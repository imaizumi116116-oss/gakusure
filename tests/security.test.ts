import { describe, expect, it } from 'vitest';
import { validateCsrfRequest } from '../lib/security';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '../lib/constants';

describe('security', () => {
  it('accepts same-origin request with csrf header', () => {
    const req = new Request('https://example.com/api/thread', {
      method: 'POST',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
    });

    const result = validateCsrfRequest(req);
    expect(result.ok).toBe(true);
  });

  it('accepts request with same-origin referer and csrf header', () => {
    const req = new Request('https://example.com/api/thread', {
      method: 'POST',
      headers: {
        referer: 'https://example.com/thread/1',
        host: 'example.com',
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
    });

    const result = validateCsrfRequest(req);
    expect(result.ok).toBe(true);
  });

  it('rejects request with no origin and no referer', () => {
    const req = new Request('https://example.com/api/thread', {
      method: 'POST',
      headers: {
        host: 'example.com',
        [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
      },
    });

    const result = validateCsrfRequest(req);
    expect(result.ok).toBe(false);
  });

  it('rejects request without csrf header', () => {
    const req = new Request('https://example.com/api/thread', {
      method: 'POST',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
      },
    });

    const result = validateCsrfRequest(req);
    expect(result.ok).toBe(false);
  });
});
