import { PageContainer } from '@/components/PageContainer';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

export default function RulesPage() {
  return (
    <PageContainer>
      <section className="glass-card space-y-4 p-6">
        <p className="text-xs font-semibold text-muted">{copy.rules.label}</p>
        <h1 className="font-display text-2xl font-semibold">{copy.rules.title}</h1>
        <p className="text-sm text-muted">{copy.rules.intro}</p>
        <div className="space-y-3 text-sm text-ink">
          {copy.rules.items.map((item, index) => (
            <p key={item}>
              {index + 1}. {item}
            </p>
          ))}
        </div>
      </section>

      <section className="glass-card mt-6 space-y-3 p-6 text-sm text-muted">
        <h2 className="font-display text-lg font-semibold text-ink">{copy.rules.reportTitle}</h2>
        <p>{copy.rules.reportBody}</p>
        <p>{copy.rules.reportNote}</p>
      </section>
    </PageContainer>
  );
}
