import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/lib/adminAuth';
import { validateCsrfRequest } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    return NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
  }

  const response = NextResponse.json({ ok: true, message: 'ログアウトしました。' });
  clearAdminSessionCookie(response);
  return response;
}
