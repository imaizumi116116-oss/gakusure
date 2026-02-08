'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './ToastProvider';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, MAX_BODY_LENGTH } from '@/lib/constants';
import { copy } from '@/lib/copy';

type ReplyFormProps = {
  threadId: number;
};

type FieldErrors = {
  body?: string;
  authorName?: string;
};

export function ReplyForm({ threadId }: ReplyFormProps) {
  const router = useRouter();
  const { push } = useToast();
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
      const res = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({
          threadId,
          body,
          authorName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fieldErrors ?? {});
        push(data.message ?? copy.postForm.error, 'error');
        return;
      }

      push(copy.postForm.success, 'success');
      setBody('');
      setAuthorName('');
      router.refresh();
      setTimeout(() => {
        document.getElementById('latest-post')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } catch {
      push(copy.postForm.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-4 p-6">
      <div>
        <label htmlFor="reply-body" className="text-xs font-semibold text-muted">
          {copy.postForm.bodyLabel}
        </label>
        <textarea
          id="reply-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          className="input-base mt-2"
          placeholder={copy.postForm.bodyPlaceholder}
          maxLength={MAX_BODY_LENGTH}
          required
        />
        <div className="mt-1 flex items-center justify-between text-xs text-muted">
          <span>{errors.body ?? copy.postForm.bodyHelp}</span>
          <span>
            {body.length}/{MAX_BODY_LENGTH}
          </span>
        </div>
      </div>
      <div>
        <label htmlFor="reply-author" className="text-xs font-semibold text-muted">
          {copy.postForm.nameLabel}
        </label>
        <input
          id="reply-author"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          className="input-base mt-2"
          placeholder={copy.postForm.namePlaceholder}
          maxLength={20}
        />
        <div className="mt-1 text-xs text-muted">
          {errors.authorName ?? copy.postForm.nameHelp}
        </div>
      </div>
      <button type="submit" className="primary-button w-full" disabled={loading}>
        {loading ? copy.postForm.submitting : copy.postForm.submit}
      </button>
    </form>
  );
}
