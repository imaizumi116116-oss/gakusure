export const REACTION_TYPES = ['like', 'thanks', 'insight'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export type ReactionTargetType = 'thread' | 'post';

export type ReactionCounts = Record<ReactionType, number>;
export type ReactionMine = Record<ReactionType, boolean>;

export const REACTION_META: Record<ReactionType, { label: string; emoji: string }> = {
  like: { label: 'いいね', emoji: '👍' },
  thanks: { label: 'ありがとう', emoji: '🙏' },
  insight: { label: 'なるほど', emoji: '💡' },
};

export function emptyReactionCounts(): ReactionCounts {
  return { like: 0, thanks: 0, insight: 0 };
}

export function emptyReactionMine(): ReactionMine {
  return { like: false, thanks: false, insight: false };
}
