import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as controller from "../controllers/auth.controller.js";

import {
  validarLogin,
  validarCambioPassword,
  validarRecuperacion,
} from "../validators/auth.validator.js";

import { validar } from "../middlewares/validar.js";

import { autenticar } from "../middlewares/autenticar.js";



// ==========================================
// 1. INICIALIZACIÓN DEL ROUTER
// ==========================================

const router = Router();

// ==========================================
// 2. LIMITACIÓN DE SOLICITUDES
// ==========================================

// Reduce los intentos automatizados de
// autenticación y cambio de contraseña.
//
// Máximo 10 solicitudes por IP cada 15 minutos
// para cada operación, usando limitadores
// independientes.

const crearLimiteAuth = () =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT || 10),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      error:
        "Se alcanzó el límite de solicitudes. " +
        "Espere unos minutos antes de intentarlo nuevamente.",
    },
  });

const limiteLogin = crearLimiteAuth();
const limiteCambioPassword = crearLimiteAuth();
const limiteRecuperacion = crearLimiteAuth();

// ==========================================
// 3. CONTROL DE CACHÉ
// ==========================================

// Evita que las respuestas de autenticación
// se almacenen en cachés HTTP.

function evitarCache(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

// ==========================================
// 4. INICIO DE SESIÓN
// POST /api/auth/login
// ==========================================

// Ruta pública:
// 1. Limita intentos de autenticación.
// 2. Valida los datos recibidos.
// 3. Procesa errores de validación.
// 4. Autentica mediante Supabase Auth.

router.post(
  "/login",
  evitarCache,
  limiteLogin,
  validarLogin,
  validar,
  controller.login,
);



// ==========================================
// RECUPERACIÓN DE ACCESO
// POST /api/auth/recuperar-password
// ==========================================

router.post(
  "/recuperar-password",
  evitarCache,
  limiteRecuperacion,
  validarRecuperacion,
  validar,
  controller.solicitarRecuperacion
);


// ==========================================
// 5. CONSULTAR PERFIL
// GET /api/auth/me
// ==========================================

// Ruta privada:
// 1. Verifica el JWT.
// 2. Consulta el usuario y su rol.
// 3. Devuelve el perfil autenticado.

router.get("/me", evitarCache, autenticar, controller.perfil);

// ==========================================
// 6. CAMBIO OBLIGATORIO DE CONTRASEÑA
// POST /api/auth/cambiar-password
// ==========================================

// Ruta privada:
// 1. Limita las solicitudes.
// 2. Verifica el JWT.
// 3. Valida las contraseñas.
// 4. Comprueba la contraseña actual.
// 5. Actualiza Supabase Auth.
// 6. Actualiza el indicador en PostgreSQL.

router.post(
  "/cambiar-password",
  evitarCache,
  limiteCambioPassword,
  autenticar,
  validarCambioPassword,
  validar,
  controller.cambiarPassword,
);

// ==========================================
// 7. EXPORTACIÓN DEL ROUTER
// ==========================================

export default router;
