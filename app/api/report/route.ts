import { NextResponse } from 'next/server';
import {
  createReport,
  findPostVisibility,
  findThreadVisibility,
} from '@/lib/db/forum';
import { reportSchema } from '@/lib/validators';
import { attachClientId, resolveClientId, resolveClientIp } from '@/lib/clientId';
import { validateCsrfRequest } from '@/lib/security';
import { checkRateLimitAny } from '@/lib/rateLimit';
import { REPORT_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';
import { logApiError, logApiWarn } from '@/lib/logger';

export const runtime = 'nodejs';

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
    const parsed = reportSchema.safeParse({
      ...body,
      targetId: Number(body.targetId),
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

    const rateLimitKeys = [`report:cookie:${client.clientId}`];
    if (ip) rateLimitKeys.push(`report:ip:${ip}`);
    const limit = await checkRateLimitAny(rateLimitKeys, REPORT_RATE_LIMIT_WINDOW_MS);
    if (!limit.allowed) {
      const res = NextResponse.json(
        {
          ok: false,
          message: `通報の連投が早すぎます。${limit.retryAfter}秒ほど待ってください。`,
        },
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

    const report = await createReport({
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      note: parsed.data.note?.trim() || undefined,
    });

    // Log minimal info for monitoring (avoid logging note/body to reduce sensitive leakage).
    logApiWarn(
      'api/report:POST',
      `report accepted id=${report.id} target=${parsed.data.targetType}:${parsed.data.targetId} reason=${parsed.data.reason}`,
    );

    const res = NextResponse.json({
      ok: true,
      message: '通報を受け付けました',
      data: report,
    });
    attachClientId(res, client);
    return res;
  } catch (error) {
    logApiError('api/report:POST', error);
    const res = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました' },
      { status: 500 },
    );
    attachClientId(res, client);
    return res;
  }
}
