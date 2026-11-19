
function formatearFecha(valor) {
  if (!valor) return "Fecha no disponible";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Fecha no disponible";
  }

  return fecha.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function obtenerNombreAutor(seguimiento) {
  const nombre = [
    seguimiento.autor_nombre,
    seguimiento.autor_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    `Usuario #${seguimiento.autor_usuario_id}`
  );
}

function formatearRol(rol) {
  const roles = {
    superadmin: "Superadmin",
    admin: "Administrador",
    tecnico: "Técnico",
    usuario: "Usuario",
  };

  return roles[rol] || rol || "Sin rol";
}

export default function HistorialSeguimientos({
  seguimientos = [],
}) {
  const registrosOrdenados = [...seguimientos].sort(
    (a, b) => {
      const fechaA = new Date(a.fecha_registro).getTime();
      const fechaB = new Date(b.fecha_registro).getTime();

      return fechaA - fechaB || Number(a.id) - Number(b.id);
    }
  );

  if (registrosOrdenados.length === 0) {
    return (
      <div className="text-center py-5 text-secondary">
        <div className="fs-2 mb-2" aria-hidden="true">
          📝
        </div>

        <p className="fw-semibold mb-1">
          Todavía no hay seguimientos.
        </p>

        <p className="small mb-0">
          Registra la primera observación de atención.
        </p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {registrosOrdenados.map((seguimiento, indice) => (
        <div
          key={seguimiento.id}
          className="d-flex gap-3"
        >
          <div className="d-flex flex-column align-items-center">
            <div
              className="rounded-circle bg-primary"
              style={{
                width: 13,
                height: 13,
                flexShrink: 0,
                marginTop: 5,
              }}
            />

            {indice < registrosOrdenados.length - 1 && (
              <div
                className="bg-primary bg-opacity-25"
                style={{
                  width: 2,
                  flex: 1,
                  minHeight: 40,
                  marginTop: 6,
                }}
              />
            )}
          </div>

          <div className="card border-0 bg-body-tertiary flex-grow-1 mb-2">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                <div>
                  <div className="fw-bold">
                    {obtenerNombreAutor(seguimiento)}
                  </div>

                  <span className="badge text-bg-secondary mt-1">
                    {formatearRol(
                      seguimiento.autor_rol
                    )}
                  </span>
                </div>

                <span className="small text-secondary">
                  {formatearFecha(
                    seguimiento.fecha_registro
                  )}
                </span>
              </div>

              <p
                className="mb-0"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {seguimiento.observacion}
              </p>

              <div className="small text-secondary mt-2">
                Seguimiento #{seguimiento.id}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
