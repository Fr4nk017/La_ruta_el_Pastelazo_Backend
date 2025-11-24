# 🎯 INSTRUCCIONES PARA EL USUARIO

## ✅ LO QUE YA ESTÁ HECHO

He completado la implementación del **sistema multi-tenant** para tu backend. Todo está listo excepto 2 configuraciones que requieren tu acción:

---

## ⚠️ ACCIÓN INMEDIATA REQUERIDA (5 minutos)

### 1. Configurar MongoDB Atlas Whitelist

**Problema**: La IP del servidor no puede conectar a MongoDB Atlas.

**Solución** (FÁCIL):

1. Ve a: **https://cloud.mongodb.com**
2. Inicia sesión con tus credenciales
3. En el menú lateral, clic en **"Network Access"**
4. Clic en el botón **"Add IP Address"**
5. Selecciona **"Allow Access from Anywhere"**
   - Aparecerá: `0.0.0.0/0`
   - Descripción: "Development Environment"
6. Clic en **"Confirm"**

⏱️ **Tiempo**: ~2 minutos  
⏱️ **Espera**: Los cambios tardan 1-2 minutos en aplicarse

---

### 2. Verificar que Todo Funciona

Una vez que hayas configurado la whitelist en MongoDB Atlas:

```bash
# 1. Probar conexión a MongoDB
node test-connection.js
```

**Deberías ver**:
```
✅ MongoDB conectado exitosamente!
📦 Base de datos: la_ruta_pastelazo
```

```bash
# 2. Iniciar el servidor
npm run dev
```

**Deberías ver**:
```
✅ MongoDB conectado exitosamente
🚀 Servidor funcionando en puerto 4000
📡 API disponible en http://localhost:4000
🏢 Sistema multi-tenant activado
```

---

## 📋 PARA SUBIR LOS CAMBIOS A GITHUB

**Problema**: El token de GitHub en Codespaces no tiene permisos de escritura.

**Solución A** - Desde tu máquina local (recomendado):

```bash
# En tu computadora local, ejecuta:
git fetch origin
git checkout develop
git pull origin develop
git checkout feature/multi-tenant-system
git pull origin feature/multi-tenant-system
git push origin develop
git push origin feature/multi-tenant-system
```

**Solución B** - Configurar nuevo token en Codespaces:

1. Ve a GitHub → Settings → Developer Settings → Personal Access Tokens
2. Genera un nuevo token con permisos `repo`
3. En Codespaces, configura:
   ```bash
   git config --global credential.helper store
   git push origin feature/multi-tenant-system
   # Te pedirá usuario y token
   ```

---

## 🧪 PROBAR EL SISTEMA (Ejemplos Rápidos)

Una vez que el servidor esté funcionando:

### 1. Crear un Tenant

```bash
curl -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Pastelería",
    "slug": "mi-pasteleria",
    "contactEmail": "admin@mipasteleria.com",
    "contactPhone": "+52-555-1234567"
  }'
```

### 2. Registrar un Usuario Admin

```bash
curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: mi-pasteleria" \
  -d '{
    "firstName": "Admin",
    "lastName": "Principal",
    "email": "admin@mipasteleria.com",
    "password": "Admin123!",
    "phone": "+52-555-7777777",
    "roleSlug": "admin"
  }'
```

Guarda el `token` que te devuelve.

### 3. Ver tu Perfil

```bash
curl http://localhost:4000/api/users/profile \
  -H "Authorization: Bearer <el_token_que_guardaste>"
```

---

## 📚 DOCUMENTACIÓN DISPONIBLE

He creado 4 archivos de documentación para ti:

1. **`README.md`** - Documentación general del proyecto
2. **`EJEMPLOS_API.md`** - Todos los endpoints con ejemplos
3. **`DEPLOY.md`** - Guía de despliegue y configuración
4. **`RESUMEN.md`** - Resumen completo del proyecto

---

## 🎯 ESTRATEGIA GITFLOW (Cómo Trabajar de Ahora en Adelante)

