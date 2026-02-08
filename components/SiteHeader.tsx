import Link from 'next/link';
import Image from 'next/image';
import { copy } from '@/lib/copy';
import { getAdminSession } from '@/lib/adminAuth';

export function SiteHeader() {
  const isAdmin = getAdminSession() !== null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icon.svg"
            alt={`${copy.site.name} icon`}
            className="h-10 w-10 rounded-2xl shadow-sm"
            width={40}
            height={40}
            priority
          />
          <div>
            <p className="font-display text-lg font-semibold">{copy.site.name}</p>
            <p className="text-xs text-muted">{copy.site.tagline}</p>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/" className="soft-button">
            {copy.nav.home}
          </Link>
          <Link href="/rules" className="soft-button">
            {copy.nav.rules}
          </Link>
          <Link href="/new" className="primary-button">
            {copy.nav.newThread}
          </Link>
          {isAdmin ? (
            <Link href="/admin" className="tag-pill text-ink">
              {copy.admin.headerBadge}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
