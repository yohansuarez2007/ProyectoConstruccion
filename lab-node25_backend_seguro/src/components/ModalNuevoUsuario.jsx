
import { useEffect } from "react";
import FormularioUsuario from "./FormularioUsuario";

export default function ModalNuevoUsuario({
  abierto,
  rolActual,
  guardando,
  error,
  onGuardar,
  onCerrar,
}) {
  useEffect(() => {
    if (!abierto) return;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = anterior;
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-nuevo-usuario"
        style={{ zIndex: 1060 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-header px-4 pt-4">
              <div>
                <h2
                  id="titulo-nuevo-usuario"
                  className="modal-title h5 fw-bold"
                >
                  Registrar nuevo usuario
                </h2>
                <p className="text-secondary small mb-0 mt-1">
                  Completa los datos de la cuenta institucional.
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

            <div className="modal-body p-4">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <FormularioUsuario
                rolActual={rolActual}
                guardando={guardando}
                onGuardar={onGuardar}
                onCancelar={onCerrar}
              />
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
