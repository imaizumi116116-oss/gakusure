import { NextResponse } from 'next/server';
import { z } from 'zod';
import { attachClientId, resolveClientId } from '@/lib/clientId';
import { validateCsrfRequest } from '@/lib/security';
import { deleteThreadByAuthorClientId } from '@/lib/db/forum';
import { logApiError } from '@/lib/logger';

export const runtime = 'nodejs';

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const client = resolveClientId();

  const csrf = validateCsrfRequest(req);
  if (!csrf.ok) {
    const response = NextResponse.json({ ok: false, message: csrf.message }, { status: csrf.status });
    attachClientId(response, client);
    return response;
  }

  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    const response = NextResponse.json({ ok: false, message: '不正なリクエストです。' }, { status: 400 });
    attachClientId(response, client);
    return response;
  }

  try {
    const result = await deleteThreadByAuthorClientId({
      threadId: parsed.data.id,
      authorClientId: client.clientId,
    });

    if (!result.ok) {
      const status = result.status;
      const message =
        status === 403 ? 'このスレッドは削除できません。' : 'スレッドが見つかりません。';
      const response = NextResponse.json({ ok: false, message }, { status });
      attachClientId(response, client);
      return response;
    }

    const response = NextResponse.json({ ok: true, message: 'スレッドを削除しました。' });
    attachClientId(response, client);
    return response;
  } catch (error) {
    logApiError('api/thread/[id]:DELETE', error);
    const response = NextResponse.json(
      { ok: false, message: 'サーバーエラーが発生しました。' },
      { status: 500 },
    );
    attachClientId(response, client);
    return response;
  }
}

