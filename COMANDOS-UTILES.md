# 🛠️ Comandos Útiles - EANA ERP

## 🐳 Docker / Portainer

### Deployment Completo
```bash
# Limpiar todo y empezar de cero
docker compose down -v
docker compose up -d --build

# Solo rebuild del backend
docker compose build --no-cache backend
docker compose up -d backend

# Ver logs en tiempo real
docker logs -f cns_backend
docker logs -f cns_frontend
docker logs -f cns_postgres
```

### Troubleshooting
```bash
# Ver estado de todos los contenedores
docker compose ps

# Ver logs de bootstrap
docker logs cns_backend | grep -A 50 "Bootstrap"

# Entrar al contenedor backend
docker exec -it cns_backend sh

# Entrar al contenedor de postgres
docker exec -it cns_postgres psql -U postgres -d cns_db

# Ver variables de entorno del contenedor
docker exec cns_backend env
```

### Re-ejecutar Bootstrap Manualmente
```bash
# Desde fuera del contenedor
docker exec cns_backend npm run bootstrap:prod -- --force

# Ejecutar solo una tarea específica
docker exec cns_backend npm run bootstrap:prod -- --seed-admin
docker exec cns_backend npm run bootstrap:prod -- --import-csv

# Ver resumen del sistema
docker exec cns_backend npm run bootstrap:prod -- --verify
```

## 📊 Base de Datos

### Conexión Directa
```bash
# Desde el host (si el puerto está expuesto)
psql -h localhost -p 5432 -U postgres -d cns_db

# Desde dentro del contenedor
docker exec -it cns_postgres psql -U postgres -d cns_db
```

### Queries Útiles
```sql
-- Ver todas las tablas
\dt

-- Ver usuarios
SELECT id, email, role FROM users;

-- Ver aeropuertos
SELECT codigo, nombre FROM aeropuertos LIMIT 10;

-- Ver historial de bootstrap
SELECT * FROM "_bootstrap_history" ORDER BY executed_at DESC;

-- Resetear historial de bootstrap (forzar re-ejecución)
DELETE FROM "_bootstrap_history";

-- Ver equipos de comunicación
SELECT COUNT(*) FROM comunicaciones;
SELECT COUNT(*) FROM navegacion;
SELECT COUNT(*) FROM vigilancia;
```

### Backup y Restore
```bash
# Backup
docker exec cns_postgres pg_dump -U postgres cns_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260206.sql | docker exec -i cns_postgres psql -U postgres -d cns_db
```

## 🔧 Backend (Desarrollo Local)

### Instalación
```bash
cd backend
npm install
```

### Ejecución
```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod

# Bootstrap manual
npm run bootstrap
npm run bootstrap -- --force
npm run bootstrap -- --seed-admin --import-csv
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🎨 Frontend (Desarrollo Local)

### Instalación
```bash
cd frontend
npm install
```

### Ejecución
```bash
# Desarrollo
npm start
# Abre http://localhost:4200

# Build de producción
npm run build

# Build con configuración específica
npm run build -- --configuration production
```

## 🔍 Monitoreo

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# API docs
open http://localhost:3000/api/docs

# Frontend
curl http://localhost:4200
```

### Logs
```bash
# Ver todos los logs
docker compose logs

# Logs de un servicio específico
docker compose logs backend
docker compose logs postgres

# Seguir logs en tiempo real
docker compose logs -f backend

# Últimas 100 líneas
docker compose logs --tail=100 backend
```

## 🧹 Limpieza

### Limpiar Docker
```bash
# Detener y remover contenedores
docker compose down

# Detener y remover contenedores + volúmenes
docker compose down -v

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar todo (cuidado!)
docker system prune -a --volumes
```

### Limpiar Node Modules
```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

## 🔐 Seguridad

### Generar JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cambiar Password de Admin
```sql
-- Conectarse a la DB y ejecutar:
UPDATE users 
SET password = '$2b$10$TU_HASH_BCRYPT_AQUI'
WHERE email = 'admin@eana.com.ar';
```

### Generar Hash de Password
```bash
# En Node.js
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('tu_password', 10).then(console.log)"
```

## 📦 Git

### Workflow Típico
```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Pull (antes de hacer cambios)
git pull origin main
```

### Branches
```bash
# Crear branch
git checkout -b feature/nueva-funcionalidad

# Cambiar de branch
git checkout main

# Merge
git checkout main
git merge feature/nueva-funcionalidad

# Push branch
git push origin feature/nueva-funcionalidad
```

## 🚀 Deployment a Producción

### Pre-deployment
```bash
# 1. Verificar que todo funciona local
docker compose down -v
docker compose up -d --build
docker logs -f cns_backend  # Verificar bootstrap

# 2. Verificar checklist
cat PRE-PUSH-CHECKLIST.md

# 3. Push
git add .
git commit -m "release: v1.x.x"
git push origin main
```

### En Portainer
1. Ir al Stack
2. Click en "Pull and redeploy"
3. Esperar ~3-5 minutos
4. Verificar logs
5. Probar acceso

### Post-deployment
```bash
# Verificar health
curl https://tu-dominio.com/health

# Ver logs
docker logs cns_backend --tail 100

# Verificar que bootstrap corrió
docker logs cns_backend | grep "Bootstrap completed"
```

---

## 📞 Soporte

Si algo no funciona:
1. Revisar logs: `docker logs cns_backend`
2. Verificar health: `curl http://localhost:3000/health`
3. Revisar `DEPLOYMENT.md`
4. Contactar al equipo de desarrollo
