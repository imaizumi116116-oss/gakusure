import { NextResponse } from 'next/server';
import { requireAdminApiGuard } from '@/lib/adminGuard';
import { listAdminReports } from '@/lib/db/admin';
import { logApiError } from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET() {
  const guardResponse = requireAdminApiGuard('reports:read');
  if (guardResponse) {
    return guardResponse;
  }

  try {
    const reports = await listAdminReports();
    return NextResponse.json({ ok: true, data: reports });
  } catch (error) {
    logApiError('api/admin/reports:GET', error);
    return NextResponse.json(
      { ok: false, message: '通報一覧の取得に失敗しました。' },
      { status: 500 },
    );
  }
}
