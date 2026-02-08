import { describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma';
import {
  createPostAndBump,
  createThread,
  deletePostByAuthorClientId,
  deleteThreadByAuthorClientId,
  getThreadById,
  getOrCreateDefaultCategoryId,
  listThreads,
} from '../lib/db/forum';

describe('forum db consistency', () => {
  it('creates reply and bumps thread timestamp', async () => {
    const thread = await createThread({
      title: `db-test-${Date.now()}`,
      body: 'body',
      authorName: 'tester',
    });

    const before = await prisma.thread.findUnique({
      where: { id: thread.id },
      select: { lastPostedAt: true },
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    const post = await createPostAndBump({
      threadId: thread.id,
      body: 'reply',
      authorName: 'tester2',
    });

    const after = await prisma.thread.findUnique({
      where: { id: thread.id },
      select: { lastPostedAt: true, _count: { select: { posts: true } } },
    });

    expect(post).not.toBeNull();
    expect(after).not.toBeNull();
    expect(before).not.toBeNull();

    if (before && after) {
      expect(after.lastPostedAt.getTime()).toBeGreaterThanOrEqual(before.lastPostedAt.getTime());
      expect(after._count.posts).toBeGreaterThanOrEqual(1);
    }
  });

  it('does not create reply on deleted thread', async () => {
    const categoryId = await getOrCreateDefaultCategoryId();
    const thread = await prisma.thread.create({
      data: {
        categoryId,
        title: `deleted-thread-${Date.now()}`,
        body: 'body',
        authorName: 'tester',
        deletedAt: new Date(),
      },
      select: { id: true },
    });

    const post = await createPostAndBump({
      threadId: thread.id,
      body: 'should fail',
      authorName: 'tester2',
    });

    const count = await prisma.post.count({ where: { threadId: thread.id } });

    expect(post).toBeNull();
    expect(count).toBe(0);
  });

  it('allows author client to delete own thread and post', async () => {
    const authorClientId = 'client-a';
    const otherClientId = 'client-b';

    const thread = await createThread({
      title: `self-delete-thread-${Date.now()}`,
      body: 'body',
      authorName: 'tester',
      authorClientId,
    });

    const created = await createPostAndBump({
      threadId: thread.id,
      body: 'reply',
      authorName: 'tester2',
      authorClientId,
    });

    expect(created).not.toBeNull();
    if (!created) return;

    const postDenied = await deletePostByAuthorClientId({ postId: created.id, authorClientId: otherClientId });
    expect(postDenied.ok).toBe(false);
    if (!postDenied.ok) {
      expect(postDenied.status).toBe(403);
    }

    const postOk = await deletePostByAuthorClientId({ postId: created.id, authorClientId });
    expect(postOk.ok).toBe(true);

    const postAfter = await prisma.post.findUnique({
      where: { id: created.id },
      select: { deletedAt: true },
    });
    expect(postAfter?.deletedAt).not.toBeNull();

    const threadDenied = await deleteThreadByAuthorClientId({ threadId: thread.id, authorClientId: otherClientId });
    expect(threadDenied.ok).toBe(false);
    if (!threadDenied.ok) {
      expect(threadDenied.status).toBe(403);
    }

    const threadOk = await deleteThreadByAuthorClientId({ threadId: thread.id, authorClientId });
    expect(threadOk.ok).toBe(true);

    const threadAfter = await prisma.thread.findUnique({
      where: { id: thread.id },
      select: { deletedAt: true },
    });
    expect(threadAfter?.deletedAt).not.toBeNull();
  });

  it('orders pinned threads and posts first', async () => {
    const unique = Date.now();
    const threadA = await createThread({
      title: `pin-test-${unique}-A`,
      body: 'body',
      authorName: 'tester',
      authorClientId: `client-${unique}-a`,
    });
    const threadB = await createThread({
      title: `pin-test-${unique}-B`,
      body: 'body',
      authorName: 'tester',
      authorClientId: `client-${unique}-b`,
    });

    // Pin threadB and make it "older" to prove pinned ordering wins.
    await prisma.thread.update({
      where: { id: threadB.id },
      data: { pinnedAt: new Date(), lastPostedAt: new Date(0) },
      select: { id: true },
    });

    const result = await listThreads({ q: `pin-test-${unique}`, page: 1, pageSize: 10 });
    expect(result.threads.length).toBeGreaterThanOrEqual(2);
    expect(result.threads[0].id).toBe(threadB.id);

    const post1 = await createPostAndBump({
      threadId: threadA.id,
      body: 'first',
      authorName: 'tester',
      authorClientId: `client-${unique}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const post2 = await createPostAndBump({
      threadId: threadA.id,
      body: 'second',
      authorName: 'tester',
      authorClientId: `client-${unique}`,
    });

    expect(post1).not.toBeNull();
    expect(post2).not.toBeNull();
    if (!post1 || !post2) return;

    await prisma.post.update({
      where: { id: post1.id },
      data: { pinnedAt: new Date() },
      select: { id: true },
    });

    const threadDetail = await getThreadById(threadA.id, 'asc');
    expect(threadDetail).not.toBeNull();
    expect(threadDetail?.posts.length).toBeGreaterThanOrEqual(2);
    expect(threadDetail?.posts[0]?.id).toBe(post1.id);
  });
});
