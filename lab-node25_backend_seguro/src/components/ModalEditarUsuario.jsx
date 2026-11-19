
import { useState } from "react";

const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "PA", "PPT", "OTRO"];

export default function ModalEditarUsuario({
  usuario,
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const [formulario, setFormulario] = useState(() => ({
    tipo_documento: usuario.tipo_documento || "CC",
    numero_documento: usuario.numero_documento || "",
    nombre: usuario.nombre || "",
    apellido: usuario.apellido || "",
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
      tipo_documento: formulario.tipo_documento,
      numero_documento:
        formulario.numero_documento.trim().toUpperCase(),
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
    });
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-editar-usuario"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header px-4">
              <div>
                <h2
                  id="titulo-editar-usuario"
                  className="modal-title h5 fw-bold"
                >
                  Editar usuario
                </h2>
                <p className="small text-secondary mb-0">
                  ID #{usuario.id} · {usuario.email}
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

                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="editar-nombre" className="form-label">
                      Nombre *
                    </label>
                    <input
                      id="editar-nombre"
                      name="nombre"
                      className="form-control"
                      value={formulario.nombre}
                      onChange={cambiar}
                      maxLength={100}
                      required
                      disabled={guardando}
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="editar-apellido" className="form-label">
                      Apellido *
                    </label>
                    <input
                      id="editar-apellido"
                      name="apellido"
                      className="form-control"
                      value={formulario.apellido}
                      onChange={cambiar}
                      maxLength={100}
                      required
                      disabled={guardando}
                    />
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="editar-tipo" className="form-label">
                      Tipo de documento *
                    </label>
                    <select
                      id="editar-tipo"
                      name="tipo_documento"
                      className="form-select"
                      value={formulario.tipo_documento}
                      onChange={cambiar}
                      disabled={guardando}
                      required
                    >
                      {TIPOS_DOCUMENTO.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-7">
                    <label htmlFor="editar-documento" className="form-label">
                      Número de documento *
                    </label>
                    <input
                      id="editar-documento"
                      name="numero_documento"
                      className="form-control"
                      value={formulario.numero_documento}
                      onChange={cambiar}
                      pattern="[A-Za-z0-9-]{4,30}"
                      maxLength={30}
                      required
                      disabled={guardando}
                    />
                  </div>
                </div>

                <div className="alert alert-light border mt-4 mb-0 small">
                  El correo electrónico, el rol y la contraseña
                  no se modifican desde este formulario.
                </div>
              </div>

              <div className="modal-footer px-4">
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
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
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
