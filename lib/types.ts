import type { Post, Thread } from '@prisma/client';

export type ThreadListItem = Pick<
  Thread,
  'id' | 'title' | 'body' | 'authorName' | 'isStaff' | 'pinnedAt' | 'createdAt' | 'lastPostedAt'
> & {
  _count: { posts: number };
};

export type ThreadDetail = Pick<
  Thread,
  'id' | 'title' | 'body' | 'authorName' | 'createdAt' | 'lastPostedAt'
> & {
  _count: { posts: number };
  posts: Pick<Post, 'id' | 'body' | 'authorName' | 'createdAt'>[];
};
