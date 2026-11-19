import { pool, comprobarConexion } from "../config/db.js";

// Comprueba si la aplicación puede conectarse a la base de datos.
export async function obtenerConexion() {
  // Se espera el resultado de la comprobación y se devuelve con una
  // propiedad clara para que el controlador pueda enviarla como respuesta.
  return { conectado: await comprobarConexion() };
}

// Obtiene un resumen con la cantidad de registros de las tablas principales.
export async function obtenerResumen() {
  // Consultas de agregados: no exponen correos ni documentos personales.
  const sql = `
    SELECT
      -- Cada subconsulta cuenta los registros de una tabla y convierte el
      -- resultado a entero para evitar devolver un tipo numérico inesperado.
      (SELECT COUNT(*)::int FROM public.roles) AS roles,
      (SELECT COUNT(*)::int FROM public.usuarios) AS usuarios,
      (SELECT COUNT(*)::int FROM public.tecnicos) AS tecnicos,
      (SELECT COUNT(*)::int FROM public.categorias) AS categorias,
      (SELECT COUNT(*)::int FROM public.tickets) AS tickets,
      (SELECT COUNT(*)::int FROM public.seguimientos) AS seguimientos
  `;
  // pool.query ejecuta la consulta usando la conexión configurada.
  const { rows } = await pool.query(sql);
  // La consulta devuelve una sola fila con todos los totales.
  return rows[0];
}

// Lista los roles mostrando únicamente su nombre y estado de actividad.
export async function obtenerRoles() {
  const { rows } = await pool.query(
    // ORDER BY id mantiene el orden definido por la tabla.
    "SELECT nombre, activo FROM public.roles ORDER BY id",
  );
  // Devuelve todas las filas para que el controlador las transforme en JSON.
  return rows;
}

// Cuenta cuántos tickets tienen el estado indicado.
export async function contarTicketsPorEstado(estado) {
  // $1 evita interpolar entrada del cliente en SQL.
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total FROM public.tickets WHERE estado = $1",
    [estado],
  );
  // La consulta devuelve una fila; se combina el total con el estado recibido.
  return { estado, total: rows[0].total };
}
