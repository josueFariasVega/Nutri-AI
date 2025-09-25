import React from 'react';
import { SimpleNavigation } from './SimpleNavigation';
import { Footer } from './Footer';
import { useRouter } from '../common/Router';

interface LayoutProps {
  children?: React.ReactNode;
  user?: any;
  onSignOut?: () => void;
  onNavigate?: (route: string) => void;
  showNavigation?: boolean;
}

export function Layout({ children, user, onSignOut, onNavigate, showNavigation = true }: LayoutProps) {
  const { currentRoute } = useRouter();

  // Show navigation on all pages except auth page and dashboard (dashboard has its own navigation)
  const shouldShowNav = showNavigation && !currentRoute.includes('/auth') && !currentRoute.includes('/dashboard');

  const shouldShowFooter = !currentRoute.includes('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {shouldShowNav && (
        <SimpleNavigation 
          user={user} 
          onNavigate={onNavigate || (() => {})}
          onSignOut={onSignOut || (() => {})}
        />
      )}
      
      <main className="flex-1">
        {children}
      </main>
      
      {shouldShowFooter && <Footer onNavigate={onNavigate} />}
    </div>
  );
}