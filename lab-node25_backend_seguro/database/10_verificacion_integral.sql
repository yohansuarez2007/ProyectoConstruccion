-- NEXDESK: verificaciones de estructura (no modifica datos)
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='notificaciones' ORDER BY ordinal_position;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='usuarios' AND column_name IN ('auth_user_id','debe_cambiar_password');
SELECT trigger_name, event_object_table, event_manipulation FROM information_schema.triggers WHERE trigger_schema='public' ORDER BY event_object_table, trigger_name;
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SELECT tablename,indexname FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname;
SELECT n.tipo, COUNT(*)::integer AS cantidad FROM public.notificaciones n GROUP BY n.tipo ORDER BY n.tipo;
