
export default function ModalEstadoUsuario({
  usuario,
  guardando,
  error,
  onConfirmar,
  onCerrar,
}) {
  const desactivar = usuario.activo === true;

  const nombre = [usuario.nombre, usuario.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-estado-usuario"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-body p-4">
              <div
                className={`fs-1 mb-2 ${
                  desactivar ? "text-warning" : "text-success"
                }`}
              >
                {desactivar ? "⚠" : "✓"}
              </div>

              <h2
                id="titulo-estado-usuario"
                className="h5 fw-bold"
              >
                {desactivar
                  ? "¿Desactivar esta cuenta?"
                  : "¿Reactivar esta cuenta?"}
              </h2>

              <p className="text-secondary">
                {desactivar
                  ? "Se marcará la cuenta como inactiva."
                  : "Se marcará la cuenta como activa."}
              </p>

              <div className="border rounded-3 p-3 mb-3">
                <strong>{nombre}</strong>
                <div className="small text-secondary">
                  {usuario.email}
                </div>
                <div className="small text-secondary">
                  Rol: {usuario.rol}
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCerrar}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className={`btn ${
                    desactivar ? "btn-danger" : "btn-success"
                  }`}
                  onClick={onConfirmar}
                  disabled={guardando}
                >
                  {guardando
                    ? "Procesando..."
                    : desactivar
                      ? "Sí, desactivar"
                      : "Sí, reactivar"}
                </button>
              </div>
            </div>
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
