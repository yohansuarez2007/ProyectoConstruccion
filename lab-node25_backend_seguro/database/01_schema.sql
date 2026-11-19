-- NEXDESK | ESQUEMA INTEGRAL PARA INSTALACION NUEVA
-- NO ejecutar sobre una base existente: crea objetos sin IF NOT EXISTS.
-- Incluye esquema original, primer acceso y notificaciones.

BEGIN;

-- 1. ROLES
CREATE TABLE public.roles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(200),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_rol_nombre CHECK (
    nombre IN ('superadmin','admin','tecnico','usuario')
  )
);

-- 2. USUARIOS
CREATE TABLE public.usuarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_user_id UUID UNIQUE
    REFERENCES auth.users(id) ON DELETE RESTRICT,
  rol_id BIGINT NOT NULL
    REFERENCES public.roles(id) ON DELETE RESTRICT,
  tipo_documento VARCHAR(10) NOT NULL,
  numero_documento VARCHAR(30) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_documento UNIQUE (
    tipo_documento, numero_documento
  ),
  CONSTRAINT chk_tipo_documento CHECK (
    tipo_documento IN ('CC','TI','CE','PA','PPT','OTRO')
  ),
  CONSTRAINT chk_documento CHECK (
    numero_documento = UPPER(TRIM(numero_documento))
    AND numero_documento ~ '^[A-Z0-9-]{4,30}$'
  ),
  CONSTRAINT chk_nombre CHECK (LENGTH(TRIM(nombre)) > 0),
  CONSTRAINT chk_apellido CHECK (LENGTH(TRIM(apellido)) > 0),
  CONSTRAINT chk_email CHECK (
    email = LOWER(TRIM(email))
    AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

-- 3. TECNICOS
CREATE TABLE public.tecnicos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id BIGINT NOT NULL UNIQUE
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  especialidad VARCHAR(100) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_especialidad CHECK (
    LENGTH(TRIM(especialidad)) > 0
  )
);

-- 4. CATEGORIAS
CREATE TABLE public.categorias (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(250),
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT chk_categoria CHECK (
    LENGTH(TRIM(nombre)) > 0
  )
);

-- 5. TICKETS
CREATE TABLE public.tickets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  prioridad VARCHAR(10) NOT NULL DEFAULT 'media',
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto',

  usuario_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  tecnico_id BIGINT
    REFERENCES public.tecnicos(id) ON DELETE RESTRICT,
  categoria_id BIGINT NOT NULL
    REFERENCES public.categorias(id) ON DELETE RESTRICT,

  solucion TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,

  CONSTRAINT chk_prioridad CHECK (
    prioridad IN ('baja','media','alta')
  ),
  CONSTRAINT chk_estado CHECK (
    estado IN (
      'abierto','asignado','en_proceso',
      'resuelto','cerrado','reabierto'
    )
  ),
  CONSTRAINT chk_titulo CHECK (LENGTH(TRIM(titulo)) > 0),
  CONSTRAINT chk_descripcion CHECK (
    LENGTH(TRIM(descripcion)) > 0
  ),
  CONSTRAINT chk_solucion CHECK (
    estado NOT IN ('resuelto','cerrado')
    OR (solucion IS NOT NULL AND LENGTH(TRIM(solucion)) > 0)
  )
);

-- 6. SEGUIMIENTOS
CREATE TABLE public.seguimientos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ticket_id BIGINT NOT NULL
    REFERENCES public.tickets(id) ON DELETE RESTRICT,
  autor_usuario_id BIGINT NOT NULL
    REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  observacion TEXT NOT NULL,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_observacion CHECK (
    LENGTH(TRIM(observacion)) > 0
  )
);

-- INDICES
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol_id);
CREATE INDEX idx_tickets_usuario ON public.tickets(usuario_id);
CREATE INDEX idx_tickets_tecnico ON public.tickets(tecnico_id);
CREATE INDEX idx_tickets_categoria ON public.tickets(categoria_id);
CREATE INDEX idx_tickets_estado ON public.tickets(estado);
CREATE INDEX idx_seguimientos_ticket
  ON public.seguimientos(ticket_id);

