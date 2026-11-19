import { body, param } from 'express-validator';

// Validación del identificador de categoría
export const validarIdCategoria = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo')
];

// Validación para crear o actualizar categorías
export const validarDatosCategoria = [
  body('nombre')
    .isString()
    .withMessage('El nombre debe ser texto')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede superar 100 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .isString()
    .withMessage('La descripción debe ser texto')
    .trim()
    .isLength({ max: 250 })
    .withMessage('La descripción no puede superar 250 caracteres')
];