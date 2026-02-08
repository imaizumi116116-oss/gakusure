'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

type AdminFooterAuthProps = {
  initiallyAuthed: boolean;
};

export function AdminFooterAuth({ initiallyAuthed }: AdminFooterAuthProps) {
  const router = useRouter();
  const { push } = useToast();
  const [authed, setAuthed] = useState(initiallyAuthed);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
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
      setAuthed(true);
      setPassword('');
      router.refresh();
    } catch {
      setErrorMessage(copy.admin.networkError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
      });

      if (!response.ok) {
        setErrorMessage(copy.admin.logoutError);
        return;
      }

      setAuthed(false);
      push(copy.admin.logoutSuccess, 'success');
      router.refresh();
    } catch {
      setErrorMessage(copy.admin.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (authed) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Link href="/admin" className="underline decoration-border underline-offset-4">
          {copy.admin.footerAdminLink}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="underline decoration-border underline-offset-4"
        >
          {loading ? copy.admin.loggingOut : copy.admin.logoutButton}
        </button>
        {errorMessage ? <span className="text-red-600">{errorMessage}</span> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="mt-3 flex flex-col items-center justify-center gap-2">
      <div className="flex w-full max-w-xs items-center justify-center gap-2">
        <span className="shrink-0">{copy.admin.footerLoginLabel}</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.admin.passwordPlaceholder}
          className="h-9 w-full rounded-full border border-border/80 bg-card/90 px-3 text-xs text-ink shadow-sm outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-ring/60"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="h-9 shrink-0 rounded-full bg-accent px-4 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          {loading ? copy.admin.loggingIn : copy.admin.loginButton}
        </button>
      </div>
      {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
    </form>
  );
}

