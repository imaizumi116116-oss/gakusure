import { envInt } from '@/lib/serverEnv';

export const THREAD_RATE_LIMIT_WINDOW_MS = envInt('THREAD_RATE_LIMIT_WINDOW_MS', 30_000, {
  min: 1_000,
  max: 10 * 60_000,
});

export const POST_RATE_LIMIT_WINDOW_MS = envInt('POST_RATE_LIMIT_WINDOW_MS', 30_000, {
  min: 1_000,
  max: 10 * 60_000,
});

export const REPORT_RATE_LIMIT_WINDOW_MS = envInt('REPORT_RATE_LIMIT_WINDOW_MS', 30_000, {
  min: 1_000,
  max: 10 * 60_000,
});

export const REACTION_RATE_LIMIT_WINDOW_MS = envInt('REACTION_RATE_LIMIT_WINDOW_MS', 10_000, {
  min: 1_000,
  max: 60 * 60_000,
});

export const REACTION_RATE_LIMIT_MAX = envInt('REACTION_RATE_LIMIT_MAX', 12, { min: 1, max: 1000 });

export const ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS = envInt('ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS', 10 * 60_000, {
  min: 1_000,
  max: 60 * 60_000,
});

export const ADMIN_LOGIN_MAX_ATTEMPTS = envInt('ADMIN_LOGIN_MAX_ATTEMPTS', 5, { min: 1, max: 100 });

export const SEARCH_RATE_LIMIT_WINDOW_MS = envInt('SEARCH_RATE_LIMIT_WINDOW_MS', 60_000, {
  min: 1_000,
  max: 60 * 60_000,
});

export const SEARCH_RATE_LIMIT_MAX = envInt('SEARCH_RATE_LIMIT_MAX', 60, { min: 1, max: 10_000 });
