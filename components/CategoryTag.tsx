import Link from 'next/link';
import { cn } from '@/lib/utils';

type CategoryTagProps = {
  name: string;
  slug?: string;
  className?: string;
  link?: boolean;
};

export function CategoryTag({ name, slug, className, link = true }: CategoryTagProps) {
  const label = slug ? `#${name}` : name;
  if (!slug || !link) {
    return <span className={cn('tag-pill', className)}>{label}</span>;
  }
  return (
    <Link href={`/c/${slug}`} className={cn('tag-pill transition hover:border-accent/70', className)}>
      {label}
    </Link>
  );
}
