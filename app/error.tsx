'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/PageContainer';
import { copy } from '@/lib/copy';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.error.label}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          {copy.error.title}
        </h1>
        <p className="mt-3 text-sm text-muted">{copy.error.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="primary-button">
            {copy.error.retry}
          </button>
          <Link href="/" className="soft-button">
            {copy.error.home}
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
