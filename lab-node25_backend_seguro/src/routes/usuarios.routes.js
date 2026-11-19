
import { Router } from "express";

import * as controller
  from "../controllers/usuarios.controller.js";

import { autenticar }
  from "../middlewares/autenticar.js";

import { autorizar }
  from "../middlewares/autorizar.js";

import { exigirPasswordActualizado }
  from "../middlewares/exigirPasswordActualizado.js";

import { validarAsignacionRol }
  from "../middlewares/exigirRolesAdministrativos.js";

import {
  validarCrearUsuario,
  validarIdUsuario,
  validarActualizarUsuario,
  validarEstadoUsuario
} from "../validators/usuarios.validator.js";

import { validar }
  from "../middlewares/validar.js";

// ==========================================
// NEXDESK - LAB NODE 26
// RUTAS ADMINISTRATIVAS DE USUARIOS
// ==========================================

const router = Router();

// ==========================================
// 1. SEGURIDAD GENERAL
// ==========================================

// Todas las operaciones requieren:
// 1. JWT válido.
// 2. Contraseña definitiva.
// 3. Rol superadmin o admin.

router.use(
  autenticar,
  exigirPasswordActualizado,
  autorizar("superadmin", "admin")
);

// ==========================================
// 2. LISTAR USUARIOS
// GET /api/usuarios
// ==========================================

router.get(
  "/",
  controller.listar
);

// ==========================================
// 3. CREAR USUARIO
// POST /api/usuarios
// ==========================================

router.post(
  "/",
  validarCrearUsuario,
  validar,
  validarAsignacionRol,
  controller.crear
);

// ==========================================
// 4. CONSULTAR USUARIO POR ID
// GET /api/usuarios/:id
// ==========================================

router.get(
  "/:id",
  validarIdUsuario,
  validar,
  controller.obtener
);

// ==========================================
// 5. ACTUALIZAR DATOS PERSONALES
// PUT /api/usuarios/:id
// ==========================================

router.put(
  "/:id",
  validarIdUsuario,
  validarActualizarUsuario,
  validar,
  controller.actualizar
);

// ==========================================
// 6. ACTIVAR / DESACTIVAR USUARIO
// PATCH /api/usuarios/:id/estado
// ==========================================

router.patch(
  "/:id/estado",
  validarIdUsuario,
  validarEstadoUsuario,
  validar,
  controller.cambiarEstado
);

// ==========================================
// 7. EXPORTACIÓN
// ==========================================



// ==========================================
// RESTABLECER CONTRASEÑA DE UN USUARIO
// PATCH /api/usuarios/:id/restablecer-password
// ==========================================

router.patch(
  "/:id/restablecer-password",
  validarIdUsuario,
  validar,
  controller.restablecerPassword
);



export default router;
