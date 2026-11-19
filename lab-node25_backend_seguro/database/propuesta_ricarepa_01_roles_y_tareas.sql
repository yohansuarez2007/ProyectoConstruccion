-- PROPUESTA RICAREPA ALIMAR - ROLES Y TAREAS DE PRODUCCION
-- Revisar y aprobar antes de ejecutar en Supabase.
-- No elimina tablas, usuarios, credenciales ni registros existentes.
-- No inserta productos, areas ni tareas de ejemplo.

BEGIN;

-- Validar que el esquema y los perfiles que se mapearan son los esperados.
DO $$
BEGIN
  IF to_regclass('public.roles') IS NULL
     OR to_regclass('public.usuarios') IS NULL THEN
    RAISE EXCEPTION 'No se encontraron las tablas roles y usuarios esperadas';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.roles'::regclass
      AND conname = 'chk_rol_nombre'
  ) THEN
    RAISE EXCEPTION 'No se encontro chk_rol_nombre; revisar el esquema antes de migrar';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 1 AND nombre = 'Sofia' AND apellido = 'Mendez'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 2 AND nombre = 'Pedro' AND apellido = 'Ruiz'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 3 AND nombre = 'Laura' AND apellido = 'Gomez'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 4 AND nombre = 'Carlos' AND apellido = 'Diaz'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 5 AND nombre = 'Ana' AND apellido = 'Torres'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 6 AND nombre = 'Maria' AND apellido = 'Lopez'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = 7 AND nombre = 'Kevin' AND apellido = 'Arevalo'
  ) THEN
    RAISE EXCEPTION 'Los perfiles ya no coinciden con el mapeo aprobado; no se aplicaron cambios';
  END IF;
END
$$;

-- Permitir nombres de roles configurables sin borrar los roles actuales.
ALTER TABLE public.roles
  DROP CONSTRAINT chk_rol_nombre;

ALTER TABLE public.roles
  ADD CONSTRAINT chk_rol_nombre
  CHECK (nombre = lower(trim(nombre))
         AND nombre ~ '^[a-z][a-z0-9_]{1,29}$');

-- Crear los roles productivos y conservar los roles anteriores.
INSERT INTO public.roles (nombre, descripcion)
VALUES
  ('asandero', 'Trabajador responsable del asado y coccion'),
  ('mesero', 'Trabajador de servicio y apoyo operativo'),
  ('armador', 'Trabajador que arma y prepara los productos'),
  ('supervisor_produccion', 'Supervision de las actividades de produccion'),
  ('encargado_inventario', 'Consulta y control de materias primas'),
  ('administrador_despacho', 'Organizacion y seguimiento de despachos')
ON CONFLICT (nombre) DO NOTHING;

-- Permisos de aplicacion separados de los nombres de rol.
CREATE TABLE public.permisos_aplicacion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clave VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(200) NOT NULL
);

