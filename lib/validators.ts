import { z } from 'zod';
import {
  MAX_BODY_LENGTH,
  MAX_NAME_LENGTH,
  MAX_REPORT_NOTE_LENGTH,
  MAX_SEARCH_QUERY_LENGTH,
  MAX_TITLE_LENGTH,
} from './constants';

function removeInvisibleChars(value: string) {
  return value.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function normalizeMultiline(value: string) {
  return removeInvisibleChars(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

function normalizeSingleLine(value: string) {
  return normalizeMultiline(value).replace(/\n+/g, ' ');
}

function neutralizeHtml(value: string) {
  return value.replace(/</g, '＜').replace(/>/g, '＞');
}

const sanitizedTitle = z
  .string()
  .transform((value) => neutralizeHtml(normalizeSingleLine(value)))
  .pipe(
    z
      .string()
      .min(1, 'タイトルを入力してください')
      .max(MAX_TITLE_LENGTH, `タイトルは${MAX_TITLE_LENGTH}文字までです`),
  );

const sanitizedBody = z
  .string()
  .transform((value) => neutralizeHtml(normalizeMultiline(value)))
  .pipe(
    z
      .string()
      .min(1, '本文を入力してください')
      .max(MAX_BODY_LENGTH, `本文は${MAX_BODY_LENGTH}文字までです`),
  );

const sanitizedOptionalName = z
  .string()
  .transform((value) => neutralizeHtml(normalizeSingleLine(value)))
  .pipe(z.string().max(MAX_NAME_LENGTH, `表示名は${MAX_NAME_LENGTH}文字までです`))
  .optional()
  .or(z.literal(''));

export const threadSchema = z.object({
  title: sanitizedTitle,
  body: sanitizedBody,
  authorName: sanitizedOptionalName,
});

export const postSchema = z.object({
  threadId: z.number().int().positive(),
  body: sanitizedBody,
  authorName: sanitizedOptionalName,
});

export const reportSchema = z.object({
  targetType: z.enum(['thread', 'post']),
  targetId: z.number().int().positive(),
  reason: z.enum(['personal', 'harassment', 'spam', 'hate', 'other']),
  note: z
    .string()
    .transform((value) => neutralizeHtml(normalizeSingleLine(value)))
    .pipe(z.string().max(MAX_REPORT_NOTE_LENGTH, `メモは${MAX_REPORT_NOTE_LENGTH}文字までです`))
    .optional()
    .or(z.literal('')),
});

export const threadsQuerySchema = z.object({
  q: z
    .string()
    .transform((value) => normalizeSingleLine(value))
    .pipe(z.string().max(MAX_SEARCH_QUERY_LENGTH, `検索語は${MAX_SEARCH_QUERY_LENGTH}文字までです`))
    .optional()
    .or(z.literal('')),
  page: z.coerce.number().int().min(1).optional(),
});

export const threadDetailQuerySchema = z.object({
  sort: z.enum(['asc', 'desc']).optional(),
});
