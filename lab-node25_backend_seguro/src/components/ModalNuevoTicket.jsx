
import { useState } from "react";

export default function ModalNuevoTicket({
  categorias = [],
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const [formulario, setFormulario] = useState({
    titulo: "",
    descripcion: "",
    prioridad: "media",
    categoria_id: "",
  });

  function cambiar(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function enviar(evento) {
    evento.preventDefault();

    if (guardando) return;

    onGuardar({
      titulo: formulario.titulo.trim(),
      descripcion: formulario.descripcion.trim(),
      prioridad: formulario.prioridad,
      categoria_id: Number(formulario.categoria_id),
    });
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-ticket"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <div>
                <h2
                  id="titulo-nuevo-ticket"
                  className="modal-title h5 fw-bold"
                >
                  Registrar solicitud de soporte
                </h2>
                <p className="small text-secondary mb-0">
                  Describe el incidente o requerimiento.
                </p>
              </div>

              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onCerrar}
                disabled={guardando}
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
                  <label
                    htmlFor="ticket-titulo"
                    className="form-label"
                  >
                    Título de la solicitud *
                  </label>

                  <input
                    id="ticket-titulo"
                    name="titulo"
                    className="form-control"
                    value={formulario.titulo}
                    onChange={cambiar}
                    maxLength={200}
                    required
                    disabled={guardando}
                    placeholder="Ej. No puedo acceder al sistema"
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="ticket-descripcion"
                    className="form-label"
                  >
                    Descripción del problema *
                  </label>

                  <textarea
                    id="ticket-descripcion"
                    name="descripcion"
                    className="form-control"
                    rows={5}
                    value={formulario.descripcion}
                    onChange={cambiar}
                    required
                    disabled={guardando}
                    placeholder="Indica qué sucede, desde cuándo y qué acciones has intentado."
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-7">
                    <label
                      htmlFor="ticket-categoria"
                      className="form-label"
                    >
                      Categoría *
                    </label>

                    <select
                      id="ticket-categoria"
                      name="categoria_id"
                      className="form-select"
                      value={formulario.categoria_id}
                      onChange={cambiar}
                      required
                      disabled={guardando}
                    >
                      <option value="">
                        Selecciona una categoría
                      </option>

                      {categorias.map((categoria) => (
                        <option
                          key={categoria.id}
                          value={categoria.id}
                        >
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-5">
                    <label
                      htmlFor="ticket-prioridad"
                      className="form-label"
                    >
                      Prioridad *
                    </label>

                    <select
                      id="ticket-prioridad"
                      name="prioridad"
                      className="form-select"
                      value={formulario.prioridad}
                      onChange={cambiar}
                      disabled={guardando}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="alert alert-info small mt-4 mb-0">
                  La solicitud se registrará a nombre de
                  tu cuenta autenticada, con estado
                  inicial abierto. La asignación del técnico
                  se realizará posteriormente.
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
                    categorias.length === 0 ||
                    !formulario.titulo.trim() ||
                    !formulario.descripcion.trim() ||
                    !formulario.categoria_id
                  }
                >
                  {guardando
                    ? "Registrando..."
                    : "Registrar ticket"}
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
