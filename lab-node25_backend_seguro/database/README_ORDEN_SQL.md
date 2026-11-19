# Orden de ejecución SQL — NEXDESK

**Sistema Integral de Gestión de Soporte Técnico**  
**Motor de base de datos:** PostgreSQL / Supabase  
**Carpeta:** `BE/database/`

## 1. Objetivo

Establecer el procedimiento de preparación, instalación, actualización y verificación de la base de datos de NEXDESK, garantizando que se trabaje con una estructura homogénea y que los cambios se apliquen en el orden correspondiente.

La base de datos incluye:

- Gestión de roles y usuarios.
- Perfiles de técnicos.
- Categorías de soporte.
- Registro y administración de tickets.
- Seguimientos de solicitudes.
- Notificaciones internas.
- Restricciones de integridad e índices.
- Funciones y triggers de PostgreSQL.
- Seguridad mediante RLS.
- Vinculación con Supabase Auth mediante `auth_user_id`.
- Control de cambio obligatorio de contraseña mediante `debe_cambiar_password`.

---

## 2. Escenario A — Base de datos NUEVA

**Aplicable cuando el estudiante crea un proyecto nuevo en Supabase y todavía no existen las tablas de NEXDESK.**

### Orden de ejecución

**Paso 1. Crear el proyecto en Supabase**

Crear un proyecto PostgreSQL en Supabase y acceder a:

`Supabase → SQL Editor → New query`

No es necesario ejecutar scripts de limpieza porque el proyecto es nuevo.

**Paso 2. Ejecutar `01_schema.sql`**

Ejecutar una sola vez el esquema integral de NEXDESK.

Este archivo contiene las siete tablas:

1. `roles`
2. `usuarios`
3. `tecnicos`
4. `categorias`
5. `tickets`
6. `seguimientos`
7. `notificaciones`

También crea relaciones, restricciones, índices, funciones, triggers, RLS y el campo `debe_cambiar_password`.

**Paso 3. Ejecutar `02_seed.sql`**

Ejecutar una sola vez y únicamente en el entorno académico de práctica.

Este archivo incorpora datos iniciales y perfiles de demostración. No crea cuentas, contraseñas ni identidades en `auth.users`.

**Paso 4. Ejecutar `10_verificacion_integral.sql`**

Ejecutar las consultas de verificación para comprobar que se crearon correctamente las tablas, columnas, índices, funciones, triggers y configuraciones de RLS.

**Paso 5. Configurar la autenticación**

Crear las cuentas de acceso mediante el mecanismo de administración de NEXDESK y Supabase Auth.

Comprobar:

- La existencia de la identidad en `auth.users`.
- La vinculación mediante `public.usuarios.auth_user_id`.
- La asignación del rol correspondiente.
- La activación del usuario.
- El cambio obligatorio de contraseña cuando corresponda.

**Importante:** **NO** ejecutar `06`, `07`, `08` ni `09` después del `01_schema.sql` integral. Estos archivos contienen cambios históricos que ya están incorporados en el esquema completo. *`03` al `05` son consultas de verificación.*

---

## 3. Escenario B — Reconstrucción de una base de datos ANTIGUA

**Aplicable cuando el estudiante ya tiene una base de datos de los primeros laboratorios y desea reemplazarla completamente por la versión integral de NEXDESK.**

Este procedimiento es destructivo y debe realizarse exclusivamente en un proyecto de laboratorio descartable, previa copia de seguridad.

### Orden de ejecución

**Paso 1. Realizar un respaldo**

Verificar que la base de datos no contenga información que deba conservarse.

Se recomienda crear un proyecto Supabase nuevo en lugar de eliminar el esquema `public` del proyecto existente.

**Paso 2. Ejecutar `00_ADVERTENCIA_limpiar_esquema.sql` (opcional y destructivo)**

Solo si se ha decidido reutilizar un proyecto de laboratorio y se han revisado las dependencias.

El script elimina y recrea el esquema `public` mediante `DROP SCHEMA public CASCADE`.

**Advertencia:** esta operación puede eliminar dependencias fuera del esquema `public` y no garantiza restaurar todos los permisos, privilegios predeterminados o configuraciones originales de Supabase. No debe utilizarse en producción ni en proyectos compartidos.

