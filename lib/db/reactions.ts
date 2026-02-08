import type { ReactionCounts, ReactionMine, ReactionTargetType, ReactionType } from '@/lib/reactions';
import { emptyReactionCounts, emptyReactionMine, REACTION_TYPES } from '@/lib/reactions';
import { prisma } from '@/lib/prisma';

export async function getReactionCounts(targetType: ReactionTargetType, targetId: number) {
  const rows = await prisma.reaction.groupBy({
    by: ['type'],
    where: { targetType, targetId },
    _count: { _all: true },
  });

  const counts = emptyReactionCounts();
  for (const row of rows) {
    const type = row.type as ReactionType;
    if (!REACTION_TYPES.includes(type)) continue;
    counts[type] = row._count._all;
  }

  return counts;
}

export async function getReactionSummary(input: {
  targetType: ReactionTargetType;
  targetIds: number[];
  authorClientId?: string | null;
}): Promise<{
  countsByTargetId: Record<number, ReactionCounts>;
  mineByTargetId: Record<number, ReactionMine>;
}> {
  const countsByTargetId: Record<number, ReactionCounts> = {};
  const mineByTargetId: Record<number, ReactionMine> = {};

  for (const id of input.targetIds) {
    countsByTargetId[id] = emptyReactionCounts();
    mineByTargetId[id] = emptyReactionMine();
  }

  if (input.targetIds.length === 0) {
    return { countsByTargetId, mineByTargetId };
  }

  const counts = await prisma.reaction.groupBy({
    by: ['targetId', 'type'],
    where: {
      targetType: input.targetType,
      targetId: { in: input.targetIds },
    },
    _count: { _all: true },
  });

  for (const row of counts) {
    const type = row.type as ReactionType;
    if (!REACTION_TYPES.includes(type)) continue;
    const targetId = row.targetId;
    countsByTargetId[targetId] ??= emptyReactionCounts();
    countsByTargetId[targetId][type] = row._count._all;
  }

  if (input.authorClientId) {
    const mine = await prisma.reaction.findMany({
      where: {
        targetType: input.targetType,
        targetId: { in: input.targetIds },
        authorClientId: input.authorClientId,
      },
      select: { targetId: true, type: true },
    });

    for (const row of mine) {
      const type = row.type as ReactionType;
      if (!REACTION_TYPES.includes(type)) continue;
      mineByTargetId[row.targetId] ??= emptyReactionMine();
      mineByTargetId[row.targetId][type] = true;
    }
  }

  return { countsByTargetId, mineByTargetId };
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  return (error as { code?: unknown }).code === 'P2002';
}

export async function toggleReaction(input: {
  targetType: ReactionTargetType;
  targetId: number;
  type: ReactionType;
  authorClientId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const where = {
      targetType: input.targetType,
      targetId: input.targetId,
      type: input.type,
      authorClientId: input.authorClientId,
    };

    // Toggle off first without throwing (avoids noisy unique-constraint logs on normal toggles).
    const deleted = await tx.reaction.deleteMany({ where });
    if (deleted.count > 0) {
      return { reacted: false as const };
    }

    try {
      await tx.reaction.create({ data: where, select: { id: true } });
      return { reacted: true as const };
    } catch (error) {
      // Rare race: another request created it after deleteMany checked.
      if (isUniqueConstraintError(error)) {
        return { reacted: true as const };
      }
      throw error;
    }
  });
}
