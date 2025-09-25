import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-48 w-full rounded-lg',
    text: 'h-4 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-md'
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        variantClasses[variant],
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
}

// Skeleton específico para el dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <Skeleton variant="button" className="h-10 w-32" />
      </div>

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="avatar" className="h-10 w-10" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton variant="text" className="h-8 w-20 mb-2" />
            <Skeleton variant="text" className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <Skeleton variant="text" className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-lg border p-6">
          <Skeleton variant="text" className="h-6 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Meal Plan Skeleton */}
      <div className="bg-white rounded-lg border p-6">
        <Skeleton variant="text" className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton variant="avatar" className="h-12 w-12" />
                <div className="space-y-2">
                  <Skeleton variant="text" className="h-5 w-32" />
                  <Skeleton variant="text" className="h-4 w-24" />
                </div>
              </div>
              <Skeleton variant="button" className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}