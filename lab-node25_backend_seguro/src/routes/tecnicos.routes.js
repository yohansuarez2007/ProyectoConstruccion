
import { Router } from "express";
import { body, param } from "express-validator";

import * as controller
  from "../controllers/tecnicos.controller.js";

import { autenticar }
  from "../middlewares/autenticar.js";

import { exigirPasswordActualizado }
  from "../middlewares/exigirPasswordActualizado.js";

import { autorizar }
  from "../middlewares/autorizar.js";

import { validar }
  from "../middlewares/validar.js";

// ==========================================
// NEXDESK - LAB NODE 26
// RUTAS DE TÉCNICOS
// ==========================================

const router = Router();

const validarId = [
  param("id").isInt({ min: 1 })
];

const validarDatos = [
  body("especialidad")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 }),

  body("disponible")
    .isBoolean({ strict: true })
];

// ==========================================
// SEGURIDAD GENERAL
// ==========================================

router.use(
  autenticar,
  exigirPasswordActualizado
);

// ==========================================
// GET /api/tecnicos
// ==========================================

router.get(
  "/",
  autorizar("superadmin", "admin", "tecnico"),
  controller.listar
);

// ==========================================
// GET /api/tecnicos/:id
// ==========================================

router.get(
  "/:id",
  autorizar("superadmin", "admin", "tecnico"),
  validarId,
  validar,
  controller.obtener
);

// ==========================================
// POST /api/tecnicos
// ==========================================

router.post(
  "/",
  autorizar("superadmin", "admin"),
  [
    body("usuario_id").isInt({ min: 1 }),
    ...validarDatos
  ],
  validar,
  controller.crear
);

// ==========================================
// PUT /api/tecnicos/:id
// ==========================================

router.put(
  "/:id",
  autorizar("superadmin", "admin"),
  validarId,
  validarDatos,
  validar,
  controller.actualizar
);

// ==========================================
// PATCH /api/tecnicos/:id/disponibilidad
// ==========================================

router.patch(
  "/:id/disponibilidad",
  autorizar("superadmin", "admin"),
  validarId,
  [
    body("disponible")
      .isBoolean({ strict: true })
  ],
  validar,
  controller.cambiarDisponibilidad
);

export default router;
