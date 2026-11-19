
export function autorizarEscrituraSeguimiento(
  req,
  res,
  next
) {
  const ticket = req.ticketAutorizado;

  if (!ticket) {
    return res.status(500).json({
      error: "No se ha validado el acceso al ticket.",
    });
  }

  const rol = req.usuario?.rol;
  const usuarioId = Number(req.usuario?.id);

  const administrativo =
    rol === "superadmin" || rol === "admin";

  const propietario =
    rol === "usuario" &&
    Number(ticket.usuario_id) === usuarioId;

  const tecnicoAsignado =
    rol === "tecnico" &&
    ticket.tecnico_usuario_id != null &&
    Number(ticket.tecnico_usuario_id) === usuarioId;

  if (
    !administrativo &&
    !propietario &&
    !tecnicoAsignado
  ) {
    return res.status(403).json({
      error:
        "No tiene permisos para registrar " +
        "observaciones en este ticket.",
    });
  }

  next();
}
