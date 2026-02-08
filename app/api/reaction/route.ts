import { NextResponse } from 'next/server';
import { z } from 'zod';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { validateCsrfRequest } from '@/lib/security';
import { checkRateLimitAnyCount } from '@/lib/rateLimit';
import { logApiError } from '@/lib/logger';
import { getReactionCounts, toggleReaction } from '@/lib/db/reactions';
import { findPostVisibility, findThreadVisibility } from '@/lib/db/forum';
import { REACTION_TYPES } from '@/lib/reactions';
import { REACTION_RATE_LIMIT_MAX, REACTION_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';

export const runtime = 'nodejs';

const reactionSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  targetId: z.number().int().positive(),
  reactionType: z.enum(REACTION_TYPES),
});

export async function POST(req: Request) {
  const client = resolveClientId();
  const ip = resolveClientIp(req);

  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    const res = NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
    attachClientId(res, client);
    return res;
  }

  try {
    const body = await req.json();
    const parsed = reactionSchema.safeParse({
      ...body,
      targetId: Number(body.targetId),
    });

    if (!parsed.success) {
      const res = NextResponse.json({ ok: false, message: '入力内容を確認してください。' }, { status: 400 });
      attachClientId(res, client);
      return res;
    }

    const rateLimitKeys = [`reaction:cookie:${client.clientId}`];
    if (ip) rateLimitKeys.push(`reaction:ip:${ip}`);
    const limit = await checkRateLimitAnyCount(
      rateLimitKeys,
      REACTION_RATE_LIMIT_WINDOW_MS,
      REACTION_RATE_LIMIT_MAX,
    );
    if (!limit.allowed) {
      const res = NextResponse.json(
        { ok: false, message: `操作が早すぎます。${limit.retryAfter}秒ほど待ってください。` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
      attachClientId(res, client);
      return res;
    }

    if (parsed.data.targetType === 'thread') {
      const thread = await findThreadVisibility(parsed.data.targetId);
      if (!thread || thread.deletedAt) {
        const res = NextResponse.json({ ok: false, message: '対象が見つかりません' }, { status: 404 });
        attachClientId(res, client);
        return res;
      }
    }

    if (parsed.data.targetType === 'post') {
      const post = await findPostVisibility(parsed.data.targetId);
      if (!post || post.deletedAt) {
        const res = NextResponse.json({ ok: false, message: '対象が見つかりません' }, { status: 404 });
        attachClientId(res, client);
        return res;
      }
    }

    const toggled = await toggleReaction({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      type: parsed.data.reactionType,
      authorClientId: client.clientId,
    });

    const counts = await getReactionCounts(parsed.data.targetType, parsed.data.targetId);

    const res = NextResponse.json({
      ok: true,
      data: {
        reacted: toggled.reacted,
        reactionType: parsed.data.reactionType,
        counts,
      },
    });
    attachClientId(res, client);
    return res;
  } catch (error) {
    logApiError('api/reaction:POST', error);
    const res = NextResponse.json({ ok: false, message: '操作に失敗しました。' }, { status: 500 });
    attachClientId(res, client);
    return res;
  }
}
