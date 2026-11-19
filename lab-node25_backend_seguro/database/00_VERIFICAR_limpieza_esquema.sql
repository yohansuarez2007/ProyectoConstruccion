-- ============================================================
-- NEXDESK - VERIFICACION DE LIMPIEZA
-- Solo lectura
-- ============================================================

SELECT 'Tablas' AS objeto, COUNT(*) AS cantidad
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT 'Funciones', COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'

UNION ALL

SELECT 'Indices', COUNT(*)
FROM pg_indexes
WHERE schemaname = 'public'

UNION ALL

SELECT 'Triggers', COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public';