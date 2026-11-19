# NEXDESK — Guía de instalación desde cero (Frontend + Backend + Base de datos)

**Sistema Integral de Gestión de Soporte Técnico**  
**Ruta técnica:** Node.js / Express (API REST) + PostgreSQL / Supabase Auth + React / Vite (SPA).  
**Objetivo:** Construir el frontend desde la terminal de VS Code usando únicamente los archivos entregados de insumo, conectar con el backend y verificar módulos, reportes y notificaciones.

> **Importante:** la carpeta `src/` entregada contiene el código del frontend, pero **no reemplaza** la instalación de dependencias ni la configuración de Vite. Los perfiles de prueba de SQL **no son cuentas de Supabase Auth**; las credenciales deben aprovisionarse por el flujo seguro del backend.

## 0. Insumos compartidos - docente

- **Backend completo** (`BE/`): `src/`, `database/`, `package.json`, `package-lock.json`, `.env.example`, `certs/` (solo lo que corresponde), colección Postman. **No distribuir `.env` con claves reales para ajustar bajo sus cuentas previamente configuradas**.
- **Frontend parcial**: `src/`, `.env`, `.gitignore`, `index.html`. Los archivos `.env` de frontend solo contienen configuración pública (`VITE_API_URL`).
- **Dos recursos adicionales a considerar**: `public/favicon.svg` y `public/icons.svg`, sino aparecen al momento de crear el proyecto FE. Se incluyen en la carpeta `frontend_public/` de este paquete.
- Esta guía `README.md`, el orden de SQL `database/README_ORDEN_SQL.md` y el esquema consolidado `database/01_schema.sql`.Leer el README de la carpeta database del BE.

### Estructura esperada

```text
NEXDESK/
├── BE/
│   ├── src/
│   ├── database/
│   │   ├── 01_schema.sql
│   │   ├── 02_seed.sql
│   │   ├── 03_queries.sql
│   │   ├── 04_tests.sql
│   │   ├── 05_verificacion_lab24.sql
│   │   ├── 06_lab25_seguridad.sql
│   │   ├── 07_notificaciones.sql
│   │   ├── 08_funcion_avisos.sql
│   │   ├── 09_avisos_seguimientos.sql
│   │   └── 10_verificacion_integral.sql
│   ├── .env.example
│   └── package.json
└── nexdesk-frontend/
    ├── src/                     <- entregada por el docente
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    ├── .env                     <- entregado (URL pública de la API)
    ├── .gitignore              <- entregado por el docente
    ├── index.html              <- entregado por el docente
    ├── eslint.config.js        <- generado por Vite
    ├── vite.config.js          <- generado por Vite
    ├── package.json            <- generado/actualizado con npm
    └── package-lock.json       <- generado con npm
```

## 1. Verificar requisitos en Windows / VS Code (solo validar)

Instalar **Node.js 22 LTS o compatible con Vite 8** (Node.js 20.19+ o 22.12+), VS Code y una terminal PowerShell. En VS Code, abrir **Terminal → New Terminal**:

```powershell
node -v
npm -v
```

Si PowerShell bloquea `npm.ps1`, usar `npm.cmd` en los comandos, o configurar la política de ejecución conforme a las reglas del equipo; no es necesario desactivar controles globales.

## 2. Crear el proyecto frontend con Vite

Desde la carpeta de trabajo del estudiante (no dentro de `BE`):

```powershell
npm create vite@latest nexdesk-frontend
```

Seleccionar las opciones interactivas:

1. **Framework:** React.
2. **Variant:** JavaScript (no TypeScript).
3. Si pregunta por instalar dependencias, responder **Yes**.
4. Si pregunta por iniciar el servidor inmediatamente, se puede responder **No** o de preferencia **SI**y seguir con esta guía.

Entrar al proyecto:

```powershell
cd nexdesk-frontend
npm install (Solo si seleccionó NO en el paso 4)
```

