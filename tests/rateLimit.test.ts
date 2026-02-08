import { describe, expect, it } from 'vitest';
import { checkRateLimitAny, checkRateLimitAnyCount, clearRateLimit } from '../lib/rateLimit';

describe('rateLimit', () => {
  it('blocks rapid repeated requests for same key', async () => {
    const key = 'post:cookie:test-user';
    await clearRateLimit(key);

    const first = await checkRateLimitAny([key], 30_000);
    const second = await checkRateLimitAny([key], 30_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.retryAfter).toBeGreaterThan(0);

    await clearRateLimit(key);
  });

  it('blocks when any identifier in the group is over limit', async () => {
    const cookieKey = 'post:cookie:test-user-2';
    const ipKey = 'post:ip:203.0.113.10';
    await clearRateLimit(cookieKey);
    await clearRateLimit(ipKey);

    const first = await checkRateLimitAny([cookieKey, ipKey], 30_000);
    const second = await checkRateLimitAny([cookieKey, ipKey], 30_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.blockedKey === cookieKey || second.blockedKey === ipKey).toBe(true);

    await clearRateLimit(cookieKey);
    await clearRateLimit(ipKey);
  });

  it('allows N requests in a window (count-based)', async () => {
    const key = 'admin-login:ip:203.0.113.20';
    await clearRateLimit(key);

    for (let i = 0; i < 5; i += 1) {
      const result = await checkRateLimitAnyCount([key], 10 * 60_000, 5);
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkRateLimitAnyCount([key], 10 * 60_000, 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);

    await clearRateLimit(key);
  });
});
