
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { menuPorRol } from "../config/menu";

export default function Sidebar({ abierto, cerrar }) {
  const { usuario } = useAuth();
  const opciones = menuPorRol(usuario?.rol);

  return (
    <>
      {abierto && (
        <button
          type="button"
          className="nexdesk-overlay"
          onClick={cerrar}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`nexdesk-sidebar ${abierto ? "abierto" : ""}`}
        aria-label="Navegación principal"
      >
        <div className="nexdesk-sidebar-brand">
          <span className="nexdesk-brand-icon">N</span>
          <div>
            <strong>NEXDESK</strong>
            <small>Sistema de soporte</small>
          </div>
        </div>

        <div className="nexdesk-sidebar-label">
          MENÚ PRINCIPAL
        </div>

        <nav className="nexdesk-sidebar-nav">
          {opciones.map((opcion) => (
            <NavLink
              key={opcion.ruta}
              to={opcion.ruta}
              onClick={cerrar}
              className={({ isActive }) =>
                `nexdesk-nav-link ${isActive ? "activo" : ""}`
              }
            >
              <span className="nexdesk-nav-icon">
                {opcion.icono}
              </span>
              <span>{opcion.titulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nexdesk-sidebar-footer">
          <span className="nexdesk-online-dot" />
          Sistema de soporte
          <small>Helpdesk Organizacional para empresas</small>
        </div>
      </aside>
    </>
  );
}
