import cors from 'cors';
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { connectDB } from "./config/db.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a la base de datos
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: { error: true, message: "Demasiadas solicitudes desde esta IP. Intente más tarde." }
});

// Middlewares globales
app.use(helmet()); // Seguridad HTTP headers
app.use(cors()); // CORS
app.use(morgan('combined')); // Logging
app.use(limiter); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Ruta de prueba / health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'La Ruta del Pastelazo - Backend API',
    version: '2.0.0',
    status: 'running',
    multiTenant: true
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * RUTAS DE LA API
 * 
 * Estructura multi-tenant:
 * - Rutas de tenant: /api/tenants (gestión de tenants)
 * - Rutas por tenant con slug: /api/:tenantSlug/users, /api/:tenantSlug/products, etc.
 * - O con header: x-tenant-id para APIs más limpias
 */

// Rutas de gestión de tenants (públicas y admin)
app.use('/api/tenants', tenantRoutes);

// Rutas de usuarios (requieren tenant context)
app.use('/api/users', userRoutes);

// Rutas de productos, carrito y órdenes (multi-tenant)
app.use('/api/products', productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);

// Swagger / OpenAPI
const openApiSpecPath = path.resolve(process.cwd(), 'openapi.json');
let openApiSpec = {};
try {
  const raw = fs.readFileSync(openApiSpecPath, 'utf-8');
  openApiSpec = JSON.parse(raw);
} catch (err) {
  console.error('⚠️ No se pudo cargar openapi.json:', err.message);
}
app.get('/api/docs-json', (req, res) => res.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

/**
 * MANEJO DE ERRORES
 * Estos middlewares DEBEN ir al final, después de todas las rutas
 */

// Manejador de rutas no encontradas (404)
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor funcionando en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}`);
  console.log(`🏢 Sistema multi-tenant activado`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