La limpieza de `public` tampoco elimina automáticamente las identidades existentes en `auth.users`.

**Paso 3. Ejecutar `00_VERIFICAR_limpieza_esquema.sql`**

Verificar que no queden tablas, funciones, índices ni triggers de NEXDESK dentro de `public`.

Para un esquema vacío se esperan los siguientes resultados:

| Objeto | Cantidad esperada |
|---|---:|
| Tablas | 0 |
| Funciones | 0 |
| Índices | 0 |
| Triggers | 0 |

Esta verificación no comprueba dependencias externas ni la restauración de todos los permisos de Supabase.

**Paso 4. Ejecutar `01_schema.sql`**

Crear la estructura integral de NEXDESK.

**Paso 5. Ejecutar `02_seed.sql`**

Insertar los datos iniciales de práctica.

**Paso 6. Ejecutar `10_verificacion_integral.sql`**

Comprobar que la estructura quedó correctamente instalada.

**Paso 7. Configurar y validar Supabase Auth**

Revisar las cuentas preexistentes en `auth.users` y crear o vincular los perfiles mediante el flujo administrativo de NEXDESK.

No eliminar indiscriminadamente las identidades de Supabase Auth.

**Paso 8. Ejecutar las pruebas funcionales**

Iniciar el backend y frontend y verificar:

- Autenticación y cambio obligatorio de contraseña.
- Permisos por rol (RBAC).
- Restricciones de acceso a recursos propios (BOLA/IDOR).
- Gestión de usuarios, técnicos y categorías.
- Creación, asignación y cambio de estado de tickets.
- Registro de seguimientos.
- Notificaciones de creación, asignación, estado y seguimiento.
- Generación de reportes CSV y PDF.

---

## 4. Escenario C — Actualización de una base de datos EXISTENTE

**Aplicable cuando se desea conservar los datos y actualizar progresivamente una base creada en laboratorios anteriores.**

### Orden de ejecución

1. Realizar un respaldo.
2. Consultar las tablas, columnas, índices, funciones y triggers existentes.
3. Revisar cuáles migraciones se han aplicado.
4. Ejecutar únicamente las migraciones pendientes, en el orden `06` → `07` → `08` → `09`.
5. Ejecutar `10_verificacion_integral.sql`.
6. Comprobar el funcionamiento de NEXDESK.

**No ejecutar `00_ADVERTENCIA_limpiar_esquema.sql` ni el nuevo `01_schema.sql` integral sobre una base existente cuyos datos se desean conservar.**

---

## 5. Inventario de archivos SQL

| Archivo | Descripción | Clasificación |
|---|---|---|
| `00_ADVERTENCIA_limpiar_esquema.sql` | Elimina y recrea `public` y sus dependencias | Destructivo, opcional |
| `00_VERIFICAR_limpieza_esquema.sql` | Verifica que el esquema esté vacío | Solo lectura |
| `01_schema.sql` | Estructura integral de NEXDESK | Instalación nueva |
| `02_seed.sql` | Datos iniciales de práctica | Semillas |
| `03_queries.sql` | Consultas didácticas | Auxiliar |
| `04_tests.sql` | Pruebas originales del laboratorio | Pruebas |
| `05_verificacion_lab24.sql` | Verificación del laboratorio 24 | Verificación |
| `06_lab25_seguridad.sql` | Campo `debe_cambiar_password` e índice único parcial del UUID | Migración histórica |
| `07_notificaciones.sql` | Tabla de notificaciones, índices y RLS | Migración histórica |
| `08_funcion_avisos.sql` | Función y trigger de eventos sobre tickets | Migración histórica |
| `09_avisos_seguimientos.sql` | Función y trigger de seguimientos | Migración histórica |
| `10_verificacion_integral.sql` | Comprobación general del esquema | Verificación |

Los archivos `03`, `04` y `05` son auxiliares y no forman parte obligatoria de la instalación integral. Revisar los efectos de las pruebas sobre los datos antes de ejecutarlas.

---

## 6. Advertencias técnicas y de seguridad

