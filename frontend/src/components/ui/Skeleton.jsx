const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  return <div className={`${baseClasses} ${variants[variant]} ${className}`} />;
};

export const HabitCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    <div className="mt-4 flex items-center gap-6">
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-8 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div>
          <Skeleton className="h-8 w-8 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  </div>
);

export const FriendCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export const ActivityCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1">
        <Skeleton className="h-5 w-64 mb-2" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-8 w-16 rounded-full" />
    </div>
  </div>
);

export const LeaderboardRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-l-4 border-gray-100">
    <Skeleton className="w-6 h-6 rounded" />
    <Skeleton variant="circular" className="w-10 h-10" />
    <div className="flex-1">
      <Skeleton className="h-5 w-32 mb-1" />
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="text-right">
      <Skeleton className="h-6 w-12 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  </div>
);

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizes[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`}
    />
  );
};

export default Skeleton;