Si el asistente de Vite cambia sus opciones, elegir siempre React + JavaScript y mantener los archivos de configuración creados por la plantilla.

## 3. Instalar las dependencias que usa NEXDESK

El `src/` actual importa **React Router**, **Bootstrap**, **jsPDF** y **jsPDF AutoTable**. Instalar:

```powershell
npm install react-router-dom@^7.18.5 bootstrap@5.3 jspdf@^4.2.1 jspdf-autotable@^5.0.9
```

El proyecto docente de referencia utiliza React 19, Vite 8 y ESLint 10. Si la plantilla generada por Vite instaló otras versiones y aparece un error de compatibilidad, comparar `package.json` con `frontend_package_reference.json` y actualizar las dependencias necesarias. **No copiar `node_modules/` ni `dist/` desde el equipo docente.**

## 4. Reemplazar exactamente los archivos entregados

Con el servidor Vite detenido:

1. Abrir `nexdesk-frontend/` en VS Code.
2. **Reemplazar el contenido de `src/`** con la carpeta `src/` entregada. Evitar el error de crear `src/src/`.
3. Reemplazar `.gitignore` e `index.html` en la **raíz** del proyecto.
4. Crear/reemplazar `.env` en la **raíz** (no dentro de `src/`).
5. Copiar `favicon.svg` e `icons.svg` dentro de `public/` para conservar los iconos del proyecto. No copiar `dist/` ni `node_modules/`.
6. **Conservar** `vite.config.js`, `eslint.config.js`, `package.json` y `package-lock.json` generados por Vite, salvo que el docente indique una modificación explícita.

Contenido de `.env` del frontend:

```dotenv
VITE_API_URL=http://localhost:3000
```

