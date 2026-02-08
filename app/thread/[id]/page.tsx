import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { PageContainer } from '@/components/PageContainer';
import { PostCard } from '@/components/PostCard';
import { ReplyForm } from '@/components/ReplyForm';
import { AdminThreadDeleteButton } from '@/components/admin/AdminThreadDeleteButton';
import { formatDate } from '@/lib/format';
import { copy } from '@/lib/copy';
import { getThreadById } from '@/lib/db/forum';
import { getReactionSummary } from '@/lib/db/reactions';
import { getAdminSession, hasAdminPermission } from '@/lib/adminAuth';

type Params = {
  id: string;
};

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export const dynamic = 'force-dynamic';

export default async function ThreadDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const id = Number(params.id);
  const sortParam = Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort;
  const sort = sortParam === 'desc' ? 'desc' : 'asc';

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const thread = await getThreadById(id, sort);
  const session = getAdminSession();
  const canModerate = session ? hasAdminPermission(session.role, 'moderation:write') : false;
  const clientId = cookies().get('clientId')?.value;

  if (!thread) {
    notFound();
  }

  if (thread.deletedAt) {
    return (
      <PageContainer>
        <section className="glass-card p-6">
          <p className="text-xs font-semibold text-muted">{copy.threadCard.threadLabel}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{copy.thread.hiddenTitle}</h1>
          <p className="mt-3 text-sm text-muted">{copy.thread.hiddenDescription}</p>
          <div className="mt-4">
            <Link href="/" className="primary-button">
              {copy.notFound.action}
            </Link>
          </div>
        </section>
      </PageContainer>
    );
  }

  const canDeleteOwnThread = Boolean(
    clientId && thread.authorClientId && clientId === thread.authorClientId,
  );

  const threadReactions = await getReactionSummary({
    targetType: 'thread',
    targetIds: [thread.id],
    authorClientId: clientId ?? null,
  });

  const postIds = thread.posts.map((post) => post.id);
  const postReactions = await getReactionSummary({
    targetType: 'post',
    targetIds: postIds,
    authorClientId: clientId ?? null,
  });

  let latestPostId: number | null = null;
  let latestPostTime = 0;

  for (const post of thread.posts) {
    const postTime = post.createdAt.getTime();
    if (latestPostId === null || postTime > latestPostTime) {
      latestPostId = post.id;
      latestPostTime = postTime;
      continue;
    }

    if (postTime === latestPostTime && post.id > latestPostId) {
      latestPostId = post.id;
    }
  }

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="tag-pill">{copy.threadCard.threadLabel}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted" suppressHydrationWarning>
              {formatDate(thread.createdAt)}
            </span>
            {canModerate ? <AdminThreadDeleteButton threadId={thread.id} /> : null}
          </div>
        </div>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{thread.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {copy.thread.authorLabel}: {thread.authorName || copy.post.anonymous}
        </p>
        <p className="mt-1 text-xs text-muted">
          {copy.thread.replyCountLabel}: {thread._count.posts}
        </p>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{copy.thread.sortLabel}</span>
        <Link
          href={`/thread/${thread.id}?sort=asc`}
          className={`soft-button ${sort === 'asc' ? 'border-accent/70 bg-accentSoft/70' : ''}`}
        >
          {copy.thread.sortOldest}
        </Link>
        <Link
          href={`/thread/${thread.id}?sort=desc`}
          className={`soft-button ${sort === 'desc' ? 'border-accent/70 bg-accentSoft/70' : ''}`}
        >
          {copy.thread.sortNewest}
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        <PostCard
          id={thread.id}
          body={thread.body}
          authorName={thread.authorName || copy.post.anonymous}
          isStaff={thread.isStaff}
          pinned={Boolean(thread.pinnedAt)}
          createdAt={thread.createdAt}
          index={1}
          targetType="thread"
          highlight
          canModerate={canModerate}
          canDeleteOwn={canDeleteOwnThread}
          reactions={{
            counts: threadReactions.countsByTargetId[thread.id],
            mine: threadReactions.mineByTargetId[thread.id],
          }}
        />
        {thread.posts.length === 0 ? (
          <div className="glass-card p-6 text-sm text-muted">{copy.thread.noReplies}</div>
        ) : (
          thread.posts.map((post, index) => (
            <PostCard
              key={post.id}
              id={post.id}
              body={post.body}
              authorName={post.authorName || copy.post.anonymous}
              isStaff={post.isStaff}
              pinned={Boolean(post.pinnedAt)}
              createdAt={post.createdAt}
              index={index + 2}
              targetType="post"
              isLatest={latestPostId !== null && post.id === latestPostId}
              canModerate={canModerate}
              canDeleteOwn={Boolean(
                clientId && post.authorClientId && clientId === post.authorClientId,
              )}
              reactions={{
                counts: postReactions.countsByTargetId[post.id],
                mine: postReactions.mineByTargetId[post.id],
              }}
            />
          ))
        )}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">{copy.thread.replyTitle}</h2>
        <p className="mt-2 text-sm text-muted">{copy.thread.replyDescription}</p>
        <ReplyForm threadId={thread.id} />
      </section>
    </PageContainer>
  );
}
