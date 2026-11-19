import { Router } from "express";

import * as controller from "../controllers/tickets.controller.js";

import {
  validarIdTicket,
  validarFiltroTickets,
  validarCrearTicket,
  validarAsignacion,
  validarCambioEstado,
} from "../validators/tickets.validator.js";

import { validar } from "../middlewares/validar.js";

import { autorizar } from "../middlewares/autorizar.js";

import { autorizarTicket } from "../middlewares/autorizarTicket.js";

const router = Router();

// ==========================================
// 1. LISTAR TICKETS
// ==========================================

router.get("/", validarFiltroTickets, validar, controller.listar);

// ==========================================
// 2. CONSULTAR TICKET
// ==========================================

router.get(
  "/:id",
  validarIdTicket,
  validar,
  autorizarTicket,
  controller.obtener,
);

// ==========================================
// 3. CREAR TICKET
// ==========================================

router.post(
  "/",
  autorizar("superadmin", "admin", "usuario"),
  validarCrearTicket,
  validar,
  controller.crear,
);

// ==========================================
// 4. ASIGNAR TÉCNICO
// ==========================================

router.patch(
  "/:id/asignar",
  autorizar("superadmin", "admin"),
  validarIdTicket,
  validarAsignacion,
  validar,
  autorizarTicket,
  controller.asignar,
);

// ==========================================
// 5. CAMBIAR ESTADO
// ==========================================

router.patch(
  "/:id/estado",
  autorizar("superadmin", "admin", "tecnico"),
  validarIdTicket,
  validarCambioEstado,
  validar,
  autorizarTicket,
  controller.cambiarEstado,
);

export default router;
