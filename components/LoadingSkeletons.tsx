import { cn } from '@/lib/utils';

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-border/50', className)} />;
}

export function ThreadListCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex gap-2">
        <SkeletonBlock className="h-6 w-20" />
        <SkeletonBlock className="h-6 w-32" />
      </div>
      <SkeletonBlock className="mt-4 h-6 w-3/4" />
      <SkeletonBlock className="mt-3 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-5/6" />
      <div className="mt-6 flex justify-between">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="h-4 w-20" />
      </div>
    </div>
  );
}
