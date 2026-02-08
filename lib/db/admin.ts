import { prisma } from '@/lib/prisma';

function createPreview(value: string, maxLength = 80) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}

export type AdminReportItem = {
  id: number;
  targetType: 'thread' | 'post';
  targetId: number;
  reason: string;
  note: string | null;
  createdAt: Date;
  targetExists: boolean;
  targetDeleted: boolean;
  targetLabel: string;
};

export async function listAdminReports(limit = 200): Promise<AdminReportItem[]> {
  const rawReports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      note: true,
      createdAt: true,
    },
  });

  const reports = rawReports.filter(
    (item): item is (typeof rawReports)[number] & { targetType: 'thread' | 'post' } =>
      item.targetType === 'thread' || item.targetType === 'post',
  );

  const threadIds = reports.filter((item) => item.targetType === 'thread').map((item) => item.targetId);
  const postIds = reports.filter((item) => item.targetType === 'post').map((item) => item.targetId);

  const [threads, posts] = await prisma.$transaction([
    threadIds.length > 0
      ? prisma.thread.findMany({
          where: { id: { in: threadIds } },
          select: {
            id: true,
            title: true,
            authorName: true,
            deletedAt: true,
          },
        })
      : prisma.thread.findMany({ where: { id: -1 }, select: { id: true, title: true, authorName: true, deletedAt: true } }),
    postIds.length > 0
      ? prisma.post.findMany({
          where: { id: { in: postIds } },
          select: {
            id: true,
            body: true,
            authorName: true,
            deletedAt: true,
            thread: { select: { id: true, title: true } },
          },
        })
      : prisma.post.findMany({
          where: { id: -1 },
          select: {
            id: true,
            body: true,
            authorName: true,
            deletedAt: true,
            thread: { select: { id: true, title: true } },
          },
        }),
  ]);

  const threadMap = new Map(threads.map((thread) => [thread.id, thread]));
  const postMap = new Map(posts.map((post) => [post.id, post]));

  return reports.map((report) => {
    if (report.targetType === 'thread') {
      const thread = threadMap.get(report.targetId);
      if (!thread) {
        return {
          ...report,
          targetExists: false,
          targetDeleted: true,
          targetLabel: '対象スレッドが見つかりません',
        };
      }

      return {
        ...report,
        targetExists: true,
        targetDeleted: thread.deletedAt !== null,
        targetLabel: `スレ: ${createPreview(thread.title)} / 投稿者: ${thread.authorName}`,
      };
    }

    const post = postMap.get(report.targetId);
    if (!post) {
      return {
        ...report,
        targetExists: false,
        targetDeleted: true,
        targetLabel: '対象返信が見つかりません',
      };
    }

    return {
      ...report,
      targetExists: true,
      targetDeleted: post.deletedAt !== null,
      targetLabel: `返信: ${createPreview(post.body)} / スレ: ${createPreview(post.thread.title)}`,
    };
  });
}

export async function hideTarget(targetType: 'thread' | 'post', targetId: number) {
  if (targetType === 'thread') {
    const result = await prisma.thread.updateMany({
      where: { id: targetId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }

  const result = await prisma.post.updateMany({
    where: { id: targetId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}

export async function setPinnedTarget(
  targetType: 'thread' | 'post',
  targetId: number,
  pinned: boolean,
) {
  const data = pinned ? { pinnedAt: new Date() } : { pinnedAt: null };

  if (targetType === 'thread') {
    const result = await prisma.thread.updateMany({
      where: { id: targetId, deletedAt: null },
      data,
    });
    return result.count > 0;
  }

  const result = await prisma.post.updateMany({
    where: { id: targetId, deletedAt: null },
    data,
  });
  return result.count > 0;
}

export async function getAdminReportStats() {
  const now = Date.now();
  const since24h = new Date(now - 24 * 60 * 60 * 1000);
  const since1h = new Date(now - 60 * 60 * 1000);

  const [total, last24h, last1h] = await prisma.$transaction([
    prisma.report.count(),
    prisma.report.count({ where: { createdAt: { gte: since24h } } }),
    prisma.report.count({ where: { createdAt: { gte: since1h } } }),
  ]);

  return { total, last24h, last1h };
}
