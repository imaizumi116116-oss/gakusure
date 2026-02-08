import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from './constants';

function resolveRequestOrigin(req: Request) {
  const url = new URL(req.url);
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
  const protocol = forwardedProto ?? url.protocol.replace(':', '');
  return `${protocol}://${host}`;
}

function resolveOriginFromReferer(referer: string | null) {
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function validateCsrfRequest(req: Request) {
  const expectedOrigin = resolveRequestOrigin(req);
  const origin = req.headers.get('origin');
  const refererOrigin = resolveOriginFromReferer(req.headers.get('referer'));
  const originSource = origin ?? refererOrigin;

  if (!originSource) {
    return {
      ok: false,
      status: 403,
      message: 'リクエスト元を確認できませんでした。ページを再読み込みして試してください。',
    };
  }

  if (originSource !== expectedOrigin) {
    return {
      ok: false,
      status: 403,
      message: '不正なリクエスト元です。ページを再読み込みして試してください。',
    };
  }

  const csrfHeader = req.headers.get(CSRF_HEADER_NAME);
  if (csrfHeader !== CSRF_HEADER_VALUE) {
    return {
      ok: false,
      status: 403,
      message: 'セキュリティ検証に失敗しました。ページを再読み込みしてください。',
    };
  }

  return { ok: true as const };
}
