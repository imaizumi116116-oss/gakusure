import { redirect } from 'next/navigation';
import { PageContainer } from '@/components/PageContainer';
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton';
import { AdminReportTable } from '@/components/admin/AdminReportTable';
import { getAdminSession, hasAdminPermission, roleLabel } from '@/lib/adminAuth';
import { getAdminReportStats, listAdminReports } from '@/lib/db/admin';
import { copy } from '@/lib/copy';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  const [reports, stats] = await Promise.all([listAdminReports(), getAdminReportStats()]);
  const canModerate = hasAdminPermission(session.role, 'moderation:write');

  const serializedReports = reports.map((report) => ({
    ...report,
    createdAt: report.createdAt.toISOString(),
  }));

  return (
    <PageContainer>
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted">{copy.admin.label}</p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{copy.admin.dashboardTitle}</h1>
            <p className="mt-2 text-sm text-muted">{copy.admin.dashboardDescription}</p>
            <p className="mt-1 text-xs text-muted">
              {copy.admin.currentRoleLabel}: {roleLabel(session.role)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="tag-pill text-ink">
                {copy.admin.reportStatsTotal}: {stats.total}
              </span>
              <span className="tag-pill text-ink">
                {copy.admin.reportStats24h}: {stats.last24h}
              </span>
              <span className="tag-pill text-ink">
                {copy.admin.reportStats1h}: {stats.last1h}
              </span>
            </div>
          </div>
          <AdminLogoutButton />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-xl font-semibold text-ink">{copy.admin.reportListTitle}</h2>
        <p className="mt-2 text-sm text-muted">{copy.admin.reportListDescription}</p>

        <div className="mt-4">
          <AdminReportTable reports={serializedReports} canModerate={canModerate} />
        </div>
      </section>
    </PageContainer>
  );
}
