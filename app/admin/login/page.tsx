import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/PageContainer';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) {
    redirect('/admin');
  }

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <p className="text-xs font-semibold text-muted">{copy.admin.label}</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{copy.admin.loginTitle}</h1>
        <p className="mt-3 text-sm text-muted">{copy.admin.loginDescription}</p>
      </section>

      <AdminLoginForm />
    </PageContainer>
  );
}
