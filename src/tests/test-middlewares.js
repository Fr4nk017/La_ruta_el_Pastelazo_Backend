/**
 * Script de prueba para validar middlewares
 * Prueba: auth, tenantIsolation, requirePermission, validate (Zod)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}━━━ ${msg} ━━━${colors.reset}`)
};

let testResults = { passed: 0, failed: 0 };
let tenantId, adminToken, userToken, productId;

async function request(method, path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const { body, headers = {}, expectStatus } = options;
  
  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));
    
    if (expectStatus && response.status !== expectStatus) {
      throw new Error(`Expected ${expectStatus}, got ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return { status: response.status, data };
  } catch (error) {
    throw error;
  }
}

async function test(name, fn) {
  try {
    await fn();
    log.success(name);
    testResults.passed++;
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    testResults.failed++;
  }
}

// Tests
async function runTests() {
  log.section('PRUEBAS DE MIDDLEWARES');

  // 1. Crear tenant
  log.section('1. Setup: Crear Tenant');
  await test('Crear tenant de prueba', async () => {
    const { status, data } = await request('POST', '/tenants', {
      body: {
        name: 'Test Store',
        slug: 'test-store',
        ownerEmail: 'admin@test.com',
        ownerPassword: 'Admin123!',
        ownerName: 'Admin Test'
      },
      expectStatus: 201
    });
    tenantId = data._id;
    log.info(`Tenant creado: ${tenantId}`);
  });

  // 2. Login como admin
  log.section('2. Autenticación');
  await test('Login admin obtiene token', async () => {
    const { status, data } = await request('POST', '/users/login', {
      body: {
        email: 'admin@test.com',
        password: 'Admin123!'
      },
      headers: { 'x-tenant-id': tenantId },
      expectStatus: 200
    });
    adminToken = data.token;
    if (!adminToken) throw new Error('No se recibió token');
    log.info(`Token admin obtenido`);
  });

  await test('Crear usuario normal (customer)', async () => {
    const { status, data } = await request('POST', '/users/register', {
      body: {
        name: 'User Test',
        email: 'user@test.com',
        password: 'User123!',
        roleSlug: 'customer'
      },
      headers: { 'x-tenant-id': tenantId },
      expectStatus: 201
    });
    log.info(`Usuario customer creado`);
  });

  await test('Login usuario normal obtiene token', async () => {
    const { status, data } = await request('POST', '/users/login', {
      body: {
        email: 'user@test.com',
        password: 'User123!'
      },
      headers: { 'x-tenant-id': tenantId },
      expectStatus: 200
    });
    userToken = data.token;
    if (!userToken) throw new Error('No se recibió token');
    log.info(`Token user obtenido`);
  });

  // 3. Middleware de autenticación
  log.section('3. Middleware: Auth');
  await test('Endpoint protegido sin token retorna 401', async () => {
    const { status } = await request('GET', '/users/profile', {
      headers: { 'x-tenant-id': tenantId }
    });
    if (status !== 401) throw new Error(`Esperaba 401, recibió ${status}`);
  });

  await test('Endpoint protegido con token válido retorna 200', async () => {
    await request('GET', '/users/profile', {
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${adminToken}`
      },
      expectStatus: 200
    });
  });

  // 4. Middleware de tenant isolation
  log.section('4. Middleware: Tenant Isolation');
  await test('Request sin tenant-id retorna error 400', async () => {
    const { status, data } = await request('GET', '/products');
    if (status !== 400) throw new Error(`Esperaba 400, recibió ${status}`);
    if (!data.message?.includes('Tenant')) throw new Error('Mensaje de error incorrecto');
  });

  await test('Request con tenant-id válido funciona', async () => {
    await request('GET', '/products', {
      headers: { 'x-tenant-id': tenantId },
      expectStatus: 200
    });
  });

  // 5. Middleware de permisos
  log.section('5. Middleware: Permissions');
  await test('Admin puede crear producto', async () => {
    const { status, data } = await request('POST', '/products', {
      body: {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        stock: 10
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${adminToken}`
      },
      expectStatus: 201
    });
    productId = data._id;
    log.info(`Producto creado: ${productId}`);
  });

  await test('Usuario normal NO puede crear producto (403)', async () => {
    const { status } = await request('POST', '/products', {
      body: {
        name: 'Another Product',
        price: 50,
        stock: 5
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (status !== 403) throw new Error(`Esperaba 403, recibió ${status}`);
  });

  await test('Usuario normal puede ver productos (público)', async () => {
    await request('GET', '/products', {
      headers: { 'x-tenant-id': tenantId },
      expectStatus: 200
    });
  });

  // 6. Middleware de validación Zod
  log.section('6. Middleware: Validation (Zod)');
  await test('Crear producto con datos inválidos retorna 400', async () => {
    const { status, data } = await request('POST', '/products', {
      body: {
        name: '',  // nombre vacío - inválido
        price: -10  // precio negativo - inválido
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${adminToken}`
      }
    });
    if (status !== 400) throw new Error(`Esperaba 400, recibió ${status}`);
    if (!data.errors) throw new Error('Debe incluir errores de validación');
  });

  await test('Agregar al carrito con productId inválido retorna 400', async () => {
    const { status, data } = await request('POST', '/carts/items', {
      body: {
        productId: 'invalid-id',  // ObjectId inválido
        quantity: 1
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (status !== 400) throw new Error(`Esperaba 400, recibió ${status}`);
  });

  await test('Agregar al carrito con datos válidos funciona', async () => {
    await request('POST', '/carts/items', {
      body: {
        productId: productId,
        quantity: 2
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${userToken}`
      },
      expectStatus: 201
    });
  });

  await test('Actualizar cantidad con valor inválido retorna 400', async () => {
    const { status } = await request('PUT', `/carts/items/${productId}`, {
      body: {
        quantity: 0  // cantidad debe ser >= 1
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${userToken}`
      }
    });
    if (status !== 400) throw new Error(`Esperaba 400, recibió ${status}`);
  });

  await test('Actualizar orden con estado inválido retorna 400', async () => {
    // Primero crear una orden
    const { data: order } = await request('POST', '/orders', {
      body: {},
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${userToken}`
      }
    });

    // Intentar actualizar con estado inválido
    const { status } = await request('PATCH', `/orders/${order._id}/status`, {
      body: {
        status: 'invalid-status'
      },
      headers: { 
        'x-tenant-id': tenantId,
        'Authorization': `Bearer ${adminToken}`
      }
    });
    if (status !== 400) throw new Error(`Esperaba 400, recibió ${status}`);
  });

  // 7. Middleware de error handling
  log.section('7. Middleware: Error Handler');
  await test('Endpoint inexistente retorna 404', async () => {
    const { status } = await request('GET', '/nonexistent-endpoint', {
      headers: { 'x-tenant-id': tenantId }
    });
    if (status !== 404) throw new Error(`Esperaba 404, recibió ${status}`);
  });

  await test('Error de recurso no encontrado retorna mensaje apropiado', async () => {
    const { status, data } = await request('GET', '/products/123456789012345678901234', {
      headers: { 'x-tenant-id': tenantId }
    });
    if (status !== 404) throw new Error(`Esperaba 404, recibió ${status}`);
    if (!data.message) throw new Error('Debe incluir mensaje de error');
  });

  // Resumen
  log.section('RESUMEN DE PRUEBAS');
  const total = testResults.passed + testResults.failed;
  console.log(`Total: ${total}`);
  console.log(`${colors.green}Pasadas: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Fallidas: ${testResults.failed}${colors.reset}`);
  
  if (testResults.failed === 0) {
    log.success('¡Todos los middlewares funcionan correctamente!');
  } else {
    log.error(`${testResults.failed} prueba(s) fallaron`);
    process.exit(1);
  }
}

// Ejecutar
runTests().catch(error => {
  log.error(`Error fatal: ${error.message}`);
  process.exit(1);
});
