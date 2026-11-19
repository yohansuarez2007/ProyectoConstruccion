
import * as service
  from "../services/seguimientos.service.js";

// ==========================================
// NEXDESK - LAB NODE 26
// CONTROLADOR DE SEGUIMIENTOS
// ==========================================

export async function listar(req, res, next) {
  try {
    const seguimientos =
      await service.listarSeguimientos(req.params.id);

    return res.status(200).json(seguimientos);
  } catch (error) {
    next(error);
  }
}

export async function crear(req, res, next) {
  try {
    const seguimiento =
      await service.crearSeguimiento({
        ticket_id: req.params.id,

        // Autor autenticado.
        autor_usuario_id: req.usuario.id,

        observacion: req.body.observacion
      });

    return res.status(201).json(seguimiento);
  } catch (error) {
    next(error);
  }
}
