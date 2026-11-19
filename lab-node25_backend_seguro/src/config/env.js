import "dotenv/config";
// Carga automáticamente las variables definidas en el archivo .env.

// ========================================
// LAB NODE 24 - CONFIGURACION DE ENTORNO
// ========================================

// Validar numeros enteros positivos
function int(value, fallback) {
  // Usa el valor recibido o, si no existe, el valor predeterminado.
  const n = Number(value ?? fallback);

  // Solo se permiten números enteros positivos para esta configuración.
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("Configuracion numerica invalida");
  }

  return n;
}

// ========================================
// ENTORNO DE EJECUCION
// ========================================

// Define el entorno actual; por defecto se ejecuta en desarrollo.
const nodeEnv = process.env.NODE_ENV ?? "development";

// ========================================
// DIAGNOSTICOS DEL LABORATORIO
// ========================================

// Los diagnósticos solo se activan cuando la variable tiene exactamente "true".
const diagnosticsEnabled = process.env.LAB_DIAGNOSTICS_ENABLED === "true";

// Token utilizado para proteger las funciones de diagnóstico.
const diagnosticsToken = process.env.LAB_DIAGNOSTICS_TOKEN ?? "";

// ========================================
// VALIDAR BASE DE DATOS
// ========================================

// La aplicación necesita esta URL para conectarse a PostgreSQL/Supabase.
if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en el archivo .env");
}

// ========================================
// VALIDAR SEGURIDAD
// ========================================

// Por seguridad, los diagnósticos no pueden estar activos en producción.
if (diagnosticsEnabled && nodeEnv === "production") {
  throw new Error("Los diagnosticos no pueden habilitarse en produccion");
}

// Si los diagnósticos están activos, el token debe ser suficientemente largo.
if (diagnosticsEnabled && diagnosticsToken.length < 32) {
  throw new Error("LAB_DIAGNOSTICS_TOKEN debe tener al menos 32 caracteres");
}

// ========================================
// EXPORTAR CONFIGURACION
// ========================================

// Agrupa la configuración y evita que otros módulos la modifiquen accidentalmente.
export const env = Object.freeze({
  // Servidor
  nodeEnv,
  // Puerto HTTP; se utiliza 3000 si PORT no está definido.
  port: int(process.env.PORT, 3000),
  // Dirección de red local donde escucha el servidor.
  host: process.env.HOST ?? "127.0.0.1",

  // PostgreSQL / Supabase
  // Cadena de conexión a la base de datos.
  databaseUrl: process.env.DATABASE_URL,

  // SSL / TLS
  // SSL está activo por defecto y solo se desactiva con PGSSL="false".
  pgSsl: process.env.PGSSL !== "false",

  // Ruta opcional al certificado de la autoridad certificadora.
  pgSslCaPath: process.env.PGSSL_CA_PATH ?? "",

  // Pool de conexiones
  // Máximo de conexiones simultáneas del pool; el valor predeterminado es 5.
  pgPoolMax: int(process.env.PGPOOL_MAX, 5),

  // Seguridad del laboratorio
  // Indica si las funciones de diagnóstico están habilitadas.
  diagnosticsEnabled,
  // Token conservado para autenticar las solicitudes de diagnóstico.
  diagnosticsToken,
});
