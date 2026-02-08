import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DEFAULT_CATEGORY = {
  slug: 'general',
  name: '全体',
  description: 'カテゴリ未指定のスレッド',
};

export async function getOrCreateDefaultCategoryId() {
  const category = await prisma.category.upsert({
    where: { slug: DEFAULT_CATEGORY.slug },
    create: DEFAULT_CATEGORY,
    update: { name: DEFAULT_CATEGORY.name, description: DEFAULT_CATEGORY.description },
    select: { id: true },
  });

  return category.id;
}

export async function listThreads(params: { q?: string; page: number; pageSize: number }) {
  const where: Prisma.ThreadWhereInput = {
    deletedAt: null,
  };

  if (params.q) {
    where.OR = [{ title: { contains: params.q } }, { body: { contains: params.q } }];
  }

  const [threads, total] = await prisma.$transaction([
    prisma.thread.findMany({
      where,
      // Stable sort for pagination: fallback by id when timestamps are identical.
      orderBy: [{ pinnedAt: 'desc' }, { lastPostedAt: 'desc' }, { id: 'desc' }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: {
        id: true,
        title: true,
        body: true,
        authorName: true,
        isStaff: true,
        pinnedAt: true,
        createdAt: true,
        lastPostedAt: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.thread.count({ where }),
  ]);

  return { threads, total };
}

export async function getThreadById(threadId: number, sort: 'asc' | 'desc') {
  return prisma.thread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      title: true,
      body: true,
      authorName: true,
      authorClientId: true,
      isStaff: true,
      pinnedAt: true,
      createdAt: true,
      lastPostedAt: true,
      deletedAt: true,
      _count: { select: { posts: true } },
      posts: {
        where: { deletedAt: null },
        orderBy: [{ pinnedAt: 'desc' }, { createdAt: sort }, { id: sort }],
        select: {
          id: true,
          body: true,
          authorName: true,
          authorClientId: true,
          isStaff: true,
          pinnedAt: true,
          createdAt: true,
          deletedAt: true,
        },
      },
    },
  });
}

export async function createThread(input: {
  title: string;
  body: string;
  authorName: string;
  authorClientId?: string;
  isStaff?: boolean;
}) {
  const categoryId = await getOrCreateDefaultCategoryId();

  return prisma.thread.create({
    data: {
      categoryId,
      title: input.title,
      body: input.body,
      authorName: input.authorName,
      authorClientId: input.authorClientId ?? null,
      isStaff: input.isStaff ?? false,
      lastPostedAt: new Date(),
    },
    select: { id: true },
  });
}

export async function createPostAndBump(input: {
  threadId: number;
  body: string;
  authorName: string;
  authorClientId?: string;
  isStaff?: boolean;
}) {
  return prisma.$transaction(async (tx) => {
    const thread = await tx.thread.findUnique({
      where: { id: input.threadId },
      select: { id: true, deletedAt: true },
    });

    if (!thread || thread.deletedAt) {
      return null;
    }

    const post = await tx.post.create({
      data: {
        threadId: input.threadId,
        body: input.body,
        authorName: input.authorName,
        authorClientId: input.authorClientId ?? null,
        isStaff: input.isStaff ?? false,
      },
      select: { id: true },
    });

    await tx.thread.update({
      where: { id: input.threadId },
      data: { lastPostedAt: new Date() },
      select: { id: true },
    });

    return post;
  });
}

export async function findThreadVisibility(threadId: number) {
  return prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, deletedAt: true },
  });
}

export async function findPostVisibility(postId: number) {
  return prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, deletedAt: true },
  });
}

export async function deleteThreadByAuthorClientId(input: { threadId: number; authorClientId: string }) {
  const thread = await prisma.thread.findUnique({
    where: { id: input.threadId },
    select: { authorClientId: true, deletedAt: true },
  });

  if (!thread || thread.deletedAt) {
    return { ok: false as const, status: 404 };
  }

  if (!thread.authorClientId || thread.authorClientId !== input.authorClientId) {
    return { ok: false as const, status: 403 };
  }

  await prisma.thread.update({
    where: { id: input.threadId },
    data: { deletedAt: new Date() },
    select: { id: true },
  });

  return { ok: true as const };
}

export async function deletePostByAuthorClientId(input: { postId: number; authorClientId: string }) {
  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { authorClientId: true, deletedAt: true },
  });

  if (!post || post.deletedAt) {
    return { ok: false as const, status: 404 };
  }

  if (!post.authorClientId || post.authorClientId !== input.authorClientId) {
    return { ok: false as const, status: 403 };
  }

  await prisma.post.update({
    where: { id: input.postId },
    data: { deletedAt: new Date() },
    select: { id: true },
  });

  return { ok: true as const };
}

export async function createReport(input: {
  targetType: 'thread' | 'post';
  targetId: number;
  reason: 'personal' | 'harassment' | 'spam' | 'hate' | 'other';
  note?: string;
}) {
  return prisma.report.create({
    data: {
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      note: input.note || null,
    },
    select: { id: true },
  });
}
