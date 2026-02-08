import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PageContainer } from '@/components/PageContainer';
import { ThreadListCard } from '@/components/ThreadListCard';
import { EmptyStateCard } from '@/components/EmptyStateCard';
import { Pager } from '@/components/Pager';
import { PAGE_SIZE } from '@/lib/constants';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

type Params = {
  slug: string;
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const pick = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const page = Math.max(1, Number(pick(searchParams.page) ?? '1'));
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) {
    notFound();
  }

  const [threads, total] = await prisma.$transaction([
    prisma.thread.findMany({
      where: { categoryId: category.id, deletedAt: null },
      orderBy: [{ pinnedAt: 'desc' }, { lastPostedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        body: true,
        authorName: true,
        isStaff: true,
        pinnedAt: true,
        createdAt: true,
        lastPostedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { posts: true } },
      },
    }),
    prisma.thread.count({ where: { categoryId: category.id, deletedAt: null } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.categoryPage.label}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">{category.name}</h1>
        <p className="mt-3 text-sm text-muted">{category.description}</p>
      </section>

      <section className="mt-8 grid gap-4">
        {threads.length === 0 ? (
          <EmptyStateCard
            title={copy.categoryPage.emptyTitle}
            description={copy.categoryPage.emptyDescription}
            actionLabel={copy.categoryPage.emptyAction}
            actionHref="/new"
          />
        ) : (
          threads.map((thread) => <ThreadListCard key={thread.id} thread={thread} />)
        )}
      </section>

      <Pager page={page} totalPages={totalPages} basePath={`/c/${params.slug}`} />
    </PageContainer>
  );
}
