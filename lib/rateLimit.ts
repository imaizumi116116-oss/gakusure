type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

import { prisma } from '@/lib/prisma';

const FALLBACK_HITS = new Map<string, number>();
const FALLBACK_COUNTERS = new Map<string, { windowStart: number; count: number }>();

let lastPruneAt = 0;
const PRUNE_INTERVAL_MS = 60_000;

function windowStartMs(now: number, windowMs: number) {
  return Math.floor(now / windowMs) * windowMs;
}

function retryAfterSeconds(now: number, expiresAt: Date) {
  return Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000));
}

async function pruneExpired(now: number) {
  if (now - lastPruneAt < PRUNE_INTERVAL_MS) return;
  lastPruneAt = now;

  try {
    await prisma.rateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date(now) } },
    });
  } catch {
    // Ignore pruning errors; limiter still works without cleanup.
  }
}

function inspectFallbackHit(key: string, windowMs: number, now: number): RateLimitResult {
  const last = FALLBACK_HITS.get(key) ?? 0;
  const diff = now - last;

  if (diff < windowMs) {
    return { allowed: false, retryAfter: Math.ceil((windowMs - diff) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}

async function checkFallbackAny(keys: string[], windowMs: number) {
  const now = Date.now();

  for (const key of keys) {
    const result = inspectFallbackHit(key, windowMs, now);
    if (!result.allowed) {
      return { ...result, blockedKey: key };
    }
  }

  for (const key of keys) {
    FALLBACK_HITS.set(key, now);
  }

  return { allowed: true as const, retryAfter: 0 };
}

async function checkFallbackAnyCount(keys: string[], windowMs: number, limit: number) {
  const now = Date.now();

  let blockedKey: string | undefined;
  let retryAfter = 0;

  for (const key of keys) {
    const state = FALLBACK_COUNTERS.get(key);
    if (!state || now - state.windowStart >= windowMs) {
      continue;
    }

    if (state.count >= limit) {
      blockedKey = key;
      const untilReset = state.windowStart + windowMs - now;
      retryAfter = Math.max(retryAfter, Math.max(1, Math.ceil(untilReset / 1000)));
    }
  }

  if (blockedKey) {
    return { allowed: false as const, retryAfter, blockedKey };
  }

  for (const key of keys) {
    const existing = FALLBACK_COUNTERS.get(key);
    if (!existing || now - existing.windowStart >= windowMs) {
      FALLBACK_COUNTERS.set(key, { windowStart: now, count: 1 });
      continue;
    }
    FALLBACK_COUNTERS.set(key, { windowStart: existing.windowStart, count: existing.count + 1 });
  }

  return { allowed: true as const, retryAfter: 0 };
}

export async function checkRateLimit(key: string, windowMs: number): Promise<RateLimitResult> {
  const result = await checkRateLimitAny([key], windowMs);
  return { allowed: result.allowed, retryAfter: result.retryAfter };
}

export async function checkRateLimitAny(
  keys: string[],
  windowMs: number,
): Promise<RateLimitResult & { blockedKey?: string }> {
  return checkRateLimitAnyCount(keys, windowMs, 1);
}

export async function checkRateLimitAnyCount(
  keys: string[],
  windowMs: number,
  limit: number,
): Promise<RateLimitResult & { blockedKey?: string }> {
  const now = Date.now();
  const start = new Date(windowStartMs(now, windowMs));
  const expiresAt = new Date(start.getTime() + windowMs);

  try {
    await pruneExpired(now);

    const existing = await prisma.rateLimitBucket.findMany({
      where: {
        key: { in: keys },
        windowStart: start,
      },
      select: { key: true, count: true },
    });

    const existingMap = new Map(existing.map((row) => [row.key, row.count]));

    for (const key of keys) {
      const count = existingMap.get(key) ?? 0;
      if (count >= limit) {
        return { allowed: false, retryAfter: retryAfterSeconds(now, expiresAt), blockedKey: key };
      }
    }

    await prisma.$transaction(
      keys.map((key) =>
        prisma.rateLimitBucket.upsert({
          where: { key_windowStart: { key, windowStart: start } },
          create: {
            key,
            windowStart: start,
            expiresAt,
            count: 1,
          },
          update: { count: { increment: 1 } },
          select: { key: true },
        }),
      ),
    );

    return { allowed: true, retryAfter: 0 };
  } catch {
    // If the DB isn't ready (e.g. migration not applied), fall back to memory.
    return checkFallbackAnyCount(keys, windowMs, limit);
  }
}

export async function clearRateLimit(key: string) {
  FALLBACK_HITS.delete(key);
  FALLBACK_COUNTERS.delete(key);

  try {
    await prisma.rateLimitBucket.deleteMany({ where: { key } });
  } catch {
    // Ignore when DB isn't ready.
  }
}
