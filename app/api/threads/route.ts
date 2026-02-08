import { NextResponse } from 'next/server';
import { listThreads } from '@/lib/db/forum';
import { threadsQuerySchema } from '@/lib/validators';
import { PAGE_SIZE } from '@/lib/constants';
import { logApiError } from '@/lib/logger';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { checkRateLimitAnyCount } from '@/lib/rateLimit';
import { SEARCH_RATE_LIMIT_MAX, SEARCH_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const client = resolveClientId();
  const ip = resolveClientIp(req);

  try {
    const rateLimitKeys = [`search:cookie:${client.clientId}`];
    if (ip) rateLimitKeys.push(`search:ip:${ip}`);

    const limit = await checkRateLimitAnyCount(
      rateLimitKeys,
      SEARCH_RATE_LIMIT_WINDOW_MS,
      SEARCH_RATE_LIMIT_MAX,
    );
    if (!limit.allowed) {
      const res = NextResponse.json(
        { ok: false, message: `検索が早すぎます。${limit.retryAfter}秒ほど待ってください。` },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
      attachClientId(res, client);
      return res;
    }

    const { searchParams } = new URL(req.url);
    const parsed = threadsQuerySchema.safeParse({
      q: searchParams.get('q') ?? '',
      page: searchParams.get('page') ?? '1',
    });

    if (!parsed.success) {
      const res = NextResponse.json(
        {
          ok: false,
          message: 'クエリが不正です',
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
      attachClientId(res, client);
      return res;
    }

    const page = parsed.data.page ?? 1;
    const q = parsed.data.q?.trim();

    const { threads, total } = await listThreads({ q, page, pageSize: PAGE_SIZE });

    const res = NextResponse.json({
      ok: true,
      data: {
        threads,
        pagination: {
          page,
          pageSize: PAGE_SIZE,
          total,
          totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        },
      },
    });
    attachClientId(res, client);
    return res;
  } catch (error) {
    logApiError('api/threads:GET', error);
    const res = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
    attachClientId(res, client);
    return res;
  }
}
