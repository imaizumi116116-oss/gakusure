import { NextResponse } from 'next/server';
import { createThread } from '@/lib/db/forum';
import { threadSchema } from '@/lib/validators';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { checkRateLimitAny } from '@/lib/rateLimit';
import { THREAD_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';
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
    const parsed = threadSchema.safeParse(body);

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

    const rateLimitKeys = [`thread:cookie:${client.clientId}`];
    if (ip) rateLimitKeys.push(`thread:ip:${ip}`);
    const limit = await checkRateLimitAny(rateLimitKeys, THREAD_RATE_LIMIT_WINDOW_MS);
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
    const thread = await createThread({
      title: parsed.data.title,
      body: parsed.data.body,
      authorName,
      authorClientId: client.clientId,
      isStaff,
    });

    const res = NextResponse.json({
      ok: true,
      message: 'スレッドを作成しました',
      data: thread,
    });
    attachClientId(res, client);
    return res;
  } catch (error) {
    logApiError('api/thread:POST', error);
    const res = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
    attachClientId(res, client);
    return res;
  }
}
