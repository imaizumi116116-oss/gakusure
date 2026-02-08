import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateAdminPassword,
  attachAdminSessionCookie,
  createAdminSessionToken,
  isAdminConfigReady,
} from '@/lib/adminAuth';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { checkRateLimitAnyCount, clearRateLimit } from '@/lib/rateLimit';
import { validateCsrfRequest } from '@/lib/security';
import { logApiError } from '@/lib/logger';
import { ADMIN_LOGIN_MAX_ATTEMPTS, ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';

export const runtime = 'nodejs';

const loginSchema = z.object({
  password: z.string().min(1, 'パスワードを入力してください').max(200),
});

export async function POST(req: Request) {
  const client = resolveClientId();
  const ip = resolveClientIp(req);

  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    const response = NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
    attachClientId(response, client);
    return response;
  }

  if (!isAdminConfigReady()) {
    const response = NextResponse.json(
      { ok: false, message: '管理者ログイン設定が不足しています。環境変数を確認してください。' },
      { status: 500 },
    );
    attachClientId(response, client);
    return response;
  }

  try {
    const keys = [`admin-login:cookie:${client.clientId}`];
    if (ip) keys.push(`admin-login:ip:${ip}`);
    const limit = await checkRateLimitAnyCount(
      keys,
      ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS,
      ADMIN_LOGIN_MAX_ATTEMPTS,
    );
    if (!limit.allowed) {
      const response = NextResponse.json(
        { ok: false, message: `試行回数が多すぎます。${limit.retryAfter}秒後に再試行してください。` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
      attachClientId(response, client);
      return response;
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const response = NextResponse.json(
        { ok: false, message: '入力内容を確認してください。' },
        { status: 400 },
      );
      attachClientId(response, client);
      return response;
    }

    const role = authenticateAdminPassword(parsed.data.password);
    if (!role) {
      const response = NextResponse.json(
        { ok: false, message: '認証に失敗しました。' },
        { status: 401 },
      );
      attachClientId(response, client);
      return response;
    }

    const token = createAdminSessionToken(role);
    if (!token) {
      const response = NextResponse.json(
        { ok: false, message: '管理者セッションの作成に失敗しました。' },
        { status: 500 },
      );
      attachClientId(response, client);
      return response;
    }

    const response = NextResponse.json({ ok: true, message: '管理者ログインしました。' });
    attachAdminSessionCookie(response, token);
    attachClientId(response, client);
    await Promise.all(keys.map((key) => clearRateLimit(key)));
    return response;
  } catch (error) {
    logApiError('api/admin/login:POST', error);
    const response = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
    attachClientId(response, client);
    return response;
  }
}
