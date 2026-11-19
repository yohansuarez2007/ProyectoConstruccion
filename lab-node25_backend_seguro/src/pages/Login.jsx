
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import EstadoBackend from "../components/EstadoBackend";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  // 1. Navegación y autenticación
  const navigate = useNavigate();
  const { login } = useAuth();

  // 2. Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // 3. Procesar inicio de sesión
  async function manejarLogin(evento) {
    evento.preventDefault();

    setError("");
    setCargando(true);

    // Evitar conservar una bienvenida anterior
    sessionStorage.removeItem(
      "nexdesk_mostrar_bienvenida"
    );

    try {
      // Autenticación mediante la API REST
      const perfil = await login(email, password);

      // Verificar cambio obligatorio de contraseña
      if (
        perfil.debeCambiarPassword ||
        perfil.debe_cambiar_password
      ) {
        navigate("/cambiar-password", {
          replace: true,
        });
      } else {
        // Activar notificación de bienvenida
        sessionStorage.setItem(
          "nexdesk_mostrar_bienvenida",
          "1"
        );

        // Acceder al dashboard
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  }

  // 4. Interfaz de inicio de sesión
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5 col-xl-4">

            <div className="card border-0 shadow-lg rounded-4">
              <div className="card-body p-4 p-md-5">

                {/* Identidad visual */}
                <div className="text-center mb-4">
                  <div className="nexdesk-logo mx-auto mb-3">
                    N
                  </div>

                  <h1 className="h3 fw-bold text-primary">
                    NEXDESK
                  </h1>

                  <p className="text-secondary small">
                    Sistema Integral de Gestión de Soporte Técnico
                  </p>
                </div>

                {/* Mensajes de error */}
                {error && (
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* Formulario */}
                <form onSubmit={manejarLogin}>

                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label"
                    >
                      Correo electrónico
                    </label>

                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="form-label"
                    >
                      Contraseña
                    </label>

                    <input
                      id="password"
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      autoComplete="current-password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={cargando}
                  >
                    {cargando
                      ? "Validando..."
                      : "Iniciar sesión"}
                  </button>

                </form>

                {/* Verificación del backend */}
                <EstadoBackend />

                <p className="text-center text-secondary small mt-4 mb-0">
                  Acceso autorizado a NEXDESK
                </p>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
