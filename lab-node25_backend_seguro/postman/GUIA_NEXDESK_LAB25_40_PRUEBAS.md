# NEXDESK — LAB NODE 25
## Guía de ejecución de 40 pruebas esenciales en Postman

> **Alcance:** Ejecutar solo sobre datos de laboratorio.

## 1. Preparación en VS Code

1. Abrir el proyecto backend NEXDESK en VS Code.
2. En la terminal integrada, ejecutar `npm install` (si aún no se han instalado dependencias).
3. Configurar `.env` con las variables reales del proyecto; no subir el archivo a GitHub.
4. Confirmar que Supabase PostgreSQL y Supabase Auth estén configurados y que Sofía, Pedro, Ana, María y un técnico estén vinculados a `public.usuarios`.
5. Iniciar el servidor con el script definido en `package.json`, por ejemplo `npm run dev` si existe.
6. Confirmar que `GET http://localhost:3000/api/estado` devuelve HTTP 200.

## 2. Importación en Postman

1. Abrir Postman → **Import**.
2. Importar `NEXDESK_LAB25_40_PRUEBAS.postman_collection.json`.
3. Importar `NEXDESK_LAB25_40_PRUEBAS.postman_environment.json`.
4. Seleccionar el entorno **NEXDESK LAB25 - 40 pruebas - Local** en la esquina superior derecha.
5. En **Environments**, completar los correos y contraseñas reales; **no compartir ni exportar** un entorno con secretos.
6. Cambiar `runId` a un identificador alfanumérico diferente para cada ejecución, por ejemplo `A002`, y usar correos de prueba nuevos.
7. Ejecutar las solicitudes **una a una y en orden**. Revisar `Response`, `Status`, `Test Results` y variables de colección.

## 3. Variables principales

| Variable | Uso |
|---|---|
| `baseUrl` | URL del backend (por defecto `http://localhost:3000`) |
| `emailSofia`, `passwordSofia` | Superadmin |
| `emailPedro`, `passwordPedro` | Admin |
| `emailAna`, `passwordAna` | Usuario propietario de tickets |
| `emailTecnico`, `passwordTecnico` | Técnico con acceso activo |
| `emailMaria`, `passwordMaria` | Segundo usuario para BOLA/IDOR |
| `emailNuevoUsuario`, `emailNuevoTecnico` | Correos nuevos controlados para altas de prueba |
| `emailIntentoSuperadmin` | Correo de prueba de creación denegada |
| `runId` | Sufijo para evitar duplicados en datos de prueba |
| `tokenSofia`, `tokenPedro`, `tokenAna`, `tokenTecnico`, `tokenMaria` | JWT almacenados por scripts de login en variables de colección |
| `usuarioId`, `tecnicoUsuarioId`, `tecnicoId`, `categoriaId`, `ticketId`, `ticketAjenoId` | Identificadores guardados automáticamente al crear recursos |

### Diferencia entre entorno y colección

Los correos y contraseñas se configuran en el **entorno**. Los scripts guardan tokens e identificadores en las **variables de colección**. No exportar la colección después de ejecutar pruebas sin limpiar los JWT.

## 4. Matriz de ejecución (orden obligatorio)

