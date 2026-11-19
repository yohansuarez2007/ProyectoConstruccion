
import { useState } from "react";

export default function ModalAsignarTecnico({
  ticket,
  tecnicos = [],
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const [tecnicoId, setTecnicoId] = useState(
    ticket.tecnico_id ? String(ticket.tecnico_id) : ""
  );

  const elegibles = tecnicos.filter(
    (tecnico) =>
      tecnico.disponible === true &&
      tecnico.activo === true
  );

  function enviar(evento) {
    evento.preventDefault();

    if (!tecnicoId || guardando) return;

    onGuardar(Number(tecnicoId));
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-asignar-tecnico"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <div>
                <h2
                  id="titulo-asignar-tecnico"
                  className="modal-title h5 fw-bold"
                >
                  Asignar técnico
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
                  <div className="alert alert-danger">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <strong>{ticket.titulo}</strong>
                  <div className="small text-secondary mt-1">
                    Estado actual: {ticket.estado}
                  </div>
                </div>

                <label
                  htmlFor="tecnico-asignado"
                  className="form-label"
                >
                  Técnico responsable *
                </label>

                <select
                  id="tecnico-asignado"
                  className="form-select"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  disabled={guardando}
                  required
                >
                  <option value="">
                    Selecciona un técnico disponible
                  </option>

                  {elegibles.map((tecnico) => (
                    <option
                      key={tecnico.id}
                      value={tecnico.id}
                    >
                      {tecnico.nombre} {tecnico.apellido}
                      {" — "}
                      {tecnico.especialidad}
                    </option>
                  ))}
                </select>

                {elegibles.length === 0 && (
                  <div className="alert alert-warning mt-3 mb-0">
                    No existen técnicos activos y disponibles
                    para asignación.
                  </div>
                )}

                <div className="alert alert-info small mt-3 mb-0">
                  Al confirmar, el ticket pasará al estado
                  <strong> asignado</strong>. El técnico
                  seleccionado podrá atenderlo posteriormente.
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
                    !tecnicoId ||
                    !elegibles.some(
                      (tecnico) =>
                        String(tecnico.id) === tecnicoId
                    )
                  }
                >
                  {guardando
                    ? "Asignando..."
                    : "Confirmar asignación"}
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
