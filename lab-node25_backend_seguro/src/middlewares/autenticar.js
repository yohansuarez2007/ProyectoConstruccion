
import { supabaseAuth } from "../config/supabase.js";
import { pool } from "../config/db.js";

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN - NEXDESK
// ==========================================

export async function autenticar(req, res, next) {
  try {

    // ======================================
    // 1. OBTENER TOKEN BEARER
    // ======================================

    // Recupera el encabezado Authorization.
    const authorization =
      req.get("Authorization") ?? "";

    // Comprueba el formato Bearer <token>.
    const match = /^Bearer\s+(.+)$/i.exec(authorization);

    if (!match) {
      return res.status(401).json({
        error: "Token de acceso requerido",
      });
    }

    const token = match[1];

    // ======================================
    // 2. VALIDAR TOKEN CON SUPABASE AUTH
    // ======================================

    // Verifica el token y recupera la identidad
    // autenticada desde Supabase Auth.

    const { data, error } =
      await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        error: "Token inválido o expirado",
      });
    }

    // ======================================
    // 3. CONSULTAR USUARIO Y ROL
    // ======================================

    // Recupera el perfil institucional,
    // estado de la cuenta, rol y condición
    // de cambio obligatorio de contraseña.
    //
    // La consulta utiliza parámetros ($1)
    // para prevenir inyección SQL.

    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.auth_user_id,
         u.nombre,
         u.apellido,
         u.email,
         u.activo,
         u.debe_cambiar_password,
         r.nombre AS rol,
         r.activo AS rol_activo
       FROM public.usuarios AS u
       INNER JOIN public.roles AS r
         ON r.id = u.rol_id
       WHERE u.auth_user_id = $1
       LIMIT 1`,
      [data.user.id],
    );

    const usuario = rows[0];

    // ======================================
    // 4. VALIDAR ACCESO DEL USUARIO
    // ======================================

    // Rechaza usuarios inexistentes,
    // inactivos o asociados a roles inactivos.

    if (
      !usuario ||
      !usuario.activo ||
      !usuario.rol_activo
    ) {
      return res.status(403).json({
        error: "Cuenta no habilitada en RICAREPA ALIMAR",
      });
    }

    // ======================================
    // 5. CONSTRUIR USUARIO AUTENTICADO
    // ======================================

    // Almacena la identidad validada
    // para utilizarla en controladores
    // y middlewares de autorización RBAC.

    req.usuario = {
      id: usuario.id,
      authUserId: usuario.auth_user_id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      debeCambiarPassword:
        usuario.debe_cambiar_password,
    };

    // ======================================
    // 6. CONTINUAR CON LA SOLICITUD
    // ======================================

    // Permite continuar hacia los
    // middlewares y controladores siguientes.

    next();

  } catch (error) {

    // Delega errores inesperados al
    // manejador centralizado de Express.

    next(error);
  }
}
