import Link from 'next/link';

type EmptyStateCardProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

export function EmptyStateCard({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateCardProps) {
  return (
    <div className="glass-card flex flex-col items-start gap-3 p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
      <Link href={actionHref} className="primary-button">
        {actionLabel}
      </Link>
    </div>
  );
}
