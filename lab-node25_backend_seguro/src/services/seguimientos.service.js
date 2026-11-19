
import { pool } from "../config/db.js";

// ==========================================
// NEXDESK - LAB NODE 26.8.3
// SERVICE: SEGUIMIENTOS
// ==========================================

function errorHttp(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// ==========================================
// 1. LISTAR SEGUIMIENTOS
// GET /api/tickets/:id/seguimientos
// ==========================================

export async function listarSeguimientos(ticketId) {
  const { rows } = await pool.query(
    `
    SELECT
      s.id,
      s.ticket_id,
      s.autor_usuario_id,

      u.nombre AS autor_nombre,
      u.apellido AS autor_apellido,
      r.nombre AS autor_rol,

      s.observacion,
      s.fecha_registro

    FROM public.seguimientos AS s

    LEFT JOIN public.usuarios AS u
      ON u.id = s.autor_usuario_id

    LEFT JOIN public.roles AS r
      ON r.id = u.rol_id

    WHERE s.ticket_id = $1

    ORDER BY
      s.fecha_registro ASC,
      s.id ASC
    `,
    [ticketId]
  );

  return rows;
}

// ==========================================
// 2. CREAR SEGUIMIENTO
// POST /api/tickets/:id/seguimientos
// ==========================================

export async function crearSeguimiento(datos) {
  const {
    ticket_id,
    autor_usuario_id,
    observacion,
  } = datos;

  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    // Bloquear el ticket para comprobar
    // su estado de forma consistente.

    const { rows: tickets } = await cliente.query(
      `
      SELECT id, estado
      FROM public.tickets
      WHERE id = $1
      FOR UPDATE
      `,
      [ticket_id]
    );

    const ticket = tickets[0];

    if (!ticket) {
      throw errorHttp(
        "Ticket no encontrado.",
        404
      );
    }

    // No se permite registrar observaciones
    // operativas sobre tickets cerrados.

    if (ticket.estado === "cerrado") {
      throw errorHttp(
        "No se pueden registrar observaciones " +
        "en un ticket cerrado. Debe reabrirse " +
        "antes de continuar la atención.",
        409
      );
    }

    // El autor ya fue identificado y autorizado
    // mediante JWT y los middlewares de la ruta.

    const { rows } = await cliente.query(
      `
      WITH nuevo AS (
        INSERT INTO public.seguimientos (
          ticket_id,
          autor_usuario_id,
          observacion
        )
        VALUES ($1, $2, $3)

        RETURNING
          id,
          ticket_id,
          autor_usuario_id,
          observacion,
          fecha_registro
      )

      SELECT
        n.id,
        n.ticket_id,
        n.autor_usuario_id,

        u.nombre AS autor_nombre,
        u.apellido AS autor_apellido,
        r.nombre AS autor_rol,

        n.observacion,
        n.fecha_registro

      FROM nuevo AS n

      LEFT JOIN public.usuarios AS u
        ON u.id = n.autor_usuario_id

      LEFT JOIN public.roles AS r
        ON r.id = u.rol_id
      `,
      [
        ticket_id,
        autor_usuario_id,
        observacion,
      ]
    );

    await cliente.query("COMMIT");

    return rows[0];

  } catch (error) {
    try {
      await cliente.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Error al revertir seguimiento:",
        rollbackError.message
      );
    }

    throw error;

  } finally {
    cliente.release();
  }
}
