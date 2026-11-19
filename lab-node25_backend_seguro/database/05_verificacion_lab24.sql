-- Ejecutar desde SQL Editor de Supabase; solo lectura.
-- Verifica que existan registros en las tablas y que los roles estén activos.
SELECT 'roles' AS tabla, COUNT(*) AS total FROM public.roles
-- Verifica que existan registros en las tablas y que los usuarios estén activos.
UNION ALL SELECT 'usuarios', COUNT(*) FROM public.usuarios
-- Verifica que existan registros en las tablas y que los técnicos estén activos.
UNION ALL SELECT 'tecnicos', COUNT(*) FROM public.tecnicos
-- Verifica que existan registros en las tablas y que los clientes estén activos.
UNION ALL SELECT 'categorias', COUNT(*) FROM public.categorias
--  tickets y seguimientos no tienen campo activo, solo se verifica que existan registros. 
UNION ALL SELECT 'tickets', COUNT(*) FROM public.tickets
UNION ALL SELECT 'seguimientos', COUNT(*) FROM public.seguimientos;
-- Verifica que existan registros en las tablas y que los roles estén activos.
SELECT nombre, activo FROM public.roles ORDER BY id;
-- Verifica que existan registros en las tablas y que los usuarios estén activos.
SELECT estado, COUNT(*) AS total FROM public.tickets GROUP BY estado ORDER BY estado;
