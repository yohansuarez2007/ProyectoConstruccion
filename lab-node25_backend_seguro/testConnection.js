import { comprobarConexion, pool } from "./src/config/db.js";

async function testConnection() {
    try {
        console.log("Probando conexión con Supabase...");

        const conectado = await comprobarConexion();

        if (conectado) {
            console.log("CONEXIÓN EXITOSA");
            console.log("PostgreSQL está respondiendo correctamente.");
        } else {
            console.log("No se pudo verificar la conexión.");
        }

    } catch (error) {
        console.error("ERROR DE CONEXIÓN:");
        console.error(error.message);
        console.error("Código:", error.code ?? "No disponible");

    } finally {
        await pool.end();
    }
}

testConnection();