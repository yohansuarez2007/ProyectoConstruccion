
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { menuPorRol } from "../config/menu";
import ToastBienvenida from "../components/ToastBienvenida";

import FlujoTickets from "../components/FlujoTickets";
import AnaliticaTickets from "../components/AnaliticaTickets";
import { listarTickets } from "../services/tickets.service";

export default function Dashboard() {
  const { usuario, token } = useAuth();
  const [ticketsAnalitica, setTicketsAnalitica] = useState([]);
  const [cargandoAnalitica, setCargandoAnalitica] = useState(true);
  const [errorAnalitica, setErrorAnalitica] = useState("");
  const [recargaAnalitica, setRecargaAnalitica] = useState(0);

  useEffect(() => {
    if (!token) { return; }
    const controlador = new AbortController();
    async function cargarAnalitica() {
      setCargandoAnalitica(true);
      try {
        const datos = await listarTickets(token, "todos", controlador.signal);
        if (!Array.isArray(datos)) throw new Error("El servidor no devolvió una lista de tickets.");
        if (!controlador.signal.aborted) { setTicketsAnalitica(datos); setErrorAnalitica(""); }
      } catch (err) {
        if (!controlador.signal.aborted) setErrorAnalitica(err instanceof Error ? err.message : "Error de consulta");
      } finally {
        if (!controlador.signal.aborted) setCargandoAnalitica(false);
      }
    }
    cargarAnalitica();
    return () => controlador.abort();
  }, [token, recargaAnalitica]);

  const [mostrarBienvenida, setMostrarBienvenida] = useState(
    () =>
      sessionStorage.getItem("nexdesk_mostrar_bienvenida") === "1"
  );

  const cerrarBienvenida = useCallback(() => {
    sessionStorage.removeItem("nexdesk_mostrar_bienvenida");
    setMostrarBienvenida(false);
  }, []);

  const nombre = usuario?.nombre?.split(" ")[0] || "usuario";
  const opciones = menuPorRol(usuario?.rol);
  const modulos = opciones.filter(
    (opcion) => opcion.ruta !== "/dashboard"
  );

  const descripciones = {
    "/usuarios": "Administración de cuentas y permisos.",
    "/tecnicos": "Gestión del personal de soporte.",
    "/categorias": "Clasificación de solicitudes.",
    "/tickets": "Registro y gestión de incidentes.",
    "/seguimientos": "Trazabilidad de las atenciones.",
  };

  return (
    <div className="container-fluid">
      <div className="mb-4">
        <div className="text-secondary small mb-1">
          Inicio / Panel de control
        </div>

        <h1 className="h3 fw-bold mb-2">
          ¡Hola, {nombre}! 👋
        </h1>

        <p className="text-secondary mb-0">
          Bienvenido al centro de gestión de NEXDESK.
        </p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-md-8">
              <div className="text-secondary small mb-2">
                CUENTA AUTENTICADA
              </div>

              <h2 className="h5 fw-bold">
                {[usuario?.nombre, usuario?.apellido]
                  .filter(Boolean)
                  .join(" ")}
              </h2>

              <p className="text-secondary mb-2">
                {usuario?.email}
              </p>

              <span className="badge text-bg-primary">
                {usuario?.rol}
              </span>
            </div>

            <div className="col-md-4 text-md-end">
              <Link
                to="/cambiar-password"
                className="btn btn-outline-primary"
              >
                Seguridad de mi cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AnaliticaTickets
        tickets={ticketsAnalitica}
        cargando={cargandoAnalitica}
        error={errorAnalitica}
        onActualizar={() => setRecargaAnalitica(n => n + 1)}
      />

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h5 fw-bold mb-0">
          Módulos disponibles
        </h2>
        <span className="text-secondary small">
          Según tu rol
        </span>
      </div>

      <div className="row g-3">
        {modulos.map((modulo) => (
          <div
            className="col-12 col-md-6 col-xl-4"
            key={modulo.ruta}
          >
            <Link
              to={modulo.ruta}
              className="text-decoration-none"
            >
              <div className="card nexdesk-module-card h-100 border-0 shadow-sm rounded-4">
                <div className="card-body p-4">
                  <div className="nexdesk-module-icon mb-3">
                    {modulo.icono}
                  </div>

                  <h3 className="h6 fw-bold text-dark">
                    {modulo.titulo}
                  </h3>

                  <p className="text-secondary small mb-3">
                    {descripciones[modulo.ruta]}
                  </p>

                  <span className="small fw-semibold text-primary">
                    Abrir módulo →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="alert alert-light border mt-4 rounded-3">
        <FlujoTickets />
        Los módulos se conectarán a la API REST de NEXDESK
        en los siguientes bloques.
      </div>

      {mostrarBienvenida && (
        <ToastBienvenida
          nombre={nombre}
          onCerrar={cerrarBienvenida}
        />
      )}
    </div>
  );
}
