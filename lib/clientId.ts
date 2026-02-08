import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

type ClientIdResult = {
  clientId: string;
  shouldSet: boolean;
};

export function resolveClientId(): ClientIdResult {
  const existing = cookies().get('clientId')?.value;
  if (existing) {
    return { clientId: existing, shouldSet: false };
  }
  return { clientId: crypto.randomUUID(), shouldSet: true };
}

export function attachClientId(response: NextResponse, result: ClientIdResult) {
  if (!result.shouldSet) return;
  response.cookies.set({
    name: 'clientId',
    value: result.clientId,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function resolveClientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return null;
}

export function resolveClientIp(req: Request) {
  return resolveClientIpFromHeaders(req.headers);
}
