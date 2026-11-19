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
