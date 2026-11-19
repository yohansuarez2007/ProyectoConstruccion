
import { pool } from "../config/db.js";

// ==========================================
// NEXDESK - LAB NODE 26
// SERVICIO DE TÉCNICOS
// ==========================================

const CAMPOS = `
  t.id,
  t.usuario_id,
  t.especialidad,
  t.disponible,
  u.nombre,
  u.apellido,
  u.email,
  u.activo
`;

// ==========================================
// 1. LISTAR TÉCNICOS
// ==========================================

export async function listarTecnicos() {
  const { rows } = await pool.query(`
    SELECT ${CAMPOS}
    FROM public.tecnicos t
    INNER JOIN public.usuarios u
      ON u.id = t.usuario_id
    ORDER BY t.id
  `);

  return rows;
}

// ==========================================
// 2. CONSULTAR TÉCNICO
// ==========================================

export async function obtenerTecnico(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS}
     FROM public.tecnicos t
     INNER JOIN public.usuarios u
       ON u.id = t.usuario_id
     WHERE t.id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

// ==========================================
// 3. CREAR PERFIL TÉCNICO
// ==========================================

export async function crearTecnico(datos) {
  const {
    usuario_id,
    especialidad,
    disponible
  } = datos;

  // Solo un usuario activo con rol técnico
  // puede recibir un perfil profesional.

  const { rows } = await pool.query(
    `INSERT INTO public.tecnicos (
       usuario_id,
       especialidad,
       disponible
     )
     SELECT
       u.id,
       $2,
       $3
     FROM public.usuarios u
     INNER JOIN public.roles r
       ON r.id = u.rol_id
     WHERE u.id = $1
       AND u.activo = TRUE
       AND r.activo = TRUE
       AND r.nombre = 'tecnico'
     RETURNING
       id,
       usuario_id,
       especialidad,
       disponible`,
    [usuario_id, especialidad, disponible]
  );

  return rows[0] ?? null;
}

// ==========================================
// 4. ACTUALIZAR PERFIL
// ==========================================

export async function actualizarTecnico(id, datos) {
  const { rows } = await pool.query(
    `UPDATE public.tecnicos
     SET
       especialidad = $1,
       disponible = $2
     WHERE id = $3
     RETURNING
       id,
       usuario_id,
       especialidad,
       disponible`,
    [
      datos.especialidad,
      datos.disponible,
      id
    ]
  );

  return rows[0] ?? null;
}

// ==========================================
// 5. CAMBIAR DISPONIBILIDAD
// ==========================================

export async function cambiarDisponibilidad(
  id,
  disponible
) {
  const { rows } = await pool.query(
    `UPDATE public.tecnicos
     SET disponible = $1
     WHERE id = $2
     RETURNING
       id,
       usuario_id,
       especialidad,
       disponible`,
    [disponible, id]
  );

  return rows[0] ?? null;
}
