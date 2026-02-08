import { NextResponse } from 'next/server';
import { type AdminPermission, getAdminSession, hasAdminPermission } from './adminAuth';

export function requireAdminApiGuard(permission: AdminPermission = 'reports:read') {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: '管理者ログインが必要です。' },
      { status: 401 },
    );
  }

  if (!hasAdminPermission(session.role, permission)) {
    return NextResponse.json({ ok: false, message: 'この操作の権限がありません。' }, { status: 403 });
  }

  return null;
}
