import * as service from '../services/categorias.service.js';

// GET /api/categorias
export async function listar(req, res, next) {
  try {
    const categorias = await service.listarCategorias();
    res.status(200).json(categorias);
  } catch (error) {
    next(error);
  }
}

// GET /api/categorias/:id
export async function obtener(req, res, next) {
  try {
    const categoria = await service.buscarCategoria(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    res.status(200).json(categoria);
  } catch (error) {
    next(error);
  }
}

// POST /api/categorias
export async function crear(req, res, next) {
  try {
    const categoria = await service.crearCategoria(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    next(error);
  }
}

// PUT /api/categorias/:id
export async function actualizar(req, res, next) {
  try {
    const categoria = await service.actualizarCategoria(
      req.params.id,
      req.body
    );

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    res.status(200).json(categoria);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/categorias/:id/activar
// PATCH /api/categorias/:id/desactivar
export async function cambiarEstado(req, res, next) {
  try {
    const activa = req.params.accion === 'activar';

    const categoria = await service.cambiarEstadoCategoria(
      req.params.id,
      activa
    );

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    res.status(200).json(categoria);
  } catch (error) {
    next(error);
  }
}