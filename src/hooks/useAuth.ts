import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/utils/supabase/client';
import { logger } from '../lib/utils/logger';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    // Check for OAuth callback parameters first
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      // Debug: Always log URL checking
      logger.log('🔍 Checking for OAuth callback...');
      logger.log('🔍 Current URL:', window.location.href);
      logger.log('🔍 Hash params:', window.location.hash);
      logger.log('🔍 Search params:', window.location.search);
      
      if (hashParams.get('access_token') || searchParams.get('code') || hashParams.get('error')) {
        logger.log('🔍 OAuth callback detected, processing...');
        
        // Check for OAuth errors first
        const oauthError = hashParams.get('error') || searchParams.get('error');
        if (oauthError) {
          const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
          logger.error('❌ Error Description:', decodeURIComponent(errorDescription || ''));
          
          // Show user-friendly error message
          if (oauthError === 'server_error' && errorDescription?.includes('Unable to exchange external code')) {
            logger.error('🔧 Configuration Error: Google OAuth redirect URI mismatch');
            logger.error('🔧 Check your Google Cloud Console and Supabase settings');
          }
          
          // Clear the error from URL and return to clean state
          window.history.replaceState({}, document.title, '/auth');
          return false;
        }
        
        try {
          // Wait a bit for Supabase to process the callback
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const { data, error } = await supabase.auth.getSession();
          logger.log('🔍 Session after OAuth:', data.session?.user?.email || 'No session');
          
          if (data.session && data.session.user) {
            logger.log('✅ OAuth session established:', data.session.user.email);
            setAuthState({
              user: data.session.user,
              session: data.session,
              loading: false,
              error: null
            });
            
            // Clean URL and redirect to home
            window.history.replaceState({}, document.title, '/');
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
            return true; // Indicate callback was handled
          } else {
            logger.log('❌ OAuth callback detected but no session established');
          }
        } catch (error) {
          logger.error('OAuth callback error:', error);
        }
      } else {
        logger.log('🔍 No OAuth callback parameters found');
      }
      return false; // No callback detected
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        // First check if this is an OAuth callback
        const isOAuthCallback = await handleOAuthCallback();
        if (isOAuthCallback) return; // Skip initial session if OAuth callback handled it
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          logger.error('Error getting session:', error);
          setAuthState((prev: AuthState) => ({ ...prev, error, loading: false }));
        } else {
          logger.log('Initial session loaded:', session?.user?.email || 'No user');
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        logger.error('Unexpected error getting session:', error);
        if (mounted) {
          setAuthState((prev: AuthState) => ({ ...prev, loading: false }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        logger.log('Auth state changed:', event, session?.user?.email || 'No user');
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            logger.log('✅ User signed in successfully');
            // Don't auto-redirect here, let the callback handler do it
            break;
          case 'SIGNED_OUT':
            logger.log('User signed out');
            break;
          case 'TOKEN_REFRESHED':
            logger.log('Token refreshed');
            break;
          case 'USER_UPDATED':
            logger.log('User updated');
            break;
          case 'PASSWORD_RECOVERY':
            logger.log('Password recovery initiated');
            break;
          case 'INITIAL_SESSION':
            // Normal initial session check
            break;
          default:
            logger.log('Auth event:', event);
        }
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          error: null
        });
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clear local state first
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });

      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error && !error.message.includes('Auth session missing')) {
        logger.error('Sign out error:', error);
        return { error };
      }
      
      // Force clear any remaining session data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
      return { error: null };
    } catch (error) {
      logger.error('Unexpected sign out error:', error);
      // Even if there's an error, clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null
      });
      return { error: null }; // Don't return error to avoid blocking logout
    }
  };

  return {
    ...authState,
    signOut,
    isAuthenticated: !!authState.user
  };
}
