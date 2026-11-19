# NEXDESK — LAB NODE 25
## Guía actualizada de 40 pruebas esenciales en Postman

> **Entorno:** exclusivamente laboratorio. La colección se ejecuta manualmente y en orden; no se ha probado contra un backend en ejecución.

## 1. Preparación de la base de datos

Antes de iniciar Postman, seguir **`README_ORDEN_SQL.md`**:

- **Nueva:** `01_schema.sql` → `02_seed.sql` → `10_verificacion_integral.sql` → configurar Auth.
- **Antigua que se reconstruirá:** respaldo → `00_ADVERTENCIA_limpiar_esquema.sql` (destructivo y opcional) → `00_VERIFICAR_limpieza_esquema.sql` → `01` → `02` → `10` → configurar Auth.
- **Antigua que conservará datos:** respaldo → solo migraciones pendientes `06`–`09` → `10`.

No ejecutar las migraciones históricas `06`–`09` después del `01_schema.sql` integral. La limpieza de `public` no elimina cuentas de `auth.users`. Es más seguro crear un proyecto Supabase nuevo.

## 2. Preparación del backend y Supabase Auth

1. Abrir el backend en VS Code, ejecutar `npm install` y configurar `.env` privado.
2. Comprobar la conexión TLS a PostgreSQL y la configuración de Supabase Auth.
3. Verificar que Sofía (`superadmin`), Pedro (`admin`), Ana (`usuario`), María (`usuario`) y un técnico (`tecnico`) tengan cuentas en `auth.users`, perfil activo en `public.usuarios` y `auth_user_id` asociado.
4. Resolver `debe_cambiar_password=true` mediante el flujo de cambio de contraseña antes de las pruebas funcionales que lo requieran.
5. Iniciar con `npm run dev` y comprobar `GET http://localhost:3000/api/estado` → 200.

**El archivo `02_seed.sql` no crea contraseñas ni usuarios en Supabase Auth.**

## 3. Importar colección y entorno

1. Importar `NEXDESK_LAB25_40_PRUEBAS.postman_collection.json` y `NEXDESK_LAB25_40_PRUEBAS.postman_environment.json`.
2. Seleccionar el entorno **NEXDESK LAB25 - 40 pruebas - Local (actualizado)**.
3. Completar los correos y contraseñas en el entorno local; no exportarlo con secretos.
4. Verificar `baseUrl=http://localhost:3000`, `runId=A001` y correos de prueba nuevos (`emailNuevoUsuario`, `emailNuevoTecnico`, `emailIntentoSuperadmin`).
5. Antes de cada nueva ejecución, cambiar `runId` **en las variables de colección** y los correos de altas para evitar duplicados. La colección contiene un valor inicial `A001` que prevalece sobre el entorno.
6. Ejecutar solicitudes una a una; inspeccionar `Status`, `Response` y `Scripts → Post-response`.
7. Los scripts guardan tokens e identificadores como **variables de colección**. No compartir la colección exportada con tokens de sesión.

## 4. Matriz de ejecución real (40 solicitudes)

