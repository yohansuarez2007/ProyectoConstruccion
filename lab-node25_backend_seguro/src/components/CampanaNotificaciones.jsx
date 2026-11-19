
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import {
  listarNotificaciones,
  contarPendientes,
  marcarNotificacionLeida,
} from "../services/notificaciones.service";

export default function CampanaNotificaciones() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const actualizar = useCallback(
    async (signal) => {
      if (!token) return;

      try {
        const [lista, cuenta] = await Promise.all([
          listarNotificaciones(token, signal),
          contarPendientes(token, signal),
        ]);

        if (signal?.aborted) return;

        setAvisos(lista);
        setPendientes(cuenta.pendientes);
        setError("");
      } catch (e) {
        if (!signal?.aborted) {
          setError(e.message);
        }
      }
    },
    [token]
  );

  // Consultar cada 30 segundos
  useEffect(() => {
    if (
      !token ||
      usuario?.debe_cambiar_password ||
      usuario?.debeCambiarPassword
    ) {
      return;
    }

    const controller = new AbortController();

    Promise.resolve().then(() =>
      actualizar(controller.signal)
    );

    const intervalo = setInterval(() => {
      actualizar(controller.signal);
    }, 30000);

    return () => {
      controller.abort();
      clearInterval(intervalo);
    };
  }, [
    token,
    usuario?.debe_cambiar_password,
    usuario?.debeCambiarPassword,
    actualizar,
  ]);

  async function leer(aviso) {
    if (cargando) return;

    setCargando(true);

    try {
      if (!aviso.leida) {
        await marcarNotificacionLeida(token, aviso.id);
      }

      await actualizar();
      setAbierto(false);

      if (aviso.ticket_id) {
        navigate("/tickets");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-light position-relative"
        aria-label={`Notificaciones: ${pendientes} sin leer`}
        aria-expanded={abierto}
        onClick={() => {
          setAbierto(!abierto);

          if (!abierto) {
            void actualizar();
          }
        }}
      >
        <span aria-hidden="true">🔔</span>

        {pendientes > 0 && (
          <span
            className={
              "position-absolute top-0 start-100 " +
              "translate-middle badge rounded-pill bg-danger"
            }
          >
            {pendientes > 99 ? "99+" : pendientes}
          </span>
        )}
      </button>

      {abierto && (
        <div
          className={
            "card shadow position-absolute end-0 mt-2"
          }
          style={{
            width: "min(360px, 90vw)",
            zIndex: 1100,
          }}
        >
          <div
            className={
              "card-header d-flex " +
              "justify-content-between align-items-center"
            }
          >
            <strong>Notificaciones</strong>

            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() => setAbierto(false)}
            />
          </div>

          {error && (
            <div
              className="alert alert-warning m-2 small"
              role="alert"
            >
              {error}
            </div>
          )}

          <div
            className={
              "list-group list-group-flush overflow-auto"
            }
            style={{ maxHeight: 360 }}
          >
            {avisos.length === 0 && (
              <div className="p-3 text-secondary small">
                No tienes notificaciones.
              </div>
            )}

            {avisos.map((aviso) => (
              <button
                key={aviso.id}
                type="button"
                disabled={cargando}
                onClick={() => leer(aviso)}
                className={
                  "list-group-item list-group-item-action " +
                  "text-start " +
                  (!aviso.leida
                    ? "list-group-item-primary"
                    : "")
                }
              >
                <div
                  className={
                    "d-flex justify-content-between gap-2"
                  }
                >
                  <strong className="small">
                    {aviso.titulo}
                  </strong>

                  {!aviso.leida && (
                    <span className="badge bg-primary">
                      Nueva
                    </span>
                  )}
                </div>

                <div className="small">
                  {aviso.mensaje}
                </div>

                <small className="text-secondary">
                  {new Date(
                    aviso.fecha_creacion
                  ).toLocaleString("es-CO")}
                </small>
              </button>
            ))}
          </div>

          <div className="card-footer text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => void actualizar()}
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