-- TRIGGER: validar que el perfil técnico
-- corresponda a un usuario con rol técnico.
CREATE FUNCTION public.validar_perfil_tecnico()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  nombre_rol TEXT;
BEGIN
  SELECT r.nombre INTO nombre_rol
  FROM public.usuarios u
  JOIN public.roles r ON r.id = u.rol_id
  WHERE u.id = NEW.usuario_id
  FOR UPDATE OF u;

  IF nombre_rol IS DISTINCT FROM 'tecnico' THEN
    RAISE EXCEPTION 'El usuario debe tener rol tecnico';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_perfil_tecnico
BEFORE INSERT OR UPDATE OF usuario_id
ON public.tecnicos
FOR EACH ROW
EXECUTE FUNCTION public.validar_perfil_tecnico();

-- TRIGGER: proteger el cambio de rol
-- de un usuario que conserva perfil técnico.
CREATE FUNCTION public.proteger_rol_tecnico()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  nombre_nuevo TEXT;
BEGIN
  IF NEW.rol_id IS DISTINCT FROM OLD.rol_id THEN
    SELECT nombre INTO nombre_nuevo
    FROM public.roles WHERE id = NEW.rol_id;

    IF nombre_nuevo IS DISTINCT FROM 'tecnico'
       AND EXISTS (
         SELECT 1 FROM public.tecnicos
         WHERE usuario_id = OLD.id
       ) THEN
      RAISE EXCEPTION 'Elimine primero el perfil tecnico';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proteger_rol_tecnico
BEFORE UPDATE OF rol_id ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.proteger_rol_tecnico();

-- TRIGGER: impedir renombrar los roles base.
CREATE FUNCTION public.proteger_nombre_rol()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.nombre IS DISTINCT FROM OLD.nombre THEN
    RAISE EXCEPTION 'No se permite renombrar roles del sistema';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_proteger_nombre_rol
BEFORE UPDATE OF nombre ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.proteger_nombre_rol();

-- TRIGGER: actualizar la fecha del ticket.
CREATE FUNCTION public.actualizar_fecha_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_actualizar_fecha_ticket
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.actualizar_fecha_ticket();

-- SEGURIDAD INICIAL
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;

-- No permitir acceso directo mediante los roles
-- públicos de la API durante estos laboratorios.
REVOKE ALL ON TABLE
  public.roles, public.usuarios, public.tecnicos,
  public.categorias, public.tickets, public.seguimientos
FROM anon, authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public
FROM anon, authenticated;

-- CONTROL DE PRIMER ACCESO (integrado desde 06_lab25_seguridad.sql)
-- 1. Control de cambio obligatorio de contraseña.
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS debe_cambiar_password
BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Cada identidad de Supabase Auth debe
-- corresponder como máximo a un perfil NEXDESK.
CREATE UNIQUE INDEX IF NOT EXISTS
ux_usuarios_auth_user_id
ON public.usuarios(auth_user_id)
WHERE auth_user_id IS NOT NULL;

-- NOTIFICACIONES (integrado desde 07, 08 y 09)
-- ==================================================
-- NEXDESK - MODULO DE NOTIFICACIONES
-- ==================================================

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

    usuario_id INTEGER NOT NULL
        REFERENCES public.usuarios(id) ON DELETE CASCADE,

    ticket_id INTEGER
        REFERENCES public.tickets(id) ON DELETE CASCADE,

    tipo VARCHAR(40) NOT NULL,
    titulo VARCHAR(160) NOT NULL,
    mensaje TEXT NOT NULL,

    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_lectura TIMESTAMPTZ,

    CONSTRAINT ck_notificaciones_tipo
        CHECK (tipo IN (
            'nuevo_ticket',
            'asignacion',
            'cambio_estado',
            'seguimiento'
        ))
);

