
import { pool } from '../config/db.js';

// Columnas que devolveremos al cliente
const CAMPOS = 'id, nombre, descripcion, activa';

// GET /api/categorias
export async function listarCategorias() {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS}
     FROM public.categorias
     ORDER BY id`
  );

  return rows;
}

// GET /api/categorias/:id
export async function buscarCategoria(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS}
     FROM public.categorias
     WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

// POST /api/categorias
export async function crearCategoria({ nombre, descripcion }) {
  const { rows } = await pool.query(
    `INSERT INTO public.categorias
       (nombre, descripcion)
     VALUES ($1, $2)
     RETURNING ${CAMPOS}`,
    [nombre, descripcion ?? null]
  );

  return rows[0];
}

// PUT /api/categorias/:id
export async function actualizarCategoria(
  id,
  { nombre, descripcion }
) {
  const { rows } = await pool.query(
    `UPDATE public.categorias
     SET nombre = $1,
         descripcion = $2
     WHERE id = $3
     RETURNING ${CAMPOS}`,
    [nombre, descripcion ?? null, id]
  );

  return rows[0] ?? null;
}

// PATCH /api/categorias/:id/activar
// PATCH /api/categorias/:id/desactivar
export async function cambiarEstadoCategoria(id, activa) {
  const { rows } = await pool.query(
    `UPDATE public.categorias
     SET activa = $1
     WHERE id = $2
     RETURNING ${CAMPOS}`,
    [activa, id]
  );

  return rows[0] ?? null;
}