| Nº | Módulo | Solicitud | Método | Endpoint | HTTP esperado |
|---:|---|---|---|---|---:|
| 01 | 01 · Acceso y JWT | Servidor activo | `GET` | `/api/estado` | 200 |
| 02 | 01 · Acceso y JWT | Login sofia | `POST` | `/api/auth/login` | 200 |
| 03 | 01 · Acceso y JWT | Perfil sofia | `GET` | `/api/auth/me` | 200 |
| 04 | 01 · Acceso y JWT | Login pedro | `POST` | `/api/auth/login` | 200 |
| 05 | 01 · Acceso y JWT | Login ana | `POST` | `/api/auth/login` | 200 |
| 06 | 01 · Acceso y JWT | Login tecnico | `POST` | `/api/auth/login` | 200 |
| 07 | 01 · Acceso y JWT | Login maria | `POST` | `/api/auth/login` | 200 |
| 08 | 01 · Acceso y JWT | Sin token: perfil | `GET` | `/api/auth/me` | 401 |
| 09 | 02 · Usuarios y RBAC | Sofía lista todos | `GET` | `/api/usuarios` | 200 |
| 10 | 02 · Usuarios y RBAC | Ana no puede listar | `GET` | `/api/usuarios` | 403 |
| 11 | 02 · Usuarios y RBAC | Sofía crea usuario | `POST` | `/api/usuarios` | 201 |
| 12 | 02 · Usuarios y RBAC | Sofía consulta usuario | `GET` | `/api/usuarios/{{usuarioId}}` | 200 |
| 13 | 02 · Usuarios y RBAC | Sofía actualiza usuario | `PUT` | `/api/usuarios/{{usuarioId}}` | 200 |
| 14 | 02 · Usuarios y RBAC | Sofía desactiva usuario | `PATCH` | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 15 | 02 · Usuarios y RBAC | Sofía reactiva usuario | `PATCH` | `/api/usuarios/{{usuarioId}}/estado` | 200 |
| 16 | 02 · Usuarios y RBAC | Sofía crea técnico como usuario | `POST` | `/api/usuarios` | 201 |
| 17 | 02 · Usuarios y RBAC | Pedro no crea superadmin | `POST` | `/api/usuarios` | 403 |
| 18 | 02 · Usuarios y RBAC | Ana no crea usuario | `POST` | `/api/usuarios` | 403 |
| 19 | 03 · Técnicos | Sofía crea perfil técnico | `POST` | `/api/tecnicos` | 201 |
| 20 | 03 · Técnicos | Sofía lista técnicos | `GET` | `/api/tecnicos` | 200 |
| 21 | 03 · Técnicos | Sofía actualiza técnico | `PUT` | `/api/tecnicos/{{tecnicoId}}` | 200 |
| 22 | 03 · Técnicos | Sofía técnico no disponible | `PATCH` | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 23 | 03 · Técnicos | Sofía técnico disponible | `PATCH` | `/api/tecnicos/{{tecnicoId}}/disponibilidad` | 200 |
| 24 | 04 · Categorías | Sofía crea categoría | `POST` | `/api/categorias` | 201 |
| 25 | 04 · Categorías | Sofía consulta categoría | `GET` | `/api/categorias/{{categoriaId}}` | 200 |
| 26 | 04 · Categorías | Pedro actualiza categoría | `PUT` | `/api/categorias/{{categoriaId}}` | 200 |
| 27 | 04 · Categorías | Sofía desactiva categoría | `PATCH` | `/api/categorias/{{categoriaId}}/desactivar` | 200 |
| 28 | 04 · Categorías | Sofía activa categoría | `PATCH` | `/api/categorias/{{categoriaId}}/activar` | 200 |
| 29 | 04 · Categorías | Ana no crea categoría | `POST` | `/api/categorias` | 403 |
| 30 | 05 · Tickets y estados | Ana crea ticket propio | `POST` | `/api/tickets` | 201 |
| 31 | 05 · Tickets y estados | Ana consulta ticket propio | `GET` | `/api/tickets/{{ticketId}}` | 200 |
| 32 | 05 · Tickets y estados | Ana no asigna técnico | `PATCH` | `/api/tickets/{{ticketId}}/asignar` | 403 |
| 33 | 05 · Tickets y estados | Sofía asigna técnico | `PATCH` | `/api/tickets/{{ticketId}}/asignar` | 200 |
| 34 | 05 · Tickets y estados | Sofía cambia a en_proceso | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 35 | 05 · Tickets y estados | Ana agrega seguimiento antes del cierre | `POST` | `/api/tickets/{{ticketId}}/seguimientos` | 201 |
| 36 | 05 · Tickets y estados | Sofía resuelve | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 37 | 05 · Tickets y estados | Sofía cierra | `PATCH` | `/api/tickets/{{ticketId}}/estado` | 200 |
| 38 | 06 · Seguimientos y BOLA | María crea ticket ajeno | `POST` | `/api/tickets` | 201 |
| 39 | 06 · Seguimientos y BOLA | Ana no consulta ticket de María | `GET` | `/api/tickets/{{ticketAjenoId}}` | 404 |
| 40 | 06 · Seguimientos y BOLA | Ana no lee seguimientos ajenos | `GET` | `/api/tickets/{{ticketAjenoId}}/seguimientos` | 404 |

