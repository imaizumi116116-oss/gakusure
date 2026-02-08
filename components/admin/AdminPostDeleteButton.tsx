'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

type AdminPostDeleteButtonProps = {
  postId: number;
};

export function AdminPostDeleteButton({ postId }: AdminPostDeleteButtonProps) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    const ok = window.confirm(copy.admin.postDeleteConfirm);
    if (!ok) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ targetType: 'post', targetId: postId }),
      });
      const data = await response.json();

      if (!response.ok) {
        push(data.message ?? copy.admin.postDeleteError, 'error');
        return;
      }

      push(copy.admin.postDeleteSuccess, 'success');
      router.refresh();
    } catch {
      push(copy.admin.networkError, 'error');
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
      {loading ? copy.admin.postDeleting : copy.admin.postDeleteButton}
    </button>
  );
}