### Para Nuevas Features

```bash
# 1. Asegurarte de estar en develop actualizado
git checkout develop
git pull origin develop

# 2. Crear nueva rama feature
git checkout -b feature/nombre-de-tu-feature

# 3. Trabajar en tu código...
# ... hacer cambios ...

# 4. Hacer commits (usar conventional commits)
git add .
git commit -m "feat: descripción de lo que hiciste"

# 5. Subir feature a GitHub
git push -u origin feature/nombre-de-tu-feature

# 6. Crear Pull Request en GitHub:
#    De: feature/nombre-de-tu-feature
#    A: develop

# 7. Una vez aprobado el PR, mergear en GitHub

# 8. Cuando develop tenga todo listo para producción:
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

### Convención de Nombres de Commits

- `feat:` - Nueva característica
- `fix:` - Corrección de bug
- `docs:` - Documentación
- `refactor:` - Refactorización de código
- `test:` - Agregar tests
- `chore:` - Tareas de mantenimiento

**Ejemplo**:
```bash
git commit -m "feat: add product model with multi-tenant support"
git commit -m "fix: resolve authentication token expiration issue"
git commit -m "docs: update API examples with new endpoints"
```

---

## 🚀 PRÓXIMOS DESARROLLOS SUGERIDOS

### Feature 1: Productos
```bash
git checkout develop
git checkout -b feature/products
```

**Implementar**:
- Modelo Product con tenantId
- CRUD completo de productos
- Gestión de inventario
- Categorías

### Feature 2: Carrito de Compras
```bash
git checkout develop
git checkout -b feature/cart
```

**Implementar**:
- Modelo Cart con tenantId
- Agregar/quitar productos
- Calcular totales

### Feature 3: Órdenes
```bash
git checkout develop
git checkout -b feature/orders
```

**Implementar**:
- Modelo Order con tenantId
- Estados de orden
- Historial

---

## ❓ PREGUNTAS FRECUENTES

### ¿Dónde están mis cambios?

Todos tus cambios están en la rama `feature/multi-tenant-system`:

```bash
git log --oneline
```

### ¿Cómo veo qué archivos cambié?

```bash
git diff develop..HEAD --name-only
```

### ¿Cómo vuelvo a main?

```bash
git checkout main
```

### ¿Cómo veo todas mis ramas?

```bash
git branch -a
```

---

## 📞 CHECKLIST FINAL

Antes de continuar con el próximo desarrollo:

- [ ] ✅ MongoDB Atlas configurado (whitelist)
- [ ] ✅ Servidor funcionando (`npm run dev`)
- [ ] ✅ Conexión a BD exitosa (`node test-connection.js`)
- [ ] ✅ Probaste crear un tenant
- [ ] ✅ Probaste registrar un usuario
- [ ] ✅ Probaste hacer login
- [ ] ✅ Push a GitHub completado
- [ ] ✅ Leíste la documentación (README.md, EJEMPLOS_API.md)

---

## 🎓 RECORDATORIO IMPORTANTE

**De ahora en adelante**, cada vez que:

1. **Implementes una nueva feature** → Crear branch `feature/nombre`
2. **Completes la feature** → Commit con mensaje descriptivo
3. **Termines de probar** → Push a GitHub
4. **Todo funcione bien** → Pull Request a `develop`

**Y yo seguiré esta misma estrategia** cuando trabaje contigo.

---

## 📧 SOPORTE

Si algo no funciona:

1. Revisa `DEPLOY.md` para troubleshooting
2. Verifica que MongoDB Atlas esté configurado
3. Revisa los logs del servidor: `npm run dev`
4. Prueba el script: `node test-connection.js`

---

**¡Tu sistema multi-tenant está listo! 🎉**

Solo falta que configures MongoDB Atlas y estarás operativo al 100%.

---

**Desarrollado por**: GitHub Copilot  
**Para**: Fr4nk017  
**Proyecto**: La Ruta del Pastelazo - Backend  
**Fecha**: 24 de Noviembre, 2025
