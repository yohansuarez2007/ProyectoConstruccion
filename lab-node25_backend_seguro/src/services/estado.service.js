import { API_URL } from "../config/api";

export async function consultarEstadoBackend() {
  const respuesta = await fetch(`${API_URL}/api/estado`);

  if (!respuesta.ok) {
    throw new Error(`Error HTTP ${respuesta.status}`);
  }

  return respuesta.json();
}