
import { pool } from "../config/db.js";

const CAMPOS = `
  id, titulo, descripcion, prioridad, estado,
  usuario_id, tecnico_id, categoria_id, solucion,
  fecha_creacion, fecha_actualizacion, fecha_cierre
`;

const TRANSICIONES = {
  abierto: ["asignado"],
  asignado: ["en_proceso"],
  en_proceso: ["resuelto"],
  resuelto: ["cerrado", "reabierto"],
  cerrado: ["reabierto"],
  reabierto: ["asignado", "en_proceso"]
};

function errorHttp(mensaje, status) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

// ==========================================
// 1. LISTADO SEGÚN IDENTIDAD
// ==========================================

export async function listarTickets(estado, usuario) {
  const administrativo =
    ["superadmin", "admin"].includes(usuario.rol);

  const { rows } = await pool.query(
    `SELECT
       t.id, t.titulo, t.descripcion, t.prioridad,
       t.estado, t.usuario_id, t.tecnico_id,
       t.categoria_id, t.solucion,
       t.fecha_creacion, t.fecha_actualizacion,
       t.fecha_cierre
     FROM public.tickets t
     LEFT JOIN public.tecnicos te
       ON te.id = t.tecnico_id
     WHERE ($1::text IS NULL OR t.estado = $1)
       AND (
         $2::boolean = TRUE
         OR t.usuario_id = $3
         OR (
           $4::text = 'tecnico'
           AND te.usuario_id = $3
         )
       )
     ORDER BY t.id DESC`,
    [
      estado ?? null,
      administrativo,
      usuario.id,
      usuario.rol
    ]
  );

  return rows;
}

// ==========================================
// 2. OBTENER TICKET
// ==========================================

export async function obtenerTicket(id) {
  const { rows } = await pool.query(
    `SELECT ${CAMPOS}
     FROM public.tickets
     WHERE id = $1`,
    [id]
  );

  return rows[0] ?? null;
}

// ==========================================
// 3. CREAR TICKET
// ==========================================

export async function crearTicket(datos) {
  const {
    titulo,
    descripcion,
    prioridad,
    usuario_id,
    categoria_id
  } = datos;

  const { rows } = await pool.query(
    `INSERT INTO public.tickets (
       titulo,
       descripcion,
       prioridad,
       usuario_id,
       categoria_id,
       estado
     )
     SELECT
       $1, $2, $3, $4, c.id, 'abierto'
     FROM public.categorias c
     WHERE c.id = $5
       AND c.activa = TRUE
     RETURNING ${CAMPOS}`,
    [
      titulo,
      descripcion,
      prioridad,
      usuario_id,
      categoria_id
    ]
  );

  if (!rows.length) {
    throw errorHttp(
      "La categoría no existe o está inactiva",
      409
    );
  }

  return rows[0];
}

// ==========================================
// 4. ASIGNAR TÉCNICO
// ==========================================

export async function asignarTecnico(ticketId, tecnicoId) {
  const { rows } = await pool.query(
    `UPDATE public.tickets t
     SET tecnico_id = $1,
         estado = 'asignado'
     WHERE t.id = $2
       AND t.estado IN ('abierto', 'asignado', 'reabierto')
       AND EXISTS (
         SELECT 1
         FROM public.tecnicos te
         JOIN public.usuarios u
           ON u.id = te.usuario_id
         JOIN public.roles r
           ON r.id = u.rol_id
         WHERE te.id = $1
           AND te.disponible = TRUE
           AND u.activo = TRUE
           AND r.nombre = 'tecnico'
           AND r.activo = TRUE
       )
     RETURNING ${CAMPOS}`,
    [tecnicoId, ticketId]
  );

  return rows[0] ?? null;
}

// ==========================================
// 5. CAMBIAR ESTADO
// ==========================================

export async function cambiarEstado(
  ticketId,
  nuevoEstado,
  solucion,
  usuario
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT
         t.id,
         t.estado,
         t.solucion,
         t.tecnico_id,
         te.usuario_id AS tecnico_usuario_id
       FROM public.tickets t
       LEFT JOIN public.tecnicos te
         ON te.id = t.tecnico_id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [ticketId]
    );

    const actual = rows[0];

    if (!actual) {
      throw errorHttp("Ticket no encontrado", 404);
    }

    const permitidos = TRANSICIONES[actual.estado] ?? [];

    if (!permitidos.includes(nuevoEstado)) {
      throw errorHttp(
        `Transición no permitida: ${actual.estado} a ${nuevoEstado}`,
        409
      );
    }

    if (usuario.rol === "tecnico") {
      if (actual.tecnico_usuario_id !== usuario.id) {
        throw errorHttp("Técnico no asignado", 403);
      }

      if (!["en_proceso", "resuelto"].includes(nuevoEstado)) {
        throw errorHttp(
          "El técnico no puede ejecutar esa transición",
          403
        );
      }
    }

    const solucionFinal =
      solucion === undefined || solucion === null
        ? actual.solucion
        : solucion.trim();

    if (
      ["resuelto", "cerrado"].includes(nuevoEstado) &&
      !solucionFinal?.trim()
    ) {
      throw errorHttp(
        "Debe registrar una solución",
        409
      );
    }

    

const { rows: actualizados } = await client.query(
  `UPDATE public.tickets
   SET estado = $1::varchar,
       solucion = $2,
       fecha_cierre = CASE
         WHEN $1::varchar = 'cerrado' THEN NOW()
         WHEN $1::varchar = 'reabierto' THEN NULL
         ELSE fecha_cierre
       END,
       fecha_actualizacion = NOW()
   WHERE id = $3
   RETURNING ${CAMPOS}`,
  [nuevoEstado, solucionFinal, ticketId]
);



    await client.query("COMMIT");

    return actualizados[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
