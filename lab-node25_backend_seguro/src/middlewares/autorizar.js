
 // ==========================================
 // MIDDLEWARE DE AUTORIZACIÓN RBAC - NEXDESK
 // ==========================================

export function autorizar(...rolesPermitidos) {

  return (req, res, next) => {

    // ======================================
    // 1. VERIFICAR AUTENTICACIÓN
    // ======================================

    // El middleware autenticar debe ejecutarse
    // previamente para construir req.usuario.

    if (!req.usuario) {
      return res.status(401).json({
        error: "Autenticación requerida",
      });
    }

    // ======================================
    // 2. VERIFICAR ROL DEL USUARIO
    // ======================================

    // Comprueba que el rol del usuario
    // pertenece a los roles autorizados
    // para ejecutar la operación.

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: "Permisos insuficientes",
      });
    }

    // ======================================
    // 3. AUTORIZAR OPERACIÓN
    // ======================================

    // Continúa hacia el controlador
    // cuando el usuario tiene permisos.

    next();
  };
}
