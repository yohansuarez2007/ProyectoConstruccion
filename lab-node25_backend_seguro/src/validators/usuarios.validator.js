
import { body, param } from "express-validator";

// ==========================================
// VALIDADORES DE USUARIOS - NEXDESK
// LAB NODE 26
// ==========================================

// ==========================================
// 1. VALIDAR CREACIÓN DE USUARIO
// POST /api/usuarios
// ==========================================

export const validarCrearUsuario = [

  // Tipo de documento permitido.
  body("tipo_documento")
    .isIn(["CC", "TI", "CE", "PA", "PPT", "OTRO"])
    .withMessage("Tipo de documento inválido"),

  // Número de documento.
  body("numero_documento")
    .isString()
    .withMessage("El documento debe ser texto")
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9-]{4,30}$/)
    .withMessage(
      "El documento debe contener entre 4 y 30 caracteres alfanuméricos o guiones"
    ),

  // Nombre.
  body("nombre")
    .isString()
    .withMessage("El nombre debe ser texto")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "El nombre debe tener entre 1 y 100 caracteres"
    ),

  // Apellido.
  body("apellido")
    .isString()
    .withMessage("El apellido debe ser texto")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "El apellido debe tener entre 1 y 100 caracteres"
    ),

  // Correo electrónico.
  body("email")
    .isEmail()
    .withMessage("Correo electrónico inválido")
    .normalizeEmail(),

  // Rol asignado.
  body("rol")
    .isIn(["superadmin", "admin", "tecnico", "usuario"])
    .withMessage("Rol de usuario inválido")

];

// ==========================================
// 2. VALIDAR IDENTIFICADOR DE USUARIO
// GET /api/usuarios/:id
// PUT /api/usuarios/:id
// PATCH /api/usuarios/:id/estado
// ==========================================

export const validarIdUsuario = [

  param("id")
    .isInt({ min: 1 })
    .withMessage(
      "El identificador debe ser un entero positivo"
    )

];

// ==========================================
// 3. VALIDAR ACTUALIZACIÓN DE USUARIO
// PUT /api/usuarios/:id
// ==========================================

// Solo permite actualizar datos personales.
// No modifica correo, rol ni contraseña.

export const validarActualizarUsuario = [

  // Tipo de documento.
  body("tipo_documento")
    .isIn(["CC", "TI", "CE", "PA", "PPT", "OTRO"])
    .withMessage("Tipo de documento inválido"),

  // Número de documento.
  body("numero_documento")
    .isString()
    .withMessage("El documento debe ser texto")
    .bail()
    .trim()
    .matches(/^[A-Za-z0-9-]{4,30}$/)
    .withMessage(
      "El documento debe contener entre 4 y 30 caracteres alfanuméricos o guiones"
    ),

  // Nombre.
  body("nombre")
    .isString()
    .withMessage("El nombre debe ser texto")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "El nombre debe tener entre 1 y 100 caracteres"
    ),

  // Apellido.
  body("apellido")
    .isString()
    .withMessage("El apellido debe ser texto")
    .bail()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      "El apellido debe tener entre 1 y 100 caracteres"
    )

];

// ==========================================
// 4. VALIDAR ESTADO DEL USUARIO
// PATCH /api/usuarios/:id/estado
// ==========================================

export const validarEstadoUsuario = [

  body("activo")
    .isBoolean({ strict: true })
    .withMessage(
      "El estado activo debe ser true o false"
    )

];
