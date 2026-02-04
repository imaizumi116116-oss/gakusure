const API_BASE = 'https://www.googleapis.com/youtube/v3/search';
const MAX_RESULTS = 12;
export const DEFAULT_QUERY = 'Apple';

const apiKey = import.meta.env.VITE_YT_API_KEY;

const createError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const buildUrl = ({ query, pageToken }) => {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(MAX_RESULTS),
    q: query,
    safeSearch: 'moderate',
    key: apiKey
  });

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  return `${API_BASE}?${params.toString()}`;
};

export const fetchVideos = async ({ query, pageToken = '' }) => {
  if (!apiKey) {
    throw createError('missing_key', 'API key is missing.');
  }

  let response;
  try {
    response = await fetch(buildUrl({ query, pageToken }));
  } catch (error) {
    throw createError('network', 'Network error.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason = data?.error?.errors?.[0]?.reason || 'unknown';
    if (reason.includes('quota') || reason.includes('rateLimit') || reason.includes('dailyLimit')) {
      throw createError('quota', data?.error?.message || 'Quota exceeded.');
    }
    if (reason === 'keyInvalid' || reason === 'accessNotConfigured') {
      throw createError('key', data?.error?.message || 'Invalid API key.');
    }
    throw createError('api', data?.error?.message || 'API error.');
  }

  return data;
};
