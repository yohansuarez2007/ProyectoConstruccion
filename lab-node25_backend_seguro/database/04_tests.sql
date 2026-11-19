-- ============================================================
-- HELP DESK - PRUEBAS DE INTEGRIDAD P01 A P10
-- PostgreSQL / Supabase
--
-- EJECUCION:
-- 1. Seleccionar un bloque completo BEGIN ... ROLLBACK.
-- 2. Ejecutarlo en Supabase SQL Editor.
-- 3. Revisar la columna "resultado" en Results.
-- 4. Continuar con la siguiente prueba.
--
-- APROBADA: comportamiento esperado comprobado
-- FALLIDA: comportamiento incorrecto detectado
-- ERROR: problema de datos, esquema o ejecución
--
-- No se almacenan resultados.
-- NOTA: P03/P07/P08 contrastan el nombre real del CHECK
-- disparado contra pg_constraint y las columnas esperadas.
-- Si la restriccion no existe o no corresponde, se informa ERROR.
-- Ningun resultado se considera comprobado hasta ejecutar SQL.
-- P10 necesita al menos un ticket existente con fecha anterior.
-- ============================================================




-- ============================================================
-- P01. DOCUMENTO DUPLICADO - UNIQUE
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p01()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario RECORD;
  v_constraint TEXT;
BEGIN
  SELECT
    tipo_documento,
    numero_documento,
    rol_id
  INTO STRICT v_usuario
  FROM public.usuarios
  WHERE email = 'ana@example.com';

  BEGIN
    INSERT INTO public.usuarios
      (
        tipo_documento,
        numero_documento,
        nombre,
        apellido,
        email,
        rol_id
      )
    VALUES
      (
        v_usuario.tipo_documento,
        v_usuario.numero_documento,
        'Prueba',
        'Duplicado',
        'p01-test@example.com',
        v_usuario.rol_id
      );

    RETURN 'P01 FALLIDA: documento duplicado aceptado';

  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF v_constraint = 'uq_documento' THEN
        RETURN 'P01 APROBADA: documento duplicado rechazado';
      END IF;

      RETURN 'P01 ERROR: otra restriccion UNIQUE: '
             || v_constraint;

    WHEN OTHERS THEN
      RETURN 'P01 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P01 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p01() AS resultado;

ROLLBACK;


-- ============================================================
-- P02. CORREO DUPLICADO - UNIQUE
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p02()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_rol BIGINT;
  v_constraint TEXT;
BEGIN
  SELECT id
  INTO STRICT v_rol
  FROM public.roles
  WHERE nombre = 'usuario';

  BEGIN
    INSERT INTO public.usuarios
      (
        tipo_documento,
        numero_documento,
        nombre,
        apellido,
        email,
        rol_id
      )
    VALUES
      (
        'CC',
        'TEST-P02-9999',
        'Prueba',
        'Correo',
        'ana@example.com',
        v_rol
      );

    RETURN 'P02 FALLIDA: correo duplicado aceptado';

  EXCEPTION
    WHEN unique_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF v_constraint = 'usuarios_email_key' THEN
        RETURN 'P02 APROBADA: correo duplicado rechazado';
      END IF;

      RETURN 'P02 ERROR: UNIQUE inesperado: '
             || v_constraint;

    WHEN OTHERS THEN
      RETURN 'P02 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P02 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p02() AS resultado;

ROLLBACK;


-- ============================================================
-- P03. DOCUMENTO NO NORMALIZADO - CHECK
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p03()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_rol BIGINT;
  v_constraint TEXT;
BEGIN
  SELECT id
  INTO STRICT v_rol
  FROM public.roles
  WHERE nombre = 'usuario';

  BEGIN
    INSERT INTO public.usuarios
      (
        tipo_documento,
        numero_documento,
        nombre,
        apellido,
        email,
        rol_id
      )
    VALUES
      (
        'CC',
        'abc',
        'Prueba',
        'Documento',
        'p03-test@example.com',
        v_rol
      );

    RETURN 'P03 FALLIDA: documento invalido aceptado';

  EXCEPTION
    WHEN check_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conrelid = 'public.usuarios'::regclass
          AND c.contype = 'c'
          AND c.conname = v_constraint
            AND pg_get_constraintdef(c.oid) ILIKE '%numero_documento%'
      ) THEN
        RETURN 'P03 APROBADA: CHECK esperado (' || v_constraint || ')';
      END IF;

      RETURN 'P03 ERROR: CHECK distinto al esperado (' || v_constraint || ')';

    WHEN OTHERS THEN
      RETURN 'P03 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P03 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p03() AS resultado;

ROLLBACK;


