import React, { createContext, useContext, useState, useEffect } from 'react';

interface RouterContextType {
  currentRoute: string;
  navigate: (route: string, options?: { replace?: boolean }) => void;
  params: Record<string, string>;
  history: string[];
  canGoBack: boolean;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

interface RouterProviderProps {
  children?: React.ReactNode;
  initialRoute?: string;
}

export function RouterProvider({ children, initialRoute = '/' }: RouterProviderProps) {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);
  const [history, setHistory] = useState<string[]>([initialRoute]);
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = (route: string, options?: { replace?: boolean }) => {
    setCurrentRoute(route);
    
    if (options?.replace) {
      setHistory(prev => [...prev.slice(0, -1), route]);
    } else {
      setHistory(prev => [...prev, route]);
    }
    
    // Parse route parameters if needed
    const parsedParams = parseRouteParams(route);
    setParams(parsedParams);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const previousRoute = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentRoute(previousRoute);
      const parsedParams = parseRouteParams(previousRoute);
      setParams(parsedParams);
    }
  };

  const parseRouteParams = (route: string): Record<string, string> => {
    // Simple parameter parsing - can be extended as needed
    const urlParams = new URLSearchParams(route.split('?')[1] || '');
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  };

  const canGoBack = history.length > 1;

  return (
    <RouterContext.Provider
      value={{
        currentRoute,
        navigate,
        params,
        history,
        canGoBack,
        goBack,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

// Route matching utilities
export function matchRoute(currentRoute: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === currentRoute) return true;
  
  // Remove query parameters for matching
  const cleanRoute = currentRoute.split('?')[0];
  const cleanPattern = pattern.split('?')[0];
  
  return cleanRoute === cleanPattern;
}

export function isActiveRoute(currentRoute: string, route: string): boolean {
  return matchRoute(currentRoute, route);
}