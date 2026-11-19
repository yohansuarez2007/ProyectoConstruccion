import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

export default function CambiarPassword() {
  const { usuario, cambiarPassword, logout } = useAuth();
  const navigate = useNavigate();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    if (nueva.length < 12 || nueva.length > 128) {
      setError("La contraseña debe tener entre 12 y 128 caracteres."); return;
    }
    if (nueva !== confirmacion) { setError("Las contraseñas nuevas no coinciden."); return; }
    if (actual === nueva) { setError("La contraseña nueva debe ser diferente."); return; }
    setCargando(true);
    try {
      await cambiarPassword(actual, nueva);
      // Por seguridad solicitamos iniciar sesión de nuevo con la nueva clave.
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "No fue posible cambiar la contraseña");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-vh-100 bg-body-tertiary py-5">
      <main className="container" style={{ maxWidth: 580 }}>
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4 p-md-5">
            {!(
              usuario?.debeCambiarPassword ||
              usuario?.debe_cambiar_password
            ) && (
                <div className="d-flex justify-content-end mb-4">
                  <Link
                    to="/dashboard"
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-2"
                    aria-label="Volver al panel de control"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m3 10 9-7 9 7" />
                      <path d="M5 9v12h14V9" />
                      <path d="M9 21v-7h6v7" />
                    </svg>

                    Volver al panel
                  </Link>
                </div>
              )}
            <h1 className="h4 fw-bold">Actualizar contraseña</h1>
            <p className="text-secondary">Cuenta: {usuario?.email}</p>
            {usuario?.debeCambiarPassword && <div className="alert alert-warning">Debes cambiar tu contraseña antes de utilizar NEXDESK.</div>}
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={enviar}>
              <label className="form-label" htmlFor="actual">Contraseña actual</label>
              <input className="form-control mb-3" id="actual" type="password" autoComplete="current-password" value={actual} onChange={e => setActual(e.target.value)} required />
              <label className="form-label" htmlFor="nueva">Nueva contraseña (12 a 128 caracteres)</label>
              <input className="form-control mb-3" id="nueva" type="password" minLength={12} maxLength={128} autoComplete="new-password" value={nueva} onChange={e => setNueva(e.target.value)} required />
              <label className="form-label" htmlFor="confirmacion">Confirmar nueva contraseña</label>
              <input className="form-control mb-4" id="confirmacion" type="password" autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} required />
              <button className="btn btn-primary w-100" type="submit" disabled={cargando}>{cargando ? "Actualizando..." : "Cambiar contraseña"}</button>
            </form>
            <button className="btn btn-link mt-3 p-0" type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }}>Cerrar sesión</button>
          </div>
        </div>
      </main>
    </div>
  );
}
