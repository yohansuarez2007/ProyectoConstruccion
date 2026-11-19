
import { randomBytes } from "node:crypto";

import { pool } from "../config/db.js";
import { supabaseAdmin } from "../config/supabaseAdmin.js";

// ==========================================
// SERVICIO DE USUARIOS - NEXDESK
// LAB NODE 26
// ==========================================

// ==========================================
// 1. GENERAR CONTRASEÑA TEMPORAL
// ==========================================

// Genera una contraseña aleatoria segura.
// No utiliza el documento de identidad
// como contraseña inicial.

function generarPasswordTemporal() {
  return randomBytes(24).toString("base64url");
}

// ==========================================
// 2. LISTAR USUARIOS
// ==========================================

export async function listarUsuarios() {

  const { rows } = await pool.query(`
    SELECT
      u.id,
      u.tipo_documento,
      u.numero_documento,
      u.nombre,
      u.apellido,
      u.email,
      u.activo,
      u.debe_cambiar_password,
      r.nombre AS rol
    FROM public.usuarios AS u
    INNER JOIN public.roles AS r
      ON r.id = u.rol_id
    ORDER BY u.id
  `);

  return rows;
}

// ==========================================
// 3. CREAR USUARIO
// ==========================================

export async function crearUsuario(datos) {

  const {
    tipo_documento,
    numero_documento,
    nombre,
    apellido,
    email,
    rol
  } = datos;

  // ======================================
  // 3.1 NORMALIZAR DATOS
  // ======================================

  const correo = email.trim().toLowerCase();
  const documento = numero_documento.trim().toUpperCase();

  // ======================================
  // 3.2 VALIDAR ROL
  // ======================================

  const { rows: roles } = await pool.query(
    `SELECT id
     FROM public.roles
     WHERE nombre = $1
       AND activo = TRUE`,
    [rol]
  );

  if (!roles.length) {
    const error = new Error("Rol inexistente o inactivo");
    error.status = 400;
    throw error;
  }

  // ======================================
  // 3.3 COMPROBAR DUPLICADOS
  // ======================================

  // Verificación anticipada.
  // Las restricciones UNIQUE de PostgreSQL
  // continúan siendo la protección definitiva.

  const { rows: existentes } = await pool.query(
    `SELECT id
     FROM public.usuarios
     WHERE email = $1
        OR (
          tipo_documento = $2
          AND numero_documento = $3
        )
     LIMIT 1`,
    [correo, tipo_documento, documento]
  );

  if (existentes.length) {
    const error = new Error("Usuario ya registrado");
    error.status = 409;
    throw error;
  }

  // ======================================
  // 3.4 GENERAR CONTRASEÑA TEMPORAL
  // ======================================

  const passwordTemporal = generarPasswordTemporal();

  // ======================================
  // 3.5 CREAR IDENTIDAD EN SUPABASE AUTH
  // ======================================

  const { data, error: errorAuth } =
    await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password: passwordTemporal,
      email_confirm: true
    });

  if (errorAuth || !data?.user) {
    const error = new Error(
      "No se pudo crear la identidad de autenticación"
    );

    error.status =
      errorAuth?.status === 422 ? 409 : 502;

    throw error;
  }

  const authUserId = data.user.id;

  // ======================================
  // 3.6 REGISTRAR PERFIL EN POSTGRESQL
  // ======================================

  try {

    const { rows } = await pool.query(
      `INSERT INTO public.usuarios (
         auth_user_id,
         rol_id,
         tipo_documento,
         numero_documento,
         nombre,
         apellido,
         email,
         activo,
         debe_cambiar_password
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         TRUE, TRUE
       )
       RETURNING
         id,
         nombre,
         apellido,
         email,
         activo,
         debe_cambiar_password`,
      [
        authUserId,
        roles[0].id,
        tipo_documento,
        documento,
        nombre.trim(),
        apellido.trim(),
        correo
      ]
    );

    return {
      usuario: {
        ...rows[0],
        rol
      },
      passwordTemporal
    };

  } catch (error) {

    // ======================================
    // 3.7 COMPENSACIÓN ANTE FALLOS
    // ======================================

    // Si falla PostgreSQL, se intenta
    // eliminar la identidad creada
    // previamente en Supabase Auth.

    const { error: errorCompensacion } =
      await supabaseAdmin.auth.admin.deleteUser(
        authUserId
      );

    if (errorCompensacion) {

      console.error(
        "Compensación de alta fallida",
        {
          authUserId,
          message: errorCompensacion.message
        }
      );

      const fallo = new Error(
        "Alta incompleta: requiere revisión administrativa"
      );

      fallo.status = 500;
      throw fallo;
    }

    throw error;
  }
}

