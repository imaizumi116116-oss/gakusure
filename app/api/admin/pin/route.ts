import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApiGuard } from '@/lib/adminGuard';
import { setPinnedTarget } from '@/lib/db/admin';
import { logApiError } from '@/lib/logger';
import { validateCsrfRequest } from '@/lib/security';

export const runtime = 'nodejs';

const pinSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  targetId: z.number().int().positive(),
  pinned: z.boolean(),
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
    const parsed = pinSchema.safeParse({
      ...body,
      targetId: Number(body.targetId),
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: '入力内容を確認してください。' }, { status: 400 });
    }

    const updated = await setPinnedTarget(
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.pinned,
    );

    if (!updated) {
      return NextResponse.json(
        { ok: false, message: '対象が見つからないか、操作できません。' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: parsed.data.pinned ? '固定しました。' : '固定を解除しました。',
    });
  } catch (error) {
    logApiError('api/admin/pin:POST', error);
    return NextResponse.json(
      { ok: false, message: '操作に失敗しました。' },
      { status: 500 },
    );
  }
}

