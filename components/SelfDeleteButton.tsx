'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

type SelfDeleteButtonProps = {
  targetType: 'thread' | 'post';
  targetId: number;
};

export function SelfDeleteButton({ targetType, targetId }: SelfDeleteButtonProps) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const confirmText =
    targetType === 'thread' ? copy.selfDelete.threadConfirm : copy.selfDelete.postConfirm;

  const endpoint = targetType === 'thread' ? `/api/thread/${targetId}` : `/api/post/${targetId}`;

  const handleDelete = async () => {
    if (loading) return;
    const ok = window.confirm(confirmText);
    if (!ok) return;

    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        push(data.message ?? copy.selfDelete.error, 'error');
        return;
      }

      push(copy.selfDelete.success, 'success');

      if (targetType === 'thread') {
        router.push('/');
      }

      router.refresh();
    } catch {
      push(copy.selfDelete.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="soft-button border-red-300/70 text-red-700 hover:border-red-400/80 hover:bg-red-50/70"
    >
      {loading ? copy.selfDelete.deleting : copy.selfDelete.button}
    </button>
  );
}