CREATE TABLE public.roles_permisos (
  rol_id BIGINT NOT NULL
    REFERENCES public.roles(id) ON DELETE CASCADE,
  permiso_id BIGINT NOT NULL
    REFERENCES public.permisos_aplicacion(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

INSERT INTO public.permisos_aplicacion (clave, descripcion)
VALUES
  ('produccion.catalogo.leer', 'Consultar areas y productos de produccion'),
  ('produccion.catalogo.administrar', 'Administrar areas y productos'),
  ('produccion.tareas.leer_todas', 'Consultar todas las tareas de produccion'),
  ('produccion.tareas.leer_asignadas', 'Consultar tareas asignadas al trabajador'),
  ('produccion.tareas.asignar', 'Crear, asignar y administrar tareas'),
  ('produccion.tareas.actualizar_asignadas', 'Actualizar el estado de tareas propias'),
  ('produccion.avances.registrar', 'Registrar avances de tareas'),
  ('produccion.reportes.leer', 'Consultar indicadores e informes de produccion'),
  ('inventario.consultar', 'Consultar materias primas y existencias'),
  ('inventario.registrar_movimientos', 'Registrar entradas y salidas de inventario'),
  ('despacho.consultar', 'Consultar pedidos y despachos'),
  ('despacho.actualizar', 'Organizar y actualizar despachos'),
  ('sistema.roles.administrar', 'Administrar roles y permisos')
ON CONFLICT (clave) DO NOTHING;

-- Asignacion inicial de permisos. Los roles anteriores se conservan.
INSERT INTO public.roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permisos_aplicacion p
WHERE
  (r.nombre IN ('superadmin', 'admin'))
  OR (r.nombre = 'supervisor_produccion'
      AND p.clave IN (
        'produccion.catalogo.leer',
        'produccion.catalogo.administrar',
        'produccion.tareas.leer_todas',
        'produccion.tareas.asignar',
        'produccion.avances.registrar',
        'produccion.reportes.leer'
      ))
  OR (r.nombre IN ('asandero', 'mesero', 'armador')
      AND p.clave IN (
        'produccion.catalogo.leer',
        'produccion.tareas.leer_asignadas',
        'produccion.tareas.actualizar_asignadas',
        'produccion.avances.registrar'
      ))
  OR (r.nombre = 'encargado_inventario'
      AND p.clave IN (
        'inventario.consultar',
        'inventario.registrar_movimientos'
      ))
  OR (r.nombre = 'administrador_despacho'
      AND p.clave IN (
        'despacho.consultar',
        'despacho.actualizar'
      ))
ON CONFLICT DO NOTHING;

-- Los roles administrativos conservan permisos completos. El acceso
-- de superadmin queda asignado a Kevin (ID 7) en este mapeo.
INSERT INTO public.roles_permisos (rol_id, permiso_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permisos_aplicacion p
WHERE r.nombre = 'superadmin'
  AND p.clave = 'sistema.roles.administrar'
ON CONFLICT DO NOTHING;

-- Asignar puestos existentes sin modificar sus IDs ni identidades Auth.
UPDATE public.usuarios u
SET rol_id = r.id
FROM public.roles r
WHERE (u.id = 1 AND u.nombre = 'Sofia' AND u.apellido = 'Mendez'
       AND r.nombre = 'asandero')
   OR (u.id IN (2, 3, 4)
       AND r.nombre = 'mesero')
   OR (u.id IN (5, 6)
       AND r.nombre = 'armador')
   OR (u.id = 7 AND u.nombre = 'Kevin' AND u.apellido = 'Arevalo'
       AND r.nombre = 'superadmin');

-- Confirmar el mapeo exacto dentro de la transaccion.
DO $$
DECLARE
  filas_roles INTEGER;
BEGIN
  SELECT count(*) INTO filas_roles
  FROM public.usuarios u
  JOIN public.roles r ON r.id = u.rol_id
  WHERE (u.id = 1 AND r.nombre = 'asandero')
     OR (u.id IN (2, 3, 4) AND r.nombre = 'mesero')
     OR (u.id IN (5, 6) AND r.nombre = 'armador')
     OR (u.id = 7 AND r.nombre = 'superadmin');

  IF filas_roles <> 7 THEN
    RAISE EXCEPTION 'No se confirmaron las siete asignaciones de rol esperadas';
  END IF;
END
$$;

-- Catalogos administrables y extensibles. Se dejan vacios para que
-- la empresa registre sus areas y productos reales.
CREATE TABLE public.areas_produccion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(250),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_area_produccion_nombre
    CHECK (length(trim(nombre)) > 0)
);

CREATE TABLE public.productos_produccion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion VARCHAR(300),
  unidad_medida VARCHAR(30) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_producto_produccion_nombre
    CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_producto_produccion_unidad
    CHECK (length(trim(unidad_medida)) > 0)
);

CREATE TABLE public.tareas_produccion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  trabajador_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  area_id BIGINT NOT NULL
    REFERENCES public.areas_produccion(id) ON DELETE RESTRICT,
  producto_id BIGINT
    REFERENCES public.productos_produccion(id) ON DELETE RESTRICT,
  asignado_por BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_limite DATE,
  prioridad VARCHAR(10) NOT NULL DEFAULT 'media',
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  observaciones TEXT,
  cantidad_planificada NUMERIC(12, 3),
  iniciada_en TIMESTAMPTZ,
  completada_en TIMESTAMPTZ,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_tarea_produccion_nombre
    CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_tarea_produccion_descripcion
    CHECK (length(trim(descripcion)) > 0),
  CONSTRAINT chk_tarea_produccion_prioridad
    CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  CONSTRAINT chk_tarea_produccion_estado
    CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
  CONSTRAINT chk_tarea_produccion_cantidad
    CHECK (cantidad_planificada IS NULL OR cantidad_planificada > 0)
);

