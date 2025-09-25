import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './loading-spinner';
import { Skeleton } from './skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  loadingText?: string;
  className?: string;
  delay?: number;
}

export function LoadingState({
  loading,
  error,
  children,
  skeleton,
  loadingText = 'Cargando...',
  className,
  delay = 300
}: LoadingStateProps) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (loading) {
      timeoutId = setTimeout(() => setShowLoading(true), delay);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, delay]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center',
          className
        )}
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ¡Ups! Algo salió mal
        </h3>
        <p className="text-sm text-gray-600 mb-4 max-w-md">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          Intentar de nuevo
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {loading && showLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('w-full', className)}
        >
          {skeleton || (
            <div className="flex flex-col items-center justify-center p-8">
              <LoadingSpinner size="lg" text={loadingText} />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn('w-full', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente específico para el dashboard
export function DashboardLoadingState({
  loading,
  error,
  children,
  className
}: {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <LoadingState
      loading={loading}
      error={error}
      skeleton={<DashboardSkeleton />}
      loadingText="Preparando tu dashboard nutricional..."
      className={className}
    >
      {children}
    </LoadingState>
  );
}

// Hook para manejar estados de carga con animaciones
export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const startLoading = (loadingText?: string) => {
    setLoading(true);
    setError(null);
    if (loadingText) {
      console.log(`🔄 ${loadingText}`);
    }
  };

  const stopLoading = () => {
    setLoading(false);
    setError(null);
  };

  const setLoadingError = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
    console.error(`❌ ${errorMessage}`);
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setLoadingError
  };
}