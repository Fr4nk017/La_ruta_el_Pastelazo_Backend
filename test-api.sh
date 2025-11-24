#!/bin/bash

# Script de pruebas completo para el backend multi-tenant
# Verifica: Auth, Tenant Isolation, Permisos, Validación Zod, CRUD completo

BASE_URL="http://localhost:4000/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

function test() {
  local name="$1"
  local expected_code="$2"
  local response="$3"
  local actual_code=$(echo "$response" | jq -r '.status // 0')
  
  if [ "$actual_code" = "$expected_code" ]; then
    echo -e "${GREEN}✓${NC} $name"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $name (esperado: $expected_code, obtenido: $actual_code)"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    ((FAILED++))
  fi
}

function request() {
  local method="$1"
  local path="$2"
  local data="$3"
  local headers="$4"
  
  local url="${BASE_URL}${path}"
  local full_headers="Content-Type: application/json"
  
  if [ -n "$headers" ]; then
    full_headers="${full_headers}|${headers}"
  fi
  
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    response=$(curl -s -w "\n{\"status\":%{http_code}}" -X "$method" "$url" \
      $(echo "$full_headers" | tr '|' '\n' | sed 's/^/-H "/;s/$/"/' | tr '\n' ' '))
  else
    response=$(curl -s -w "\n{\"status\":%{http_code}}" -X "$method" "$url" \
      -d "$data" \
      $(echo "$full_headers" | tr '|' '\n' | sed 's/^/-H "/;s/$/"/' | tr '\n' ' '))
  fi
  
  echo "$response"
}

echo -e "\n${BLUE}━━━ PRUEBAS DE BACKEND MULTI-TENANT ━━━${NC}\n"

# 1. Health Check
echo -e "${BLUE}1. Health Check${NC}"
response=$(request GET "/" "" "")
test "Servidor responde" "200" "$response"

# 2. Crear Tenant
echo -e "\n${BLUE}2. Crear Tenant${NC}"
response=$(request POST "/tenants" '{
  "name": "Test Store",
  "slug": "test-'$(date +%s)'",
  "ownerEmail": "admin@test.com",
  "ownerPassword": "Admin123!",
  "ownerName": "Admin Test"
}' "")
test "Crear tenant" "201" "$response"
TENANT_ID=$(echo "$response" | jq -r 'select(.status != null) | .status as $st | . | del(.status) | ._id')

# 3. Login Admin
echo -e "\n${BLUE}3. Autenticación${NC}"
response=$(request POST "/users/login" '{
  "email": "admin@test.com",
  "password": "Admin123!"
}' "x-tenant-id: $TENANT_ID")
test "Login admin" "200" "$response"
ADMIN_TOKEN=$(echo "$response" | jq -r 'select(.status != null) | .status as $st | . | del(.status) | .token')

# 4. Crear usuario customer
response=$(request POST "/users/register" '{
  "name": "User Test",
  "email": "user@test.com",
  "password": "User123!",
  "roleSlug": "customer"
}' "x-tenant-id: $TENANT_ID")
test "Registrar usuario customer" "201" "$response"

response=$(request POST "/users/login" '{
  "email": "user@test.com",
  "password": "User123!"
}' "x-tenant-id: $TENANT_ID")
test "Login usuario" "200" "$response"
USER_TOKEN=$(echo "$response" | jq -r 'select(.status != null) | .status as $st | . | del(.status) | .token')

# 5. Middleware de Autenticación
echo -e "\n${BLUE}4. Middleware: Auth${NC}"
response=$(request GET "/users/profile" "" "x-tenant-id: $TENANT_ID")
test "Sin token retorna 401" "401" "$response"

response=$(request GET "/users/profile" "" "x-tenant-id: $TENANT_ID|Authorization: Bearer $ADMIN_TOKEN")
test "Con token válido retorna 200" "200" "$response"

# 6. Middleware Tenant Isolation
echo -e "\n${BLUE}5. Middleware: Tenant Isolation${NC}"
response=$(request GET "/products" "" "")
test "Sin tenant-id retorna 400" "400" "$response"

response=$(request GET "/products" "" "x-tenant-id: $TENANT_ID")
test "Con tenant-id válido retorna 200" "200" "$response"

# 7. Middleware Permisos
echo -e "\n${BLUE}6. Middleware: Permissions${NC}"
response=$(request POST "/products" '{
  "name": "Test Product",
  "description": "Test description",
  "price": 99.99,
  "stock": 10
}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $ADMIN_TOKEN")
test "Admin puede crear producto" "201" "$response"
PRODUCT_ID=$(echo "$response" | jq -r 'select(.status != null) | .status as $st | . | del(.status) | ._id')

response=$(request POST "/products" '{
  "name": "Another Product",
  "price": 50,
  "stock": 5
}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "Usuario sin permiso retorna 403" "403" "$response"

# 8. Validación Zod
echo -e "\n${BLUE}7. Middleware: Validation (Zod)${NC}"
response=$(request POST "/products" '{
  "name": "",
  "price": -10
}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $ADMIN_TOKEN")
test "Datos inválidos retorna 400" "400" "$response"

response=$(request POST "/carts/items" '{
  "productId": "invalid-id",
  "quantity": 1
}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "ProductId inválido retorna 400" "400" "$response"

# 9. Carrito
echo -e "\n${BLUE}8. Funcionalidad: Carrito${NC}"
response=$(request POST "/carts/items" '{
  "productId": "'$PRODUCT_ID'",
  "quantity": 2
}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "Agregar producto al carrito" "201" "$response"

response=$(request GET "/carts" "" "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "Obtener carrito" "200" "$response"

# 10. Órdenes
echo -e "\n${BLUE}9. Funcionalidad: Órdenes${NC}"
response=$(request POST "/orders" '{}' "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "Crear orden desde carrito" "201" "$response"
ORDER_ID=$(echo "$response" | jq -r 'select(.status != null) | .status as $st | . | del(.status) | ._id')

response=$(request GET "/orders/mine" "" "x-tenant-id: $TENANT_ID|Authorization: Bearer $USER_TOKEN")
test "Listar mis órdenes" "200" "$response"

# Resumen
echo -e "\n${BLUE}━━━ RESUMEN ━━━${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total: $TOTAL"
echo -e "${GREEN}Pasadas: $PASSED${NC}"
echo -e "${RED}Fallidas: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ ¡Todos los middlewares y funcionalidades funcionan correctamente!${NC}\n"
  exit 0
else
  echo -e "\n${RED}✗ $FAILED prueba(s) fallaron${NC}\n"
  exit 1
fi
