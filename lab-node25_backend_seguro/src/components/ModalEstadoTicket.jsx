
import { useState } from "react";

const ETIQUETAS = {
  abierto: "Abierto",
  asignado: "Asignado",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  reabierto: "Reabierto",
};

export default function ModalEstadoTicket({
  ticket,
  transiciones = [],
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const [estado, setEstado] = useState("");
  const [solucion, setSolucion] = useState(
    ticket.solucion || ""
  );

  const requiereSolucion = [
    "resuelto",
    "cerrado",
  ].includes(estado);

  function enviar(evento) {
    evento.preventDefault();

    if (
      guardando ||
      !transiciones.includes(estado) ||
      (requiereSolucion && !solucion.trim())
    ) {
      return;
    }

    onGuardar({
      estado,
      ...(solucion.trim()
        ? { solucion: solucion.trim() }
        : {}),
    });
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-estado-ticket"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <div>
                <h2
                  id="titulo-estado-ticket"
                  className="modal-title h5 fw-bold"
                >
                  Gestionar estado del ticket
                </h2>

                <p className="small text-secondary mb-0">
                  Ticket #{ticket.id}
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={onCerrar}
                disabled={guardando}
                aria-label="Cerrar"
              />
            </div>

            <form onSubmit={enviar}>
              <div className="modal-body p-4">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <div className="fw-semibold">
                    {ticket.titulo}
                  </div>

                  <div className="small text-secondary mt-1">
                    Estado actual:{" "}
                    {ETIQUETAS[ticket.estado] || ticket.estado}
                  </div>
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="nuevo-estado-ticket"
                    className="form-label"
                  >
                    Nuevo estado *
                  </label>

                  <select
                    id="nuevo-estado-ticket"
                    className="form-select"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    required
                    disabled={guardando}
                  >
                    <option value="">
                      Selecciona la siguiente etapa
                    </option>

                    {transiciones.map((valor) => (
                      <option key={valor} value={valor}>
                        {ETIQUETAS[valor] || valor}
                      </option>
                    ))}
                  </select>
                </div>

                {(estado === "resuelto" ||
                  estado === "cerrado" ||
                  Boolean(ticket.solucion)) && (
                  <div className="mb-3">
                    <label
                      htmlFor="solucion-ticket"
                      className="form-label"
                    >
                      Solución registrada
                      {requiereSolucion ? " *" : ""}
                    </label>

                    <textarea
                      id="solucion-ticket"
                      className="form-control"
                      rows={5}
                      maxLength={5000}
                      value={solucion}
                      onChange={(e) =>
                        setSolucion(e.target.value)
                      }
                      required={requiereSolucion}
                      disabled={guardando}
                      placeholder="Describe el diagnóstico, las acciones realizadas y el resultado."
                    />

                    <div className="form-text">
                      {solucion.length}/5000 caracteres
                    </div>
                  </div>
                )}

                <div className="alert alert-info small mb-0">
                  El cambio será validado por el backend
                  según el estado actual y los permisos
                  de tu cuenta.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCerrar}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardando ||
                    !estado ||
                    (requiereSolucion && !solucion.trim())
                  }
                >
                  {guardando
                    ? "Actualizando..."
                    : "Confirmar cambio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop show"
        style={{ zIndex: 1055 }}
      />
    </>
  );
}
