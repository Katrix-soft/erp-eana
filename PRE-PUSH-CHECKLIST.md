# ✅ Pre-Push Checklist

Antes de hacer push al repositorio, verificá que:

## 🔐 Seguridad

- [ ] El archivo `.env` NO está en el commit (debe estar en `.gitignore`)
- [ ] El archivo `backend/.env` NO está en el commit
- [ ] Las API keys en `.env.example` están como placeholders
- [ ] No hay contraseñas reales en ningún archivo commiteado
- [ ] El `JWT_SECRET` en `.env.example` es un placeholder

## 📁 Archivos Necesarios

- [ ] `docker-compose.yml` está actualizado
- [ ] `backend/Dockerfile` incluye el entrypoint
- [ ] `backend/docker-entrypoint.sh` existe y es ejecutable
- [ ] `backend/tsconfig.scripts.json` incluye todos los scripts
- [ ] `DEPLOYMENT.md` tiene instrucciones actualizadas
- [ ] `.gitignore` está configurado correctamente

## 🗂️ Datos

- [ ] Los archivos CSV en `backend/data/csv/` están presentes
- [ ] Los archivos Excel en `backend/data/excel/` están presentes (si aplica)
- [ ] El archivo `CREDENCIALES_VALIDAS.csv` NO está en el commit (sensible)

## 🧪 Testing Local

- [ ] `docker compose build` funciona sin errores
- [ ] `docker compose up` levanta todos los servicios
- [ ] El bootstrap se ejecuta automáticamente
- [ ] El frontend carga en `http://localhost:4200`
- [ ] El backend responde en `http://localhost:3000/health`
- [ ] Podés loguearte con `admin@eana.com.ar` / `admin1234`

## 📝 Documentación

- [ ] `README.md` está actualizado con cambios relevantes
- [ ] `DEPLOYMENT.md` refleja el proceso actual
- [ ] Los comentarios en el código están claros

## 🚀 Git

- [ ] Todos los cambios están en commits con mensajes descriptivos
- [ ] No hay archivos `node_modules/` o `dist/` en el commit
- [ ] La rama está actualizada con `main`

---

## Comandos de Verificación Rápida

```bash
# Verificar que .env no está trackeado
git status | grep -E "\.env$"  # No debería aparecer nada

# Verificar build de Docker
docker compose build --no-cache

# Test completo
docker compose down -v
docker compose up -d
docker logs -f cns_backend  # Verificar que bootstrap corre

# Verificar health
curl http://localhost:3000/health
```

## ✅ Todo Listo

Si todos los checks están ✅, podés hacer:

```bash
git add .
git commit -m "feat: auto-bootstrap configuration for Portainer deployment"
git push origin main
```

Luego en Portainer: **Pull and redeploy** y el sistema se auto-configurará completamente.
