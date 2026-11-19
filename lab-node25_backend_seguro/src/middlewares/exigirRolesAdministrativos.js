export function validarAsignacionRol(req, res, next) {
  const solicitante = req.usuario.rol;
  const rolSolicitado = req.body.rol;

  if (solicitante === "superadmin") {
    return next();
  }

  if (
    solicitante === "admin" &&
    ["tecnico", "usuario"].includes(rolSolicitado)
  ) {
    return next();
  }

  return res.status(403).json({
    error: "No puede asignar el rol solicitado",
  });
}