CREATE TABLE public.avances_produccion (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tarea_id BIGINT NOT NULL
    REFERENCES public.tareas_produccion(id) ON DELETE RESTRICT,
  usuario_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  descripcion TEXT NOT NULL,
  cantidad_realizada NUMERIC(12, 3),
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_avance_produccion_descripcion
    CHECK (length(trim(descripcion)) > 0),
  CONSTRAINT chk_avance_produccion_cantidad
    CHECK (cantidad_realizada IS NULL OR cantidad_realizada > 0)
);

CREATE INDEX idx_tareas_produccion_trabajador_estado
  ON public.tareas_produccion (trabajador_id, estado, fecha_limite);
CREATE INDEX idx_tareas_produccion_area_estado
  ON public.tareas_produccion (area_id, estado);
CREATE INDEX idx_tareas_produccion_fecha_limite
  ON public.tareas_produccion (fecha_limite)
  WHERE estado IN ('pendiente', 'en_proceso');
CREATE INDEX idx_avances_produccion_tarea_fecha
  ON public.avances_produccion (tarea_id, fecha_registro DESC);

-- Helpers de RLS: las consultas usan el UUID de Supabase Auth validado
-- y el perfil activo asociado. No se confia en IDs enviados por el cliente.
CREATE FUNCTION public.ricarepa_perfil_actual_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id
  FROM public.usuarios u
  WHERE u.auth_user_id = auth.uid()
    AND u.activo = TRUE
  LIMIT 1
$$;

CREATE FUNCTION public.ricarepa_tiene_permiso(p_clave TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.roles r ON r.id = u.rol_id
    JOIN public.roles_permisos rp ON rp.rol_id = r.id
    JOIN public.permisos_aplicacion p ON p.id = rp.permiso_id
    WHERE u.auth_user_id = auth.uid()
      AND u.activo = TRUE
      AND r.activo = TRUE
      AND p.clave = p_clave
  )
$$;

CREATE FUNCTION public.ricarepa_usuario_es_trabajador(p_usuario_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.ricarepa_tiene_permiso('produccion.tareas.asignar') THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.roles r ON r.id = u.rol_id
    JOIN public.roles_permisos rp ON rp.rol_id = r.id
    JOIN public.permisos_aplicacion p ON p.id = rp.permiso_id
    WHERE u.id = p_usuario_id
      AND u.activo = TRUE
      AND r.activo = TRUE
      AND p.clave = 'produccion.tareas.leer_asignadas'
  );
END;
$$;

CREATE FUNCTION public.ricarepa_es_responsable_tarea(p_tarea_id BIGINT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tareas_produccion t
    WHERE t.id = p_tarea_id
      AND t.trabajador_id = public.ricarepa_perfil_actual_id()
  )
$$;

