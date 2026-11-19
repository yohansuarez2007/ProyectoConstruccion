import * as service from "../services/diagnostico.service.js";

// Verifica y devuelve el estado de conexión mediante la capa de servicios.
export async function conexion(req, res, next) {
  try {
    // Espera el resultado del servicio y lo envía como respuesta JSON.
    res.json(await service.obtenerConexion());
  } catch (error) {
    // Delega cualquier error al middleware de manejo de errores de Express.
    next(error);
  }
}

// Obtiene un resumen general de la información disponible.
export async function resumen(req, res, next) {
  try {
    res.json(await service.obtenerResumen());
  } catch (error) {
    next(error);
  }
}

// Consulta los roles y los devuelve dentro de la propiedad "datos".
export async function roles(req, res, next) {
  try {
    res.json({ datos: await service.obtenerRoles() });
  } catch (error) {
    next(error);
  }
}

// Cuenta los tickets que coinciden con el estado recibido en la URL.
export async function ticketsPorEstado(req, res, next) {
  try {
    // req.params.estado contiene el parámetro dinámico definido en la ruta.
    res.json(await service.contarTicketsPorEstado(req.params.estado));
  } catch (error) {
    next(error);
  }
}
