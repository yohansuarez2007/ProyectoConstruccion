
import * as servicio from "../services/notificaciones.service.js";

export async function listar(req, res, next) {
  try {
    const datos = await servicio.listarNotificaciones(
      req.usuario.id
    );

    return res.status(200).json(datos);
  } catch (error) {
    next(error);
  }
}

export async function pendientes(req, res, next) {
  try {
    const total = await servicio.contarPendientes(
      req.usuario.id
    );

    return res.status(200).json({
      pendientes: total,
    });
  } catch (error) {
    next(error);
  }
}

export async function marcarLeida(req, res, next) {
  try {
    const resultado = await servicio.marcarLeida(
      req.usuario.id,
      Number(req.params.id)
    );

    if (!resultado) {
      return res.status(404).json({
        error: "Notificación no encontrada",
      });
    }

    return res.status(200).json(resultado);
  } catch (error) {
    next(error);
  }
}
