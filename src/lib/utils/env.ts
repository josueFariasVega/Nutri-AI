/**
 * @fileoverview Environment Variables Configuration
 * @description Configuración y validación de variables de entorno para desarrollo y producción
 */

// Supabase Configuration
export const VITE_SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL
export const VITE_SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY

// Spoonacular API Configuration
export const VITE_SPOONACULAR_API_KEY: string = import.meta.env.VITE_SPOONACULAR_API_KEY

// Environment Configuration
export const VITE_REDIRECT_URL: string = import.meta.env.VITE_REDIRECT_URL || window.location.origin

// Production Features
export const VITE_ENABLE_ANALYTICS: boolean = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
export const VITE_ENABLE_ERROR_REPORTING: boolean = import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true'
export const VITE_ENABLE_PERFORMANCE_MONITORING: boolean = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true'

// Environment Checks
export const isDevelopment = VITE_APP_ENV === 'development'
export const isProduction = VITE_APP_ENV === 'production'

/**
 * Validar variables de entorno requeridas
 */
function validateEnvironmentVariables(): void {
  const requiredVars = [
    { name: 'VITE_SUPABASE_URL', value: VITE_SUPABASE_URL },
    { name: 'VITE_SUPABASE_ANON_KEY', value: VITE_SUPABASE_ANON_KEY },
    { name: 'VITE_SPOONACULAR_API_KEY', value: VITE_SPOONACULAR_API_KEY },
  ]

  const missingVars = requiredVars.filter(({ value }) => !value)

  if (missingVars.length > 0) {
    const missingNames = missingVars.map(({ name }) => name).join(', ')
    throw new Error(
      `❌ Variables de entorno faltantes: ${missingNames}\n` +
      `📝 Copia .env.example como .env y completa los valores requeridos`
    )
  }

  // Validaciones específicas
  if (!VITE_SUPABASE_URL.startsWith('https://')) {
    throw new Error('❌ VITE_SUPABASE_URL debe ser una URL HTTPS válida')
  }

  if (VITE_SUPABASE_ANON_KEY.length < 100) {
    throw new Error('❌ VITE_SUPABASE_ANON_KEY parece ser inválida (muy corta)')
  }

  if (VITE_SPOONACULAR_API_KEY.length < 20) {
    throw new Error('❌ VITE_SPOONACULAR_API_KEY parece ser inválida (muy corta)')
  }

  // Log de configuración (solo en desarrollo)
  if (isDevelopment) {
    console.log('✅ Variables de entorno validadas correctamente')
    console.log(`🌍 Entorno: ${VITE_APP_ENV}`)
    //console.log(`🔗 Supabase URL: ${VITE_SUPABASE_URL}`)
    //console.log(`🔑 Spoonacular API: ${VITE_SPOONACULAR_API_KEY.substring(0, 8)}...`)
  }
}

// Ejecutar validación al importar el módulo
validateEnvironmentVariables()

/**
 * Configuración de logging condicional
 */
export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    // Errores siempre se muestran
    console.error(...args)
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}
