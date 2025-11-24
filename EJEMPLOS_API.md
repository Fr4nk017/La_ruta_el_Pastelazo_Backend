# 📚 Ejemplos de Uso - API Multi-Tenant

Ejemplos de peticiones HTTP para probar el backend eCommerce multi-tenant.

> **Nota**: Puedes usar estos ejemplos con Postman, Thunder Client, Insomnia, curl, o cualquier cliente HTTP.

---

## 🏢 1. GESTIÓN DE TENANTS

### 1.1 Crear un Tenant

```http
POST http://localhost:4000/api/tenants
Content-Type: application/json

{
  "name": "Pastelería La Dulzura",
  "slug": "la-dulzura",
  "contactEmail": "admin@ladulzura.com",
  "contactPhone": "+52-555-1234567",
  "address": {
    "street": "Av. Reforma 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "country": "México",
    "postalCode": "01000"
  }
}
```

**Respuesta esperada:**
```json
{
  "message": "Tenant creado exitosamente",
  "data": {
    "id": "674321abcdef123456789012",
    "name": "Pastelería La Dulzura",
    "slug": "la-dulzura",
    "contactEmail": "admin@ladulzura.com",
    "status": "trial",
    "createdAt": "2025-11-24T15:30:00.000Z"
  }
}
```

> 💡 **Importante**: Al crear un tenant, se crean automáticamente 3 roles: `admin`, `seller`, `customer`

### 1.2 Obtener Tenant por Slug

```http
GET http://localhost:4000/api/tenants/la-dulzura
```

### 1.3 Obtener Tenant por ID

```http
GET http://localhost:4000/api/tenants/674321abcdef123456789012
```

### 1.4 Actualizar Tenant (requiere autenticación)

```http
PUT http://localhost:4000/api/tenants/674321abcdef123456789012
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json

{
  "contactPhone": "+52-555-9999999",
  "settings": {
    "currency": "MXN",
    "language": "es",
    "timezone": "America/Mexico_City"
  }
}
```

### 1.5 Obtener Estadísticas del Tenant

```http
GET http://localhost:4000/api/tenants/674321abcdef123456789012/stats
Authorization: Bearer <tu_token_jwt>
```

---

## 👥 2. GESTIÓN DE USUARIOS

### 2.1 Registrar Usuario (Cliente)

```http
POST http://localhost:4000/api/users/register
Content-Type: application/json
x-tenant-id: la-dulzura

{
  "firstName": "María",
  "lastName": "González",
  "email": "maria@example.com",
  "password": "Password123!",
  "phone": "+52-555-1111111",
  "roleSlug": "customer"
}
```

**Respuesta esperada:**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "674322bcdef123456789abc",
      "firstName": "María",
      "lastName": "González",
      "email": "maria@example.com",
      "phone": "+52-555-1111111",
      "tenantId": "674321abcdef123456789012",
      "roleId": "674321ccdef123456789xyz"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.2 Registrar Usuario Administrador

```http
POST http://localhost:4000/api/users/register
Content-Type: application/json
x-tenant-id: la-dulzura

{
  "firstName": "Carlos",
  "lastName": "Ramírez",
  "email": "carlos@ladulzura.com",
  "password": "AdminPass123!",
  "phone": "+52-555-2222222",
  "roleSlug": "admin"
}
```

### 2.3 Iniciar Sesión

```http
POST http://localhost:4000/api/users/login
Content-Type: application/json
x-tenant-id: la-dulzura

{
  "email": "maria@example.com",
  "password": "Password123!"
}
```

**Respuesta esperada:**
```json
{
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "674322bcdef123456789abc",
      "firstName": "María",
      "lastName": "González",
      "fullName": "María González",
      "email": "maria@example.com",
      "phone": "+52-555-1111111",
      "tenantId": "674321abcdef123456789012",
      "role": {
        "id": "674321ccdef123456789xyz",
        "name": "Cliente",
        "slug": "customer"
      },
      "lastLogin": "2025-11-24T15:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.4 Obtener Perfil Propio

```http
GET http://localhost:4000/api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.5 Actualizar Perfil Propio

```http
PUT http://localhost:4000/api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "firstName": "María Elena",
  "phone": "+52-555-3333333",
  "profileImage": "https://example.com/avatar.jpg"
}
```

### 2.6 Listar Usuarios (Admin)

```http
GET http://localhost:4000/api/users?page=1&limit=10&role=customer
Authorization: Bearer <token_admin>
```

**Query params opcionales:**
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 10)
- `role`: Filtrar por rol slug (`admin`, `seller`, `customer`)
- `search`: Buscar por nombre, apellido o email
- `isActive`: Filtrar por estado (`true` / `false`)

