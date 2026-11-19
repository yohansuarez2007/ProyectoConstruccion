
import * as service
  from "../services/tecnicos.service.js";

// ==========================================
// NEXDESK - LAB NODE 26
// CONTROLADOR DE TÉCNICOS
// ==========================================

// ==========================================
// 1. LISTAR
// ==========================================

export async function listar(req, res, next) {
  try {
    const tecnicos = await service.listarTecnicos();

    return res.status(200).json(tecnicos);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. OBTENER POR ID
// ==========================================

export async function obtener(req, res, next) {
  try {
    const tecnico = await service.obtenerTecnico(
      req.params.id
    );

    if (!tecnico) {
      return res.status(404).json({
        error: "Técnico no encontrado"
      });
    }

    return res.status(200).json(tecnico);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. CREAR
// ==========================================

export async function crear(req, res, next) {
  try {
    const tecnico = await service.crearTecnico(
      req.body
    );

    if (!tecnico) {
      return res.status(409).json({
        error:
          "El usuario debe existir, estar activo y tener rol tecnico"
      });
    }

    return res.status(201).json(tecnico);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 4. ACTUALIZAR
// ==========================================

export async function actualizar(req, res, next) {
  try {
    const tecnico = await service.actualizarTecnico(
      req.params.id,
      req.body
    );

    if (!tecnico) {
      return res.status(404).json({
        error: "Técnico no encontrado"
      });
    }

    return res.status(200).json(tecnico);
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 5. CAMBIAR DISPONIBILIDAD
// ==========================================

export async function cambiarDisponibilidad(
  req,
  res,
  next
) {
  try {
    const tecnico =
      await service.cambiarDisponibilidad(
        req.params.id,
        req.body.disponible
      );

    if (!tecnico) {
      return res.status(404).json({
        error: "Técnico no encontrado"
      });
    }

    return res.status(200).json(tecnico);
  } catch (error) {
    next(error);
  }
}
