
import { body, param, query } from "express-validator";

export const ESTADOS = [
  "abierto",
  "asignado",
  "en_proceso",
  "resuelto",
  "cerrado",
  "reabierto"
];

export const validarIdTicket = [
  param("id").isInt({ min: 1 })
];

export const validarFiltroTickets = [
  query("estado")
    .optional()
    .isIn(ESTADOS)
];

export const validarCrearTicket = [
  body("titulo")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 200 }),

  body("descripcion")
    .isString()
    .trim()
    .notEmpty(),

  body("prioridad")
    .isIn(["baja", "media", "alta"]),

  body("categoria_id")
    .isInt({ min: 1 })
];

export const validarAsignacion = [
  body("tecnico_id")
    .isInt({ min: 1 })
];

export const validarCambioEstado = [
  body("estado")
    .isIn(ESTADOS),

  body("solucion")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .isLength({ max: 5000 })
];
