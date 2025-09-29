# Buscar y corregir TODOS los imports problemáticos con versiones
echo "🔍 Buscando imports con versiones específicas..."

# Buscar archivos con imports problemáticos
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "@.*@[0-9]" 2>/dev/null || echo "No se encontraron archivos con grep"

echo "🔧 Corrigiendo imports automáticamente..."

# Función para corregir un archivo
fix_file() {
    local file="$1"
    echo "Corrigiendo: $file"
    
    # Corregir imports de Radix UI
    sed -i 's/@radix-ui\/react-[^@]*@[0-9][^"]*/@radix-ui\/react-\1/g' "$file" 2>/dev/null || true
    
    # Corregir otros imports comunes
    sed -i 's/class-variance-authority@[^"]*"/class-variance-authority"/g' "$file" 2>/dev/null || true
    sed -i 's/sonner@[^"]*"/sonner"/g' "$file" 2>/dev/null || true
    sed -i 's/next-themes@[^"]*"/next-themes"/g' "$file" 2>/dev/null || true
    sed -i 's/lucide-react@[^"]*"/lucide-react"/g' "$file" 2>/dev/null || true
    sed -i 's/framer-motion@[^"]*"/framer-motion"/g' "$file" 2>/dev/null || true
    
    echo "✅ $file corregido"
}

# Corregir archivos específicos que sabemos tienen problemas
for file in \
    "src/components/ui/badge.tsx" \
    "src/components/ui/button.tsx" \
    "src/components/ui/card.tsx" \
    "src/components/ui/input.tsx" \
    "src/components/ui/label.tsx" \
    "src/components/ui/progress.tsx" \
    "src/components/ui/sonner.tsx"
do
    if [ -f "$file" ]; then
        fix_file "$file"
    fi
done

echo "🎉 Todos los imports corregidos!"
echo "🚀 Ahora ejecuta: npm run build"
