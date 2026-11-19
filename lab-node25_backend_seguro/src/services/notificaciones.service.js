
import { pool } from "../config/db.js";

// Listar las últimas 40 notificaciones
export async function listarNotificaciones(usuarioId) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      ticket_id,
      tipo,
      titulo,
      mensaje,
      leida,
      fecha_creacion,
      fecha_lectura
    FROM public.notificaciones
    WHERE usuario_id = $1
    ORDER BY fecha_creacion DESC, id DESC
    LIMIT 40
    `,
    [usuarioId]
  );

  return rows;
}

// Contar notificaciones sin leer
export async function contarPendientes(usuarioId) {
  const { rows } = await pool.query(
    `
    SELECT COUNT(*)::integer AS pendientes
    FROM public.notificaciones
    WHERE usuario_id = $1
      AND leida = FALSE
    `,
    [usuarioId]
  );

  return rows[0].pendientes;
}

// Marcar una notificación propia como leída
export async function marcarLeida(usuarioId, id) {
  const { rows } = await pool.query(
    `
    UPDATE public.notificaciones
    SET
      leida = TRUE,
      fecha_lectura = COALESCE(fecha_lectura, NOW())
    WHERE id = $1
      AND usuario_id = $2
    RETURNING id, leida, fecha_lectura
    `,
    [id, usuarioId]
  );

  return rows[0] ?? null;
}