### 6.1. Seguridad RLS

Las siete tablas de NEXDESK deben tener RLS habilitada.

Las funciones de notificación utilizan `SECURITY INVOKER`, por lo que sus operaciones dependen de los privilegios efectivos del rol PostgreSQL que ejecuta las sentencias.

Con RLS habilitada y sin políticas, el comportamiento dependerá de ese rol, su condición de propietario y posibles privilegios `BYPASSRLS`.

**No desactivar RLS ni conceder `BYPASSRLS` indiscriminadamente.**

La autenticación JWT, RBAC y las comprobaciones BOLA/IDOR del backend siguen siendo necesarias.

### 6.2. Tipos de datos

Las migraciones históricas `07` a `09` pueden utilizar referencias `INTEGER`, mientras que determinadas claves del esquema original utilizan `BIGINT`.

PostgreSQL puede admitir relaciones entre tipos compatibles, pero en nuevas implementaciones se recomienda homologar los tipos de las claves primarias y foráneas.

### 6.3. Notificaciones automáticas

Las funciones y triggers registran notificaciones cuando se crean tickets, se asignan técnicos, se modifican estados o se registran seguimientos.

El trigger actual de cambio de estado puede notificar al propietario incluso cuando él mismo realizó la modificación, porque no conoce la identidad del actor que ejecutó la operación.

Para evitar estos autoavisos se requiere transmitir la identidad del actor desde Express al contexto de la transacción y adaptar la función SQL.

### 6.4. Autenticación Supabase Auth

Los scripts SQL de `database/` no crean automáticamente cuentas ni contraseñas en `auth.users`.

El UUID almacenado en `public.usuarios.auth_user_id` es un identificador de vinculación, no una contraseña ni un hash.

### 6.5. Reejecución de scripts

Las instrucciones `IF NOT EXISTS` evitan determinados errores de creación, pero no garantizan que los objetos existentes tengan la estructura correcta.

`CREATE OR REPLACE FUNCTION` puede sobrescribir una definición existente.

`DROP TRIGGER` seguido de `CREATE TRIGGER` recrea el trigger y requiere que todas las instrucciones se ejecuten correctamente.

Por tanto, no se recomienda ejecutar nuevamente migraciones ya aplicadas.

### 6.6. Protección de credenciales

No publicar en GitHub ni entregar a los estudiantes archivos `.env` que contengan contraseñas, tokens administrativos, claves privadas o cadenas de conexión reales.

Cada estudiante debe configurar las credenciales correspondientes a su propio proyecto Supabase.

---

## 7. Resumen del orden de ejecución

| Escenario | Secuencia |
|---|---|
| Proyecto Supabase nuevo | `01` → `02` → `10` → Configurar Auth |
| Reconstrucción de laboratorio antiguo | Respaldo → `00_ADVERTENCIA` → `00_VERIFICAR` → `01` → `02` → `10` → Configurar Auth |
| Actualización sin perder datos | Respaldo → Migraciones pendientes `06–09` → `10` |
| Base integral ya instalada | `10` y pruebas funcionales |

**Nota:** en la reconstrucción, los scripts `00` son opcionales y solo deben ejecutarse cuando se ha autorizado explícitamente la eliminación del esquema. Se recomienda crear un proyecto Supabase nuevo como alternativa más segura.

---

## 8. Criterios de finalización

La instalación se considerará completada cuando:

- Existan las siete tablas esperadas.
- Las relaciones y restricciones estén correctamente creadas.
- Los índices, funciones y triggers estén presentes.
- RLS esté habilitada en las siete tablas.
- Las cuentas de acceso estén correctamente vinculadas con Supabase Auth.
- El backend pueda consultar y modificar los datos según los permisos autorizados.
- El frontend pueda autenticarse y consumir la API REST.
- Las notificaciones se generen y se visualicen en la campanita.
- Los reportes CSV y PDF puedan generarse correctamente.
- Las pruebas funcionales y de autorización finalicen satisfactoriamente.

**Resultado esperado:** una instalación homogénea y verificable de NEXDESK, apta para finalizar el proyecto de construcción de software con Node.js, Express, React, PostgreSQL y Supabase.