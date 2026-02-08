import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE_NAME = 'admin_session';
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 2;

export type AdminRole = 'owner' | 'moderator' | 'viewer';

export type AdminPermission = 'reports:read' | 'moderation:write';

export type AdminSessionPayload = {
  role: AdminRole;
  iat: number;
  exp: number;
  jti: string;
  v: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(payload: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function toOptionalValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '';
}

function getAdminSessionSecret() {
  return toOptionalValue(process.env.ADMIN_SESSION_SECRET);
}

function getSessionVersion() {
  const parsed = Number(process.env.ADMIN_SESSION_VERSION ?? '1');
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function getAdminPasswordByRole(role: AdminRole) {
  if (role === 'owner') {
    return (
      toOptionalValue(process.env.ADMIN_OWNER_PASSWORD) || toOptionalValue(process.env.ADMIN_PASSWORD)
    );
  }
  if (role === 'moderator') {
    return toOptionalValue(process.env.ADMIN_MODERATOR_PASSWORD);
  }
  return toOptionalValue(process.env.ADMIN_VIEWER_PASSWORD);
}

function getConfiguredRoles(): AdminRole[] {
  const roles: AdminRole[] = [];
  if (getAdminPasswordByRole('owner')) roles.push('owner');
  if (getAdminPasswordByRole('moderator')) roles.push('moderator');
  if (getAdminPasswordByRole('viewer')) roles.push('viewer');
  return roles;
}

function isAdminRole(value: unknown): value is AdminRole {
  return value === 'owner' || value === 'moderator' || value === 'viewer';
}

function digestForCompare(value: string) {
  return crypto.createHash('sha256').update(value).digest();
}

function timingSafeMatch(input: string, expected: string) {
  const inputDigest = digestForCompare(input);
  const expectedDigest = digestForCompare(expected);
  return crypto.timingSafeEqual(inputDigest, expectedDigest);
}

export function roleLabel(role: AdminRole) {
  if (role === 'owner') return 'owner';
  if (role === 'moderator') return 'moderator';
  return 'viewer';
}

export function hasAdminPermission(role: AdminRole, permission: AdminPermission) {
  if (role === 'owner') {
    return true;
  }

  if (role === 'moderator') {
    return permission === 'reports:read' || permission === 'moderation:write';
  }

  return permission === 'reports:read';
}

export function isAdminConfigReady() {
  return getConfiguredRoles().length > 0 && Boolean(getAdminSessionSecret());
}

export function authenticateAdminPassword(inputPassword: string): AdminRole | null {
  if (!inputPassword) {
    return null;
  }

  const roleOrder: AdminRole[] = ['owner', 'moderator', 'viewer'];
  for (const role of roleOrder) {
    const expectedPassword = getAdminPasswordByRole(role);
    if (!expectedPassword) continue;
    if (timingSafeMatch(inputPassword, expectedPassword)) {
      return role;
    }
  }

  return null;
}

export function createAdminSessionToken(
  role: AdminRole,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  const secret = getAdminSessionSecret();
  if (!secret) {
    return null;
  }

  const payload: AdminSessionPayload = {
    role,
    iat: nowSeconds,
    exp: nowSeconds + ADMIN_SESSION_TTL_SECONDS,
    jti: crypto.randomUUID(),
    v: getSessionVersion(),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export function parseAdminSessionToken(
  token: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): AdminSessionPayload | null {
  const secret = getAdminSessionSecret();
  if (!token || !secret) {
    return null;
  }

  const [encodedPayload, receivedSignature] = token.split('.');
  if (!encodedPayload || !receivedSignature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload, secret);
  const receivedBuffer = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;

    if (!isAdminRole(payload.role)) {
      return null;
    }

    if (!Number.isInteger(payload.exp) || payload.exp <= nowSeconds) {
      return null;
    }

    if (!Number.isInteger(payload.iat) || payload.iat > nowSeconds) {
      return null;
    }

    if (typeof payload.jti !== 'string' || payload.jti.length < 8) {
      return null;
    }

    if (!Number.isInteger(payload.v) || payload.v !== getSessionVersion()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSession() {
  const token = cookies().get(ADMIN_SESSION_COOKIE_NAME)?.value;
  return parseAdminSessionToken(token);
}

export function isAdminAuthenticated() {
  return getAdminSession() !== null;
}

export function attachAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}
