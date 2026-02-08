'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/format';
import { CopyButton } from './CopyButton';
import { ReportButton } from './ReportButton';
import { AdminPostDeleteButton } from '@/components/admin/AdminPostDeleteButton';
import { AdminThreadDeleteButton } from '@/components/admin/AdminThreadDeleteButton';
import { AdminPinToggleButton } from '@/components/admin/AdminPinToggleButton';
import { SelfDeleteButton } from '@/components/SelfDeleteButton';
import { ReactionBar } from '@/components/ReactionBar';
import { cn } from '@/lib/utils';
import { copy } from '@/lib/copy';
import type { ReactionCounts, ReactionMine } from '@/lib/reactions';

export type PostCardProps = {
  id: number;
  body: string;
  authorName: string;
  isStaff?: boolean;
  pinned?: boolean;
  createdAt: Date | string;
  index: number;
  targetType: 'thread' | 'post';
  isLatest?: boolean;
  highlight?: boolean;
  canModerate?: boolean;
  canDeleteOwn?: boolean;
  reactions?: {
    counts: ReactionCounts;
    mine: ReactionMine;
  };
};

export function PostCard({
  id,
  body,
  authorName,
  isStaff,
  pinned,
  createdAt,
  index,
  targetType,
  isLatest,
  highlight,
  canModerate,
  canDeleteOwn,
  reactions,
}: PostCardProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <article
      id={isLatest ? 'latest-post' : undefined}
      className={cn(
        'glass-card relative isolate space-y-4 p-6',
        isReportOpen ? 'z-30' : 'z-0',
        highlight && 'border-accent/50 bg-accentSoft/40',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">#{index}</p>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span>{authorName || copy.post.anonymous}</span>
            {isStaff ? (
              <span className="inline-flex items-center rounded-full border border-accent/20 bg-accentSoft/70 px-3 py-1 text-[11px] font-semibold text-accent">
                {copy.badges.staff}
              </span>
            ) : null}
            {pinned ? (
              <span className="inline-flex items-center rounded-full border border-accent/20 bg-accentSoft/70 px-3 py-1 text-[11px] font-semibold text-accent">
                {copy.badges.pinned}
              </span>
            ) : null}
          </p>
        </div>
        <p className="text-xs text-muted" suppressHydrationWarning>
          {formatDate(createdAt)}
        </p>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{body}</p>
      <ReactionBar
        targetType={targetType}
        targetId={id}
        initialCounts={reactions?.counts}
        initialMine={reactions?.mine}
      />
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={body} />
        <ReportButton targetType={targetType} targetId={id} onOpenChange={setIsReportOpen} />
        {canDeleteOwn ? <SelfDeleteButton targetType={targetType} targetId={id} /> : null}
        {canModerate ? (
          <AdminPinToggleButton targetType={targetType} targetId={id} pinned={Boolean(pinned)} />
        ) : null}
        {canModerate && targetType === 'post' ? <AdminPostDeleteButton postId={id} /> : null}
        {canModerate && targetType === 'thread' ? <AdminThreadDeleteButton threadId={id} /> : null}
      </div>
    </article>
  );
}
