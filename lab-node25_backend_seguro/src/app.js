
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env.js";

// ==========================================
// 1. MIDDLEWARES DE SEGURIDAD
// ==========================================

import { exigirTokenLaboratorio } from "./middlewares/labToken.js";
import { autenticar } from "./middlewares/autenticar.js";
import { exigirPasswordActualizado } from "./middlewares/exigirPasswordActualizado.js";

// ==========================================
// 2. IMPORTACIÓN DE RUTAS
// ==========================================

import diagnosticoRoutes from "./routes/diagnostico.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import tecnicosRoutes from "./routes/tecnicos.routes.js";
import ticketsRoutes from "./routes/tickets.routes.js";
import seguimientosRoutes from "./routes/seguimientos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import notificacionesRoutes from "./routes/notificaciones.routes.js";

// ==========================================
// 3. INICIALIZACIÓN DE EXPRESS
// ==========================================

const app = express();

app.disable("x-powered-by");

// Cabeceras de seguridad HTTP
app.use(helmet());

// Configuración CORS para React + Vite
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Limitar tamaño del cuerpo JSON
app.use(express.json({ limit: "20kb" }));

// ==========================================
// 4. ENDPOINT PÚBLICO
// ==========================================

app.get("/api/estado", (req, res) => {
  return res.status(200).json({
    servicio: "nexdesk",
    estado: "activo",
  });
});

// ==========================================
// 5. AUTENTICACIÓN
// ==========================================

// Login, perfil y cambio de contraseña
app.use("/api/auth", authRoutes);

// ==========================================
// 6. ADMINISTRACIÓN DE USUARIOS
// ==========================================

// Este router ya contiene autenticación,
// validación de contraseña y RBAC.
app.use("/api/usuarios", usuariosRoutes);

// ==========================================
// 7. PROTECCIÓN DE MÓDULOS
// ==========================================

// JWT válido y contraseña actualizada
const protegerModulo = [
  autenticar,
  exigirPasswordActualizado,
];

// ==========================================
// 8. CATEGORÍAS
// ==========================================

// El router debe aplicar RBAC por operación.
app.use(
  "/api/categorias",
  ...protegerModulo,
  categoriasRoutes,
);

// ==========================================
// 9. TÉCNICOS
// ==========================================

// El router debe aplicar RBAC por operación.
app.use(
  "/api/tecnicos",
  ...protegerModulo,
  tecnicosRoutes,
);

// ==========================================
// 10. SEGUIMIENTOS
// ==========================================

// Registrar antes del router general de tickets.
app.use(
  "/api/tickets",
  ...protegerModulo,
  seguimientosRoutes,
);

// ==========================================
// 11. TICKETS
// ==========================================

app.use(
  "/api/tickets",
  ...protegerModulo,
  ticketsRoutes,
);

// ==========================================
// 12. NOTIFICACIONES
// ==========================================

// Requiere JWT válido y contraseña actualizada.
// El router debe controlar acceso por destinatario.
app.use(
  "/api/notificaciones",
  ...protegerModulo,
  notificacionesRoutes,
);

// ==========================================
// 13. DIAGNÓSTICOS DEL LABORATORIO
// ==========================================

if (env.diagnosticsEnabled) {
  app.use(
    "/api/laboratorio",
    exigirTokenLaboratorio,
    diagnosticoRoutes,
  );
}

// ==========================================
// 14. RUTAS NO ENCONTRADAS
// ==========================================

app.use((req, res) => {
  return res.status(404).json({
    error: "Ruta no encontrada",
  });
});

// ==========================================
// 15. MANEJO CENTRALIZADO DE ERRORES
// ==========================================

app.use((error, req, res, next) => {
  // JSON inválido
  if (
    error instanceof SyntaxError &&
    error.status === 400
  ) {
    return res.status(400).json({
      error: "JSON inválido",
    });
  }

  // Registro duplicado
  if (error.code === "23505") {
    return res.status(409).json({
      error: "El registro ya existe",
    });
  }

  // Restricción de clave foránea
  if (error.code === "23503") {
    return res.status(409).json({
      error: "Referencia inexistente o restringida",
    });
  }

  // Restricción CHECK
  if (error.code === "23514") {
    return res.status(400).json({
      error: "Restricción de base de datos incumplida",
    });
  }

  // Dato inválido para PostgreSQL
  if (error.code === "22P02") {
    return res.status(400).json({
      error: "Formato de dato inválido",
    });
  }

  // Errores de negocio controlados
  if (
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  // Registro técnico sin secretos
  console.error("ERROR NEXDESK:", {
    message: error.message,
    code: error.code,
    constraint: error.constraint,
    table: error.table,
  });

  return res.status(500).json({
    error: "Error interno del servidor",
  });
});

// ==========================================
// 16. EXPORTACIÓN
// ==========================================

export default app;