-- El trabajador solo puede cambiar el estado permitido de sus tareas.
-- Los detalles, la asignacion y las cantidades se registran por el flujo
-- administrativo o mediante avances, no editando la tarea directamente.
CREATE FUNCTION public.ricarepa_proteger_actualizacion_tarea()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.actualizada_en := NOW();

  IF public.ricarepa_tiene_permiso('produccion.tareas.asignar') THEN
    RETURN NEW;
  END IF;

  IF OLD.trabajador_id <> public.ricarepa_perfil_actual_id()
     OR NOT public.ricarepa_tiene_permiso(
       'produccion.tareas.actualizar_asignadas'
     ) THEN
    RAISE EXCEPTION 'No tiene permiso para actualizar esta tarea'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.nombre IS DISTINCT FROM OLD.nombre
     OR NEW.descripcion IS DISTINCT FROM OLD.descripcion
     OR NEW.trabajador_id IS DISTINCT FROM OLD.trabajador_id
     OR NEW.area_id IS DISTINCT FROM OLD.area_id
     OR NEW.producto_id IS DISTINCT FROM OLD.producto_id
     OR NEW.asignado_por IS DISTINCT FROM OLD.asignado_por
     OR NEW.fecha_asignacion IS DISTINCT FROM OLD.fecha_asignacion
     OR NEW.fecha_limite IS DISTINCT FROM OLD.fecha_limite
     OR NEW.prioridad IS DISTINCT FROM OLD.prioridad
     OR NEW.observaciones IS DISTINCT FROM OLD.observaciones
     OR NEW.cantidad_planificada IS DISTINCT FROM OLD.cantidad_planificada
     OR NEW.creada_en IS DISTINCT FROM OLD.creada_en THEN
    RAISE EXCEPTION 'El trabajador no puede modificar los datos de asignacion'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.estado IS DISTINCT FROM OLD.estado THEN
    IF OLD.estado = 'pendiente' AND NEW.estado = 'en_proceso' THEN
      NEW.iniciada_en := COALESCE(OLD.iniciada_en, NOW());
      NEW.completada_en := NULL;
    ELSIF OLD.estado = 'en_proceso' AND NEW.estado = 'completada' THEN
      NEW.iniciada_en := COALESCE(OLD.iniciada_en, NOW());
      NEW.completada_en := NOW();
    ELSE
      RAISE EXCEPTION 'Transicion de estado no permitida para el trabajador'
        USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NEW.iniciada_en IS DISTINCT FROM OLD.iniciada_en
       OR NEW.completada_en IS DISTINCT FROM OLD.completada_en THEN
      RAISE EXCEPTION 'Las fechas de inicio y finalizacion son automaticas'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ricarepa_proteger_actualizacion_tarea
BEFORE UPDATE ON public.tareas_produccion
FOR EACH ROW
EXECUTE FUNCTION public.ricarepa_proteger_actualizacion_tarea();

ALTER TABLE public.permisos_aplicacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avances_produccion ENABLE ROW LEVEL SECURITY;

-- Permisos necesarios para las llamadas autenticadas a Supabase REST.
GRANT SELECT, INSERT, UPDATE ON
  public.areas_produccion,
  public.productos_produccion,
  public.tareas_produccion,
  public.avances_produccion
TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.roles TO authenticated;
GRANT SELECT ON public.permisos_aplicacion TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.roles_permisos
TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE
  public.areas_produccion_id_seq,
  public.productos_produccion_id_seq,
  public.tareas_produccion_id_seq,
  public.avances_produccion_id_seq,
  public.permisos_aplicacion_id_seq
TO authenticated;