> Toda variable `VITE_*` se expone al navegador. Nunca incluir `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, claves JWT ni contraseñas en este archivo.

### Comprobar archivos críticos

- `src/main.jsx`: importa Bootstrap y los estilos globales y monta `<App />`.
- `src/App.jsx`, `src/routes/AppRouter.jsx`: enrutamiento de la SPA.
- `src/context/AuthContext.jsx`, `src/hooks/useAuth.js`: sesión y autenticación.
- `src/config/api.js`: URL base de Express.
- `src/components/NavbarPrincipal.jsx`, `src/components/CampanaNotificaciones.jsx`: barra superior y notificaciones.
- `src/components/AnaliticaTickets.jsx`: indicadores y exportación CSV/PDF.

## 5. Preparar PostgreSQL / Supabase (responsable: docente o administrador)

**Escoger una sola ruta:**

**Base nueva (vacía):** ejecutar en Supabase SQL Editor, **en este orden**:

1. `database/01_schema.sql` (esquema integral actualizado).
2. `database/02_seed.sql` (datos de práctica, **una sola vez**, no en producción).
3. `database/10_verificacion_integral.sql` (consultas de comprobación).

El `01_schema.sql` integral incluye tablas `roles`, `usuarios`, `tecnicos`, `categorias`, `tickets`, `seguimientos` y `notificaciones`; constraints; índices; funciones/triggers; RLS; `debe_cambiar_password` y el índice único parcial para `auth_user_id`.

**Base existente:** **no ejecutar** `01_schema.sql` ni volver a insertar semillas. Revisar el estado con `10_verificacion_integral.sql` y aplicar únicamente migraciones pendientes `06` → `07` → `08` → `09` en ese orden. Ver `database/README_ORDEN_SQL.md`.

**Atención:** el script original `02_seed.sql` inserta perfiles ficticios, no contraseñas ni cuentas de `auth.users`. El docente debe aprovisionar usuarios de prueba mediante los endpoints administrativos y Supabase Auth. Los triggers de notificación utilizan `SECURITY INVOKER`: comprobar los permisos y la estrategia RLS del rol PostgreSQL que utiliza Express. **No desactivar RLS ni distribuir credenciales privilegiadas como solución.**

## 6. Preparar e iniciar el backend

En una **primera terminal** de VS Code:

```powershell
cd BE
npm install
```

Crear `.env` a partir de `.env.example` y completar **solo en el entorno seguro** los valores de conexión, URL/clave pública de Supabase y credenciales de administración requeridas por `src/config/env.js`. El docente debe proporcionar las instrucciones o variables por un canal seguro. No compartir ni subir el `.env` real al repositorio.

Si la conexión usa certificado CA, verificar la ruta configurada en `PGSSL_CA_PATH` y que el archivo exista. La API utiliza un `Pool` de PostgreSQL y validación TLS conforme a `src/config/db.js`.

Iniciar:

```powershell
npm run dev
```

Probar en navegador o Postman:

```text
http://localhost:3000/api/estado
```

El backend debe permanecer activo mientras se utiliza React. Si falla, revisar la consola del backend antes de depurar el frontend.

## 7. Iniciar el frontend

En una **segunda terminal** de VS Code, dentro de `nexdesk-frontend/`:

```powershell
npm run dev
```

Abrir la dirección que muestra Vite, normalmente:

```text
http://localhost:5173
```

La aplicación debe mostrar la pantalla de acceso. Si Vite usa otro puerto, revisar la configuración CORS de Express para permitir el origen real del frontend.

## 8. Iniciar sesión y comprobar permisos

1. El administrador debe crear/vincular cuentas reales de Supabase Auth con `public.usuarios.auth_user_id`.
2. Iniciar sesión con un usuario autorizado.
3. Si el perfil exige cambio de contraseña (`debe_cambiar_password`), completar el flujo antes de acceder a módulos protegidos.
4. Cerrar sesión y verificar que no se pueda abrir una ruta protegida sin token.
5. Probar cuentas con roles `superadmin`, `admin`, `tecnico`, `usuario` y comprobar que cada una vea solo sus recursos permitidos.

El frontend almacena el token de sesión en `sessionStorage`; no se debe pegar ni compartir el token en capturas, documentos o repositorios.

## 9. Pruebas funcionales por módulo

| Módulo | Prueba sugerida | Resultado esperado |
|---|---|---|
| Estado del backend | Abrir aplicación y consultar estado | API responde correctamente |
| Login | Ingresar con credenciales de prueba válidas | Acceso al Dashboard |
| Usuarios | Crear, consultar, editar, activar/desactivar según rol | Respuesta y permisos correctos |
| Técnicos | Crear/editar perfil técnico y consultar disponibilidad | Perfil asociado a usuario con rol técnico |
| Categorías | Listar y gestionar categorías | Cambios persistidos |
| Tickets | Crear ticket y filtrar por estado/prioridad | Ticket visible según RBAC/BOLA |
| Asignación | Asignar técnico a ticket | Asignación persistida |
| Estado | Cambiar a asignado/en_proceso/resuelto/cerrado | Historial y fechas coherentes |
| Seguimientos | Agregar observación permitida | Observación visible en historial |
| Analítica | Revisar KPIs y distribución | Conteos según tickets visibles |
| CSV | Exportar reporte | Archivo legible en Excel |
| PDF | Exportar reporte | Documento con tabla e indicadores |
| Campana | Crear, asignar, cambiar estado o agregar seguimiento | Notificaciones al destinatario correcto |
| Lectura | Abrir notificación | Cambia `leida` a `true` y baja contador |

**Notificaciones:** React consulta la API periódicamente (cada 30 segundos); no se usan WebSockets ni Supabase Realtime. La tabla `notificaciones` persiste avisos incluso tras recargar la página. La consulta y lectura deben filtrar por el `usuario_id` del JWT, no por un ID enviado libremente desde el navegador.

## 10. Consultas SQL para comprobar notificaciones

Ejecutar **solo desde el SQL Editor administrativo**:

```sql
SELECT n.id, n.usuario_id, u.nombre, u.apellido,
       n.ticket_id, n.tipo, n.titulo, n.leida,
       n.fecha_creacion, n.fecha_lectura