-- ============================================================
-- P04. ROL INEXISTENTE - FOREIGN KEY
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p04()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_constraint TEXT;
BEGIN
  BEGIN
    INSERT INTO public.usuarios
      (
        tipo_documento,
        numero_documento,
        nombre,
        apellido,
        email,
        rol_id
      )
    VALUES
      (
        'CC',
        'TEST-P04-9999',
        'Prueba',
        'Rol',
        'p04-test@example.com',
        -999
      );

    RETURN 'P04 FALLIDA: rol inexistente aceptado';

  EXCEPTION
    WHEN foreign_key_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF v_constraint = 'usuarios_rol_id_fkey' THEN
        RETURN 'P04 APROBADA: rol inexistente rechazado';
      END IF;

      RETURN 'P04 ERROR: FK inesperada: '
             || v_constraint;

    WHEN OTHERS THEN
      RETURN 'P04 ERROR: ' || SQLERRM;
  END;
END;
$$;

SELECT pg_temp.prueba_p04() AS resultado;

ROLLBACK;


-- ============================================================
-- P05. PERFIL TECNICO CON USUARIO COMUN - TRIGGER
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p05()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario BIGINT;
BEGIN
  SELECT u.id
  INTO STRICT v_usuario
  FROM public.usuarios u
  INNER JOIN public.roles r
    ON r.id = u.rol_id
  WHERE u.email = 'ana@example.com'
    AND r.nombre = 'usuario';

  BEGIN
    INSERT INTO public.tecnicos
      (
        usuario_id,
        especialidad
      )
    VALUES
      (
        v_usuario,
        'Redes'
      );

    RETURN 'P05 FALLIDA: perfil tecnico invalido aceptado';

  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM = 'El usuario debe tener rol tecnico' THEN
        RETURN 'P05 APROBADA: perfil tecnico invalido rechazado';
      END IF;

      RETURN 'P05 ERROR: ' || SQLERRM;

    WHEN OTHERS THEN
      RETURN 'P05 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P05 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p05() AS resultado;

ROLLBACK;


-- ============================================================
-- P06. CAMBIO DE ROL DE TECNICO - TRIGGER
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p06()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario BIGINT;
  v_rol BIGINT;
  v_filas INTEGER;
BEGIN
  SELECT u.id
  INTO STRICT v_usuario
  FROM public.usuarios u
  INNER JOIN public.tecnicos t
    ON t.usuario_id = u.id
  WHERE u.email = 'laura@example.com';

  SELECT id
  INTO STRICT v_rol
  FROM public.roles
  WHERE nombre = 'usuario';

  BEGIN
    UPDATE public.usuarios
    SET rol_id = v_rol
    WHERE id = v_usuario;

    GET DIAGNOSTICS v_filas = ROW_COUNT;

    IF v_filas = 1 THEN
      RETURN 'P06 FALLIDA: cambio de rol aceptado';
    END IF;

    RETURN 'P06 ERROR: no se actualizo ningun usuario';

  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM = 'Elimine primero el perfil tecnico' THEN
        RETURN 'P06 APROBADA: cambio de rol rechazado';
      END IF;

      RETURN 'P06 ERROR: ' || SQLERRM;

    WHEN OTHERS THEN
      RETURN 'P06 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P06 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p06() AS resultado;

ROLLBACK;


-- ============================================================
-- P07. PRIORIDAD INVALIDA - CHECK
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p07()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario BIGINT;
  v_categoria BIGINT;
  v_constraint TEXT;
BEGIN
  SELECT id
  INTO STRICT v_usuario
  FROM public.usuarios
  WHERE email = 'ana@example.com';

  SELECT id
  INTO STRICT v_categoria
  FROM public.categorias
  WHERE nombre = 'Redes';

  BEGIN
    INSERT INTO public.tickets
      (
        titulo,
        descripcion,
        prioridad,
        usuario_id,
        categoria_id
      )
    VALUES
      (
        'Prueba prioridad',
        'Descripcion valida',
        'urgente',
        v_usuario,
        v_categoria
      );

    RETURN 'P07 FALLIDA: prioridad invalida aceptada';

  EXCEPTION
    WHEN check_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conrelid = 'public.tickets'::regclass
          AND c.contype = 'c'
          AND c.conname = v_constraint
            AND pg_get_constraintdef(c.oid) ILIKE '%prioridad%'
      ) THEN
        RETURN 'P07 APROBADA: CHECK esperado (' || v_constraint || ')';
      END IF;

      RETURN 'P07 ERROR: CHECK distinto al esperado (' || v_constraint || ')';

    WHEN OTHERS THEN
      RETURN 'P07 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P07 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p07() AS resultado;

ROLLBACK;


-- ============================================================
-- P08. TICKET CERRADO SIN SOLUCION - CHECK
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p08()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario BIGINT;
  v_categoria BIGINT;
  v_constraint TEXT;
