import { PageContainer } from '@/components/PageContainer';
import { SkeletonBlock, ThreadListCardSkeleton } from '@/components/LoadingSkeletons';

export default function Loading() {
  return (
    <PageContainer>
      <div className="glass-card p-6">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="mt-3 h-8 w-2/3" />
        <SkeletonBlock className="mt-2 h-4 w-1/2" />
      </div>
      <div className="mt-6 grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <ThreadListCardSkeleton key={index} />
        ))}
      </div>
    </PageContainer>
  );
}
