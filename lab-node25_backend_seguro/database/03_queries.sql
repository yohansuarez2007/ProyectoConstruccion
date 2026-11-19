-- Q01. Usuarios y sus roles
SELECT
  u.id,
  u.tipo_documento,
  u.numero_documento,
  u.nombre,
  u.apellido,
  u.email,
  r.nombre AS rol,
  u.activo
FROM public.usuarios u
JOIN public.roles r ON r.id = u.rol_id
ORDER BY u.id;

-- Q02. Tecnicos y datos personales
SELECT
  t.id AS tecnico_id,
  u.id AS usuario_id,
  u.nombre,
  u.apellido,
  u.numero_documento,
  t.especialidad,
  t.disponible
FROM public.tecnicos t
JOIN public.usuarios u ON u.id = t.usuario_id;

-- Q03. Tickets con sus relaciones
SELECT
  tk.id,
  tk.titulo,
  tk.estado,
  tk.prioridad,
  CONCAT(s.nombre, ' ', s.apellido) AS solicitante,
  CONCAT(at.nombre, ' ', at.apellido) AS tecnico,
  c.nombre AS categoria
FROM public.tickets tk
JOIN public.usuarios s ON s.id = tk.usuario_id
LEFT JOIN public.tecnicos t ON t.id = tk.tecnico_id
LEFT JOIN public.usuarios at ON at.id = t.usuario_id
JOIN public.categorias c ON c.id = tk.categoria_id
ORDER BY tk.id;

-- Q04. Tickets sin asignar
SELECT id, titulo, estado
FROM public.tickets
WHERE tecnico_id IS NULL;

-- Q05. Tickets asignados a Laura
SELECT tk.id, tk.titulo, tk.estado
FROM public.tickets tk
JOIN public.tecnicos t ON t.id = tk.tecnico_id
JOIN public.usuarios u ON u.id = t.usuario_id
WHERE u.email = 'laura@example.com';

-- Q06. Tickets de Ana
SELECT tk.id, tk.titulo, tk.estado
FROM public.tickets tk
JOIN public.usuarios u ON u.id = tk.usuario_id
WHERE u.email = 'ana@example.com';

-- Q07. Historial de seguimiento
SELECT
  s.id,
  tk.titulo,
  CONCAT(u.nombre, ' ', u.apellido) AS autor,
  s.observacion,
  s.fecha_registro
FROM public.seguimientos s
JOIN public.tickets tk ON tk.id = s.ticket_id
JOIN public.usuarios u ON u.id = s.autor_usuario_id
ORDER BY s.fecha_registro;

-- Q08. Conteo de tickets por estado
SELECT estado, COUNT(*) AS cantidad
FROM public.tickets
GROUP BY estado
ORDER BY estado;

-- Q09. Conteo por prioridad
SELECT prioridad, COUNT(*) AS cantidad
FROM public.tickets
GROUP BY prioridad
ORDER BY prioridad;

-- Q10. Tecnicos disponibles
SELECT
  t.id,
  u.nombre,
  u.apellido,
  t.especialidad
FROM public.tecnicos t
JOIN public.usuarios u ON u.id = t.usuario_id
WHERE t.disponible = TRUE;

-- Q11. Cantidad de usuarios por rol
SELECT
  r.nombre AS rol,
  COUNT(u.id) AS cantidad
FROM public.roles r
LEFT JOIN public.usuarios u ON u.rol_id = r.id
GROUP BY r.id, r.nombre
ORDER BY r.id;

-- Q12. Buscar usuario por documento
SELECT id, nombre, apellido, email
FROM public.usuarios
WHERE tipo_documento = 'CC'
  AND numero_documento = 'TEST-1005';
