
import { Link } from "react-router-dom";

export default function ModuloPendiente({ titulo }) {
  return (
    <div className="container-fluid">
      <div className="text-secondary small mb-2">
        Inicio / {titulo}
      </div>

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4 p-md-5">
          <span className="badge text-bg-primary mb-3">
            Próxima integración
          </span>

          <h1 className="h4 fw-bold">
            Módulo de {titulo}
          </h1>

          <p className="text-secondary">
            La navegación de este módulo ya está preparada.
            Sus operaciones se conectarán a los endpoints
            existentes del backend de NEXDESK.
          </p>

          <Link to="/dashboard" className="btn btn-outline-primary">
            Volver al panel de control
          </Link>
        </div>
      </div>
    </div>
  );
}