// ==========================================
// 4. OBTENER USUARIO POR ID
// ==========================================

// Recupera los datos de un usuario y su rol.
// No devuelve contraseñas ni credenciales.

export async function obtenerUsuario(id) {

  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.tipo_documento,
       u.numero_documento,
       u.nombre,
       u.apellido,
       u.email,
       u.activo,
       u.debe_cambiar_password,
       r.nombre AS rol
     FROM public.usuarios AS u
     INNER JOIN public.roles AS r
       ON r.id = u.rol_id
     WHERE u.id = $1`,
    [id]
  );

  // Si el usuario no existe, devuelve null.
  return rows[0] ?? null;
}

// ==========================================
// 5. ACTUALIZAR DATOS DEL USUARIO
// ==========================================

// Actualiza únicamente datos personales.
//
// No modifica:
// - Correo electrónico.
// - Rol.
// - Contraseña.
// - Estado de la cuenta.
// - Identificador de Supabase Auth.

export async function actualizarUsuario(id, datos) {

  const { rows } = await pool.query(
    `UPDATE public.usuarios
     SET
       tipo_documento = $1,
       numero_documento = $2,
       nombre = $3,
       apellido = $4
     WHERE id = $5
     RETURNING
       id,
       tipo_documento,
       numero_documento,
       nombre,
       apellido,
       email,
       activo`,
    [
      datos.tipo_documento,
      datos.numero_documento,
      datos.nombre,
      datos.apellido,
      id
    ]
  );

  // Devuelve null cuando el ID no existe.
  return rows[0] ?? null;
}

// ==========================================
// 6. CAMBIAR ESTADO DEL USUARIO
// ==========================================

// Activa o desactiva el acceso institucional
// mediante el campo public.usuarios.activo.
//
// El middleware autenticar consulta este
// indicador antes de permitir operaciones.

export async function cambiarEstadoUsuario(
  id,
  activo
) {

  const { rows } = await pool.query(
    `UPDATE public.usuarios
     SET activo = $1
     WHERE id = $2
     RETURNING
       id,
       nombre,
       email,
       activo`,
    [activo, id]
  );

  return rows[0] ?? null;
}


export async function restablecerPasswordUsuario(id) {
  // 1. Consultar identidad vinculada con Supabase Auth.
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.auth_user_id,
       u.nombre,
       u.apellido,
       u.email,
       u.activo,
       r.nombre AS rol
     FROM public.usuarios u
     INNER JOIN public.roles r ON r.id = u.rol_id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  );

  const usuario = rows[0];

  if (!usuario) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  if (!usuario.activo) {
    const error = new Error(
      "No se puede restablecer una cuenta inactiva"
    );
    error.status = 409;
    throw error;
  }

  if (!usuario.auth_user_id) {
    const error = new Error(
      "El usuario no tiene identidad vinculada"
    );
    error.status = 409;
    throw error;
  }

  // 2. Generar una contraseña temporal aleatoria.
  const passwordTemporal = generarPasswordTemporal();

  // 3. Marcar el cambio como obligatorio antes de
  // actualizar Supabase, evitando una ventana en la
  // que la nueva clave permita acceso normal.
  await pool.query(
    `UPDATE public.usuarios
     SET debe_cambiar_password = TRUE
     WHERE id = $1`,
    [usuario.id]
  );

  // 4. Actualizar la credencial en Supabase Auth.
  const { error: errorAuth } =
    await supabaseAdmin.auth.admin.updateUserById(
      usuario.auth_user_id,
      { password: passwordTemporal }
    );

  if (errorAuth) {
    const error = new Error(
      "No se pudo restablecer la contraseña en Supabase Auth. " +
      "La cuenta quedó pendiente de cambio de contraseña; " +
      "un administrador debe reintentar la operación."
    );
    error.status = 502;
    throw error;
  }

  // 5. Devolver la credencial una sola vez.
  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
    },
    credencialTemporal: passwordTemporal,
  };
}
