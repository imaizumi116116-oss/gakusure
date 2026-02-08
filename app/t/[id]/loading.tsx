import { PageContainer } from '@/components/PageContainer';
import { SkeletonBlock } from '@/components/LoadingSkeletons';

export default function LoadingThread() {
  return (
    <PageContainer>
      <div className="glass-card p-6">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="mt-3 h-8 w-3/4" />
        <SkeletonBlock className="mt-2 h-4 w-40" />
      </div>
      <div className="mt-6 grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="glass-card p-6">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="mt-3 h-4 w-full" />
            <SkeletonBlock className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