BEGIN
  SELECT id
  INTO STRICT v_usuario
  FROM public.usuarios
  WHERE email = 'ana@example.com';

  SELECT id
  INTO STRICT v_categoria
  FROM public.categorias
  WHERE nombre = 'Redes';

  BEGIN
    INSERT INTO public.tickets
      (
        titulo,
        descripcion,
        estado,
        usuario_id,
        categoria_id
      )
    VALUES
      (
        'Prueba cierre',
        'Descripcion valida',
        'cerrado',
        v_usuario,
        v_categoria
      );

    RETURN 'P08 FALLIDA: cierre sin solucion aceptado';

  EXCEPTION
    WHEN check_violation THEN
      GET STACKED DIAGNOSTICS
        v_constraint = CONSTRAINT_NAME;

      IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conrelid = 'public.tickets'::regclass
          AND c.contype = 'c'
          AND c.conname = v_constraint
            AND pg_get_constraintdef(c.oid) ILIKE '%estado%'
            AND pg_get_constraintdef(c.oid) ILIKE '%solucion%'
      ) THEN
        RETURN 'P08 APROBADA: CHECK esperado (' || v_constraint || ')';
      END IF;

      RETURN 'P08 ERROR: CHECK distinto al esperado (' || v_constraint || ')';

    WHEN OTHERS THEN
      RETURN 'P08 ERROR: ' || SQLERRM;
  END;

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P08 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p08() AS resultado;

ROLLBACK;


-- ============================================================
-- P09. CREAR TICKET SIN TECNICO - OPERACION VALIDA
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p09()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_usuario BIGINT;
  v_categoria BIGINT;
  v_ticket BIGINT;
  v_tecnico BIGINT;
BEGIN
  SELECT id
  INTO STRICT v_usuario
  FROM public.usuarios
  WHERE email = 'ana@example.com';

  SELECT id
  INTO STRICT v_categoria
  FROM public.categorias
  WHERE nombre = 'Redes';

  INSERT INTO public.tickets
    (
      titulo,
      descripcion,
      usuario_id,
      categoria_id
    )
  VALUES
    (
      'Prueba ticket',
      'Solicitud sin asignar',
      v_usuario,
      v_categoria
    )
  RETURNING id, tecnico_id
  INTO v_ticket, v_tecnico;

  IF v_ticket IS NOT NULL
     AND v_tecnico IS NULL
  THEN
    RETURN
      'P09 APROBADA: ticket sin tecnico creado. ID: '
      || v_ticket;
  END IF;

  RETURN 'P09 FALLIDA: ticket o asignacion inesperada';

EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P09 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p09() AS resultado;

ROLLBACK;


-- ============================================================
-- P10. ACTUALIZACION AUTOMATICA DE FECHA - TRIGGER
-- ============================================================
-- Usa un ticket EXISTENTE con fecha anterior al inicio
-- de la transaccion. No manipula manualmente fechas.
-- La actualizacion se revierte mediante ROLLBACK.
-- Si no hay ticket elegible, devuelve ERROR (no FALLIDA).
-- ============================================================

BEGIN;

CREATE FUNCTION pg_temp.prueba_p10()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_ticket BIGINT;
  v_fecha_anterior TIMESTAMPTZ;
  v_fecha_nueva TIMESTAMPTZ;
  v_descripcion_anterior TEXT;
  v_descripcion_nueva TEXT;
  v_filas INTEGER;
BEGIN
  -- Evita comparar timestamps generados dentro de la
  -- misma transaccion: NOW() permanece constante en ella.
  SELECT id, fecha_actualizacion, descripcion
  INTO v_ticket, v_fecha_anterior, v_descripcion_anterior
  FROM public.tickets
  WHERE fecha_actualizacion IS NOT NULL
    AND fecha_actualizacion < transaction_timestamp() - INTERVAL '2 seconds'
  ORDER BY fecha_actualizacion ASC, id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_ticket IS NULL THEN
    RETURN 'P10 ERROR: no hay ticket con fecha anterior para probar el trigger';
  END IF;

  UPDATE public.tickets
  SET descripcion = COALESCE(v_descripcion_anterior, '') || ' [P10 temporal]'
  WHERE id = v_ticket;

  GET DIAGNOSTICS v_filas = ROW_COUNT;

  SELECT fecha_actualizacion, descripcion
  INTO v_fecha_nueva, v_descripcion_nueva
  FROM public.tickets
  WHERE id = v_ticket;

  IF v_filas <> 1 OR v_descripcion_nueva IS DISTINCT FROM
       (COALESCE(v_descripcion_anterior, '') || ' [P10 temporal]') THEN
    RETURN 'P10 FALLIDA: descripcion no se actualizo correctamente';
  END IF;

  IF v_fecha_nueva IS NULL OR v_fecha_nueva <= v_fecha_anterior THEN
    RETURN 'P10 FALLIDA: fecha_actualizacion no avanzo';
  END IF;

  RETURN 'P10 APROBADA: fecha_actualizacion avanzo automaticamente';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'P10 ERROR: ' || SQLERRM;
END;
$$;

SELECT pg_temp.prueba_p10() AS resultado;

ROLLBACK;
