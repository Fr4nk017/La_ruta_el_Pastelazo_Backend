#!/bin/bash

# Script simple para probar middlewares
BASE_URL="http://localhost:4000/api"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRUEBAS DE MIDDLEWARES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar que el servidor esté activo
echo "1. Verificando servidor..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/)
if [ "$STATUS" -eq "200" ] || [ "$STATUS" -eq "304" ]; then
    echo "   ✓ Servidor activo"
else
    echo "   ✗ Servidor no responde (HTTP $STATUS)"
    exit 1
fi

# Crear tenant
echo ""
echo "2. Creando tenant de prueba..."
TENANT_RESPONSE=$(curl -s -X POST "${BASE_URL}/tenants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store Shell",
    "slug": "test-store-shell",
    "ownerEmail": "admin@testshell.com",
    "ownerPassword": "Admin123!",
    "ownerName": "Admin Shell Test"
  }')

TENANT_ID=$(echo $TENANT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
if [ -n "$TENANT_ID" ]; then
    echo "   ✓ Tenant creado: $TENANT_ID"
else
    echo "   ✗ Error creando tenant"
    echo "   Respuesta: $TENANT_RESPONSE"
    exit 1
fi

# Login admin
echo ""
echo "3. Probando autenticación (login admin)..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/users/login" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "email": "admin@testshell.com",
    "password": "Admin123!"
  }')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$ADMIN_TOKEN" ]; then
    echo "   ✓ Token admin obtenido"
else
    echo "   ✗ Error en login"
    exit 1
fi

# Probar middleware de auth
echo ""
echo "4. Probando middleware de autenticación..."
echo "   a) Sin token (debe retornar 401)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/users/profile" \
  -H "x-tenant-id: $TENANT_ID")
if [ "$STATUS" -eq "401" ]; then
    echo "      ✓ Correctamente rechazado (401)"
else
    echo "      ✗ Esperaba 401, recibió $STATUS"
fi

echo "   b) Con token válido (debe retornar 200)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/users/profile" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if [ "$STATUS" -eq "200" ]; then
    echo "      ✓ Acceso concedido (200)"
else
    echo "      ✗ Esperaba 200, recibió $STATUS"
fi

# Probar middleware de tenant isolation
echo ""
echo "5. Probando middleware de tenant isolation..."
echo "   a) Sin tenant-id (debe retornar 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/products")
if [ "$STATUS" -eq "400" ]; then
    echo "      ✓ Correctamente rechazado (400)"
else
    echo "      ✗ Esperaba 400, recibió $STATUS"
fi

echo "   b) Con tenant-id válido (debe retornar 200)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/products" \
  -H "x-tenant-id: $TENANT_ID")
if [ "$STATUS" -eq "200" ]; then
    echo "      ✓ Acceso concedido (200)"
else
    echo "      ✗ Esperaba 200, recibió $STATUS"
fi

# Probar middleware de permisos
echo ""
echo "6. Probando middleware de permisos..."
echo "   a) Admin puede crear producto (debe retornar 201)..."
PRODUCT_RESPONSE=$(curl -s -X POST "${BASE_URL}/products" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "Product for testing",
    "price": 99.99,
    "stock": 10
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
if [ -n "$PRODUCT_ID" ]; then
    echo "      ✓ Producto creado: $PRODUCT_ID"
else
    echo "      ✗ Error creando producto"
    echo "      Respuesta: $PRODUCT_RESPONSE"
fi

# Crear usuario normal
echo "   b) Creando usuario customer..."
curl -s -X POST "${BASE_URL}/users/register" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "name": "User Test",
    "email": "user@testshell.com",
    "password": "User123!",
    "roleSlug": "customer"
  }' > /dev/null

USER_LOGIN=$(curl -s -X POST "${BASE_URL}/users/login" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -d '{
    "email": "user@testshell.com",
    "password": "User123!"
  }')

USER_TOKEN=$(echo $USER_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "   c) Usuario normal NO puede crear producto (debe retornar 403)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name": "Unauthorized Product", "price": 50, "stock": 5}')

if [ "$STATUS" -eq "403" ]; then
    echo "      ✓ Correctamente rechazado (403)"
else
    echo "      ✗ Esperaba 403, recibió $STATUS"
fi

# Probar middleware de validación Zod
echo ""
echo "7. Probando middleware de validación (Zod)..."
echo "   a) Crear producto con datos inválidos (debe retornar 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/products" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "", "price": -10}')

if [ "$STATUS" -eq "400" ]; then
    echo "      ✓ Validación funcionando (400)"
else
    echo "      ✗ Esperaba 400, recibió $STATUS"
fi

echo "   b) Agregar al carrito con productId inválido (debe retornar 400)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/carts/items" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"productId": "invalid-id", "quantity": 1}')

if [ "$STATUS" -eq "400" ]; then
    echo "      ✓ Validación funcionando (400)"
else
    echo "      ✗ Esperaba 400, recibió $STATUS"
fi

# Probar error handler
echo ""
echo "8. Probando middleware de error handling..."
echo "   a) Endpoint inexistente (debe retornar 404)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/nonexistent" \
  -H "x-tenant-id: $TENANT_ID")

if [ "$STATUS" -eq "404" ]; then
    echo "      ✓ Error handler funcionando (404)"
else
    echo "      ✗ Esperaba 404, recibió $STATUS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ ¡Todas las pruebas completadas!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
