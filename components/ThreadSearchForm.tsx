import Link from 'next/link';
import { copy } from '@/lib/copy';

type ThreadSearchFormProps = {
  currentQuery?: string;
};

export function ThreadSearchForm({ currentQuery }: ThreadSearchFormProps) {
  return (
    <form method="GET" className="glass-card mt-6 grid gap-4 p-5 md:grid-cols-[1fr_auto]">
      <div>
        <label htmlFor="search-q" className="text-xs font-medium text-muted">
          {copy.search.keywordLabel}
        </label>
        <input
          id="search-q"
          name="q"
          defaultValue={currentQuery}
          placeholder={copy.search.keywordPlaceholder}
          className="input-base mt-2"
        />
      </div>
      <div className="flex items-end gap-2">
        <button type="submit" className="primary-button w-full">
          {copy.search.submit}
        </button>
        <Link href="/" className="soft-button">
          {copy.search.clear}
        </Link>
      </div>
    </form>
  );
}
