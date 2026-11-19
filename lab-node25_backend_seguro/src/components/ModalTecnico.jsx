
import { useState } from "react";

export default function ModalTecnico({
  tecnico,
  usuariosDisponibles = [],
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  const editando = Boolean(tecnico);

  const [formulario, setFormulario] = useState(() => ({
    usuario_id: tecnico?.usuario_id
      ? String(tecnico.usuario_id)
      : "",
    especialidad: tecnico?.especialidad || "",
    disponible: tecnico?.disponible ?? true,
  }));

  function cambiar(evento) {
    const { name, value, type, checked } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function enviar(evento) {
    evento.preventDefault();

    const datos = {
      especialidad: formulario.especialidad.trim(),
      disponible: formulario.disponible,
    };

    if (!editando) {
      datos.usuario_id = Number(formulario.usuario_id);
    }

    onGuardar(datos);
  }

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-tecnico"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <h2
                id="titulo-modal-tecnico"
                className="modal-title h5 fw-bold"
              >
                {editando
                  ? "Editar perfil técnico"
                  : "Registrar perfil técnico"}
              </h2>

              <button
                type="button"
                className="btn-close"
                onClick={onCerrar}
                disabled={guardando}
                aria-label="Cerrar"
              />
            </div>

            <form onSubmit={enviar}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="tecnico-usuario"
                  >
                    Usuario asociado *
                  </label>

                  {editando ? (
                    <input
                      id="tecnico-usuario"
                      className="form-control"
                      value={`${tecnico.nombre} ${tecnico.apellido}`}
                      disabled
                      readOnly
                    />
                  ) : (
                    <select
                      id="tecnico-usuario"
                      name="usuario_id"
                      className="form-select"
                      value={formulario.usuario_id}
                      onChange={cambiar}
                      disabled={guardando}
                      required
                    >
                      <option value="">
                        Selecciona un usuario con rol técnico
                      </option>

                      {usuariosDisponibles.map((usuario) => (
                        <option
                          key={usuario.id}
                          value={usuario.id}
                        >
                          {usuario.nombre} {usuario.apellido}
                          {" — "}
                          {usuario.email}
                        </option>
                      ))}
                    </select>
                  )}

                  {!editando && usuariosDisponibles.length === 0 && (
                    <div className="form-text text-warning">
                      No hay usuarios técnicos activos sin
                      perfil. Créalo primero en Usuarios.
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label
                    className="form-label"
                    htmlFor="tecnico-especialidad"
                  >
                    Especialidad *
                  </label>

                  <input
                    id="tecnico-especialidad"
                    name="especialidad"
                    className="form-control"
                    value={formulario.especialidad}
                    onChange={cambiar}
                    placeholder="Ej. Redes y conectividad"
                    minLength={2}
                    maxLength={100}
                    required
                    disabled={guardando}
                  />

                  <div className="form-text">
                    Describe el área de soporte que atiende.
                  </div>
                </div>

                <div className="form-check form-switch">
                  <input
                    id="tecnico-disponible"
                    name="disponible"
                    type="checkbox"
                    className="form-check-input"
                    checked={formulario.disponible}
                    onChange={cambiar}
                    disabled={guardando}
                  />

                  <label
                    className="form-check-label"
                    htmlFor="tecnico-disponible"
                  >
                    Disponible para asignación de tickets
                  </label>
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
                    (!editando &&
                      usuariosDisponibles.length === 0)
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : editando
                      ? "Guardar cambios"
                      : "Registrar técnico"}
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
