
export default function ModalRestablecerPassword({
  usuario,
  procesando,
  error,
  onConfirmar,
  onCerrar,
}) {
  if (!usuario) return null;

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-restablecer"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header">
              <h2
                id="titulo-restablecer"
                className="modal-title h5 fw-bold"
              >
                Restablecer contraseña
              </h2>

              <button
                type="button"
                className="btn-close"
                onClick={onCerrar}
                disabled={procesando}
                aria-label="Cerrar"
              />
            </div>

            <div className="modal-body">
              <p>
                Se generará una nueva contraseña temporal
                para la siguiente cuenta:
              </p>

              <div className="border rounded-3 p-3 mb-3">
                <strong>
                  {usuario.nombre} {usuario.apellido}
                </strong>

                <div className="small text-secondary">
                  {usuario.email}
                </div>

                <div className="small text-secondary">
                  Rol: {usuario.rol}
                </div>
              </div>

              <div className="alert alert-warning small">
                La contraseña anterior dejará de servir
                para nuevos inicios de sesión. El titular
                deberá cambiar la contraseña temporal.
                Verifica su identidad antes de continuar.
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCerrar}
                disabled={procesando}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-warning"
                onClick={onConfirmar}
                disabled={procesando}
              >
                {procesando
                  ? "Restableciendo..."
                  : "Confirmar restablecimiento"}
              </button>
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
