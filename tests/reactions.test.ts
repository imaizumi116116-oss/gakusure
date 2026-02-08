import { describe, expect, it } from 'vitest';
import { createThread, createPostAndBump } from '../lib/db/forum';
import { getReactionCounts, getReactionSummary, toggleReaction } from '../lib/db/reactions';

describe('reactions', () => {
  it('toggles reaction on thread and post', async () => {
    const unique = Date.now();
    const clientId = `client-react-${unique}`;

    const thread = await createThread({
      title: `react-thread-${unique}`,
      body: 'body',
      authorName: 'tester',
      authorClientId: clientId,
    });

    const post = await createPostAndBump({
      threadId: thread.id,
      body: 'reply',
      authorName: 'tester2',
      authorClientId: clientId,
    });
    expect(post).not.toBeNull();
    if (!post) return;

    const threadOn = await toggleReaction({
      targetType: 'thread',
      targetId: thread.id,
      type: 'like',
      authorClientId: clientId,
    });
    expect(threadOn.reacted).toBe(true);

    const threadCounts = await getReactionCounts('thread', thread.id);
    expect(threadCounts.like).toBe(1);

    const threadOff = await toggleReaction({
      targetType: 'thread',
      targetId: thread.id,
      type: 'like',
      authorClientId: clientId,
    });
    expect(threadOff.reacted).toBe(false);

    const threadCountsOff = await getReactionCounts('thread', thread.id);
    expect(threadCountsOff.like).toBe(0);

    const postOn = await toggleReaction({
      targetType: 'post',
      targetId: post.id,
      type: 'thanks',
      authorClientId: clientId,
    });
    expect(postOn.reacted).toBe(true);

    const summary = await getReactionSummary({
      targetType: 'post',
      targetIds: [post.id],
      authorClientId: clientId,
    });
    expect(summary.countsByTargetId[post.id]?.thanks).toBe(1);
    expect(summary.mineByTargetId[post.id]?.thanks).toBe(true);
  });
});
