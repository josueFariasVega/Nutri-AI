# Configurar Git y flujo de trabajo
echo "=== Configuración Inicial de Git ==="

# 1. Inicializar repositorio Git (si no existe)
if [ ! -d ".git" ]; then
  echo "Inicializando repositorio Git..."
  git init
  git add .
  git commit -m "Initial commit: Plataforma de Nutrición Personalizada"
fi

# 2. Crear rama main si no existe
if ! git show-ref --verify --quiet refs/heads/main; then
  echo "Creando rama main..."
  git branch -M main
fi

# 3. Crear rama develop
if ! git show-ref --verify --quiet refs/heads/develop; then
  echo "Creando rama develop..."
  git checkout -b develop
fi

echo "=== Ramas creadas ==="
echo "✅ main (producción)"
echo "✅ develop (desarrollo)"
echo ""
echo "=== Próximos pasos ==="
echo "1. Crea un repositorio en GitHub"
echo "2. Conecta tu repo local con GitHub:"
echo "   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git"
echo "   git push -u origin main"
echo "   git push -u origin develop"
echo ""
echo "3. Conecta con Vercel desde GitHub"
