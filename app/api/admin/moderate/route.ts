import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiGuard } from '@/lib/adminGuard';
import { hideTarget } from '@/lib/db/admin';
import { logApiError } from '@/lib/logger';
import { validateCsrfRequest } from '@/lib/security';

export const runtime = 'nodejs';

const moderateSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  targetId: z.number().int().positive(),
});

export async function POST(req: Request) {
  const guardResponse = requireAdminApiGuard('moderation:write');
  if (guardResponse) {
    return guardResponse;
  }

  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    return NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
  }

  try {
    const body = await req.json();
    const parsed = moderateSchema.safeParse({
      ...body,
      targetId: Number(body.targetId),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: '入力内容を確認してください。' },
        { status: 400 },
      );
    }

    const updated = await hideTarget(parsed.data.targetType, parsed.data.targetId);
    if (!updated) {
      return NextResponse.json(
        { ok: false, message: '対象が見つからないか、すでに非表示です。' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, message: '非表示にしました。' });
  } catch (error) {
    logApiError('api/admin/moderate:POST', error);
    return NextResponse.json(
      { ok: false, message: '操作に失敗しました。' },
      { status: 500 },
    );
  }
}
