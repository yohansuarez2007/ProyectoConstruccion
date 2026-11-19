
import { useState } from "react";

export default function CredencialTemporal({
  resultado,
  onCerrar,
}) {
  const [mostrar, setMostrar] = useState(false);

  if (!resultado) return null;

  const { usuario, credencialTemporal } = resultado;

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-credencial"
        style={{ zIndex: 1070 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 shadow">
            <div className="modal-body p-4">
              <div className="text-success fs-1 mb-2">✓</div>

              <h2 id="titulo-credencial" className="h5 fw-bold">
                {resultado?.mensaje ||
                  "Credencial temporal generada correctamente"}
              </h2>

              <p className="text-secondary small">
                Conserva esta credencial temporal y entrégala
únicamente al titular mediante un canal seguro.
              </p>

              <div className="border rounded-3 p-3 mb-3">
                <div className="small text-secondary">Usuario</div>
                <strong>
                  {usuario?.nombre} {usuario?.apellido}
                </strong>

                <div className="small text-secondary mt-3">
                  Correo electrónico
                </div>
                <strong>{usuario?.email}</strong>

                <div className="small text-secondary mt-3">
                  Contraseña temporal
                </div>

                <div className="d-flex gap-2 align-items-center">
                  <code className="flex-grow-1 text-break">
                    {mostrar
                      ? credencialTemporal
                      : "••••••••••••"}
                  </code>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setMostrar((valor) => !valor)}
                  >
                    {mostrar ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="alert alert-warning small">
                <strong>Credencial de un solo acceso visual.</strong>
                Regístrala mediante un canal seguro antes de
                cerrar esta ventana. No se volverá a mostrar
                desde el frontend.
              </div>

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={onCerrar}
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal-backdrop show"
        style={{ zIndex: 1065 }}
      />
    </>
  );
}
