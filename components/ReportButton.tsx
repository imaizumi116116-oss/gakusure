'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { copy } from '@/lib/copy';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@/lib/constants';

type ReportButtonProps = {
  targetType: 'thread' | 'post';
  targetId: number;
  onOpenChange?: (open: boolean) => void;
};

type ReportReason = (typeof copy.report.reasons)[number]['value'];

export function ReportButton({ targetType, targetId, onOpenChange }: ReportButtonProps) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(copy.report.reasons[0].value);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const setPopupOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const submitReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
        },
        body: JSON.stringify({ targetType, targetId, reason, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.message ?? copy.report.error, 'error');
        return;
      }
      push(copy.report.success, 'success');
      setPopupOpen(false);
      setNote('');
      setReason(copy.report.reasons[0].value);
    } catch {
      push(copy.report.networkError, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${open ? 'z-40' : 'z-10'}`}>
      <button type="button" onClick={() => setPopupOpen(!open)} className="soft-button">
        {copy.report.button}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-border/80 bg-card/95 p-4 shadow-lg backdrop-blur sm:left-auto sm:right-0">
          <p className="text-xs font-semibold text-muted">{copy.report.title}</p>
          <select
            value={reason}
            onChange={(event) => setReason(event.target.value as ReportReason)}
            className="input-base mt-2"
          >
            {copy.report.reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <textarea
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.report.placeholder}
            className="input-base mt-3"
          />
          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={() => setPopupOpen(false)} className="soft-button">
              {copy.report.close}
            </button>
            <button
              type="button"
              onClick={submitReport}
              className="primary-button"
              disabled={loading}
            >
              {loading ? copy.report.submitting : copy.report.submit}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
