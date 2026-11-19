
import { supabaseAuth } from "../config/supabase.js";
import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { pool } from "../config/db.js";

// ==========================================
// 1. INICIO DE SESIÓN
// POST /api/auth/login
// ==========================================


export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // 1. Verificar credenciales con Supabase Auth.
    const { data, error } =
      await supabaseAuth.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data?.session || !data?.user) {
      return res.status(401).json({
        error: "Credenciales inválidas",
      });
    }

    // 2. Consultar cuenta y rol institucional.
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.activo,
         u.debe_cambiar_password,
         r.nombre AS rol,
         r.activo AS rol_activo
       FROM public.usuarios AS u
       INNER JOIN public.roles AS r
         ON r.id = u.rol_id
       WHERE u.auth_user_id = $1
       LIMIT 1`,
      [data.user.id]
    );

    const usuario = rows[0];

    // 3. Bloquear cuentas o roles inactivos.
    if (
      !usuario ||
      !usuario.activo ||
      !usuario.rol_activo
    ) {
      return res.status(403).json({
        error: "Cuenta no habilitada en RICAREPA ALIMAR",
      });
    }

    // 4. Entregar token solamente a cuentas habilitadas.
    return res.status(200).json({
      access_token: data.session.access_token,
      token_type: "Bearer",
      expires_in: data.session.expires_in,
    });

  } catch (error) {
    next(error);
  }
}


export async function solicitarRecuperacion(req, res, next) {
  try {
    const { email } = req.body;

    const mensaje =
      "Si el correo está registrado, recibirá instrucciones para recuperar el acceso.";

    // Consultar la cuenta sin revelar su existencia.
    const { rows } = await pool.query(
      `SELECT u.activo, r.activo AS rol_activo
       FROM public.usuarios u
       INNER JOIN public.roles r ON r.id = u.rol_id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const cuenta = rows[0];

    // No enviar recuperación para cuentas no habilitadas.
    // La respuesta pública es siempre la misma.
    if (!cuenta?.activo || !cuenta?.rol_activo) {
      return res.status(200).json({ mensaje });
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("Falta configurar FRONTEND_URL");
    }

    const { error } =
      await supabaseAuth.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            `${frontendUrl}/restablecer-password`,
        }
      );

    if (error) {
      // Registrar únicamente información operativa.
      // No exponer al cliente detalles de Supabase.
      console.error(
        "No se pudo solicitar recuperación:",
        error.message
      );
    }

    return res.status(200).json({ mensaje });

  } catch (error) {
    next(error);
  }
}


// ==========================================
// 2. PERFIL DEL USUARIO
// GET /api/auth/me
// ==========================================

export function perfil(req, res) {
  return res.status(200).json({
    usuario: req.usuario
  });
}

// ==========================================
// 3. CAMBIO OBLIGATORIO DE CONTRASEÑA
// PATCH /api/auth/cambiar-password
// ==========================================

export async function cambiarPassword(req, res, next) {
  try {

    // ======================================
    // 3.1 OBTENER CONTRASEÑAS
    // ======================================

    const { passwordActual, passwordNueva } = req.body ?? {};

    // ======================================
    // 3.2 VALIDAR DATOS DE ENTRADA
    // ======================================

    if (
      typeof passwordActual !== "string" ||
      typeof passwordNueva !== "string"
    ) {
      return res.status(400).json({
        error: "Las contraseñas son obligatorias"
      });
    }

    // Requisitos mínimos de contraseña.
    if (
      passwordNueva.length < 12 ||
      passwordNueva.length > 128
    ) {
      return res.status(400).json({
        error: "La nueva contraseña debe tener entre 12 y 128 caracteres"
      });
    }

    // Evitar reutilizar la contraseña actual.
    if (passwordActual === passwordNueva) {
      return res.status(400).json({
        error: "La nueva contraseña debe ser diferente de la actual"
      });
    }

    // ======================================
    // 3.3 VERIFICAR CONTRASEÑA ACTUAL
    // ======================================

    // Reautenticar al titular mediante Supabase Auth.
    const { data, error } =
      await supabaseAuth.auth.signInWithPassword({
        email: req.usuario.email,
        password: passwordActual
      });

    if (
      error ||
      !data?.user ||
      data.user.id !== req.usuario.authUserId
    ) {
      return res.status(401).json({
        error: "No se pudo verificar la contraseña actual"
      });
    }

    // ======================================
    // 3.4 ACTUALIZAR CONTRASEÑA
    // ======================================

    // Operación administrativa de Supabase Auth.
    const { error: errorCambio } =
      await supabaseAdmin.auth.admin.updateUserById(
        req.usuario.authUserId,
        {
          password: passwordNueva
        }
      );

    if (errorCambio) {
      return res.status(502).json({
        error: "No se pudo actualizar la contraseña"
      });
    }

    // ======================================
    // 3.5 ACTUALIZAR INDICADOR EN POSTGRESQL
    // ======================================

    await pool.query(
      `UPDATE public.usuarios
       SET debe_cambiar_password = FALSE
       WHERE id = $1
         AND auth_user_id = $2`,
      [
        req.usuario.id,
        req.usuario.authUserId
      ]
    );

    // ======================================
    // 3.6 RESPUESTA EXITOSA
    // ======================================

    return res.status(200).json({
      mensaje: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    next(error);
  }
}
