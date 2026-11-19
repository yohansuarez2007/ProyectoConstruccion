-- ==========================================
-- NEXDESK - LAB NODE 26
-- SEGURIDAD Y CONTROL DE PRIMER ACCESO
-- ==========================================

BEGIN;

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

COMMIT;

-- 3. Verificación.
SELECT
    u.id,
    u.nombre,
    u.apellido,
    u.email,
    u.auth_user_id,
    u.activo,
    u.debe_cambiar_password,
    r.nombre AS rol
FROM public.usuarios u
INNER JOIN public.roles r
    ON r.id = u.rol_id
ORDER BY u.id;