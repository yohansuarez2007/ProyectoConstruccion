
import { useEffect, useState } from "react";

export default function ToastBienvenida({ nombre, onCerrar }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inicio = setTimeout(() => setVisible(true), 50);
    const cierre = setTimeout(() => setVisible(false), 3800);
    const finalizar = setTimeout(() => onCerrar(), 4300);

    return () => {
      clearTimeout(inicio);
      clearTimeout(cierre);
      clearTimeout(finalizar);
    };
  }, [onCerrar]);

  return (
    <div
      className={`nexdesk-toast ${visible ? "visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="d-flex align-items-start gap-3">
        <div className="nexdesk-toast-icon">
          ✓
        </div>

        <div className="flex-grow-1">
          <div className="fw-bold fs-6">
            ¡Bienvenido/a, {nombre}!
          </div>
          <div className="text-secondary small mt-1">
            Has iniciado sesión correctamente en NEXDESK.
          </div>
        </div>

        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar notificación"
          onClick={onCerrar}
        />
      </div>

      <div className="nexdesk-toast-progress" />
    </div>
  );
}
