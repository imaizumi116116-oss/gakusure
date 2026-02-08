'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

type AdminPinToggleButtonProps = {
  targetType: 'thread' | 'post';
  targetId: number;
  pinned: boolean;
};

export function AdminPinToggleButton({ targetType, targetId, pinned }: AdminPinToggleButtonProps) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const nextPinned = !pinned;

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin/pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ targetType, targetId, pinned: nextPinned }),
      });
      const data = await response.json();

      if (!response.ok) {
        push(data.message ?? copy.admin.pinError, 'error');
        return;
      }

      push(nextPinned ? copy.admin.pinSuccess : copy.admin.unpinSuccess, 'success');
      router.refresh();
    } catch {
      push(copy.admin.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleToggle} disabled={loading} className="soft-button">
      {loading
        ? nextPinned
          ? copy.admin.pinning
          : copy.admin.unpinning
        : pinned
          ? copy.admin.unpinButton
          : copy.admin.pinButton}
    </button>
  );
}

