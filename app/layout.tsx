import './globals.css';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ToastProvider } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

export const metadata: Metadata = {
  title: `${copy.site.name} | ${copy.site.tagline}`,
  description: copy.site.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <ToastProvider>
          <SiteHeader />
          <main className="min-h-[calc(100vh-160px)] py-10">{children}</main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
