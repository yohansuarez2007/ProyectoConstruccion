
import { pool } from "../config/db.js";

export async function autorizarTicket(req, res, next) {
  try {
    const ticketId = Number(req.params.id);

    if (!Number.isSafeInteger(ticketId) || ticketId < 1) {
      return res.status(400).json({
        error: "ID de ticket inválido"
      });
    }

    const { rows } = await pool.query(
      `SELECT
         t.id,
         t.usuario_id,
         t.tecnico_id,
         te.usuario_id AS tecnico_usuario_id
       FROM public.tickets t
       LEFT JOIN public.tecnicos te
         ON te.id = t.tecnico_id
       WHERE t.id = $1`,
      [ticketId]
    );

    const ticket = rows[0];

    if (!ticket) {
      return res.status(404).json({
        error: "Ticket no encontrado"
      });
    }

    const rol = req.usuario.rol;
    const usuarioId = req.usuario.id;

    const administrativo =
      rol === "superadmin" || rol === "admin";

    const propietario =
      ticket.usuario_id === usuarioId;

    const tecnicoAsignado =
      rol === "tecnico" &&
      ticket.tecnico_usuario_id === usuarioId;

    if (
      !administrativo &&
      !propietario &&
      !tecnicoAsignado
    ) {
      return res.status(404).json({
        error: "Ticket no encontrado"
      });
    }

    req.ticketAutorizado = ticket;

    next();
  } catch (error) {
    next(error);
  }
}
