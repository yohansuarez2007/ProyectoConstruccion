// Importa el cliente de PostgreSQL para Node.js.
import pg from "pg";

// Utilidades para leer el certificado y resolver su ruta absoluta.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Configuración validada de las variables de entorno.
import { env } from "./env.js";

// ========================================
// LAB NODE 24 - CONEXION POSTGRESQL
// ========================================

// Pool administra y reutiliza varias conexiones con PostgreSQL.
const { Pool } = pg;

// ========================================
// CONFIGURACION SSL / TLS
// ========================================

// Por defecto no se utiliza SSL. Se activa según la configuración del entorno.
let ssl = false;

if (env.pgSsl) {
  // Exige validar el certificado presentado por el servidor.
  ssl = {
    rejectUnauthorized: true,
  };

  // Si se indicó una ruta, carga el certificado de la autoridad certificadora.
  if (env.pgSslCaPath) {
    const rutaCertificado = resolve(process.cwd(), env.pgSslCaPath);

    const certificado = readFileSync(rutaCertificado, "utf8");

    ssl.ca = certificado;
  }
}

// ========================================
// CREAR POOL DE CONEXIONES
// ========================================

// Convierte la URL de conexión en un objeto modificable.
const databaseUrl = new URL(env.databaseUrl);

// Evita que parámetros SSL de la URI sobrescriban la configuración anterior.
for (const parametro of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
  databaseUrl.searchParams.delete(parametro);
}

export const pool = new Pool({
  // URL del servidor, base de datos y credenciales de PostgreSQL.
  connectionString: databaseUrl.toString(),

  // Configuración TLS, activada o desactivada según env.pgSsl.
  ssl,

  // Número máximo de conexiones simultáneas.
max: env.pgPoolMax,

// Espera para obtener una conexión.
connectionTimeoutMillis: 20000,

// Permanencia de conexiones inactivas.
idleTimeoutMillis: 30000,

// Límite de ejecución SQL.
statement_timeout: 15000,

// Límite de espera de consulta.
query_timeout: 20000,
});

// ========================================
// MANEJO DE ERRORES DEL POOL
// ========================================

// Captura errores inesperados en conexiones que están inactivas en el pool.
pool.on("error", (error) => {
  console.error("Error inesperado de PostgreSQL:", error.code ?? error.name);
});

// ========================================
// COMPROBAR CONEXION
// ========================================

export async function comprobarConexion() {
  // Consulta mínima para comprobar que la base de datos responde.
  const sql = `
    SELECT 1 AS conectado
  `;

  // pool.query obtiene una conexión, ejecuta la consulta y la devuelve al pool.
  const { rows } = await pool.query(sql);

  // Devuelve true únicamente si PostgreSQL respondió con el valor esperado.
  return rows[0]?.conectado === 1;
}
