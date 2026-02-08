import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { ThreadListItem } from '@/lib/types';
import { copy } from '@/lib/copy';

function snippet(text: string, max = 120) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

type ThreadListCardProps = {
  thread: ThreadListItem;
};

export function ThreadListCard({ thread }: ThreadListCardProps) {
  return (
    <Link
      href={`/thread/${thread.id}`}
      className="glass-card block p-6 transition hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tag-pill">{copy.threadCard.threadLabel}</span>
          {thread.pinnedAt ? (
            <span className="inline-flex items-center rounded-full border border-accent/20 bg-accentSoft/70 px-3 py-1 text-[11px] font-semibold text-accent">
              {copy.badges.pinned}
            </span>
          ) : null}
        </div>
        <span className="text-xs text-muted" suppressHydrationWarning>
          {copy.threadCard.lastPosted} {formatDate(thread.lastPostedAt)}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-ink">{thread.title}</h3>
      <p className="mt-2 break-words text-sm text-muted">{snippet(thread.body)}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span className="flex flex-wrap items-center gap-2">
          <span>
            {copy.thread.authorLabel}: {thread.authorName || copy.post.anonymous}
          </span>
          {thread.isStaff ? (
            <span className="inline-flex items-center rounded-full border border-accent/20 bg-accentSoft/70 px-3 py-1 text-[11px] font-semibold text-accent">
              {copy.badges.staff}
            </span>
          ) : null}
        </span>
        <span>
          {copy.threadCard.replies} {thread._count.posts} {copy.threadCard.repliesUnit}
        </span>
      </div>
    </Link>
  );
}
