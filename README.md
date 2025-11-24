# La Ruta del Pastelazo - Backend API

Backend multi-tenant para eCommerce construido con Node.js, Express, MongoDB y Mongoose.

## 🏗️ Arquitectura Multi-Tenant

Este backend soporta **múltiples inquilinos (tenants)** donde cada tenant representa una tienda o cliente independiente con sus propios:

- ✅ Usuarios
- ✅ Roles y permisos
- 🔜 Productos
- 🔜 Carritos
- 🔜 Órdenes

**Aislamiento de datos**: Ningún tenant puede ver ni modificar datos de otro tenant.

## 🚀 Stack Tecnológico

- **Runtime**: Node.js (ES Modules)
- **Framework HTTP**: Express 4.x
- **Base de datos**: MongoDB
- **ODM**: Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Seguridad**: bcryptjs, helmet, CORS, rate-limiting
- **Validación**: Zod

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── db.js                 # Configuración de MongoDB
├── models/
│   ├── tenant.js             # Modelo de Tenant (inquilino)
│   ├── role.js               # Modelo de Rol (con permisos)
│   └── user.js               # Modelo de Usuario
├── controllers/
│   ├── tenantController.js   # CRUD de Tenants
│   └── userController.js     # CRUD de Usuarios
├── routes/
│   ├── tenantRoutes.js       # Rutas de /api/tenants
│   └── userRoutes.js         # Rutas de /api/users
├── middlewares/
│   ├── auth.js               # Autenticación JWT
│   ├── errorHandler.js       # Manejo centralizado de errores
│   ├── tenantIsolation.js    # Aislamiento de tenants
│   └── validate.js           # Validación con Zod
├── schemas/
│   └── userSchemas.js        # Esquemas de validación
├── services/                 # Lógica de negocio (futuro)
├── utils/                    # Utilidades (futuro)
└── server.js                 # Punto de entrada
```

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# Puerto del servidor
PORT=4000

# MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Entorno
NODE_ENV=development
```

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

### Ejecutar en producción

```bash
npm start
```

## 📡 API Endpoints

### 🏢 Tenants

| Método | Ruta | Descripción | Auth | Permisos |
|--------|------|-------------|------|----------|
| `POST` | `/api/tenants` | Crear tenant | No | - |
| `GET` | `/api/tenants/:identifier` | Obtener tenant por ID/slug | No | - |
| `PUT` | `/api/tenants/:id` | Actualizar tenant | Sí | `tenant.edit` |
| `PATCH` | `/api/tenants/:id/status` | Cambiar estado | Sí | `tenant.edit` |
| `GET` | `/api/tenants/:id/stats` | Estadísticas | Sí | `tenant.view` |
| `DELETE` | `/api/tenants/:id` | Desactivar tenant | Sí | `tenant.edit` |

### 👥 Usuarios

| Método | Ruta | Descripción | Auth | Permisos |
|--------|------|-------------|------|----------|
| `POST` | `/api/users/register` | Registrar usuario | No | - |
| `POST` | `/api/users/login` | Iniciar sesión | No | - |
| `GET` | `/api/users/profile` | Ver perfil propio | Sí | - |
| `PUT` | `/api/users/profile` | Actualizar perfil | Sí | - |
| `GET` | `/api/users` | Listar usuarios | Sí | `users.view` |
| `GET` | `/api/users/:id` | Ver usuario | Sí | `users.view` |
| `PUT` | `/api/users/:id` | Actualizar usuario | Sí | `users.edit` |
| `DELETE` | `/api/users/:id` | Desactivar usuario | Sí | `users.delete` |

## 🔐 Autenticación y Tenant Isolation

### Estrategia de Tenant Isolation

El `tenantId` se puede proporcionar de las siguientes formas (en orden de prioridad):

1. **Del token JWT** (usuario autenticado)
2. **Header personalizado**: `x-tenant-id: <tenantId o slug>`
3. **Path parameter**: `/api/:tenantSlug/...`
4. **Subdominio**: `acme.mitienda.com` → tenant "acme"

### Ejemplo de Registro e Inicio de Sesión

**1. Crear un Tenant:**

```bash
POST /api/tenants
Content-Type: application/json

{
  "name": "Mi Tienda ACME",
  "slug": "acme",
  "contactEmail": "admin@acme.com",
  "contactPhone": "+1234567890"
}

# Response:
{
  "message": "Tenant creado exitosamente",
  "data": {
    "id": "674321abcdef123456789012",
    "name": "Mi Tienda ACME",
    "slug": "acme",
    "status": "trial"
  }
}
```

**2. Registrar un Usuario:**

```bash
POST /api/users/register
Content-Type: application/json
x-tenant-id: acme

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@acme.com",
  "password": "Password123!",
  "phone": "+1234567890",
  "roleSlug": "customer"
}

# Response:
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**3. Iniciar Sesión:**

```bash
POST /api/users/login
Content-Type: application/json
x-tenant-id: acme

{
  "email": "juan@acme.com",
  "password": "Password123!"
}

# Response:
{
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**4. Usar el Token:**

```bash
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎭 Sistema de Roles y Permisos

### Roles por Defecto

Cada tenant tiene 3 roles creados automáticamente:

1. **Administrador** (`admin`)
   - Acceso completo al sistema
   - Puede gestionar usuarios, productos, órdenes, roles y configuración

2. **Vendedor** (`seller`)
   - Puede gestionar productos y órdenes
   - Ver usuarios pero no modificarlos

3. **Cliente** (`customer`)
   - Ver productos
   - Crear y ver sus propias órdenes
   - Gestionar su perfil

### Estructura de Permisos

```javascript
permissions: {
  users: { view, create, edit, delete },
  products: { view, create, edit, delete, manageStock },
  orders: { view, viewAll, create, edit, cancel, updateStatus },
  roles: { view, create, edit, delete },
  tenant: { view, edit }
}
```

## 🛡️ Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT para autenticación stateless
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet para headers HTTP seguros
- ✅ CORS configurado
- ✅ Validación de datos con Zod
- ✅ Nunca exponer `passwordHash` en respuestas
- ✅ Aislamiento total entre tenants

## 🚧 Próximos Pasos (TODO)

- [ ] Crear modelo y CRUD de **Products**
- [ ] Crear modelo y CRUD de **Cart**
- [ ] Crear modelo y CRUD de **Orders**
- [ ] Implementar sistema de **super-admin** para gestión global
- [ ] Agregar **paginación, filtros y búsqueda** avanzada
- [ ] Implementar **refresh tokens**
- [ ] Agregar **logging** con Winston o similar
- [ ] Tests unitarios e integración (Jest/Mocha)
- [ ] Documentación con Swagger/OpenAPI
- [ ] Implementar **webhooks** para eventos
- [ ] Sistema de **notificaciones** (email, SMS)

## 📝 Convenciones de Código

- ✅ ES Modules (`import/export`)
- ✅ `async/await` (no callbacks ni `.then()`)
- ✅ `const`/`let` (no `var`)
- ✅ Nombres en inglés para código
- ✅ Comentarios en español para documentación
- ✅ Manejo de errores con `asyncHandler` o `try/catch`
- ✅ Respuestas JSON consistentes

## 👨‍💻 Autor

Proyecto desarrollado para La Ruta del Pastelazo

## 📄 Licencia

ISC
