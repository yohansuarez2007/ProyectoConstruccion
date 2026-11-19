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
