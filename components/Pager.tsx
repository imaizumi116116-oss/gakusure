import Link from 'next/link';
import { copy } from '@/lib/copy';

function buildQueryString(page: number, query?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
  }
  if (page > 1) {
    params.set('page', String(page));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

type PagerProps = {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
};

export function Pager({ page, totalPages, basePath, query }: PagerProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <Link
        href={`${basePath}${buildQueryString(prevPage, query)}`}
        className={`soft-button ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
      >
        {copy.pagination.prev}
      </Link>
      <p className="text-sm text-muted">
        {page} / {totalPages} {copy.pagination.page}
      </p>
      <Link
        href={`${basePath}${buildQueryString(nextPage, query)}`}
        className={`soft-button ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
      >
        {copy.pagination.next}
      </Link>
    </div>
  );
}