REVOKE ALL ON FUNCTION public.ricarepa_perfil_actual_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ricarepa_tiene_permiso(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ricarepa_usuario_es_trabajador(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ricarepa_es_responsable_tarea(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ricarepa_proteger_actualizacion_tarea() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ricarepa_perfil_actual_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ricarepa_tiene_permiso(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ricarepa_usuario_es_trabajador(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ricarepa_es_responsable_tarea(BIGINT) TO authenticated;

CREATE POLICY ricarepa_permisos_lectura_admin
ON public.permisos_aplicacion
FOR SELECT TO authenticated
USING (public.ricarepa_tiene_permiso('sistema.roles.administrar'));

CREATE POLICY ricarepa_roles_lectura_admin
ON public.roles
FOR SELECT TO authenticated
USING (public.ricarepa_tiene_permiso('sistema.roles.administrar'));

CREATE POLICY ricarepa_roles_gestion_admin
ON public.roles
FOR ALL TO authenticated
USING (public.ricarepa_tiene_permiso('sistema.roles.administrar'))
WITH CHECK (public.ricarepa_tiene_permiso('sistema.roles.administrar'));

CREATE POLICY ricarepa_roles_permisos_gestion_admin
ON public.roles_permisos
FOR ALL TO authenticated
USING (public.ricarepa_tiene_permiso('sistema.roles.administrar'))
WITH CHECK (public.ricarepa_tiene_permiso('sistema.roles.administrar'));

CREATE POLICY ricarepa_areas_lectura
ON public.areas_produccion
FOR SELECT TO authenticated
USING (public.ricarepa_tiene_permiso('produccion.catalogo.leer'));

CREATE POLICY ricarepa_areas_gestion
ON public.areas_produccion
FOR ALL TO authenticated
USING (public.ricarepa_tiene_permiso('produccion.catalogo.administrar'))
WITH CHECK (public.ricarepa_tiene_permiso('produccion.catalogo.administrar'));

CREATE POLICY ricarepa_productos_lectura
ON public.productos_produccion
FOR SELECT TO authenticated
USING (public.ricarepa_tiene_permiso('produccion.catalogo.leer'));

CREATE POLICY ricarepa_productos_gestion
ON public.productos_produccion
FOR ALL TO authenticated
USING (public.ricarepa_tiene_permiso('produccion.catalogo.administrar'))
WITH CHECK (public.ricarepa_tiene_permiso('produccion.catalogo.administrar'));

CREATE POLICY ricarepa_tareas_lectura
ON public.tareas_produccion
FOR SELECT TO authenticated
USING (
  public.ricarepa_tiene_permiso('produccion.tareas.leer_todas')
  OR (
    public.ricarepa_tiene_permiso('produccion.tareas.leer_asignadas')
    AND trabajador_id = public.ricarepa_perfil_actual_id()
  )
);

CREATE POLICY ricarepa_tareas_creacion
ON public.tareas_produccion
FOR INSERT TO authenticated
WITH CHECK (
  public.ricarepa_tiene_permiso('produccion.tareas.asignar')
  AND asignado_por = public.ricarepa_perfil_actual_id()
  AND public.ricarepa_usuario_es_trabajador(trabajador_id)
);

CREATE POLICY ricarepa_tareas_actualizacion
ON public.tareas_produccion
FOR UPDATE TO authenticated
USING (
  public.ricarepa_tiene_permiso('produccion.tareas.asignar')
  OR (
    public.ricarepa_tiene_permiso('produccion.tareas.actualizar_asignadas')
    AND trabajador_id = public.ricarepa_perfil_actual_id()
  )
)
WITH CHECK (
  public.ricarepa_tiene_permiso('produccion.tareas.asignar')
  OR (
    public.ricarepa_tiene_permiso('produccion.tareas.actualizar_asignadas')
    AND trabajador_id = public.ricarepa_perfil_actual_id()
  )
);

CREATE POLICY ricarepa_avances_lectura
ON public.avances_produccion
FOR SELECT TO authenticated
USING (
  public.ricarepa_tiene_permiso('produccion.tareas.leer_todas')
  OR public.ricarepa_es_responsable_tarea(tarea_id)
);

CREATE POLICY ricarepa_avances_registro
ON public.avances_produccion
FOR INSERT TO authenticated
WITH CHECK (
  public.ricarepa_tiene_permiso('produccion.avances.registrar')
  AND usuario_id = public.ricarepa_perfil_actual_id()
  AND (
    public.ricarepa_tiene_permiso('produccion.tareas.asignar')
    OR public.ricarepa_es_responsable_tarea(tarea_id)
  )
);

-- La migracion solo crea estructura, roles y permisos. La implementacion
-- de endpoints debe usar el JWT del usuario contra Supabase REST/RPC para
-- que estas politicas se apliquen; no debe usar el pool postgres para tareas.

COMMIT;

-- Verificacion posterior, solo lectura:
-- SELECT u.id, u.nombre, u.apellido, r.nombre AS rol
-- FROM public.usuarios u JOIN public.roles r ON r.id = u.rol_id
-- WHERE u.id BETWEEN 1 AND 7 ORDER BY u.id;
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'areas_produccion', 'productos_produccion',
--     'tareas_produccion', 'avances_produccion'
--   )
-- ORDER BY tablename;
