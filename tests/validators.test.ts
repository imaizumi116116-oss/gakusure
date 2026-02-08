import { describe, expect, it } from 'vitest';
import {
  MAX_BODY_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  MAX_TITLE_LENGTH,
} from '../lib/constants';
import {
  postSchema,
  reportSchema,
  threadSchema,
  threadsQuerySchema,
} from '../lib/validators';

describe('validators', () => {
  it('rejects empty thread title', () => {
    const result = threadSchema.safeParse({
      title: '',
      body: '本文',
      authorName: '匿名',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title that exceeds max length', () => {
    const result = threadSchema.safeParse({
      title: 'a'.repeat(MAX_TITLE_LENGTH + 1),
      body: '本文',
      authorName: '匿名',
    });
    expect(result.success).toBe(false);
  });

  it('rejects body that exceeds max length', () => {
    const result = threadSchema.safeParse({
      title: 'タイトル',
      body: 'a'.repeat(MAX_BODY_LENGTH + 1),
      authorName: '匿名',
    });
    expect(result.success).toBe(false);
  });

  it('sanitizes potentially dangerous html and invisible characters', () => {
    const result = threadSchema.safeParse({
      title: '<script>alert(1)</script>\u200B',
      body: '<img src=x onerror=alert(1)>\u200B',
      authorName: '<b>name</b>\u200B',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title.includes('<')).toBe(false);
      expect(result.data.body.includes('<')).toBe(false);
      expect(result.data.authorName?.includes('<')).toBe(false);
      expect(result.data.title.includes('\u200B')).toBe(false);
    }
  });

  it('accepts valid post payload', () => {
    const result = postSchema.safeParse({
      threadId: 1,
      body: '返信本文',
      authorName: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too long author name', () => {
    const result = postSchema.safeParse({
      threadId: 1,
      body: '返信本文',
      authorName: 'a'.repeat(MAX_NAME_LENGTH + 1),
    });
    expect(result.success).toBe(false);
  });

  it('rejects too long search query', () => {
    const result = threadsQuerySchema.safeParse({
      q: 'q'.repeat(MAX_SEARCH_QUERY_LENGTH + 1),
      page: 1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts report with note', () => {
    const result = reportSchema.safeParse({
      targetType: 'post',
      targetId: 10,
      reason: 'spam',
      note: '宣伝っぽいです',
    });
    expect(result.success).toBe(true);
  });
});
