BEGIN;

-- ROLES
INSERT INTO public.roles(nombre, descripcion)
VALUES
('superadmin', 'Administracion global'),
('admin', 'Administracion de soporte'),
('tecnico', 'Atencion de tickets'),
('usuario', 'Solicitante de soporte');

-- USUARIOS
INSERT INTO public.usuarios
(tipo_documento, numero_documento,
 nombre, apellido, email, rol_id)
SELECT
  v.tipo_documento,
  v.numero_documento,
  v.nombre,
  v.apellido,
  v.email,
  r.id
FROM (
  VALUES
  ('CC','TEST-1001','Sofia','Mendez',
   'sofia@example.com','superadmin'),
  ('CC','TEST-1002','Pedro','Ruiz',
   'pedro@example.com','admin'),
  ('CC','TEST-1003','Laura','Gomez',
   'laura@example.com','tecnico'),
  ('CC','TEST-1004','Carlos','Diaz',
   'carlos@example.com','tecnico'),
  ('CC','TEST-1005','Ana','Torres',
   'ana@example.com','usuario'),
  ('CC','TEST-1006','Maria','Lopez',
   'maria@example.com','usuario')
) AS v(
  tipo_documento,numero_documento,
  nombre,apellido,email,rol
)
JOIN public.roles r ON r.nombre = v.rol;

-- PERFILES TECNICOS
INSERT INTO public.tecnicos
(usuario_id, especialidad, disponible)
SELECT id, 'Redes', TRUE
FROM public.usuarios
WHERE email = 'laura@example.com';

INSERT INTO public.tecnicos
(usuario_id, especialidad, disponible)
SELECT id, 'Software', TRUE
FROM public.usuarios
WHERE email = 'carlos@example.com';

-- CATEGORIAS
INSERT INTO public.categorias(nombre, descripcion)
VALUES
('Software', 'Aplicaciones y sistemas'),
('Hardware', 'Equipos y dispositivos'),
('Redes', 'Conectividad'),
('Accesos', 'Ingreso y permisos');

-- TICKET ABIERTO SIN ASIGNAR
INSERT INTO public.tickets
(titulo, descripcion, prioridad, usuario_id, categoria_id)
SELECT
  'Equipo sin conexion',
  'El computador no tiene acceso a Internet',
  'alta',
  u.id,
  c.id
FROM public.usuarios u
CROSS JOIN public.categorias c
WHERE u.email = 'ana@example.com'
  AND c.nombre = 'Redes';

-- TICKET ASIGNADO A LAURA
INSERT INTO public.tickets
(titulo, descripcion, prioridad, estado,
 usuario_id, tecnico_id, categoria_id)
SELECT
  'No puedo ingresar al sistema',
  'La plataforma rechaza el acceso',
  'alta',
  'asignado',
  solicitante.id,
  t.id,
  c.id
FROM public.usuarios solicitante
CROSS JOIN public.tecnicos t
JOIN public.usuarios tecnico
  ON tecnico.id = t.usuario_id
CROSS JOIN public.categorias c
WHERE solicitante.email = 'maria@example.com'
  AND tecnico.email = 'laura@example.com'
  AND c.nombre = 'Accesos';

-- SEGUIMIENTO DEL TICKET ASIGNADO
INSERT INTO public.seguimientos
(ticket_id, autor_usuario_id, observacion)
SELECT
  tk.id,
  u.id,
  'Solicitud recibida para diagnostico'
FROM public.tickets tk
CROSS JOIN public.usuarios u
WHERE tk.titulo = 'No puedo ingresar al sistema'
  AND u.email = 'laura@example.com';

COMMIT;
