
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export default function RutaProtegida() {
  const { usuario, cargandoSesion } = useAuth();
  const location = useLocation();

  if (cargandoSesion) {
    return (
      <div className="container py-5 text-center" role="status">
        Verificando sesión...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const debeCambiar = Boolean(
    usuario.debeCambiarPassword ||
    usuario.debe_cambiar_password
  );

  if (
    debeCambiar &&
    location.pathname !== "/cambiar-password"
  ) {
    return <Navigate to="/cambiar-password" replace />;
  }

  return <Outlet />;
}
