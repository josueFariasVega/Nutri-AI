/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase Configuration
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  // Spoonacular API Configuration
  readonly VITE_SPOONACULAR_API_KEY: string;
  
  // Environment Configuration
  readonly VITE_APP_ENV: 'development' | 'production' | 'test';
  
  // Production Features
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_ERROR_REPORTING: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  
  // Optional: Future integrations
  readonly VITE_ANALYTICS_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}