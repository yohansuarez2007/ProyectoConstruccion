# README — NEXDESK · LAB NODE 25

> **Guía práctica de instalación, configuración, integración y pruebas de API REST**  
> Node.js / Express / Supabase Authentication / PostgreSQL / Postman  

## 0. Objetivo y alcance

Continuar NEXDESK desde LAB 24 para incorporar autenticación con Supabase Auth, JWT, autorización por roles RBAC, gestión administrativa de usuarios, cambio obligatorio de contraseña, gestión de perfiles técnicos, categorías, tickets y seguimientos; evitar accesos indebidos **BOLA** [Broken Object Level Authorization	Autorización defectuosa a nivel de objeto] /**IDOR** [Insecure Direct Object Reference	Referencia directa insegura a objetos] y registrar evidencia en Postman y PostgreSQL. La baja de usuarios y categorías es lógica: no se implementa `DELETE` físico.

Diferencia principal:
- **IDOR** describe una situación en la que un identificador manipulable permite acceder indebidamente a un recurso.
- **BOLA** describe el fallo de autorización que permite operar sobre un objeto sin tener permiso para hacerlo.


## 1. Preparación del entorno en VS Code (Windows / PowerShell)

### 1.1. Requisitos

1. Instalar **Node.js 20 o superior** (recomendado Node.js 22 LTS), **Visual Studio Code**, **Git** y **Postman**.
2. Contar con un proyecto **Supabase** que tenga PostgreSQL y Authentication habilitados.
3. Trabajar en una base de datos de laboratorio, nunca con registros productivos.

### 1.2. Abrir y preparar el proyecto

Desde VS Code → **File → Open Folder**, abrir la raíz del proyecto (donde se encuentra `package.json`). En **Terminal → New Terminal**, ejecutar:

```powershell
node --version
npm --version
npm install
npm install @supabase/supabase-js express-validator express-rate-limit
npm audit
```

Si el proyecto no tiene instaladas las dependencias históricas, revisar `package.json` e instalar las necesarias para el código existente, entre ellas `express`, `pg`, `dotenv`, `helmet` y `cors`. **No crear un segundo `package.json` ni reinstalar a ciegas**: conservar las versiones compatibles del proyecto.

Verificar en `package.json` que se utiliza ESM:

```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  }
}
```

Este fragmento es **orientativo**: integrar `type` y `scripts` sin borrar las demás dependencias, metadatos ni scripts del `package.json` original.

### 1.3. Variables `.env` y secretos

En la raíz del proyecto, crear o completar `.env` (no subir a GitHub):

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3000

# Supabase PostgreSQL — conexión del proyecto LAB 24
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:PUERTO/postgres
PGSSL=true
PGSSL_CA_PATH=certs/supabase-ca.crt
PGPOOL_MAX=5

# Supabase Authentication
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=CLAVE_PUBLICA_O_PUBLISHABLE_COMPATIBLE
SUPABASE_SERVICE_ROLE_KEY=CLAVE_PRIVILEGIADA_SOLO_BACKEND

# Diagnósticos opcionales (mantener deshabilitados normalmente)
LAB_DIAGNOSTICS_ENABLED=false
LAB_DIAGNOSTICS_TOKEN=
```

**Ajustar los nombres de claves a `src/config/supabase.js` y `src/config/supabaseAdmin.js`.** La configuración real `src/config/env.js` exige `DATABASE_URL`, activa TLS por defecto, admite `PGSSL_CA_PATH` y usa `PGPOOL_MAX=5` por defecto. `src/config/db.js` valida certificados (`rejectUnauthorized: true`): usar el certificado CA correcto del entorno y **no deshabilitar la verificación TLS** como solución permanente.

Añadir a `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
certs/*.key
*.log
```

La `SUPABASE_SERVICE_ROLE_KEY` es privilegiada: **nunca** debe ir al frontend.

### 1.4. Iniciar y comprobar

```powershell
npm run dev
```

Si ese script no existe, usar `node --watch src/server.js` y revisar el error de arranque. En Postman:

```http
GET http://localhost:3000/api/estado
```

Esperado: HTTP 200. La conexión a PostgreSQL se valida adicionalmente mediante las operaciones y consultas SQL; la ruta de salud por sí sola no prueba todos los servicios.

## 2. Configuración y verificación en Supabase

### 2.1. Estructura de datos

En **Supabase → SQL Editor**, verificar que existan las tablas `public.roles`, `public.usuarios`, `public.tecnicos`, `public.categorias`, `public.tickets` y `public.seguimientos`, así como sus claves foráneas, restricciones y registros semilla de LAB 22-24. El esquema de LAB 26 debe preservar el vínculo de `usuarios.auth_user_id` con la identidad de Supabase Auth y el campo `debe_cambiar_password`.

```sql
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_auth_user_id
  ON public.usuarios(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

SELECT u.id, u.nombre, u.email, u.auth_user_id,
       r.nombre AS rol, u.activo, u.debe_cambiar_password
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;
```

**Precaución:** la migración es idempotente, pero no debe aplicarse sobre un esquema desconocido sin copia de seguridad. No establecer `debe_cambiar_password=false` indiscriminadamente: solo cuando se haya completado el cambio correspondiente.

### 2.2. Supabase Authentication: cuentas de prueba

1. Ir a **Authentication → Users**.
2. Confirmar que Sofía (superadmin), Pedro (admin), Ana (usuario), María (usuario) y al menos un técnico tengan cuentas de Auth con correo verificable y contraseña conocida para el laboratorio.
3. Copiar el UUID de cada identidad **solo dentro de la consola segura** y vincularlo al registro institucional correcto en `public.usuarios.auth_user_id`.
4. Confirmar que el rol real se obtiene de `public.roles`, **no** de un rol arbitrario suministrado por el cliente.
5. Para cuentas creadas por `POST /api/usuarios`, el backend utiliza el cliente administrativo de Supabase Auth; después registra/vincula la identidad en PostgreSQL y marca `debe_cambiar_password=true`.
6. Las credenciales temporales deben entregarse privadamente. No guardarlas en un README, colección exportada, evidencia de clase ni capturas.

Ejemplo de vinculación **solo si el usuario ya existe en ambas plataformas y el UUID es correcto**:

```sql

-- ==========================================
-- HELP DESK
-- VINCULACIÓN DE USUARIO CON SUPABASE AUTH
-- ==========================================

BEGIN;

-- 1. Vincular la identidad de autenticación.
UPDATE public.usuarios
SET auth_user_id =
    '7aa25b16-8e31-481a-a565-58cb1ed4303a'::uuid
WHERE id = 5
  AND auth_user_id IS NULL
  AND activo = TRUE
RETURNING
    id,
    nombre,
    apellido,
    email,
    auth_user_id,
    activo;

-- 2. Confirmar únicamente si UPDATE
--    devolvió exactamente una fila.
COMMIT;

-- Si no devolvió una fila, ejecutar
-- ROLLBACK en lugar de COMMIT.


```

### 2.3. Seguridad y RLS

Mantener RLS habilitado según LAB 24 y sin políticas públicas que permitan leer o modificar registros sensibles. **RLS no sustituye el RBAC/BOLA del backend** cuando Express se conecta con un usuario PostgreSQL privilegiado o que pueda eludir políticas. El backend debe filtrar por identidad y permisos en cada operación.

## 3. Archivos incorporados y modificados

- `src/app.js`
- `src/controllers/seguimientos.controller.js`
- `src/controllers/tecnicos.controller.js`
- `src/controllers/tickets.controller.js`
- `src/controllers/usuarios.controller.js`
- `src/routes/categorias.routes.js`
- `src/routes/seguimientos.routes.js`
- `src/routes/tecnicos.routes.js`
- `src/routes/tickets.routes.js`
- `src/routes/usuarios.routes.js`
- `src/services/tecnicos.service.js`
- `src/services/tickets.service.js`
- `src/services/usuarios.service.js`
- `src/validators/seguimientos.validator.js`
- `src/validators/tickets.validator.js`
- `src/validators/usuarios.validator.js`

### 3.1. Relación entre capas

```text
src/server.js  →  src/app.js
                        │
                        ├── routes/auth.routes.js
                        │      ├── validators/auth.validator.js
                        │      ├── middlewares/autenticar.js
                        │      └── controllers/auth.controller.js → Supabase Auth
                        ├── routes/usuarios.routes.js
                        │      └── validators → controller → services/usuarios.service.js
                        ├── routes/tecnicos.routes.js
                        │      └── validators/controller → services/tecnicos.service.js
                        ├── routes/categorias.routes.js
                        │      └── validators/controller → services/categorias.service.js
                        ├── routes/tickets.routes.js
                        │      └── autorizarTicket → validators/controller → services/tickets.service.js
                        └── routes/seguimientos.routes.js
                               └── autorizarTicket → validators/controller → services/seguimientos.service.js
```

`autenticar` valida el JWT y obtiene el usuario institucional; `autorizar` comprueba roles; `exigirPasswordActualizado` restringe cuentas con contraseña temporal; `autorizarTicket` aplica propiedad/asignación de tickets. Los controladores procesan HTTP; los servicios ejecutan reglas de negocio y SQL parametrizado.

**Punto de revisión:** `src/app.js` y algunos routers aplican autenticación duplicada; consolidar la protección en una sola capa al refactorizar. Verificar que los prefijos de rutas no se registren dos veces.

## 4. Preparación de Postman

1. Importar `NEXDESK_LAB26.postman_collection.json` y `NEXDESK_LAB26.postman_environment.json`.
2. Seleccionar el entorno **NEXDESK LAB26 - Local**.
3. Completar `baseUrl`, correos y contraseñas reales de las cuentas de laboratorio.
4. Confirmar los valores iniciales de IDs: `sofiaId`, `categoriaId` y los que dependan de registros existentes. Las solicitudes de creación guardan automáticamente los IDs cuando la respuesta tiene la forma esperada.
5. Revisar **Authorization → Bearer Token** en cada solicitud: Sofía, Pedro, Ana, María o técnico según la prueba. Los scripts de colección guardan tokens e IDs como **variables de colección**, no como variables de entorno.
6. Ejecutar en orden **manualmente**. No usar Collection Runner para toda la colección: hay operaciones destructivas lógicas, cambios de contraseña y dependencias.
7. Antes de ejecutar una prueba negativa, comprobar la precondición (usuario/ticket existente, rol y token correctos).
8. En **Body → raw → JSON**, revisar los datos de prueba y usar correos controlados. No publicar tokens ni contraseñas.

### 4.1. Códigos de respuesta

| HTTP | Interpretación en el laboratorio |
|---|---|
| 200 | Lectura, edición o transición correcta |
| 201 | Creación correcta |
| 400 | Validación incorrecta |
| 401 | JWT ausente o inválido |
| 403 | Rol sin permiso, o contraseña temporal pendiente |
| 404 | Recurso inexistente o no visible por BOLA |
| 409 | Conflicto o transición no permitida |
| 429 | Límite de solicitudes de autenticación |

## 5. Catálogo detallado de pruebas Postman (76 casos)

**Orden recomendado:** autenticación de identidades existentes → usuarios → técnicos → categorías → tickets → seguimientos y BOLA. Las pruebas de contraseña deben respetar el estado real de cada cuenta; una contraseña ya definitiva no debe cambiarse sin necesidad.

### 01 Estado y autenticación

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 01 | Servidor activo | `GET` | `/api/estado` | 200 |
| 02 | Login sofia | `POST` | `/api/auth/login` | 200 |
| 03 | Perfil sofia | `GET` | `/api/auth/me` | 200 |
| 04 | Login pedro | `POST` | `/api/auth/login` | 200 |
| 05 | Perfil pedro | `GET` | `/api/auth/me` | 200 |
| 06 | Login ana | `POST` | `/api/auth/login` | 200 |
| 07 | Perfil ana | `GET` | `/api/auth/me` | 200 |
| 08 | Login tecnico | `POST` | `/api/auth/login` | 200 |
| 09 | Perfil tecnico | `GET` | `/api/auth/me` | 200 |
| 10 | Login maria | `POST` | `/api/auth/login` | 200 |
| 11 | Perfil maria | `GET` | `/api/auth/me` | 200 |
| 12 | Cambio de contraseña del técnico | `POST` | `/api/auth/cambiar-password` | 200 |
| 13 | Sin token: perfil | `GET` | `/api/auth/me` | 401 |
| 14 | Token inválido: perfil | `GET` | `/api/auth/me` | 401 |

**02 — 02 · Login sofia** · Cuerpo `raw / JSON`:

```json
{
  "email": "{{emailSofia}}",
  "password": "{{passwordSofia}}"
}
```

**04 — 04 · Login pedro** · Cuerpo `raw / JSON`:

```json
{
  "email": "{{emailPedro}}",
  "password": "{{passwordPedro}}"
}
```

**06 — 06 · Login ana** · Cuerpo `raw / JSON`:

```json
{
  "email": "{{emailAna}}",
  "password": "{{passwordAna}}"
}
```

**08 — 08 · Login tecnico** · Cuerpo `raw / JSON`:

```json
{
  "email": "{{emailTecnico}}",
  "password": "{{passwordTecnico}}"
}
```

**10 — 10 · Login maria** · Cuerpo `raw / JSON`:

```json
{
  "email": "{{emailMaria}}",
  "password": "{{passwordMaria}}"
}
```

**12 — 12 · Cambio de contraseña del técnico** · Cuerpo `raw / JSON`:

```json
{
  "passwordActual": "{{passwordTecnico}}",
  "passwordNueva": "{{passwordNuevaTecnico}}"
}
```

### 02 Usuarios CRUD

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 15 | Sofía lista todos | `GET` | `/api/usuarios` | 200 |
| 16 | Pedro lista solo técnicos y usuarios | `GET` | `/api/usuarios` | 200 |
| 17 | Ana no puede listar | `GET` | `/api/usuarios` | 403 |
| 18 | Sofía crea usuario | `POST` | `/api/usuarios` | 201 |
| 19 | Sofía consulta usuario | `GET` | `/api/usuarios/{{usuarioId}}` | 200 |
| 20 | Sofía actualiza usuario | `PUT` | `/api/usuarios/{{usuarioId}}` | 200 |
| 21 | Sofía desactiva usuario | `PATCH` | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 22 | Sofía reactiva usuario | `PATCH` | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 23 | Sofía crea técnico como usuario | `POST` | `/api/usuarios` | 201 |
| 24 | Sofía crea admin de prueba | `POST` | `/api/usuarios` | 201 |
| 25 | Pedro no crea superadmin | `POST` | `/api/usuarios` | 403 |
| 26 | Pedro no crea admin | `POST` | `/api/usuarios` | 403 |
| 27 | Pedro no consulta admin | `GET` | `/api/usuarios/{{adminCreadoId}}` | 403 |
| 28 | Pedro no actualiza admin | `PUT` | `/api/usuarios/{{adminCreadoId}}` | 403 |
| 29 | Pedro no desactiva admin | `PATCH` | `/api/usuarios/{{adminCreadoId}}/estado` | 403 |
| 30 | Ana no crea usuario | `POST` | `/api/usuarios` | 403 |
| 31 | Ana no actualiza usuario | `PUT` | `/api/usuarios/{{usuarioId}}` | 403 |
| 32 | Sofía no puede autodesactivarse | `PATCH` | `/api/usuarios/{{sofiaId}}/estado` | 403 |
| 33 | Validación documento inválido | `POST` | `/api/usuarios` | 400 |
| 34 | Usuario inexistente | `GET` | `/api/usuarios/999999999` | 404 |

**18 — 18 · Sofía crea usuario** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260001",
  "nombre": "Andres",
  "apellido": "Ramirez",
  "email": "{{emailNuevoUsuario}}",
  "rol": "usuario"
}
```

**20 — 20 · Sofía actualiza usuario** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260001",
  "nombre": "Andres Felipe",
  "apellido": "Ramirez"
}
```

**21 — 21 · Sofía desactiva usuario** · Cuerpo `raw / JSON`:

```json
{
  "activo": false
}
```

**22 — 22 · Sofía reactiva usuario** · Cuerpo `raw / JSON`:

```json
{
  "activo": true
}
```

**23 — 23 · Sofía crea técnico como usuario** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260002",
  "nombre": "Daniel",
  "apellido": "Ramirez",
  "email": "{{emailNuevoTecnico}}",
  "rol": "tecnico"
}
```

**24 — 24 · Sofía crea admin de prueba** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260003",
  "nombre": "Laura",
  "apellido": "Ramirez",
  "email": "{{emailNuevoAdmin}}",
  "rol": "admin"
}
```

**25 — 25 · Pedro no crea superadmin** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260004",
  "nombre": "Andres",
  "apellido": "Ramirez",
  "email": "{{emailIntentoSuperadmin}}",
  "rol": "superadmin"
}
```

**26 — 26 · Pedro no crea admin** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260005",
  "nombre": "Andres",
  "apellido": "Ramirez",
  "email": "{{emailIntentoAdmin}}",
  "rol": "admin"
}
```

**28 — 28 · Pedro no actualiza admin** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260003",
  "nombre": "Cambio",
  "apellido": "Indebido"
}
```

**29 — 29 · Pedro no desactiva admin** · Cuerpo `raw / JSON`:

```json
{
  "activo": false
}
```

**30 — 30 · Ana no crea usuario** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260001",
  "nombre": "Andres",
  "apellido": "Ramirez",
  "email": "{{emailNuevoUsuario}}",
  "rol": "usuario"
}
```

**31 — 31 · Ana no actualiza usuario** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "LAB260001",
  "nombre": "Intento",
  "apellido": "No Autorizado"
}
```

**32 — 32 · Sofía no puede autodesactivarse** · Cuerpo `raw / JSON`:

```json
{
  "activo": false
}
```

**33 — 33 · Validación documento inválido** · Cuerpo `raw / JSON`:

```json
{
  "tipo_documento": "CC",
  "numero_documento": "!",
  "nombre": "Andres",
  "apellido": "Ramirez",
  "email": "{{emailNuevoUsuario}}",
  "rol": "usuario"
}
```

### 03 Técnicos CRUD y RBAC

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 35 | Sofía crea perfil técnico | `POST` | `/api/tecnicos` | 201 |
| 36 | Sofía lista técnicos | `GET` | `/api/tecnicos` | 200 |
| 37 | Sofía consulta técnico | `GET` | `/api/tecnicos/{{tecnicoId}}` | 200 |
| 38 | Sofía actualiza técnico | `PUT` | `/api/tecnicos/{{tecnicoId}}` | 200 |
| 39 | Sofía técnico no disponible | `PATCH` | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 40 | Sofía técnico disponible | `PATCH` | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 41 | Ana no lista técnicos | `GET` | `/api/tecnicos` | 403 |
| 42 | Técnico consulta lista | `GET` | `/api/tecnicos` | 200 |
| 43 | Técnico no crea perfiles | `POST` | `/api/tecnicos` | 403 |

**35 — 35 · Sofía crea perfil técnico** · Cuerpo `raw / JSON`:

```json
{
  "usuario_id": "{{tecnicoUsuarioId}}",
  "especialidad": "Redes",
  "disponible": true
}
```

**38 — 38 · Sofía actualiza técnico** · Cuerpo `raw / JSON`:

```json
{
  "especialidad": "Infraestructura",
  "disponible": true
}
```

**39 — 39 · Sofía técnico no disponible** · Cuerpo `raw / JSON`:

```json
{
  "disponible": false
}
```

**40 — 40 · Sofía técnico disponible** · Cuerpo `raw / JSON`:

```json
{
  "disponible": true
}
```

**43 — 43 · Técnico no crea perfiles** · Cuerpo `raw / JSON`:

```json
{
  "usuario_id": "{{tecnicoUsuarioId}}",
  "especialidad": "Redes",
  "disponible": true
}
```

### 04 Categorías CRUD y RBAC

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 44 | Ana lista categorías | `GET` | `/api/categorias` | 200 |
| 45 | Sofía crea categoría | `POST` | `/api/categorias` | 201 |
| 46 | Sofía consulta categoría | `GET` | `/api/categorias/{{categoriaId}}` | 200 |
| 47 | Pedro actualiza categoría | `PUT` | `/api/categorias/{{categoriaId}}` | 200 |
| 48 | Sofía desactiva categoría | `PATCH` | `/api/categorias/{{categoriaId}}/desactivar` | 200 |
| 49 | Sofía activa categoría | `PATCH` | `/api/categorias/{{categoriaId}}/activar` | 200 |
| 50 | Ana no crea categoría | `POST` | `/api/categorias` | 403 |
| 51 | Técnico no modifica categoría | `PUT` | `/api/categorias/{{categoriaId}}` | 403 |
| 52 | Acción inválida | `PATCH` | `/api/categorias/{{categoriaId}}/borrar` | 400 |

**45 — 45 · Sofía crea categoría** · Cuerpo `raw / JSON`:

```json
{
  "nombre": "LAB26 Redes {{runId}}",
  "descripcion": "Categoría temporal para pruebas"
}
```

**47 — 47 · Pedro actualiza categoría** · Cuerpo `raw / JSON`:

```json
{
  "nombre": "LAB26 Redes Actualizada {{runId}}",
  "descripcion": "Validación CRUD"
}
```

**50 — 50 · Ana no crea categoría** · Cuerpo `raw / JSON`:

```json
{
  "nombre": "No autorizada",
  "descripcion": "Prueba RBAC"
}
```

**51 — 51 · Técnico no modifica categoría** · Cuerpo `raw / JSON`:

```json
{
  "nombre": "No autorizado",
  "descripcion": "Prueba RBAC"
}
```

### 05 Tickets flujo y RBAC

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 53 | Ana crea ticket propio | `POST` | `/api/tickets` | 201 |
| 54 | Ana lista tickets visibles | `GET` | `/api/tickets` | 200 |
| 55 | Ana consulta ticket propio | `GET` | `/api/tickets/{{ticketId}}` | 200 |
| 56 | Ana no asigna técnico | `PATCH` | `/api/tickets/{{ticketId}}/asignar` | 403 |
| 57 | Sofía asigna técnico | `PATCH` | `/api/tickets/{{ticketId}}/asignar` | 200 |
| 58 | Ana no cambia estado | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 403 |
| 59 | Sofía cambia a en_proceso | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 60 | Sofía resuelve | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 61 | Sofía cierra | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 62 | Sofía reabre | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 63 | Estado inválido | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 400 |
| 64 | Sin JWT no lista tickets | `GET` | `/api/tickets` | 401 |
| 65 | Filtro por estado | `GET` | `/api/tickets?estado=reabierto` | 200 |
| 66 | Técnico no crea ticket | `POST` | `/api/tickets` | 403 |

**53 — 53 · Ana crea ticket propio** · Cuerpo `raw / JSON`:

```json
{
  "titulo": "LAB26 Falla de red {{runId}}",
  "descripcion": "Sin conexión a Internet en laboratorio",
  "prioridad": "media",
  "categoria_id": "{{categoriaId}}"
}
```

**56 — 56 · Ana no asigna técnico** · Cuerpo `raw / JSON`:

```json
{
  "tecnico_id": "{{tecnicoId}}"
}
```

**57 — 57 · Sofía asigna técnico** · Cuerpo `raw / JSON`:

```json
{
  "tecnico_id": "{{tecnicoId}}"
}
```

**58 — 58 · Ana no cambia estado** · Cuerpo `raw / JSON`:

```json
{
  "estado": "en_proceso"
}
```

**59 — 59 · Sofía cambia a en_proceso** · Cuerpo `raw / JSON`:

```json
{
  "estado": "en_proceso"
}
```

**60 — 60 · Sofía resuelve** · Cuerpo `raw / JSON`:

```json
{
  "estado": "resuelto",
  "solucion": "Se restableció conectividad"
}
```

**61 — 61 · Sofía cierra** · Cuerpo `raw / JSON`:

```json
{
  "estado": "cerrado"
}
```

**62 — 62 · Sofía reabre** · Cuerpo `raw / JSON`:

```json
{
  "estado": "reabierto"
}
```

**63 — 63 · Estado inválido** · Cuerpo `raw / JSON`:

```json
{
  "estado": "cancelado"
}
```

**66 — 66 · Técnico no crea ticket** · Cuerpo `raw / JSON`:

```json
{
  "titulo": "LAB26 Falla de red {{runId}}",
  "descripcion": "Sin conexión a Internet en laboratorio",
  "prioridad": "media",
  "categoria_id": "{{categoriaId}}"
}
```

### 06 Seguimientos y BOLA

| Nº | Prueba | Método | Ruta | Esperado |
|---|---|---|---|---|
| 67 | Ana agrega seguimiento propio | `POST` | `/api/tickets/{{ticketId}}/seguimientos` | 201 |
| 68 | Ana consulta seguimientos | `GET` | `/api/tickets/{{ticketId}}/seguimientos` | 200 |
| 69 | María crea ticket ajeno | `POST` | `/api/tickets` | 201 |
| 70 | Ana no consulta ticket de María | `GET` | `/api/tickets/{{ticketAjenoId}}` | 404 |
| 71 | Ana no lee seguimientos ajenos | `GET` | `/api/tickets/{{ticketAjenoId}}/seguimientos` | 404 |
| 72 | Ana no crea seguimiento ajeno | `POST` | `/api/tickets/{{ticketAjenoId}}/seguimientos` | 404 |
| 73 | María consulta ticket propio | `GET` | `/api/tickets/{{ticketAjenoId}}` | 200 |
| 74 | Técnico no asignado no ve ticket ajeno | `GET` | `/api/tickets/{{ticketAjenoId}}` | 404 |
| 75 | Sofía consulta ticket ajeno | `GET` | `/api/tickets/{{ticketAjenoId}}` | 200 |
| 76 | Ticket inexistente | `GET` | `/api/tickets/999999999` | 404 |

**67 — 67 · Ana agrega seguimiento propio** · Cuerpo `raw / JSON`:

```json
{
  "observacion": "Solicito actualización del caso"
}
```

**69 — 69 · María crea ticket ajeno** · Cuerpo `raw / JSON`:

```json
{
  "titulo": "LAB26 Ticket de María {{runId}}",
  "descripcion": "Prueba de propiedad de recurso",
  "prioridad": "baja",
  "categoria_id": "{{categoriaId}}"
}
```

**72 — 72 · Ana no crea seguimiento ajeno** · Cuerpo `raw / JSON`:

```json
{
  "observacion": "Intento de acceso indebido"
}
```

## 6. Consultas SQL para contrastar las respuestas

```sql
-- Usuarios y roles
SELECT u.id, u.nombre, u.apellido, u.email,
       r.nombre AS rol, u.activo, u.debe_cambiar_password
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;

-- Técnicos y usuarios asociados
SELECT t.id, t.usuario_id, u.nombre, t.especialidad, t.disponible
FROM public.tecnicos t
JOIN public.usuarios u ON u.id = t.usuario_id
ORDER BY t.id;

-- Categorías
SELECT id, nombre, descripcion, activa FROM public.categorias ORDER BY id;

-- Tickets y trazabilidad
SELECT id, titulo, prioridad, estado, usuario_id, tecnico_id,
       categoria_id, solucion, fecha_creacion, fecha_actualizacion, fecha_cierre
FROM public.tickets ORDER BY id DESC;

-- Seguimientos
SELECT id, ticket_id, autor_usuario_id, observacion, fecha_registro
FROM public.seguimientos ORDER BY id DESC;
```

## 7. Matriz de permisos RBAC esperada

| Gestión | superadmin | admin | tecnico | usuario |
|---|---|---|---|---|
| Listar usuarios | Todos | Solo técnicos/usuarios | No | No |
| Crear usuarios | Todos los roles válidos | Solo técnico/usuario | No | No |
| Actualizar/desactivar usuarios | Administrativa, con restricciones | Solo técnico/usuario | No | No |
| Consultar técnicos | Sí | Sí | Sí | No |
| Administrar técnicos | Sí | Sí | No | No |
| Consultar categorías | Sí | Sí | Sí | Sí |
| Administrar categorías | Sí | Sí | No | No |
| Crear tickets | Sí | Sí | No | Sí |
| Consultar tickets | Todos | Todos | Asignados | Propios |
| Asignar técnico | Sí | Sí | No | No |
| Cambiar estado | Sí | Sí | Asignados y transiciones limitadas | No |
| Seguimientos | Todos | Todos | Asignados | Propios |

**BOLA/IDOR:** para probar que Ana no puede ver el ticket de María, primero crear un ticket **real** como María. Debe devolver 404 cuando Ana lo consulta, pero 200 cuando María lo consulta. Un ID inexistente no prueba BOLA.

## 8. Checklist de cierre y evidencias

- [ ] Salud de Express y autenticación de Sofía verificadas (reportadas: P01 y P02).
- [ ] Login y perfil de Pedro, Ana, María y técnico, con roles correctos.
- [ ] Creación, lectura, actualización y baja lógica de usuarios; comprobación SQL.
- [ ] Restricción de Pedro para crear/editar roles administrativos.
- [ ] Contraseña temporal: login, bloqueo de rutas funcionales, cambio y desbloqueo.
- [ ] CRUD lógico de técnicos, disponibilidad y asignación.
- [ ] CRUD lógico de categorías, permisos y estado activo.
- [ ] Tickets: alta propia, lectura autorizada, asignación y transiciones válidas.
- [ ] Seguimientos con `autor_usuario_id` derivado del JWT, no del body.
- [ ] BOLA: Ana no accede a tickets/seguimientos de María; técnico no asignado tampoco.
- [ ] JWT ausente/inválido, entradas incorrectas y roles indebidos rechazados.
- [ ] Resultados persistidos y documentados en PostgreSQL.
- [ ] Revisar la prevención de autodesactivación y protección del último superadmin.
- [ ] Resolver fallos detectados antes de declarar LAB 26 completado.

**Documentar con capturas la evidencia por prueba**


