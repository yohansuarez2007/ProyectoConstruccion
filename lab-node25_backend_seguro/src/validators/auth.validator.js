
import { body } from "express-validator";


export const validarRecuperacion = [
  body("email")
    .isEmail()
    .withMessage("Correo electrónico inválido")
    .normalizeEmail(),
];

// ==========================================
// 1. VALIDACIÓN DE INICIO DE SESIÓN
// POST /api/auth/login
// ==========================================

export const validarLogin = [

  // Validar correo electrónico.
  body("email")
    .isEmail()
    .withMessage("Correo electrónico inválido")
    .normalizeEmail(),

  // Validar contraseña.
  body("password")
    .isString()
    .withMessage("La contraseña debe ser texto")
    .bail()
    .notEmpty()
    .withMessage("La contraseña es obligatoria")

];

// ==========================================
// 2. VALIDACIÓN DE CAMBIO DE CONTRASEÑA
// PATCH /api/auth/cambiar-password
// ==========================================

export const validarCambioPassword = [

  // ======================================
  // 2.1 VALIDAR CONTRASEÑA ACTUAL
  // ======================================

  body("passwordActual")
    .isString()
    .withMessage("La contraseña actual debe ser texto")
    .bail()
    .notEmpty()
    .withMessage("La contraseña actual es obligatoria"),

  // ======================================
  // 2.2 VALIDAR NUEVA CONTRASEÑA
  // ======================================

  body("passwordNueva")
    .isString()
    .withMessage("La nueva contraseña debe ser texto")
    .bail()
    .isLength({ min: 12, max: 128 })
    .withMessage(
      "La nueva contraseña debe tener entre 12 y 128 caracteres"
    ),

  // ======================================
  // 2.3 IMPEDIR REUTILIZACIÓN
  // ======================================

  body("passwordNueva")
    .custom((valor, { req }) => {

      if (valor === req.body.passwordActual) {
        throw new Error(
          "La contraseña nueva debe ser diferente"
        );
      }

      return true;
    })

];