## 5. Secuencia crítica: seguimiento y cierre

La secuencia correcta es **crear ticket → consultar → intentar asignación sin permiso → asignar técnico → iniciar proceso → agregar seguimiento → resolver → cerrar**. El seguimiento debe registrarse mientras el ticket aún permite nuevas observaciones. **No** ejecutar `POST /api/tickets/{{ticketId}}/seguimientos` después del cierre esperando HTTP 201.

Los casos BOLA posteriores utilizan un ticket real de María (`ticketAjenoId`): Ana debe recibir 404 al intentar consultar ese ticket o sus seguimientos. Un ID inexistente no demuestra BOLA.

## 6. Variables y datos de prueba

| Variable | Uso |
|---|---|
| `baseUrl` | URL del backend |
| `runId` | Identificador único por corrida; cambiar en Collection Variables |
| `emailSofia`, `emailPedro`, `emailAna`, `emailTecnico`, `emailMaria` | Correos de cuentas vinculadas a Auth |
| `passwordSofia`, `passwordPedro`, `passwordAna`, `passwordTecnico`, `passwordMaria` | Contraseñas privadas locales |
| `emailNuevoUsuario`, `emailNuevoTecnico`, `emailIntentoSuperadmin` | Correos controlados para altas/intentos |
| `tokenSofia`, `tokenPedro`, `tokenAna`, `tokenTecnico`, `tokenMaria` | JWT guardados por los scripts de login |
| `usuarioId`, `tecnicoUsuarioId`, `tecnicoId`, `categoriaId`, `ticketId`, `ticketAjenoId` | IDs creados durante la secuencia |

**Nota:** si las contraseñas están pendientes de cambio obligatorio, el login puede funcionar, pero las rutas de negocio devolverán 403 hasta completar el cambio.

## 7. Verificación SQL

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SELECT u.id, u.nombre, r.nombre AS rol, u.activo, u.auth_user_id, u.debe_cambiar_password
FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id ORDER BY u.id;
SELECT id, usuario_id, tecnico_id, estado, fecha_creacion, fecha_actualizacion, fecha_cierre
FROM public.tickets ORDER BY id DESC;
SELECT id, ticket_id, autor_usuario_id, observacion FROM public.seguimientos ORDER BY id DESC;
SELECT tipo, COUNT(*) AS cantidad FROM public.notificaciones GROUP BY tipo ORDER BY tipo;
```

Las notificaciones por triggers pueden generarse automáticamente durante las pruebas. **No existe un caso dedicado a los endpoints de notificaciones entre estas 40 solicitudes**; su visualización y marcado como leídas deben validarse adicionalmente desde el frontend o con una colección específica.

## 8. Registro de evidencias y diagnóstico

Registrar para cada caso: número, rol, método, endpoint, HTTP esperado, HTTP real, PASS/FAIL y evidencia. Códigos usuales: `200` lectura/cambio, `201` creación, `400` validación, `401` JWT ausente/inválido, `403` permisos insuficientes, `404` recurso inexistente/no visible por BOLA, `409` conflicto. Un `403` o `404` esperado es un PASS.

**Problemas habituales:** `401` → repetir login; `403` → verificar rol y `debe_cambiar_password`; `404` → confirmar que existe el recurso ajeno; `409` → revisar duplicados o transición; IDs vacíos → comprobar scripts y precondiciones; altas repetidas → cambiar `runId` y correos.

No ejecutar sobre producción ni declarar las 40 pruebas aprobadas sin haberlas ejecutado.
