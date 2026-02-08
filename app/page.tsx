import { cookies, headers } from 'next/headers';
import { PageContainer } from '@/components/PageContainer';
import { ThreadSearchForm } from '@/components/ThreadSearchForm';
import { ThreadListCard } from '@/components/ThreadListCard';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { Pager } from '@/components/Pager';
import { PAGE_SIZE } from '@/lib/constants';
import { copy } from '@/lib/copy';
import { listThreads } from '@/lib/db/forum';
import { resolveClientIpFromHeaders } from '@/lib/clientId';
import { checkRateLimitAnyCount } from '@/lib/rateLimit';
import { SEARCH_RATE_LIMIT_MAX, SEARCH_RATE_LIMIT_WINDOW_MS } from '@/lib/rateLimitConfig';

export const dynamic = 'force-dynamic';

function getMood() {
  const index = new Date().getDate() % copy.home.moods.length;
  return copy.home.moods[index];
}

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const pick = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const page = Math.max(1, Number(pick(searchParams.page) ?? '1'));
  const q = pick(searchParams.q)?.trim();

  if (q) {
    const clientId = cookies().get('clientId')?.value;
    const ip = resolveClientIpFromHeaders(headers());

    const rateLimitKeys: string[] = [];
    if (clientId) rateLimitKeys.push(`search:cookie:${clientId}`);
    if (ip) rateLimitKeys.push(`search:ip:${ip}`);

    if (rateLimitKeys.length > 0) {
      const limit = await checkRateLimitAnyCount(
        rateLimitKeys,
        SEARCH_RATE_LIMIT_WINDOW_MS,
        SEARCH_RATE_LIMIT_MAX,
      );

      if (!limit.allowed) {
        return (
          <PageContainer>
            <section className="glass-card p-6">
              <p className="text-xs font-semibold text-muted">{copy.home.moodLabel}</p>
              <h1
                className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl"
                suppressHydrationWarning
              >
                {getMood()}
                {copy.home.headlineSuffix}
              </h1>
              <p className="mt-3 text-sm text-muted">{copy.home.subcopy}</p>
            </section>

            <ThreadSearchForm currentQuery={q} />

            <section className="glass-card mt-8 p-6">
              <h2 className="font-display text-lg font-semibold text-ink">{copy.search.rateLimitedTitle}</h2>
              <p className="mt-2 text-sm text-muted">
                {copy.search.rateLimitedDescription}（{limit.retryAfter}秒ほど待ってください）
              </p>
            </section>
          </PageContainer>
        );
      }
    }
  }

  const { threads, total } = await listThreads({ q, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.home.moodLabel}</p>
        <h1
          className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl"
          suppressHydrationWarning
        >
          {getMood()}
          {copy.home.headlineSuffix}
        </h1>
        <p className="mt-3 text-sm text-muted">{copy.home.subcopy}</p>
      </section>

      <ThreadSearchForm currentQuery={q} />

      <section className="mt-8 grid gap-4">
        {threads.length === 0 ? (
          <EmptyStateCard
            title={copy.home.emptyTitle}
            description={copy.home.emptyDescription}
            actionLabel={copy.home.emptyAction}
            actionHref="/new"
          />
        ) : (
          threads.map((thread) => <ThreadListCard key={thread.id} thread={thread} />)
        )}
      </section>

      <Pager page={page} totalPages={totalPages} basePath="/" query={{ q: q || undefined }} />
    </PageContainer>
  );
}
