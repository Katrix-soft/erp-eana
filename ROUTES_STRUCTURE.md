# 📋 Estructura de Rutas - ERP EANA

## 🎯 Organización de Rutas

La aplicación ahora tiene una estructura de rutas bien organizada y discriminada, evitando paths universales y mejorando la mantenibilidad.

---

## 🔓 Rutas Públicas (Sin Autenticación)

Estas rutas son accesibles sin necesidad de iniciar sesión:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | LoginComponent | Página de inicio de sesión |
| `/forgot-password` | ForgotPasswordComponent | Recuperación de contraseña |
| `/reset-password` | ResetPasswordComponent | Restablecer contraseña |

---

## 🔒 Rutas Protegidas (Requieren Autenticación)

Todas las rutas siguientes requieren que el usuario esté autenticado.

### 📊 Dashboard
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | DashboardComponent | Panel principal con estadísticas |

### 📡 Módulo de Comunicaciones (VHF)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/comunicaciones` | EquiposListComponent | Listado de equipos VHF |

### 🧭 Módulo de Navegación
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/navegacion` | NavegacionListComponent | Menú principal de navegación |
| `/navegacion/vor-analysis` | VorAnalysisComponent | Análisis de curva de error VOR |

### 👁️ Módulo de Vigilancia
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/vigilancia` | VigilanciaListComponent | Equipos de vigilancia |

### ⚡ Módulo de Energía
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/energia` | EnergiaListComponent | Sistemas de energía |

### ✅ Módulo de Checklists
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/checklists` | ChecklistListComponent | Listado de checklists |
| `/checklists/new` | ChecklistFormComponent | Crear nuevo checklist |
| `/checklists/:id` | ChecklistFormComponent | Ver checklist (modo vista) |
| `/checklists/:id/edit` | ChecklistFormComponent | Editar checklist |
| `/checklists/:id/mimic` | ChecklistMimicComponent | Simulador de checklist |

### 🔧 Módulo de Mantenimiento
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/mantenimiento` | (Lazy loaded) | Órdenes de trabajo y mantenimiento |

### 💬 Módulo de Comunicación
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/foro` | ForoComponent | Foro de discusión |
| `/chat` | ChatComponent | Chat en tiempo real |

### 👤 Perfil y Configuración
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/profile` | ProfileComponent | Perfil del usuario |
| `/settings` | SettingsComponent | Configuración de la aplicación |

---

## 🔐 Panel de Administración

**Acceso restringido:** Solo usuarios con rol `ADMIN` o `CNS_NACIONAL`

Todas las rutas de administración están bajo el prefijo `/admin`:

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/users` | UsersListComponent | Gestión de usuarios |
| `/admin/aeropuertos` | AeropuertosListComponent | Gestión de aeropuertos |
| `/admin/firs` | FirListComponent | Gestión de FIRs |
| `/admin/personal` | PersonalListComponent | Gestión de personal |
| `/admin/puestos` | PuestosListComponent | Gestión de puestos |
| `/admin/comunicaciones` | ComunicacionesListComponent | Admin de comunicaciones |
| `/admin/navegacion` | NavegacionListComponent | Admin de navegación |
| `/admin/vigilancia` | VigilanciaListComponent | Admin de vigilancia |
| `/admin/energia` | EnergiaListComponent | Admin de energía |
| `/admin/vhf-importer` | VhfImporterComponent | Importador de equipos VHF |
| `/admin/audit` | AuditLogsComponent | Logs de auditoría |

---

## 🔄 Redirecciones

| Desde | Hacia | Condición |
|-------|-------|-----------|
| `/` | `/dashboard` | Usuario autenticado |
| `/admin` | `/admin/users` | Usuario admin |
| `/**` (404) | `/login` | Ruta no encontrada |

---

## ✨ Mejoras Implementadas

### 1. **Estructura Jerárquica Clara**
- Las rutas están organizadas por módulos funcionales
- Uso de `children` para rutas anidadas relacionadas
- Prefijos claros (`/admin`, `/checklists`, `/navegacion`)

### 2. **Discriminación de Rutas**
- **Antes:** Rutas planas sin organización
- **Ahora:** Rutas agrupadas por funcionalidad con paths específicos

### 3. **Seguridad Mejorada**
- Guard de autenticación en todas las rutas protegidas
- Guard de roles específico para rutas de administración
- Redirección a login para rutas no autorizadas

### 4. **Lazy Loading**
- Componentes cargados bajo demanda
- Mejor rendimiento inicial
- Módulos separados (ej: mantenimiento)

### 5. **Mantenibilidad**
- Comentarios claros separando secciones
- Estructura predecible y escalable
- Fácil de extender con nuevas rutas

---

## 📝 Ejemplos de Uso

### Navegación Programática

```typescript
// Ir al dashboard
this.router.navigate(['/dashboard']);

// Ir a un checklist específico
this.router.navigate(['/checklists', checklistId]);

// Ir a editar un checklist
this.router.navigate(['/checklists', checklistId, 'edit']);

// Ir a administración de usuarios (solo admin)
this.router.navigate(['/admin/users']);

// Ir a análisis VOR
this.router.navigate(['/navegacion/vor-analysis']);
```

### RouterLink en Templates

```html
<!-- Dashboard -->
<a routerLink="/dashboard">Dashboard</a>

<!-- Checklist específico -->
<a [routerLink]="['/checklists', checklist.id]">Ver Checklist</a>

<!-- Admin -->
<a routerLink="/admin/users">Usuarios</a>

<!-- Navegación con parámetros -->
<a [routerLink]="['/navegacion/vor-analysis']">Análisis VOR</a>
```

---

## 🎯 Beneficios

1. ✅ **Rutas más claras y predecibles**
2. ✅ **Mejor organización del código**
3. ✅ **Seguridad mejorada con guards específicos**
4. ✅ **Fácil de mantener y extender**
5. ✅ **Mejor experiencia de desarrollo**
6. ✅ **SEO-friendly (rutas descriptivas)**
7. ✅ **Evita conflictos de rutas**

---

**Fecha de actualización:** 2026-01-30  
**Versión:** 2.0.0
