# 🚀 EANA ERP - Deployment Guide

## Deployment Automático con Portainer

Este proyecto está configurado para **auto-inicializarse completamente** cuando se hace pull desde Portainer.

### ✅ Qué se ejecuta automáticamente:

1. **Sincronización de Base de Datos** - Crea/actualiza todas las tablas
2. **Datos Básicos** - FIRs, Puestos de Personal
3. **Usuario Administrador** - `admin@eana.com.ar` / `admin1234`
4. **Aeropuertos** - Carga completa desde CSV
5. **Equipos de Navegación** - Carga desde Excel (si existe)
6. **Salas de Chat** - Inicialización
7. **Foro** - Datos iniciales
8. **Frecuencias VHF** - Actualización desde Excel (si existe)
9. **Restauración CSV** - Todos los datos históricos
10. **Verificación** - Resumen del sistema

### 📋 Pasos para Deploy en Portainer:

#### 1. Configurar Variables de Entorno

En Portainer, antes de hacer el pull, asegurate de tener configuradas estas variables:

```env
# Base de Datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI
POSTGRES_DB=cns_db

# Seguridad
JWT_SECRET=GENERAR_CON_CRYPTO_RANDOM_BYTES_32
CORS_ORIGIN=https://tu-dominio.com,https://app.katrix.com.ar

# Gemini AI
GEMINI_API_KEY=TU_API_KEY_DE_GEMINI
```

#### 2. Pull del Stack

1. En Portainer, andá a tu Stack
2. Click en **"Pull and redeploy"**
3. Esperá a que se complete el build (puede tardar 2-3 minutos)

#### 3. Verificar el Bootstrap

Podés ver los logs del contenedor backend para confirmar que el bootstrap se ejecutó:

```bash
docker logs cns_backend
```

Deberías ver:
```
✅ Bootstrap completed successfully!
🎯 Starting NestJS Application...
🚀 Servidor iniciado en puerto 3000
```

### 🔄 Comportamiento del Bootstrap

- **Primera vez**: Ejecuta TODAS las tareas de inicialización
- **Siguientes veces**: Solo ejecuta las tareas que no se completaron exitosamente
- **Forzar re-ejecución**: Usar flag `--force` (solo para desarrollo)

### 🛠️ Troubleshooting

#### El contenedor se reinicia constantemente

Verificá los logs:
```bash
docker logs cns_backend --tail 100
```

Posibles causas:
- Base de datos no está lista (el script espera automáticamente)
- Credenciales incorrectas en las variables de entorno
- Falta algún archivo de datos (CSV/Excel)

#### Bootstrap falla en una tarea específica

El sistema es **tolerante a fallos**:
- Tareas críticas (migrate, seed-admin) detienen el proceso si fallan
- Tareas opcionales (import-csv, seed-nav) solo muestran warning

Para ver qué falló:
```bash
docker exec cns_backend npm run bootstrap:prod -- --verify
```

### 📊 Acceso al Sistema

Una vez deployado:

- **Frontend**: `https://tu-dominio.com` o `http://localhost:4200`
- **API**: `https://tu-dominio.com/api/v1` o `http://localhost:3000/api/v1`
- **Docs**: `https://tu-dominio.com/api/docs`
- **Health**: `https://tu-dominio.com/health`

**Credenciales por defecto:**
- Usuario: `admin@eana.com.ar`
- Password: `admin1234`

⚠️ **IMPORTANTE**: Cambiar la contraseña del admin después del primer login.

### 🔐 Seguridad en Producción

Antes de ir a producción, asegurate de:

1. ✅ Cambiar `JWT_SECRET` a un valor aleatorio seguro
2. ✅ Usar contraseña fuerte para PostgreSQL
3. ✅ Configurar CORS_ORIGIN solo con tus dominios
4. ✅ Cambiar password del usuario admin
5. ✅ Configurar HTTPS (certificado SSL)
6. ✅ Revisar que los archivos `.env` no estén en el repositorio

### 📁 Estructura de Datos

Los datos se cargan desde:
- `backend/data/csv/` - Datos históricos exportados
- `backend/data/excel/` - Archivos Excel de equipamiento (opcional)

Si necesitás actualizar datos, reemplazá los archivos en estas carpetas y hacé redeploy.

### 🔄 Actualizar el Sistema

Para actualizar a una nueva versión:

1. Hacé push de los cambios al repositorio
2. En Portainer: **Pull and redeploy**
3. El sistema se reconstruirá y reinicializará automáticamente

### 💡 Tips

- El bootstrap es **idempotente**: podés ejecutarlo múltiples veces sin duplicar datos
- Los logs se guardan en `/app/logs/` dentro del contenedor
- Los uploads se persisten en el volumen `uploads_data`
- La base de datos se persiste en el volumen `postgres_data`

---

**¿Problemas?** Revisá los logs o contactá al equipo de desarrollo.
