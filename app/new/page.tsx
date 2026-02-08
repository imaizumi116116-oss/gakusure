import { PageContainer } from '@/components/PageContainer';
import { ThreadCreateForm } from '@/components/ThreadCreateForm';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

export default function NewThreadPage() {
  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.threadForm.pageLabel}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{copy.threadForm.pageTitle}</h1>
        <p className="mt-3 text-sm text-muted">{copy.threadForm.pageDescription}</p>
      </section>

      <ThreadCreateForm />
    </PageContainer>
  );
}
