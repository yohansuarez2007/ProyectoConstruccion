
import { useState } from "react";

export default function ModalCategoria({
  categoria,
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const editando = Boolean(categoria);

  const [formulario, setFormulario] = useState(() => ({
    nombre: categoria?.nombre || "",
    descripcion: categoria?.descripcion || "",
  }));

  function cambiar(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function enviar(evento) {
    evento.preventDefault();

    onGuardar({
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
    });
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-categoria"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <div>
                <h2
                  id="titulo-modal-categoria"
                  className="modal-title h5 fw-bold"
                >
                  {editando
                    ? "Editar categoría"
                    : "Registrar categoría"}
                </h2>

                <p className="small text-secondary mb-0">
                  Clasificación de solicitudes de soporte técnico
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
                  <label
                    htmlFor="categoria-nombre"
                    className="form-label"
                  >
                    Nombre de la categoría *
                  </label>

                  <input
                    id="categoria-nombre"
                    name="nombre"
                    className="form-control"
                    value={formulario.nombre}
                    onChange={cambiar}
                    maxLength={100}
                    placeholder="Ej. Redes y conectividad"
                    required
                    disabled={guardando}
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="categoria-descripcion"
                    className="form-label"
                  >
                    Descripción
                  </label>

                  <textarea
                    id="categoria-descripcion"
                    name="descripcion"
                    className="form-control"
                    rows={4}
                    maxLength={250}
                    value={formulario.descripcion}
                    onChange={cambiar}
                    placeholder="Describe qué solicitudes pertenecen a esta categoría"
                    disabled={guardando}
                  />

                  <div className="form-text text-end">
                    {formulario.descripcion.length}/250 caracteres
                  </div>
                </div>

                {!editando && (
                  <div className="alert alert-info small mb-0">
                    La categoría se registrará con el estado
                    predeterminado definido en PostgreSQL.
                  </div>
                )}
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
                    guardando || !formulario.nombre.trim()
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : editando
                      ? "Guardar cambios"
                      : "Registrar categoría"}
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
