'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import type { ReactionCounts, ReactionMine, ReactionTargetType, ReactionType } from '@/lib/reactions';
import { REACTION_META, REACTION_TYPES, emptyReactionCounts, emptyReactionMine } from '@/lib/reactions';

type ReactionBarProps = {
  targetType: ReactionTargetType;
  targetId: number;
  initialCounts?: ReactionCounts;
  initialMine?: ReactionMine;
};

export function ReactionBar({ targetType, targetId, initialCounts, initialMine }: ReactionBarProps) {
  const { push } = useToast();
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts ?? emptyReactionCounts());
  const [mine, setMine] = useState<ReactionMine>(initialMine ?? emptyReactionMine());
  const [loadingType, setLoadingType] = useState<ReactionType | null>(null);

  const types = useMemo(() => [...REACTION_TYPES], []);

  const toggle = async (reactionType: ReactionType) => {
    if (loadingType) return;
    setLoadingType(reactionType);

    try {
      const response = await fetch('/api/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ targetType, targetId, reactionType }),
      });

      const data = await response.json();
      if (!response.ok) {
        push(data.message ?? 'リアクションに失敗しました', 'error');
        return;
      }

      const nextCounts = data?.data?.counts as ReactionCounts | undefined;
      const reacted = Boolean(data?.data?.reacted);

      if (nextCounts) {
        setCounts(nextCounts);
      }
      setMine((prev) => ({ ...prev, [reactionType]: reacted }));
    } catch {
      push('通信に失敗しました。少し時間をおいてください。', 'error');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {types.map((type) => {
        const meta = REACTION_META[type];
        const active = mine[type];
        const isLoading = loadingType === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => toggle(type)}
            disabled={Boolean(loadingType)}
            className={[
              'inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70',
              active ? 'border-accent/50 bg-accentSoft/80 text-accent' : 'border-border bg-card/90 text-ink hover:bg-accentSoft/70',
            ].join(' ')}
          >
            <span aria-hidden="true">{meta.emoji}</span>
            <span>{meta.label}</span>
            <span className={active ? 'text-accent' : 'text-muted'}>{counts[type]}</span>
            {isLoading ? <span className="text-muted">…</span> : null}
          </button>
        );
      })}
    </div>
  );
}