| # | Carpeta | Prueba | Método | Ruta | Esperado |
|---:|---|---|---|---|---|
| 01 | 01 · Acceso y JWT | Servidor activo | GET | `/api/estado` | 200 |
| 02 | 01 · Acceso y JWT | Login sofia | POST | `/api/auth/login` | 200 |
| 03 | 01 · Acceso y JWT | Perfil sofia | GET | `/api/auth/me` | 200 |
| 04 | 01 · Acceso y JWT | Login pedro | POST | `/api/auth/login` | 200 |
| 05 | 01 · Acceso y JWT | Login ana | POST | `/api/auth/login` | 200 |
| 06 | 01 · Acceso y JWT | Login tecnico | POST | `/api/auth/login` | 200 |
| 07 | 01 · Acceso y JWT | Login maria | POST | `/api/auth/login` | 200 |
| 08 | 01 · Acceso y JWT | Sin token: perfil | GET | `/api/auth/me` | 401 |
| 09 | 02 · Usuarios y RBAC | Sofía lista todos | GET | `/api/usuarios` | 200 |
| 10 | 02 · Usuarios y RBAC | Ana no puede listar | GET | `/api/usuarios` | 403 |
| 11 | 02 · Usuarios y RBAC | Sofía crea usuario | POST | `/api/usuarios` | 201 |
| 12 | 02 · Usuarios y RBAC | Sofía consulta usuario | GET | `/api/usuarios/{{usuarioId}}` | 200 |
| 13 | 02 · Usuarios y RBAC | Sofía actualiza usuario | PUT | `/api/usuarios/{{usuarioId}}` | 200 |
| 14 | 02 · Usuarios y RBAC | Sofía desactiva usuario | PATCH | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 15 | 02 · Usuarios y RBAC | Sofía reactiva usuario | PATCH | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 16 | 02 · Usuarios y RBAC | Sofía crea técnico como usuario | POST | `/api/usuarios` | 201 |
| 17 | 02 · Usuarios y RBAC | Pedro no crea superadmin | POST | `/api/usuarios` | 403 |
| 18 | 02 · Usuarios y RBAC | Ana no crea usuario | POST | `/api/usuarios` | 403 |
| 19 | 03 · Técnicos | Sofía crea perfil técnico | POST | `/api/tecnicos` | 201 |
| 20 | 03 · Técnicos | Sofía lista técnicos | GET | `/api/tecnicos` | 200 |
| 21 | 03 · Técnicos | Sofía actualiza técnico | PUT | `/api/tecnicos/{{tecnicoId}}` | 200 |
| 22 | 03 · Técnicos | Sofía técnico no disponible | PATCH | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 23 | 03 · Técnicos | Sofía técnico disponible | PATCH | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 24 | 04 · Categorías | Sofía crea categoría | POST | `/api/categorias` | 201 |
| 25 | 04 · Categorías | Sofía consulta categoría | GET | `/api/categorias/{{categoriaId}}` | 200 |
| 26 | 04 · Categorías | Pedro actualiza categoría | PUT | `/api/categorias/{{categoriaId}}` | 200 |
| 27 | 04 · Categorías | Sofía desactiva categoría | PATCH | `/api/categorias/{{categoriaId}}/desactivar` | 200 |
| 28 | 04 · Categorías | Sofía activa categoría | PATCH | `/api/categorias/{{categoriaId}}/activar` | 200 |
| 29 | 04 · Categorías | Ana no crea categoría | POST | `/api/categorias` | 403 |
| 30 | 05 · Tickets y estados | Ana crea ticket propio | POST | `/api/tickets` | 201 |
| 31 | 05 · Tickets y estados | Ana consulta ticket propio | GET | `/api/tickets/{{ticketId}}` | 200 |
| 32 | 05 · Tickets y estados | Ana no asigna técnico | PATCH | `/api/tickets/{{ticketId}}/asignar` | 403 |
| 33 | 05 · Tickets y estados | Sofía asigna técnico | PATCH | `/api/tickets/{{ticketId}}/asignar` | 200 |
| 34 | 05 · Tickets y estados | Sofía cambia a en_proceso | PATCH | `/api/tickets/{{ticketId}}/estado` | 200 |
| 35 | 05 · Tickets y estados | Sofía resuelve | PATCH | `/api/tickets/{{ticketId}}/estado` | 200 |
| 36 | 05 · Tickets y estados | Sofía cierra | PATCH | `/api/tickets/{{ticketId}}/estado` | 200 |
| 37 | 06 · Seguimientos y BOLA | Ana agrega seguimiento propio | POST | `/api/tickets/{{ticketId}}/seguimientos` | 201 |
| 38 | 06 · Seguimientos y BOLA | María crea ticket ajeno | POST | `/api/tickets` | 201 |
| 39 | 06 · Seguimientos y BOLA | Ana no consulta ticket de María | GET | `/api/tickets/{{ticketAjenoId}}` | 404 |
| 40 | 06 · Seguimientos y BOLA | Ana no lee seguimientos ajenos | GET | `/api/tickets/{{ticketAjenoId}}/seguimientos` | 404 |

## 5. Guía de ejecución por módulos

### Módulo 01 — Acceso y JWT (8 pruebas)

1. Verificar servidor.
2. Iniciar sesión con Sofía y confirmar `tokenSofia` en **Collection → Variables**.
3. Consultar `/api/auth/me` con Sofía. Revisar que el rol sea `superadmin`.
4. Autenticar a Pedro (`admin`), Ana (`usuario`), un técnico (`tecnico`) y María (`usuario`).
5. Solicitar `/api/auth/me` sin token; debe responder 401.

