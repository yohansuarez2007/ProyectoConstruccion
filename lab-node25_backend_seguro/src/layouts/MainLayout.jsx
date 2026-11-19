
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import NavbarPrincipal from "../components/NavbarPrincipal";

export default function MainLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="nexdesk-app">
      <Sidebar
        abierto={menuAbierto}
        cerrar={() => setMenuAbierto(false)}
      />

      <div className="nexdesk-main">
        <NavbarPrincipal
          abrirMenu={() => setMenuAbierto(true)}
        />

        <main className="nexdesk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