FROM public.notificaciones n
JOIN public.usuarios u ON u.id = n.usuario_id
ORDER BY n.fecha_creacion DESC, n.id DESC
LIMIT 30;
```

Comprobar triggers:

```sql
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trg_nexdesk_%'
ORDER BY trigger_name, event_manipulation;
```

El trigger de `tickets` genera avisos para administradores por creación, técnicos por asignación y solicitantes por cambio de estado. El de `seguimientos` avisa a solicitante y técnico, excluyendo al autor del seguimiento. **Limitación conocida:** en cambios de estado, el trigger actual no identifica al actor que ejecutó la transición; puede enviar un aviso al propio solicitante si este realizó el cambio.

## 11. Problemas frecuentes y solución

| Síntoma | Qué revisar |
|---|---|
| `npm` no reconocido | Instalación de Node.js y reinicio de terminal |
| Error de importación `react-router-dom`, `jspdf`, `bootstrap` | Ejecutar `npm install` del paso 3 |
| Página en blanco | Consola del navegador, `src/main.jsx`, `src/App.jsx`, archivos copiados a `src/` correcto |
| Error de CORS | Puerto de Vite y orígenes permitidos en Express |
| `401` | Token ausente, expirado o inválido |
| `403` | Rol sin permiso o cambio obligatorio de contraseña |
| Campana sin avisos | JWT, API `/api/notificaciones`, permisos RLS, triggers, usuario destinatario |
| SQL `42501` | Privilegios efectivos y RLS del rol usado por Express |
| PDF/CSV sin datos | Tickets visibles para ese rol, respuesta API y campos de fechas |
| Iconos faltantes | Copiar `public/favicon.svg` y `public/icons.svg` |
| Puerto ocupado | Revisar procesos en 3000/5173; no cambiar ambos puertos sin actualizar CORS y `.env` |

## 12. Verificaciones de calidad

```powershell
npm run lint
npm run build
npm run preview
```

`npm run build` crea `dist/`; esta carpeta es un artefacto de despliegue y no reemplaza `src/`. Si aparecen errores de ESLint, corregirlos antes de entregar el trabajo; no desactivar reglas indiscriminadamente.

## 13. Evidencias

- Captura de `node -v` y `npm -v`.
- Captura del asistente de creación Vite (React + JavaScript).
- Captura de `npm install` y de la estructura de archivos final.
- Captura del backend activo y del frontend funcionando.
- Pruebas con los cuatro roles y evidencia de RBAC/BOLA.
- Pruebas de creación/asignación/estado/seguimientos de tickets.
- Exportación CSV y PDF.
- Capturas de la campana con avisos leídos y no leídos.
- Resultado de `npm run lint` y `npm run build`.
- No incluir `.env` privado, tokens, contraseñas, `node_modules/` ni `dist/` en la entrega de código fuente.



- Los archivos `06`–`09` son **migraciones históricas**. El `01_schema.sql` entregado aquí es un **esquema integral para instalaciones nuevas**, ensamblado a partir de los SQL reales adjuntos; **no ha sido ejecutado contra tu proyecto Supabase**. Probar primero en una base desechable.
- La semilla `02_seed.sql` proviene del backend adjunto y no necesariamente coincide con los nombres y tickets actuales de las capturas. No usarla para reconstruir datos reales de una base existente.
- El archivo `frontend_package_reference.json` es solo una referencia de las dependencias del proyecto docente; el estudiante genera su propio `package.json` y `package-lock.json` con npm.
- Los archivos `.env` del backend y las claves de Supabase deben entregarse por medios seguros, nunca como parte del ZIP de estudiantes.
- La carpeta `database/` contiene tanto scripts para creación desde cero como migraciones históricas. Leer `database/README_ORDEN_SQL.md` antes de ejecutar cualquier archivo.
