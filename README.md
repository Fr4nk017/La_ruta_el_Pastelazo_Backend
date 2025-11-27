# 🍰 La Ruta el Pastelazo - Backend API

Backend completo para el sistema de e-commerce de la pastelería "La Ruta el Pastelazo". API REST construida con Node.js, Express y MongoDB, completamente funcional y lista para producción.

## 🚀 Características Principales

- ✅ **API REST Completa** con documentación Swagger
- ✅ **Autenticación JWT** con roles y permisos granulares  
- ✅ **Base de datos MongoDB Atlas** configurada y poblada
- ✅ **Sistema de Usuarios** (admin, trabajador, cliente)
- ✅ **Gestión de Productos** con categorías y filtros
- ✅ **Sistema de Pedidos** completo con información de cliente
- ✅ **Seguridad** con rate limiting, CORS, helmet
- ✅ **Validaciones** robustas con Joi
- ✅ **Middleware personalizado** para autenticación y roles

## 🛠️ Tecnologías Utilizadas

- **Runtime:** Node.js
- **Framework:** Express.js
- **Base de Datos:** MongoDB Atlas
- **ODM:** Mongoose
- **Autenticación:** JWT (jsonwebtoken)
- **Seguridad:** Helmet, CORS, Rate Limiting
- **Validación:** Joi
- **Documentación:** Swagger UI
- **Hash de Passwords:** bcryptjs
- **Variables de Entorno:** dotenv

## ⚡ Inicio Rápido

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/Fr4nk017/La_ruta_el_Pastelazo_Backend.git
cd La_ruta_el_Pastelazo_Backend
npm install
```

### 2. Configurar Variables de Entorno
```bash
cp .env.example .env
```

### 3. Poblar Base de Datos con Datos de Ejemplo
```bash
node seedDatabase.js
```

### 4. Iniciar Servidor
```bash
# Desarrollo
npm run dev

# Producción  
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## 📚 Documentación API

La documentación completa está disponible en:
```
http://localhost:5000/api-docs
```

## 👥 Usuarios de Prueba

Una vez ejecutado el script `seedDatabase.js`:

```
👤 Administrador: admin@larutaelpastelazo.cl / admin123
👤 Trabajador: trabajador@larutaelpastelazo.cl / trabajador123  
👤 Cliente: cliente@example.com / cliente123
```

## 📋 Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Productos
- `GET /api/products` - Listar productos (público)
- `GET /api/products/:id` - Obtener producto específico
- `POST /api/products` - Crear producto (Admin/Trabajador)
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto (Admin)

### Órdenes
- `GET /api/orders` - Órdenes del usuario actual
- `POST /api/orders` - Crear nueva orden
- `GET /api/orders/all` - Todas las órdenes (Admin/Trabajador)
- `PUT /api/orders/:id/status` - Actualizar estado

### Usuarios
- `GET /api/users/profile` - Perfil del usuario
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users` - Listar usuarios (Admin)

## 🔐 Sistema de Roles y Permisos

### Cliente (`cliente`)
- Ver productos
- Realizar pedidos  
- Ver sus propias órdenes
- Actualizar su perfil

### Trabajador (`trabajador`)
- Todos los permisos de cliente
- Gestionar productos (crear, actualizar)
- Ver y gestionar todas las órdenes
- Actualizar estados de órdenes

### Administrador (`admin`)  
- Todos los permisos anteriores
- Gestionar usuarios (crear, actualizar, eliminar)
- Eliminar productos
- Acceso completo al sistema

## 📦 Estructura del Proyecto

```
src/
├── config/          # Configuración (DB, Swagger, env)
├── controllers/     # Lógica de negocio
├── middlewares/     # Middleware personalizado  
├── models/          # Modelos de Mongoose
├── routes/          # Definición de rutas
├── utils/           # Utilidades y validaciones
└── server.js        # Punto de entrada

