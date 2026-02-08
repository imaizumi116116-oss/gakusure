'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from '@/lib/constants';
import { copy } from '@/lib/copy';

type FieldErrors = {
  title?: string;
  body?: string;
  authorName?: string;
};

export function ThreadCreateForm() {
  const router = useRouter();
  const { push } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({
          title,
          body,
          authorName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        push(data.message ?? copy.threadForm.error, 'error');
        return;
      }

      push(copy.threadForm.success, 'success');
      router.push(`/thread/${data.data.id}`);
      router.refresh();
    } catch {
      push(copy.threadForm.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-5 p-6">
      <div>
        <label htmlFor="thread-title" className="text-xs font-semibold text-muted">
          {copy.threadForm.titleLabel}
        </label>
        <input
          id="thread-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="input-base mt-2"
          placeholder={copy.threadForm.titlePlaceholder}
          maxLength={MAX_TITLE_LENGTH}
          required
        />
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>{errors.title ?? copy.threadForm.titleHelp}</span>
          <span>
            {title.length}/{MAX_TITLE_LENGTH}
          </span>
        </div>
      </div>
      <div>
        <label htmlFor="thread-body" className="text-xs font-semibold text-muted">
          {copy.threadForm.bodyLabel}
        </label>
        <textarea
          id="thread-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={7}
          className="input-base mt-2"
          placeholder={copy.threadForm.bodyPlaceholder}
          maxLength={MAX_BODY_LENGTH}
          required
        />
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>{errors.body ?? copy.threadForm.bodyHelp}</span>
          <span>
            {body.length}/{MAX_BODY_LENGTH}
          </span>
        </div>
      </div>
      <div>
        <label htmlFor="thread-author" className="text-xs font-semibold text-muted">
          {copy.threadForm.nameLabel}
        </label>
        <input
          id="thread-author"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          className="input-base mt-2"
          placeholder={copy.threadForm.namePlaceholder}
          maxLength={20}
        />
        <div className="mt-1 text-xs text-muted">
          {errors.authorName ?? copy.threadForm.nameHelp}
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4 text-xs text-muted">
        <p className="font-semibold text-ink">{copy.threadForm.guidelinesTitle}</p>
        <p className="mt-2">{copy.threadForm.guidelinesBody}</p>
      </div>
      <button type="submit" className="primary-button w-full" disabled={loading}>
        {loading ? copy.threadForm.submitting : copy.threadForm.submit}
      </button>
    </form>
  );
}
