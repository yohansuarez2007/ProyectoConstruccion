
import { Router } from "express";

import * as controller
  from "../controllers/categorias.controller.js";

import {
  validarIdCategoria,
  validarDatosCategoria
} from "../validators/categorias.validator.js";

import { validar }
  from "../middlewares/validar.js";

import { autenticar }
  from "../middlewares/autenticar.js";

import { autorizar }
  from "../middlewares/autorizar.js";

import { exigirPasswordActualizado }
  from "../middlewares/exigirPasswordActualizado.js";

// ==========================================
// NEXDESK - LAB NODE 26
// RUTAS DE CATEGORÍAS
// ==========================================

const router = Router();

// Todas las operaciones requieren JWT válido
// y contraseña definitiva.

router.use(
  autenticar,
  exigirPasswordActualizado
);

// ==========================================
// 1. LISTAR CATEGORÍAS
// ==========================================

router.get(
  "/",
  autorizar(
    "superadmin",
    "admin",
    "tecnico",
    "usuario"
  ),
  controller.listar
);

// ==========================================
// 2. CONSULTAR CATEGORÍA
// ==========================================

router.get(
  "/:id",
  autorizar(
    "superadmin",
    "admin",
    "tecnico",
    "usuario"
  ),
  validarIdCategoria,
  validar,
  controller.obtener
);

// ==========================================
// 3. CREAR CATEGORÍA
// ==========================================

router.post(
  "/",
  autorizar("superadmin", "admin"),
  validarDatosCategoria,
  validar,
  controller.crear
);

// ==========================================
// 4. ACTUALIZAR CATEGORÍA
// ==========================================

router.put(
  "/:id",
  autorizar("superadmin", "admin"),
  validarIdCategoria,
  validarDatosCategoria,
  validar,
  controller.actualizar
);

// ==========================================
// 5. ACTIVAR / DESACTIVAR
// ==========================================

router.patch(
  "/:id/:accion",
  autorizar("superadmin", "admin"),
  validarIdCategoria,
  validar,
  (req, res, next) => {
    const acciones = ["activar", "desactivar"];

    if (!acciones.includes(req.params.accion)) {
      return res.status(400).json({
        error: "Acción inválida"
      });
    }

    next();
  },
  controller.cambiarEstado
);

export default router;
