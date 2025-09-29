# Corregir imports problemáticos en todos los archivos
echo "=== Corrigiendo imports problemáticos ==="

# Función para corregir imports
fix_imports() {
  local file="$1"

  # Corregir sonner imports
  sed -i 's/sonner@[0-9]\+\.[0-9]\+\.[0-9]\+/sonner/g' "$file"

  # Corregir next-themes imports
  sed -i 's/next-themes@[0-9]\+\.[0-9]\+\.[0-9]\+/next-themes/g' "$file"

  # Corregir otros imports con versiones si existen
  sed -i 's/lucide-react@[0-9]\+\.[0-9]\+\.[0-9]\+/lucide-react/g' "$file"
  sed -i 's/framer-motion@[0-9]\+\.[0-9]\+\.[0-9]\+/framer-motion/g' "$file"

  echo "✅ Corregido: $file"
}

# Encontrar y corregir todos los archivos TypeScript/JavaScript
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
  if grep -q "@[0-9]\+\.[0-9]\+\.[0-9]\+" "$file"; then
    fix_imports "$file"
  fi
done

echo "=== Todos los imports corregidos ==="
