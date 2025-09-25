# 🚀 Guía de Deployment - Plataforma de Nutrición Personalizada

## 📋 Pre-requisitos

### Variables de Entorno Requeridas
```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_SPOONACULAR_API_KEY=tu_clave_de_spoonacular
VITE_APP_ENV=production
```

### Servicios Externos
- ✅ **Supabase**: Proyecto configurado con autenticación OAuth
- ✅ **Spoonacular API**: Cuenta activa con API key válida
- ✅ **Dominio**: Configurado para HTTPS

## 🔧 Configuración de Producción

### 1. Variables de Entorno
```bash
# Copiar template de producción
cp .env.production .env

# Editar con valores reales de producción
nano .env
```

### 2. Build de Producción
```bash
# Limpiar builds anteriores
npm run clean

# Verificar tipos TypeScript
npm run type-check

# Build optimizado para producción
npm run build:prod
```

### 3. Verificar Build
```bash
# Preview local del build de producción
npm run preview
```

## 🌐 Deployment en Diferentes Plataformas

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configurar variables de entorno en Vercel Dashboard
```

### Netlify
```bash
# Build command: npm run build:prod
# Publish directory: build
# Environment variables: Configurar en Netlify Dashboard
```

### Servidor Propio (VPS/Dedicated)
```bash
# Build local
npm run build:prod

# Subir carpeta build/ al servidor
scp -r build/ user@server:/var/www/html/

# Configurar Nginx/Apache para SPA
```

## 🔒 Configuración de Seguridad

### Supabase
- ✅ RLS (Row Level Security) habilitado
- ✅ OAuth providers configurados
- ✅ CORS configurado para dominio de producción

### Headers de Seguridad (Nginx ejemplo)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

## 📊 Monitoreo y Analytics

### Variables de Entorno Opcionales
```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### Servicios Recomendados
- **Analytics**: Google Analytics, Plausible
- **Error Tracking**: Sentry, LogRocket
- **Performance**: Web Vitals, Lighthouse CI

## 🧪 Testing Pre-Deployment

### Checklist de Verificación
- [ ] Variables de entorno configuradas
- [ ] Build de producción exitoso
- [ ] Autenticación OAuth funcional
- [ ] APIs externas respondiendo
- [ ] Responsive design verificado
- [ ] Performance optimizada (Lighthouse > 90)
- [ ] SEO básico implementado

### Comandos de Testing
```bash
# Verificar variables de entorno
npm run dev # Debe mostrar logs de validación

# Build de prueba
npm run build:prod

# Preview local
npm run preview
```

## 🔄 CI/CD (Opcional)

### GitHub Actions Ejemplo
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run build:prod
      - run: npm run preview
```

## 🆘 Troubleshooting

### Errores Comunes
1. **Variables de entorno faltantes**: Verificar .env
2. **CORS errors**: Configurar Supabase para dominio de producción
3. **OAuth redirect**: Actualizar URLs en Google Cloud Console
4. **API limits**: Verificar quotas de Spoonacular

### Logs de Producción
- Errores se muestran en consola del navegador
- Logs de desarrollo están deshabilitados automáticamente
- Usar herramientas de monitoreo para tracking avanzado

## 📞 Soporte

Para problemas de deployment:
1. Verificar esta guía completa
2. Revisar logs de build
3. Verificar configuración de servicios externos
4. Contactar al equipo de desarrollo
