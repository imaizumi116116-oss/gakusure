import Link from 'next/link';
import { PageContainer } from '@/components/PageContainer';
import { copy } from '@/lib/copy';

export default function NotFound() {
  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.notFound.label}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          {copy.notFound.title}
        </h1>
        <p className="mt-3 text-sm text-muted">{copy.notFound.description}</p>
        <div className="mt-5">
          <Link href="/" className="primary-button">
            {copy.notFound.action}
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
