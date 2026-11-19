// Importa Router para definir las rutas de este módulo.
import { Router } from "express";
// Importa validadores para comprobar los parámetros recibidos en la URL.
import { param } from "express-validator";
// Importa las funciones que contienen la lógica de cada endpoint.
import * as controller from "../controllers/diagnostico.controller.js";
// Middleware que devuelve los errores si alguna validación falla.
import { validar } from "../middlewares/validar.js";

// Crea un router independiente que luego se monta desde el archivo principal.
const router = Router();
// Verifica la conexión con los servicios configurados.
router.get("/conexion", controller.conexion);
// Obtiene un resumen general del sistema.
router.get("/resumen", controller.resumen);
// Consulta los roles disponibles.
router.get("/roles", controller.roles);
// Busca los tickets cuyo estado coincide con el parámetro de la URL.
router.get(
  "/tickets/estado/:estado",
  // Solo permite los estados definidos por la aplicación.
  param("estado").isIn([
    "abierto",
    "asignado",
    "en_proceso",
    "resuelto",
    "cerrado",
    "reabierto",
  ]),
  // Ejecuta la validación antes de llamar al controlador.
  validar,
  // Procesa la solicitud cuando el parámetro es válido.
  controller.ticketsPorEstado,
);
// Exporta el router para que pueda ser utilizado por la aplicación Express.
export default router;
