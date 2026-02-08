'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';
import { useToast } from '@/components/ToastProvider';
import { copy } from '@/lib/copy';

type AdminReportRow = {
  id: number;
  targetType: 'thread' | 'post';
  targetId: number;
  reason: string;
  note: string | null;
  createdAt: string;
  targetExists: boolean;
  targetDeleted: boolean;
  targetLabel: string;
};

type AdminReportTableProps = {
  reports: AdminReportRow[];
  canModerate: boolean;
};

export function AdminReportTable({ reports, canModerate }: AdminReportTableProps) {
  const router = useRouter();
  const { push } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleHide = async (targetType: 'thread' | 'post', targetId: number, reportId: number) => {
    if (loadingId !== null) return;
    setLoadingId(reportId);

    try {
      const response = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ targetType, targetId }),
      });
      const data = await response.json();

      if (!response.ok) {
        push(data.message ?? copy.admin.hideError, 'error');
        return;
      }

      push(copy.admin.hideSuccess, 'success');
      router.refresh();
    } catch {
      push(copy.admin.networkError, 'error');
    } finally {
      setLoadingId(null);
    }
  };

  if (reports.length === 0) {
    return <p className="text-sm text-muted">{copy.admin.noReports}</p>;
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <article key={report.id} className="glass-card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>ID: {report.id}</span>
            <span>{new Date(report.createdAt).toLocaleString('ja-JP')}</span>
          </div>

          <p className="text-sm text-ink">
            <span className="font-semibold">{copy.admin.targetLabel}:</span> {report.targetLabel}
          </p>
          <p className="text-sm text-ink">
            <span className="font-semibold">{copy.admin.reasonLabel}:</span> {report.reason}
          </p>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{copy.admin.noteLabel}:</span>{' '}
            {report.note ? report.note : copy.admin.noNote}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {report.targetDeleted ? (
              <span className="tag-pill">{copy.admin.alreadyHidden}</span>
            ) : !canModerate ? (
              <span className="tag-pill">{copy.admin.permissionDeniedLabel}</span>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={loadingId === report.id || !report.targetExists}
                onClick={() => handleHide(report.targetType, report.targetId, report.id)}
              >
                {loadingId === report.id ? copy.admin.hiding : copy.admin.hideButton}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