-- Indices para mejorar las consultas
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_pendientes
ON public.notificaciones (
    usuario_id,
    leida,
    fecha_creacion DESC
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_ticket
ON public.notificaciones (ticket_id);

-- Mantener proteccion RLS
ALTER TABLE public.notificaciones
ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.nexdesk_notificar_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_tecnico_usuario INTEGER;
BEGIN
    -- 1. Ticket nuevo: avisar a administradores
    IF TG_OP = 'INSERT' THEN

        INSERT INTO public.notificaciones
            (usuario_id, ticket_id, tipo, titulo, mensaje)

        SELECT
            u.id,
            NEW.id,
            'nuevo_ticket',
            'Nuevo ticket #' || NEW.id,
            'Se registró: ' || LEFT(NEW.titulo, 120)

        FROM public.usuarios u
        JOIN public.roles r ON r.id = u.rol_id

        WHERE u.activo = TRUE
          AND r.activo = TRUE
          AND r.nombre IN ('superadmin', 'admin')
          AND u.id <> NEW.usuario_id;

        RETURN NEW;
    END IF;

    -- 2. Asignación o reasignación de técnico
    IF NEW.tecnico_id IS DISTINCT FROM OLD.tecnico_id
       AND NEW.tecnico_id IS NOT NULL THEN

        SELECT usuario_id
        INTO v_tecnico_usuario
        FROM public.tecnicos
        WHERE id = NEW.tecnico_id;

        IF v_tecnico_usuario IS NOT NULL THEN

            INSERT INTO public.notificaciones
                (usuario_id, ticket_id, tipo, titulo, mensaje)

            VALUES (
                v_tecnico_usuario,
                NEW.id,
                'asignacion',
                'Ticket #' || NEW.id || ' asignado',
                'Se te asignó el ticket: '
                    || LEFT(NEW.titulo, 120)
            );

        END IF;
    END IF;

    -- 3. Cambio de estado
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN

        INSERT INTO public.notificaciones
            (usuario_id, ticket_id, tipo, titulo, mensaje)

        VALUES (
            NEW.usuario_id,
            NEW.id,
            'cambio_estado',
            'Actualización del ticket #' || NEW.id,
            'El estado cambió de '
                || OLD.estado || ' a ' || NEW.estado
        );

    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nexdesk_notificar_ticket
ON public.tickets;

CREATE TRIGGER trg_nexdesk_notificar_ticket
AFTER INSERT OR UPDATE OF estado, tecnico_id
ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.nexdesk_notificar_ticket();

CREATE OR REPLACE FUNCTION public.nexdesk_notificar_seguimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_dueno INTEGER;
    v_tecnico INTEGER;
BEGIN
    SELECT t.usuario_id, te.usuario_id
    INTO v_dueno, v_tecnico

    FROM public.tickets t

    LEFT JOIN public.tecnicos te
        ON te.id = t.tecnico_id

    WHERE t.id = NEW.ticket_id;

    INSERT INTO public.notificaciones
        (usuario_id, ticket_id, tipo, titulo, mensaje)

    SELECT DISTINCT
        x.destino,
        NEW.ticket_id,
        'seguimiento',
        'Seguimiento en ticket #' || NEW.ticket_id,
        'Se registró una nueva observación en el ticket.'

    FROM (
        VALUES (v_dueno), (v_tecnico)
    ) AS x(destino)

    WHERE x.destino IS NOT NULL
      AND x.destino <> NEW.autor_usuario_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nexdesk_notificar_seguimiento
ON public.seguimientos;

CREATE TRIGGER trg_nexdesk_notificar_seguimiento
AFTER INSERT
ON public.seguimientos
FOR EACH ROW
EXECUTE FUNCTION public.nexdesk_notificar_seguimiento();

-- Los clientes anon/authenticated no consultan las tablas directamente.
REVOKE ALL ON TABLE public.notificaciones FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

COMMIT;
