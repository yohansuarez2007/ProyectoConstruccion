
import { Router } from "express";
import { param } from "express-validator";

import * as controller
  from "../controllers/seguimientos.controller.js";

import { validar }
  from "../middlewares/validar.js";

import { validarSeguimiento }
  from "../validators/seguimientos.validator.js";

import { autorizarTicket }
  from "../middlewares/autorizarTicket.js";

import { autorizarEscrituraSeguimiento }
  from "../middlewares/autorizarEscrituraSeguimiento.js";

const router = Router();

// ==========================================
// NEXDESK - LAB NODE 26.8.3
// RUTAS DE SEGUIMIENTOS
// ==========================================

// ==========================================
// 1. CONSULTAR HISTORIAL
// GET /api/tickets/:id/seguimientos
// ==========================================

// Permite consultar el historial a quienes
// tengan acceso autorizado al ticket.

router.get(
  "/:id/seguimientos",
  param("id").isInt({ min: 1 }),
  validar,
  autorizarTicket,
  controller.listar
);

// ==========================================
// 2. REGISTRAR OBSERVACIÓN
// POST /api/tickets/:id/seguimientos
// ==========================================

// Primero valida los datos.
// Después verifica el acceso al ticket.
// Luego verifica el permiso de escritura.
// Finalmente registra la observación.

router.post(
  "/:id/seguimientos",
  validarSeguimiento,
  validar,
  autorizarTicket,
  autorizarEscrituraSeguimiento,
  controller.crear
);

export default router;
