import { timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

// Middleware que protege las rutas de diagnóstico mediante un token secreto.
export function exigirTokenLaboratorio(req, res, next) {
  // Lee el token enviado en la cabecera; si no existe, usa una cadena vacía.
  const supplied = req.get("X-Lab-Token") ?? "";
  // Obtiene el token válido desde la configuración de variables de entorno.
  const expected = env.diagnosticsToken;

  // Convierte ambos valores a bytes para poder compararlos de forma segura.
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);

  // Primero se verifica que tengan la misma longitud porque timingSafeEqual
  // requiere buffers del mismo tamaño. Luego se comparan sin filtrar tiempos
  // de ejecución que faciliten descubrir el token carácter por carácter.
  if (a.length === b.length && timingSafeEqual(a, b)) return next();

  // Rechaza la solicitud si el token falta o no coincide.
  return res.status(401).json({ error: "No autorizado" });
}