**Nota:** si un usuario tiene `debe_cambiar_password=true`, ejecutar previamente el flujo de cambio de contraseña del backend y volver a iniciar sesión. Esta operación no forma parte de las 40 solicitudes esenciales porque es condicional.

### Módulo 02 — Usuarios y RBAC (10 pruebas)

1. Sofía lista usuarios; Ana intenta listar y debe recibir 403.
2. Sofía crea un usuario nuevo; la respuesta debe guardar `usuarioId` y la credencial temporal debe tratarse como secreto.
3. Consultar y actualizar los datos personales del usuario creado.
4. Desactivar y reactivar el usuario mediante `PATCH /api/usuarios/{{usuarioId}}/estado`.
5. Crear un usuario con rol técnico y guardar `tecnicoUsuarioId`.
6. Pedro intenta crear un superadmin y debe recibir 403.
7. Ana intenta crear un usuario y debe recibir 403.

**Importante:** esta batería no ejecuta la autodesactivación de Sofía para evitar bloquear la única cuenta administrativa del laboratorio. Se debe verificar esa regla en un entorno aislado.

### Módulo 03 — Técnicos (5 pruebas)

1. Crear perfil técnico usando `tecnicoUsuarioId` del módulo anterior.
2. Listar técnicos y confirmar el nuevo perfil.
3. Actualizar especialidad.
4. Marcar como no disponible y después disponible.
5. Confirmar `tecnicoId` y `disponible=true` antes de asignar tickets.

### Módulo 04 — Categorías (6 pruebas)

1. Sofía crea categoría; guardar `categoriaId`.
2. Consultarla por ID.
3. Pedro la actualiza.
4. Sofía la desactiva y la reactiva.
5. Ana intenta crear una categoría y recibe 403.

### Módulo 05 — Tickets (7 pruebas)

1. Ana crea un ticket: el backend debe asignar `usuario_id` desde JWT, no desde el JSON del cliente.
2. Ana consulta su propio ticket.
3. Ana intenta asignar un técnico: 403.
4. Sofía asigna el técnico disponible.
5. Sofía cambia el estado a `en_proceso`, luego `resuelto` (con solución) y finalmente `cerrado`.

### Módulo 06 — Seguimientos y BOLA/IDOR (4 pruebas)

1. Ana crea seguimiento sobre su ticket y verifica la autoría desde JWT.
2. María crea otro ticket y se almacena `ticketAjenoId`.
3. Ana intenta leer el ticket de María: 404.
4. Ana intenta leer seguimientos de ese ticket: 404.

## 6. Validación de evidencias

Para cada solicitud registrar: identificador, método, endpoint, rol, código esperado, código real, resultado PASS/FAIL y evidencia de respuesta.

Comprobar además en Supabase SQL Editor:

```sql
SELECT u.id, u.nombre, u.apellido, r.nombre AS rol, u.activo
FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;

SELECT id, usuario_id, especialidad, disponible FROM public.tecnicos ORDER BY id;
SELECT id, nombre, activa FROM public.categorias ORDER BY id;
SELECT id, usuario_id, tecnico_id, estado, solucion FROM public.tickets ORDER BY id DESC;
SELECT id, ticket_id, autor_usuario_id, observacion FROM public.seguimientos ORDER BY id DESC;
```

## 7. Solución de problemas

- **401:** JWT ausente, inválido o expirado. Repetir login y verificar variables.
- **403:** verificar rol y política de autorización. Si se esperaba 403, es un PASS.
- **404:** verificar ID y acceso; para BOLA debe existir el ticket ajeno.
- **400:** revisar JSON, validadores y campos obligatorios.
- **409:** revisar duplicados, estado del ticket y disponibilidad del técnico.
- **Variables vacías:** revisar la pestaña `Scripts → Post-response` y las variables de colección.
- **Duplicados:** cambiar `runId`, correos de prueba y documentos antes de repetir altas.
- **Login exitoso pero acceso bloqueado:** comprobar `debe_cambiar_password`, usuario activo y vínculo `auth_user_id`.

## 8. Alcance de la reducción

Se redujeron las 76 solicitudes originales a 40 esenciales, sin alterar el contrato de endpoints del archivo proporcionado. Quedan fuera algunos casos de regresión (token inválido, usuario inexistente, cierre/reapertura, técnico no asignado, validaciones de formato, etc.), que conviene conservar en la colección original para auditorías más completas.

**No afirmar cierre del laboratorio hasta ejecutar las pruebas, revisar los resultados y corregir fallos.**
