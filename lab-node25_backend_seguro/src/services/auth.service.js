
import { API_URL } from "../config/api";

async function procesarRespuesta(respuesta) {
  const tipo = respuesta.headers.get("content-type") || "";

  if (!tipo.includes("application/json")) {
    throw new Error(
      `Respuesta inesperada del servidor: HTTP ${respuesta.status}`
    );
  }

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(
      datos.mensaje ||
      datos.error ||
      `Error HTTP ${respuesta.status}`
    );

    error.status = respuesta.status;
    error.codigo = datos.codigo;

    throw error;
  }

  return datos;
}

export async function iniciarSesion(email, password) {
  const respuesta = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });

  return procesarRespuesta(respuesta);
}

export async function obtenerPerfil(token) {
  const respuesta = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return procesarRespuesta(respuesta);
}

export async function cambiarPassword(
  token,
  passwordActual,
  passwordNueva
) {
  const respuesta = await fetch(
    `${API_URL}/api/auth/cambiar-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        passwordActual,
        passwordNueva,
      }),
    }
  );

  return procesarRespuesta(respuesta);
}