seedDatabase.js      # Script para poblar DB
```

## 🏗️ Modelos de Datos

### Usuario
```javascript
{
  firstName: String,
  lastName: String, 
  email: String (único),
  password: String (hasheado),
  phone: String,
  role: 'admin' | 'trabajador' | 'cliente',
  permissions: Array<String>,
  isActive: Boolean
}
```

### Producto
```javascript
{
  name: String,
  description: String,
  price: Number,
  img: String,
  category: 'clasicas' | 'especiales' | 'frutales' | ...,
  stock: Number,
  isActive: Boolean
}
```

### Orden
```javascript
{
  userId: ObjectId,
  orderNumber: String (auto-generado),
  items: Array<OrderItem>,
  customerInfo: CustomerInfo,
  deliveryDate: Date,
  deliveryTime: 'manana' | 'tarde' | 'noche',
  paymentMethod: String,
  total: Number,
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered'
}
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno Requeridas:
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=tu_jwt_secret_super_seguro
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Scripts Disponibles:
```bash
npm start        # Iniciar en producción
npm run dev      # Iniciar en desarrollo (nodemon)
npm test         # Ejecutar tests (si están configurados)
```

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel --prod
```

### Variables de entorno en producción:
- `NODE_ENV=production`
- `MONGODB_URI` (string de conexión Atlas)
- `JWT_SECRET` (clave segura)
- `CORS_ORIGIN` (URL del frontend)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

**Francisco** - [Fr4nk017](https://github.com/Fr4nk017)

---

🍰 **¡Disfruta construyendo con La Ruta el Pastelazo!** 🍰

## 📋 Modelos de Datos

### Usuario
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: 'admin' | 'trabajador' | 'cliente',
  permissions: Array<String>,
  isActive: Boolean,
  preferences: {
    newsletter: Boolean,
    promotions: Boolean
  }
}
```

### Producto
```javascript
{
  name: String,
  description: String,
  price: Number,
  img: String,
  category: 'clasicas' | 'especiales' | 'frutales' | 'gourmet' | ...,
  stock: Number,
  isActive: Boolean
}
```

### Orden
```javascript
{
  userId: ObjectId,
  orderNumber: String (auto-generated),
  items: [{
    productId: ObjectId,
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  customerInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    comuna: String,
    reference: String
  },
  deliveryDate: Date,
  deliveryTime: 'manana' | 'tarde' | 'noche',
  paymentMethod: 'transferencia' | 'efectivo' | 'tarjeta',
  specialInstructions: String,
  couponCode: String,
  total: Number,
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
}
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB (local o Atlas)
- npm o yarn

### 1. Clonar e instalar dependencias
```bash
git clone <repository-url>
cd pasteleria-backend
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pasteleria_db
JWT_SECRET=tu_jwt_secret_super_seguro
CORS_ORIGIN=http://localhost:5173
```

### 3. Ejecutar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `POST /api/users` - Crear usuario (Admin)
- `GET /api/users/profile` - Obtener perfil actual
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/:id` - Obtener usuario (Admin)
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Desactivar usuario (Admin)

### Productos
- `GET /api/products` - Listar productos (Público)
- `GET /api/products/:id` - Obtener producto (Público)
- `POST /api/products` - Crear producto (Admin/Trabajador)
- `PUT /api/products/:id` - Actualizar producto (Admin/Trabajador)
- `DELETE /api/products/:id` - Desactivar producto (Admin)

### Órdenes
- `GET /api/orders` - Listar órdenes del usuario
- `POST /api/orders` - Crear orden (checkout)
- `GET /api/orders/all` - Listar todas las órdenes (Admin/Trabajador)
- `GET /api/orders/:id` - Obtener orden específica
- `PUT /api/orders/:id/status` - Actualizar estado (Admin/Trabajador)
- `PUT /api/orders/:id/cancel` - Cancelar orden

## 🔐 Roles y Permisos

### Cliente (`cliente`)
- Ver productos
- Realizar pedidos
- Ver sus propias órdenes
- Actualizar su perfil

### Trabajador (`trabajador`)
- Todos los permisos de cliente
- Gestionar productos (crear, actualizar)
- Gestionar órdenes (ver todas, actualizar estado)
- Ver inventario

### Administrador (`admin`)
- Todos los permisos anteriores
- Gestionar usuarios (crear, actualizar, desactivar)
- Eliminar productos
- Ver reportes del sistema
- Gestionar configuraciones

## 📖 Documentación API

La documentación completa de la API está disponible en:
```
http://localhost:3000/api-docs
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 🚀 Deployment

### Variables de entorno de producción
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pasteleria_prod
JWT_SECRET=super_secret_production_key
CORS_ORIGIN=https://tu-frontend-domain.com
```

### Docker (opcional)
```bash
docker build -t pasteleria-backend .
docker run -p 3000:3000 pasteleria-backend
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🍰 Sobre La Ruta el Pastelazo

La Ruta el Pastelazo es una pastelería especializada en tortas artesanales, postres y productos de repostería de la más alta calidad. Nuestro sistema de e-commerce permite a los clientes explorar nuestro catálogo, personalizar pedidos y coordinar entregas.

**Contacto:**
- 📧 Email: contacto@larutaelpastelazo.cl
- 📞 Teléfono: +56 9 1234 5678
- 📍 Dirección: Av. Principal 123, Santiago, Chile