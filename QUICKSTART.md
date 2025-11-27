# 🚀 Guía de Inicio Rápido

## ✅ Configuración Completada

Este proyecto ya está **100% configurado** y listo para usar.

### ✨ Qué está incluido:

- ✅ Backend multi-tenant completo
- ✅ MongoDB Atlas configurado y conectado
- ✅ Autenticación JWT con bcrypt
- ✅ Sistema de roles (admin/customer)
- ✅ Carrito persistente en BD
- ✅ Sistema completo de órdenes
- ✅ Gestión de productos con inventario
- ✅ Validación de datos con Joi
- ✅ Seguridad (Helmet, CORS, Rate Limiting)
- ✅ Git configurado con GitFlow
- ✅ Documentación completa

---

## 🎯 Inicio Inmediato (3 pasos)

### 1️⃣ Instalar dependencias (ya hecho)
```bash
npm install
```

### 2️⃣ Iniciar el servidor
```bash
npm start
# o en modo desarrollo con auto-reload
npm run dev
```

### 3️⃣ Verificar que funciona
```bash
curl http://localhost:3000/health
```

**✅ Esperado:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-05T23:15:48.684Z"
}
```

---

## 📡 Conexión a MongoDB

El proyecto está conectado a **MongoDB Atlas** con las siguientes credenciales:

```
Base de datos: ecommerce-multitenant
Cluster: cluster0.p5abetu.mongodb.net
Estado: ✅ CONECTADO Y FUNCIONANDO
```

---

## 🧪 Prueba Rápida Completa

Sigue esta guía paso a paso en **5 minutos**:

### Paso 1: Crear un Tenant
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Tienda",
    "slug": "mi-tienda",
    "email": "admin@mitienda.com"
  }'
```

**Guardar el `_id` del response como `TENANT_ID`**

---

### Paso 2: Registrar un Admin
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT_ID" \
  -d '{
    "email": "admin@mitienda.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "Principal",
    "role": "admin"
  }'
```

**Guardar el `token` del response**

---

### Paso 3: Crear un Producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT_ID" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "description": "El iPhone más avanzado",
    "price": 1299.99,
    "category": "Smartphones",
    "inventory": {
      "quantity": 100
    }
  }'
```

---

### Paso 4: Listar Productos
```bash
curl http://localhost:3000/api/products \
  -H "x-tenant-id: TENANT_ID"
```

---

### Paso 5: Registrar un Cliente
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: TENANT_ID" \
  -d '{
    "email": "cliente@example.com",
    "password": "Cliente123!",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

---

## 📚 Documentación Completa

El proyecto incluye documentación detallada:

- **[README.md](./README.md)**: Documentación principal del proyecto
- **[TESTING.md](./TESTING.md)**: Guía completa de pruebas
- **[GITFLOW.md](./GITFLOW.md)**: Workflow de GitFlow y convenciones

---

## 🔀 GitFlow Configurado

El repositorio ya tiene configurado GitFlow:

```
Ramas actuales:
├── main (producción)
└── develop (desarrollo) ← Estás aquí
```

### Crear una nueva característica:

```bash
# 1. Crear feature branch
git checkout -b feature/nombre-caracteristica

# 2. Desarrollar y hacer commits
git add .
git commit -m "feat: descripción del cambio"

# 3. Probar
npm start

# 4. Merge a develop
git checkout develop
git merge --no-ff feature/nombre-caracteristica

# 5. Limpiar
git branch -d feature/nombre-caracteristica
```

📖 **Ver [GITFLOW.md](./GITFLOW.md) para más detalles**

---

## 📋 Endpoints Disponibles

### Públicos (requieren `x-tenant-id`)
```
GET  /health
POST /api/tenants
POST /api/auth/register
POST /api/auth/login
GET  /api/products
GET  /api/products/:id
GET  /api/products/slug/:slug
GET  /api/products/categories
```

### Autenticados (requieren `x-tenant-id` + `Authorization: Bearer <token>`)
```
GET  /api/auth/profile
PUT  /api/auth/profile
GET  /api/cart
POST /api/cart/items
PUT  /api/cart/items/:productId
DELETE /api/cart/items/:productId
DELETE /api/cart
POST /api/orders
GET  /api/orders/my-orders
GET  /api/orders/:id
POST /api/orders/:id/cancel
```

