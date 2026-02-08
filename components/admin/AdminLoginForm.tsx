'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

export function AdminLoginForm() {
  const router = useRouter();
  const { push } = useToast();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message ?? copy.admin.loginError);
        return;
      }

      push(copy.admin.loginSuccess, 'success');
      router.push('/admin');
      router.refresh();
    } catch {
      setErrorMessage(copy.admin.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-4 p-6">
      <div>
        <label htmlFor="admin-password" className="text-xs font-semibold text-muted">
          {copy.admin.passwordLabel}
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input-base mt-2"
          placeholder={copy.admin.passwordPlaceholder}
          required
        />
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button type="submit" className="primary-button w-full" disabled={loading}>
        {loading ? copy.admin.loggingIn : copy.admin.loginButton}
      </button>
    </form>
  );
}
