import { VITE_SUPABASE_URL } from '../env'

// Base de Edge Functions de este proyecto (ajusta el slug si cambia)
const EDGE_BASE = `${VITE_SUPABASE_URL}/functions/v1/make-server-b9678739`

export function getEdgeUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${EDGE_BASE}/${normalized}`
}

export async function fetchEdge(path: string, init?: RequestInit) {
  const url = getEdgeUrl(path)
  return fetch(url, init)
}


/*
 * Conector a funciones Edge
Este archivo está diseñado para invocar funciones serverless que creaste en Supabase Edge Functions. Es ideal para lógica que:
No querés exponer directamente al cliente (como claves secretas, validaciones, etc.)
Requiere procesamiento backend (como enviar correos, manejar pagos, etc.)
Está desacoplada del frontend y puede escalar por separado 
*/