### Solo Admin (requieren `x-tenant-id` + `Authorization` + role=admin)
```
GET  /api/users
GET  /api/users/:id
PUT  /api/users/:id
DELETE /api/users/:id
POST /api/products
PUT  /api/products/:id
DELETE /api/products/:id
GET  /api/orders
PUT  /api/orders/:id/status
```

---

## 🔑 Variables de Entorno

### Archivo `.env` (YA CONFIGURADO)
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://...  # ✅ Ya configurado
JWT_SECRET=...                  # ✅ Ya configurado
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### Archivo `.env.example` (Plantilla)
Incluido para referencia y para otros desarrolladores.

---

## 🛠️ Scripts Disponibles

```bash
# Iniciar servidor en producción
npm start

# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Ejecutar tests (cuando se implementen)
npm test
```

---

## 🏗️ Estructura del Código

```
src/
├── config/           # Configuración (DB, env)
├── models/           # Modelos Mongoose
│   ├── Tenant.js
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── controllers/      # Lógica de negocio
├── routes/           # Definición de rutas
├── middlewares/      # Middlewares personalizados
│   ├── auth.js       # JWT & autorización
│   ├── tenant.js     # Multi-tenancy
│   └── errorHandler.js
├── utils/            # Utilidades
│   ├── jwt.js
│   ├── validators.js
│   └── errors.js
└── server.js         # Entrada principal
```

---

## 🎨 Características Destacadas

### Multi-Tenancy
- ✅ Aislamiento completo de datos por tenant
- ✅ Validación automática de pertenencia
- ✅ Header `x-tenant-id` obligatorio

### Seguridad
- ✅ Passwords hasheados con bcryptjs (salt 10)
- ✅ JWT con expiración configurable
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet para headers seguros
- ✅ CORS configurado
- ✅ Validación estricta de entrada

### Carrito Persistente
- ✅ Almacenado en MongoDB
- ✅ Un carrito activo por usuario
- ✅ Cálculo automático de totales
- ✅ Validación de stock

### Gestión de Órdenes
- ✅ Número de orden auto-generado
- ✅ Reducción automática de inventario
- ✅ Estados de orden y pago
- ✅ Snapshot de productos
- ✅ Cálculo de impuestos y envío

---

## 🐛 Troubleshooting

### El servidor no inicia
```bash
# Verificar que MongoDB esté accesible
curl http://localhost:3000/health

# Ver logs completos
npm start
```

### Error de conexión a MongoDB
```bash
# Verificar .env
cat .env | grep MONGODB_URI

# Las credenciales ya están configuradas correctamente
```

### Puerto en uso
```bash
# Cambiar puerto en .env
echo "PORT=3001" >> .env
```

---

## 📞 Próximos Pasos

### Recomendaciones:

1. **Conectar un frontend** (Next.js, React, etc.)
2. **Implementar tests** con Jest
3. **Añadir Swagger** para documentación de API
4. **Configurar CI/CD** con GitHub Actions
5. **Añadir logging** con Winston
6. **Implementar cache** con Redis
7. **Subir imágenes** a S3/Cloudinary

---

## ✅ Checklist de Verificación

- [x] Servidor inicia correctamente
- [x] MongoDB conectado
- [x] Health check funciona
- [x] Se pueden crear tenants
- [x] Registro de usuarios funciona
- [x] Login devuelve token
- [x] CRUD de productos funciona
- [x] Carrito se persiste
- [x] Órdenes se crean correctamente
- [x] Multi-tenancy funciona
- [x] Validaciones funcionan
- [x] GitFlow configurado
- [x] Documentación completa

---

## 🎉 ¡Listo para Desarrollar!

El backend está **100% funcional** y listo para:
- ✅ Añadir nuevas características
- ✅ Conectar un frontend
- ✅ Desplegar a producción
- ✅ Integrar con servicios externos

**¡Feliz desarrollo!** 🚀

