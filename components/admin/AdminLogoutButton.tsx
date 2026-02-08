'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

export function AdminLogoutButton() {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
      });

      if (!response.ok) {
        push(copy.admin.logoutError, 'error');
        setLoading(false);
        return;
      }

      router.push('/admin/login');
      router.refresh();
    } catch {
      push(copy.admin.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" onClick={handleLogout} className="soft-button" disabled={loading}>
      {loading ? copy.admin.loggingOut : copy.admin.logoutButton}
    </button>
  );
}
