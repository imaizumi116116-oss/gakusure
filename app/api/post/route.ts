import { NextResponse } from 'next/server';
import { createPostAndBump } from '@/lib/db/forum';
import { postSchema } from '@/lib/validators';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { checkRateLimitAny } from '@/lib/rateLimit';
import { POST_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';
import { validateCsrfRequest } from '@/lib/security';
import { logApiError } from '@/lib/logger';
import { getAdminSession } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const client = resolveClientId();
  const ip = resolveClientIp(req);
  const isStaff = getAdminSession() !== null;

  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    const res = NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
    attachClientId(res, client);
    return res;
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse({
      ...body,
      threadId: Number(body.threadId),
    });

    if (!parsed.success) {
      const res = NextResponse.json(
        {
          ok: false,
          message: '入力内容を確認してください',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
      attachClientId(res, client);
      return res;
    }

    const rateLimitKeys = [`post:cookie:${client.clientId}`];
    if (ip) rateLimitKeys.push(`post:ip:${ip}`);
    const limit = await checkRateLimitAny(rateLimitKeys, POST_RATE_LIMIT_WINDOW_MS);
    if (!limit.allowed) {
      const res = NextResponse.json(
        {
          ok: false,
          message: `連投が早すぎます。${limit.retryAfter}秒ほど待ってください。`,
        },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
      attachClientId(res, client);
      return res;
    }

    const authorName = parsed.data.authorName?.trim() || '匿名';
    const post = await createPostAndBump({
      threadId: parsed.data.threadId,
      body: parsed.data.body,
      authorName,
      authorClientId: client.clientId,
      isStaff,
    });

    if (!post) {
      const res = NextResponse.json(
        { ok: false, message: 'スレッドが見つかりません' },
        { status: 404 },
      );
      attachClientId(res, client);
      return res;
    }

    const res = NextResponse.json({
      ok: true,
      message: 'レスを投稿しました',
      data: post,
    });
    attachClientId(res, client);
    return res;
  } catch (error) {
    logApiError('api/post:POST', error);
    const res = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
    attachClientId(res, client);
    return res;
  }
}