### 2.7 Obtener Usuario por ID (Admin)

```http
GET http://localhost:4000/api/users/674322bcdef123456789abc
Authorization: Bearer <token_admin>
```

### 2.8 Actualizar Usuario (Admin)

```http
PUT http://localhost:4000/api/users/674322bcdef123456789abc
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "roleSlug": "seller",
  "isActive": true
}
```

### 2.9 Desactivar Usuario (Admin)

```http
DELETE http://localhost:4000/api/users/674322bcdef123456789abc
Authorization: Bearer <token_admin>
```

---

## 🔐 3. ESTRATEGIAS DE TENANT ISOLATION

Puedes especificar el tenant de **3 formas diferentes**:

### Opción 1: Header `x-tenant-id` (Recomendado para APIs)

```http
POST http://localhost:4000/api/users/login
x-tenant-id: la-dulzura
Content-Type: application/json

{
  "email": "maria@example.com",
  "password": "Password123!"
}
```

### Opción 2: Tenant ID en el Header

```http
POST http://localhost:4000/api/users/login
x-tenant-id: 674321abcdef123456789012
Content-Type: application/json

{
  "email": "maria@example.com",
  "password": "Password123!"
}
```

### Opción 3: Token JWT (Usuario ya autenticado)

Una vez que el usuario inicia sesión, el `tenantId` viene en el token JWT, por lo que no necesitas enviarlo en las siguientes peticiones:

```http
GET http://localhost:4000/api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 4. PRUEBAS COMPLETAS

### Flujo Completo: Crear Tenant → Registrar Admin → Login → Gestionar Usuarios

#### Paso 1: Crear Tenant

```bash
curl -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pastelería El Pastelazo",
    "slug": "el-pastelazo",
    "contactEmail": "admin@elpastelazo.com",
    "contactPhone": "+52-555-7777777"
  }'
```

#### Paso 2: Registrar Administrador

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: el-pastelazo" \
  -d '{
    "firstName": "Admin",
    "lastName": "El Pastelazo",
    "email": "admin@elpastelazo.com",
    "password": "Admin123!",
    "phone": "+52-555-8888888",
    "roleSlug": "admin"
  }'
```

#### Paso 3: Login

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: el-pastelazo" \
  -d '{
    "email": "admin@elpastelazo.com",
    "password": "Admin123!"
  }'
```

Guarda el `token` de la respuesta.

#### Paso 4: Ver Perfil

```bash
curl -X GET http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer <tu_token_aqui>"
```

#### Paso 5: Listar Usuarios

```bash
curl -X GET http://localhost:4000/api/users \
  -H "Authorization: Bearer <tu_token_aqui>"
```

---

## ❌ 5. MANEJO DE ERRORES

El backend devuelve errores en formato JSON consistente:

### Error de Validación

```json
{
  "error": true,
  "message": "Error de validación",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### Error de Autenticación

```json
{
  "error": true,
  "message": "Token inválido"
}
```

### Error de Permisos

```json
{
  "error": true,
  "message": "No tienes permiso para edit en users"
}
```

### Error de Recurso No Encontrado

```json
{
  "error": true,
  "message": "Usuario no encontrado"
}
```

### Error de Tenant

```json
{
  "error": true,
  "message": "Tenant 'mi-tienda' no encontrado"
}
```

---

## 📝 6. NOTAS IMPORTANTES

### Seguridad

- ✅ Las contraseñas **nunca** se devuelven en las respuestas
- ✅ Todos los passwords se hashean con bcrypt (10 rounds)
- ✅ Los tokens JWT expiran en 24 horas
- ✅ Rate limiting: máximo 100 requests cada 15 minutos por IP

### Multi-Tenant

- ✅ Cada tenant está **completamente aislado**
- ✅ Un usuario puede tener el mismo email en diferentes tenants
- ✅ Los datos de un tenant **nunca** son visibles para otro tenant

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Acceso completo al tenant |
| **Seller** | Gestionar productos y órdenes |
| **Customer** | Ver productos, gestionar sus órdenes |

---

## 🐛 7. TROUBLESHOOTING

### Problema: "Tenant no especificado"

**Solución**: Agregar header `x-tenant-id` o autenticarse primero

### Problema: "Credenciales inválidas"

**Solución**: Verificar que el email/password sean correctos y que uses el tenant correcto

### Problema: "No tienes permiso"

**Solución**: Verificar que tu rol tenga los permisos necesarios

### Problema: "El email ya está registrado"

**Solución**: El email ya existe en ese tenant específico

---

## 📞 SOPORTE

Para más información, consulta el `README.md` del proyecto o contacta al equipo de desarrollo.
