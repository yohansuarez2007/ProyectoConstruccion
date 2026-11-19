import { validationResult } from "express-validator";

// Middleware que verifica los resultados de las validaciones de express-validator.
export function validar(req, res, next) {
  // Obtiene los errores generados durante la validación de la solicitud.
  const errors = validationResult(req);

  // Si existen errores, detiene la solicitud y devuelve sus detalles al cliente.
  if (!errors.isEmpty())
    return res
      .status(400)
      .json({ error: "Datos invalidos", detalles: errors.array() });

  // Si no hay errores, permite continuar con el siguiente middleware o controlador.
  next();
}
