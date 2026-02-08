import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  authenticateAdminPassword,
  createAdminSessionToken,
  hasAdminPermission,
  isAdminConfigReady,
  parseAdminSessionToken,
} from '../lib/adminAuth';

const originalAdminPassword = process.env.ADMIN_PASSWORD;
const originalOwnerPassword = process.env.ADMIN_OWNER_PASSWORD;
const originalModeratorPassword = process.env.ADMIN_MODERATOR_PASSWORD;
const originalViewerPassword = process.env.ADMIN_VIEWER_PASSWORD;
const originalAdminSessionSecret = process.env.ADMIN_SESSION_SECRET;
const originalAdminSessionVersion = process.env.ADMIN_SESSION_VERSION;

describe('admin auth', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = '';
    process.env.ADMIN_OWNER_PASSWORD = 'owner-password';
    process.env.ADMIN_MODERATOR_PASSWORD = 'moderator-password';
    process.env.ADMIN_VIEWER_PASSWORD = 'viewer-password';
    process.env.ADMIN_SESSION_SECRET = 'very-long-secret-for-tests';
    process.env.ADMIN_SESSION_VERSION = '1';
  });

  afterAll(() => {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
    process.env.ADMIN_OWNER_PASSWORD = originalOwnerPassword;
    process.env.ADMIN_MODERATOR_PASSWORD = originalModeratorPassword;
    process.env.ADMIN_VIEWER_PASSWORD = originalViewerPassword;
    process.env.ADMIN_SESSION_SECRET = originalAdminSessionSecret;
    process.env.ADMIN_SESSION_VERSION = originalAdminSessionVersion;
  });

  it('returns ready when required env vars exist', () => {
    expect(isAdminConfigReady()).toBe(true);
  });

  it('authenticates admin password and resolves role', () => {
    expect(authenticateAdminPassword('owner-password')).toBe('owner');
    expect(authenticateAdminPassword('moderator-password')).toBe('moderator');
    expect(authenticateAdminPassword('viewer-password')).toBe('viewer');
    expect(authenticateAdminPassword('wrong')).toBeNull();
  });

  it('creates and parses a valid admin session token', () => {
    const token = createAdminSessionToken('owner', 1_000);
    expect(token).toBeTruthy();

    const payload = parseAdminSessionToken(token ?? undefined, 1_100);
    expect(payload).not.toBeNull();
    expect(payload?.role).toBe('owner');
  });

  it('rejects expired admin session token', () => {
    const token = createAdminSessionToken('owner', 1_000);
    expect(token).toBeTruthy();

    const payload = parseAdminSessionToken(token ?? undefined, 1_000 + 60 * 60 * 3);
    expect(payload).toBeNull();
  });

  it('rejects tampered admin session token', () => {
    const token = createAdminSessionToken('owner', 1_000);
    expect(token).toBeTruthy();

    const tampered = `${token?.split('.')[0]}.invalid-signature`;
    const payload = parseAdminSessionToken(tampered, 1_100);
    expect(payload).toBeNull();
  });

  it('rejects token when session version changes', () => {
    const token = createAdminSessionToken('owner', 1_000);
    expect(token).toBeTruthy();

    process.env.ADMIN_SESSION_VERSION = '2';
    const payload = parseAdminSessionToken(token ?? undefined, 1_100);
    expect(payload).toBeNull();
  });

  it('enforces permissions by role', () => {
    expect(hasAdminPermission('owner', 'reports:read')).toBe(true);
    expect(hasAdminPermission('owner', 'moderation:write')).toBe(true);
    expect(hasAdminPermission('moderator', 'reports:read')).toBe(true);
    expect(hasAdminPermission('moderator', 'moderation:write')).toBe(true);
    expect(hasAdminPermission('viewer', 'reports:read')).toBe(true);
    expect(hasAdminPermission('viewer', 'moderation:write')).toBe(false);
  });

  it('falls back to ADMIN_PASSWORD for owner when owner password is not set', () => {
    process.env.ADMIN_OWNER_PASSWORD = '';
    process.env.ADMIN_PASSWORD = 'legacy-password';
    expect(authenticateAdminPassword('legacy-password')).toBe('owner');
  });
});
