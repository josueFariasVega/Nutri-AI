import { createClient } from '@supabase/supabase-js'
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from '../env'

// Validate environment variables
if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// Create a singleton Supabase client to avoid multiple instances
export const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

/**🧠 ¿Por qué usar un singleton?
/*Porque evita:
🔁 Múltiples instancias que rompen la sesión del usuario
🧨 Problemas de sincronización en realtime
🧼 Código duplicado en cada componente */

//🧩 ¿Qué es el cliente Supabase?
/*Es una instancia creada con createClient(supabaseUrl, supabaseAnonKey) que te permite interactuar con todos los servicios de Supabase desde el frontend:
📦 Base de datos (PostgreSQL): CRUD con seguridad basada en RLS
🔐 Autenticación: OTP, magic links, OAuth, etc.
🗂️ Storage: subir, descargar y gestionar archivos
📡 Realtime: escuchar cambios en tablas en tiempo real
🧠 Edge Functions: invocar funciones serverless (aunque eso lo estás manejando aparte)
*/