
import * as service from "../services/usuarios.service.js";

// ==========================================
// CONTROLADOR DE USUARIOS - NEXDESK
// LAB NODE 26
// ==========================================

// ==========================================
// 1. LISTAR USUARIOS
// GET /api/usuarios
// ==========================================

export async function listar(req, res, next) {
  try {

    // ======================================
    // 1.1 CONSULTAR USUARIOS
    // ======================================

    const usuarios = await service.listarUsuarios();

    // ======================================
    // 1.2 FILTRAR SEGÚN EL ROL
    // ======================================

    // superadmin: puede consultar todos.
    //
    // admin: no puede consultar cuentas
    // administrativas ni de superadmin.

    const usuariosPermitidos = usuarios.filter(
      (usuario) =>
        req.usuario.rol === "superadmin" ||
        !["superadmin", "admin"].includes(usuario.rol)
    );

    // ======================================
    // 1.3 DEVOLVER RESULTADOS
    // ======================================

    res.status(200).json(usuariosPermitidos);

  } catch (error) {
    next(error);
  }
}

// ==========================================
// 2. CREAR USUARIO
// POST /api/usuarios
// ==========================================

export async function crear(req, res, next) {
  try {

    // ======================================
    // 2.1 REGISTRAR USUARIO
    // ======================================

    const resultado =
      await service.crearUsuario(req.body);

    // ======================================
    // 2.2 EVITAR CACHÉ
    // ======================================

    // La respuesta incluye una contraseña
    // temporal para el laboratorio local.
    //
    // No debe almacenarse ni registrarse
    // en logs o repositorios.

    res.set("Cache-Control", "no-store");

    // ======================================
    // 2.3 RESPUESTA EXITOSA
    // ======================================

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: resultado.usuario,
      credencialTemporal: resultado.passwordTemporal
    });

  } catch (error) {
    next(error);
  }
}

// ==========================================
// 3. OBTENER USUARIO POR ID
// GET /api/usuarios/:id
// ==========================================

export async function obtener(req, res, next) {
  try {

    // ======================================
    // 3.1 CONSULTAR USUARIO
    // ======================================

    const usuario =
      await service.obtenerUsuario(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      });
    }

    // ======================================
    // 3.2 CONTROL DE ACCESO
    // ======================================

    // Un admin no puede consultar
    // cuentas admin o superadmin.

    if (
      req.usuario.rol === "admin" &&
      ["admin", "superadmin"].includes(usuario.rol)
    ) {
      return res.status(403).json({
        error: "No puede consultar esta cuenta"
      });
    }

    // ======================================
    // 3.3 RESPUESTA EXITOSA
    // ======================================

    res.status(200).json(usuario);

  } catch (error) {
    next(error);
  }
}

// ==========================================
// 4. ACTUALIZAR USUARIO
// PUT /api/usuarios/:id
// ==========================================

export async function actualizar(req, res, next) {
  try {

    // ======================================
    // 4.1 CONSULTAR USUARIO OBJETIVO
    // ======================================

    const objetivo =
      await service.obtenerUsuario(req.params.id);

    if (!objetivo) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      });
    }

    // ======================================
    // 4.2 CONTROL DE ACCESO
    // ======================================

    // Un admin no puede modificar
    // cuentas admin o superadmin.

    if (
      req.usuario.rol === "admin" &&
      ["admin", "superadmin"].includes(objetivo.rol)
    ) {
      return res.status(403).json({
        error: "No puede modificar esta cuenta"
      });
    }

    // ======================================
    // 4.3 ACTUALIZAR DATOS PERSONALES
    // ======================================

    // El servicio únicamente modifica:
    // - tipo_documento
    // - numero_documento
    // - nombre
    // - apellido
    //
    // No modifica correo, rol o contraseña.

    const usuario =
      await service.actualizarUsuario(
        req.params.id,
        req.body
      );

    // ======================================
    // 4.4 RESPUESTA EXITOSA
    // ======================================

    res.status(200).json(usuario);

  } catch (error) {
    next(error);
  }
}

// ==========================================
// 5. CAMBIAR ESTADO DEL USUARIO
// PATCH /api/usuarios/:id/estado
// ==========================================

export async function cambiarEstado(req, res, next) {
  try {

    // ======================================
    // 5.1 OBTENER IDENTIFICADOR
    // ======================================

    const id = Number(req.params.id);

    // ======================================
    // 5.2 EVITAR AUTODESACTIVACIÓN
    // ======================================

    // No se permite desactivar la propia
    // cuenta administrativa.

    if (
      id === req.usuario.id &&
      req.body.activo === false
    ) {
      return res.status(403).json({
        error: "No puede desactivar su propia cuenta"
      });
    }

    // ======================================
    // 5.3 CONSULTAR USUARIO OBJETIVO
    // ======================================

    const objetivo =
      await service.obtenerUsuario(id);

    if (!objetivo) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      });
    }

    // ======================================
    // 5.4 CONTROL DE ACCESO
    // ======================================

    // Un admin no puede modificar
    // cuentas admin o superadmin.

    if (
      req.usuario.rol === "admin" &&
      ["admin", "superadmin"].includes(objetivo.rol)
    ) {
      return res.status(403).json({
        error: "No puede modificar esta cuenta"
      });
    }

    // ======================================
    // 5.5 ACTUALIZAR ESTADO
    // ======================================

    const usuario =
      await service.cambiarEstadoUsuario(
        id,
        req.body.activo
      );

    // ======================================
    // 5.6 RESPUESTA EXITOSA
    // ======================================

    res.status(200).json(usuario);

  } catch (error) {
    next(error);
  }
}


export async function restablecerPassword(req, res, next) {
  try {
    const id = Number(req.params.id);

    // No permitir restablecer la propia cuenta
    // mediante esta operación administrativa.
    if (id === Number(req.usuario.id)) {
      return res.status(403).json({
        error:
          "No puede restablecer su propia contraseña desde administración",
      });
    }

    const objetivo = await service.obtenerUsuario(id);

    if (!objetivo) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    // Ninguna cuenta superadmin se restablece
    // mediante este endpoint.
    if (objetivo.rol === "superadmin") {
      return res.status(403).json({
        error:
          "La recuperación de superadmin requiere un procedimiento especial",
      });
    }

    // Admin solo puede restablecer técnico y usuario.
    if (
      req.usuario.rol === "admin" &&
      !["tecnico", "usuario"].includes(objetivo.rol)
    ) {
      return res.status(403).json({
        error:
          "No tiene permisos para restablecer esta cuenta",
      });
    }

    const resultado =
      await service.restablecerPasswordUsuario(id);

    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");

    return res.status(200).json({
      mensaje: "Contraseña temporal generada correctamente",
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
}
