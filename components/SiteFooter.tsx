import Link from 'next/link';
import { copy } from '@/lib/copy';
import { getAdminSession } from '@/lib/adminAuth';
import { AdminFooterAuth } from '@/components/admin/AdminFooterAuth';

export function SiteFooter() {
  const isAdmin = getAdminSession() !== null;

  return (
    <footer className="mt-16 border-t border-border/70 py-8 text-center text-xs text-muted">
      <p>{copy.site.footerNote}</p>
      <p className="mt-2">
        <Link href="/rules" className="underline decoration-border underline-offset-4">
          {copy.nav.rules}
        </Link>
      </p>
      <p className="mt-1">{copy.site.copyright}</p>
      <AdminFooterAuth initiallyAuthed={isAdmin} />
    </footer>
  );
}
