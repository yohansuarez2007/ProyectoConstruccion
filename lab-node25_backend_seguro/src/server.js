import app from "./app.js";
import { pool } from "./config/db.js";
import { env } from "./config/env.js";

// Inicia el servidor HTTP usando el puerto y la dirección configurados.
const server = app.listen(env.port, env.host, () => {
  // Muestra en consola la URL donde está disponible la API.
  console.log(`API Help Desk: http://${env.host}:${env.port}`);
});

// Detiene el servidor y cierra la conexión con la base de datos de forma ordenada.
async function detener() {
  // Espera a que el servidor deje de aceptar nuevas solicitudes.
  server.close(async () => {
    try {
      // Libera todas las conexiones del pool de PostgreSQL/Supabase.
      await pool.end();
    } catch {
      // Indica que ocurrió un error durante el cierre.
      process.exitCode = 1;
    }
  });
}

// Ejecuta la función de apagado cuando el proceso recibe estas señales.
process.on("SIGINT", detener);
process.on("SIGTERM", detener);
