
import { useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ==========================================
// 1. ESTADOS Y COLORES
// ==========================================

const ESTADOS = [
  ["abierto", "Abiertos", "#3b82f6"],
  ["asignado", "Asignados", "#06b6d4"],
  ["en_proceso", "En proceso", "#f59e0b"],
  ["resuelto", "Resueltos", "#10b981"],
  ["cerrado", "Cerrados", "#64748b"],
  ["reabierto", "Reabiertos", "#a855f7"],
];

// ==========================================
// 2. UTILIDADES PARA EXPORTACIÓN CSV
// ==========================================

// Protege los campos CSV contra separadores,
// saltos de línea, comillas y fórmulas en Excel.
function escaparCSV(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  let texto = String(valor);

  // Evita que Excel interprete como fórmula
  // un valor procedente de los tickets.
  if (/^\s*[=+@-]/.test(texto)) {
  texto = `'${texto}`;
}

  return `"${texto.replace(/"/g, '""')}"`;
}

// Convierte una fecha ISO a un formato legible.
function formatearFecha(fecha) {
  if (!fecha) return "";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return String(fecha);
  }

  return valor.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Descarga un archivo CSV compatible con Excel.
function descargarCSV(nombreArchivo, filas) {
  const contenido = filas
    .map((fila) => fila.map(escaparCSV).join(";"))
    .join("\r\n");

  // BOM UTF-8 para reconocer tildes y ñ en Excel.
  const blob = new Blob(
    ["\uFEFF", contenido],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  URL.revokeObjectURL(url);
}

// ==========================================
// 3. COMPONENTE DE ANALÍTICA
// ==========================================

export default function AnaliticaTickets({
  tickets = [],
  cargando = false,
  error = "",
  onActualizar,
}) {

  // ========================================
  // 4. CALCULAR INDICADORES
  // ========================================

  const resumen = useMemo(() => {
    const total = tickets.length;

    const estados = ESTADOS.map(
      ([clave, nombre, color]) => ({
        clave,
        nombre,
        color,
        cantidad: tickets.filter(
          (ticket) => ticket.estado === clave
        ).length,
      })
    );

    const prioridades = [
      {
        nombre: "Alta",
        color: "#ef4444",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "alta"
        ).length,
      },
      {
        nombre: "Media",
        color: "#f59e0b",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "media"
        ).length,
      },
      {
        nombre: "Baja",
        color: "#10b981",
        cantidad: tickets.filter(
          (ticket) => ticket.prioridad === "baja"
        ).length,
      },
    ];

    const activos = tickets.filter(
      (ticket) =>
        !["cerrado", "resuelto"].includes(ticket.estado)
    ).length;

    return {
      total,
      estados,
      prioridades,
      activos,
    };
  }, [tickets]);

  const maxEstado = Math.max(
    1,
    ...resumen.estados.map(
      (estado) => estado.cantidad
    )
  );

  // ========================================
  // 5. EXPORTAR REPORTE CSV
  // ========================================

  function exportarReporteCSV() {
    if (cargando || error || tickets.length === 0) {
      return;
    }

    const encabezados = [
      "ID",
      "Título",
      "Descripción",
      "Prioridad",
      "Estado",
      "Usuario ID",
      "Técnico ID",
      "Categoría ID",
      "Solución",
      "Fecha de creación",
      "Fecha de actualización",
      "Fecha de cierre",
    ];

    const registros = tickets.map((ticket) => [
      ticket.id,
      ticket.titulo,
      ticket.descripcion,
      ticket.prioridad,
      ticket.estado,
      ticket.usuario_id,
      ticket.tecnico_id,
      ticket.categoria_id,
      ticket.solucion,
      formatearFecha(ticket.fecha_creacion),
      formatearFecha(ticket.fecha_actualizacion),
      formatearFecha(ticket.fecha_cierre),
    ]);

    const filas = [
      encabezados,
      ...registros,
    ];

    const fecha = new Date()
      .toLocaleDateString("sv-SE");

    const nombreArchivo =
      `NEXDESK_reporte_tickets_${fecha}.csv`;

    descargarCSV(nombreArchivo, filas);
  }

  // ========================================
  // 5B. EXPORTAR REPORTE PDF
  // ========================================

  function exportarReportePDF() {
    if (cargando || error || tickets.length === 0) return;

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const ancho = pdf.internal.pageSize.getWidth();
    const fechaGeneracion = formatearFecha(new Date());
    const azul = [22, 54, 93];
    const gris = [82, 95, 111];
    const margen = 14;

    pdf.setFillColor(...azul);
    pdf.rect(0, 0, ancho, 28, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text("NEXDESK", margen, 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("Sistema Integral de Gestion de Soporte Tecnico", margen, 20);
    pdf.text("REPORTE DE GESTION", ancho - margen, 15, { align: "right" });

    pdf.setTextColor(...gris);
    pdf.setFontSize(9);
    pdf.text(`Generado: ${fechaGeneracion}`, margen, 35);
    pdf.text("Alcance: tickets visibles para el usuario autenticado", margen, 41);

    const resueltos = resumen.estados.find((e) => e.clave === "resuelto")?.cantidad ?? 0;
    const cerrados = resumen.estados.find((e) => e.clave === "cerrado")?.cantidad ?? 0;
    const metricas = [
      ["Tickets visibles", resumen.total],
      ["En atencion / pendientes", resumen.activos],
      ["Resueltos", resueltos],
      ["Cerrados", cerrados],
    ];
    const espacio = (ancho - 2 * margen - 9) / 4;
    metricas.forEach(([etiqueta, valor], i) => {
      const x = margen + i * (espacio + 3);
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(x, 47, espacio, 22, 2, 2, "F");
      pdf.setTextColor(...gris);
      pdf.setFontSize(8);
      pdf.text(etiqueta, x + 4, 54);
      pdf.setTextColor(...azul);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text(String(valor), x + 4, 64);
      pdf.setFont("helvetica", "normal");
    });

    pdf.setTextColor(...azul);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("Por estado", margen, 79);
    pdf.text("Por prioridad", ancho / 2 + 4, 79);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(45, 55, 72);
    resumen.estados.forEach((e, i) => {
      pdf.text(`${e.nombre}: ${e.cantidad}`, margen, 86 + i * 5);
    });
    resumen.prioridades.forEach((p, i) => {
      pdf.text(`${p.nombre}: ${p.cantidad}`, ancho / 2 + 4, 86 + i * 6);
    });

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...azul);
    pdf.setFontSize(10);
    pdf.text("Detalle de tickets", margen, 123);

    const columnas = [
      "ID", "Titulo", "Prioridad", "Estado", "Usuario ID",
      "Tecnico ID", "Categoria ID", "Fecha creacion", "Fecha cierre",
    ];
    const filas = tickets.map((t) => [
      String(t.id ?? ""),
      String(t.titulo ?? ""),
      String(t.prioridad ?? ""),
      String(t.estado ?? ""),
      String(t.usuario_id ?? ""),
      String(t.tecnico_id ?? "Sin asignar"),
      String(t.categoria_id ?? ""),
      formatearFecha(t.fecha_creacion) || "No disponible",
      formatearFecha(t.fecha_cierre) || "No aplica",
    ]);

    autoTable(pdf, {
      head: [columnas],
      body: filas,
      startY: 127,
      margin: { left: margen, right: margen, bottom: 16 },
      theme: "striped",
      styles: { font: "helvetica", fontSize: 7, cellPadding: 2.3, overflow: "linebreak" },
      headStyles: { fillColor: azul, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 251] },
      columnStyles: { 1: { cellWidth: 58 }, 7: { cellWidth: 31 }, 8: { cellWidth: 31 } },
    });

    const paginas = pdf.getNumberOfPages();
    for (let pagina = 1; pagina <= paginas; pagina += 1) {
      pdf.setPage(pagina);
      const alto = pdf.internal.pageSize.getHeight();
      pdf.setDrawColor(220, 226, 234);
      pdf.line(margen, alto - 12, ancho - margen, alto - 12);
      pdf.setTextColor(...gris);
      pdf.setFontSize(8);
      pdf.text("NEXDESK | Reporte de tickets", margen, alto - 7);
      pdf.text(`Pagina ${pagina} de ${paginas}`, ancho - margen, alto - 7, { align: "right" });
    }

    const fechaArchivo = new Date().toLocaleDateString("sv-SE");
    pdf.save(`NEXDESK_reporte_tickets_${fechaArchivo}.pdf`);
  }

  // ========================================
  // 6. INTERFAZ
  // ========================================

  return (
    <section
      className="mb-4"
      aria-label="Analítica de tickets"
    >

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3">

        <div>
          <h2 className="h5 fw-bold mb-1">
            Analítica de soporte
          </h2>

          <p className="text-secondary small mb-0">
            Datos de tickets visibles según tu rol
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">

          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={exportarReporteCSV}
            disabled={
              cargando ||
              Boolean(error) ||
              tickets.length === 0
            }
            title="Descargar reporte de tickets en CSV"
          >
            <span aria-hidden="true">↓ </span>
            Exportar CSV
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={exportarReportePDF}
            disabled={cargando || Boolean(error) || tickets.length === 0}
            title="Descargar reporte de tickets en PDF"
          >
            <span aria-hidden="true">↓ </span>
            Exportar PDF
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={onActualizar}
            disabled={cargando || !onActualizar}
          >
            {cargando
              ? "Actualizando..."
              : "Actualizar gráficas"}
          </button>

        </div>

      </div>

      {/* MENSAJE DE ERROR */}

      {error && (
        <div
          className="alert alert-warning"
          role="alert"
        >
          No se pudieron cargar las gráficas: {error}
        </div>
      )}

      {/* =====================================
          7. TARJETAS DE INDICADORES
      ===================================== */}

      <div className="row g-3 mb-3">

        {[
          ["Tickets visibles", resumen.total],
          [
            "En atención / pendientes",
            resumen.activos,
          ],
          [
            "Resueltos",
            resumen.estados.find(
              (estado) => estado.clave === "resuelto"
            )?.cantidad || 0,
          ],
          [
            "Cerrados",
            resumen.estados.find(
              (estado) => estado.clave === "cerrado"
            )?.cantidad || 0,
          ],
        ].map(([nombre, valor]) => (

          <div
            className="col-6 col-xl-3"
            key={nombre}
          >

            <div className="card border-0 shadow-sm rounded-4 h-100">

              <div className="card-body p-3">

                <div className="small text-secondary">
                  {nombre}
                </div>

                <div className="fs-2 fw-bold mt-1">
                  {cargando && !tickets.length
                    ? "…"
                    : valor}
                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* =====================================
          8. TICKETS POR ESTADO
      ===================================== */}

      <div className="row g-3">

        <div className="col-12">

          <div className="card border-0 shadow-sm rounded-4 h-100">

            <div className="card-body p-4">

              <h3 className="h6 fw-bold mb-4">
                Tickets por estado
              </h3>

              {resumen.estados.map((estado) => (

                <div
                  key={estado.clave}
                  className="mb-3"
                >

                  <div className="d-flex justify-content-between small mb-1">

                    <span>
                      {estado.nombre}
                    </span>

                    <strong>
                      {estado.cantidad}
                    </strong>

                  </div>

                  <div
                    className="progress"
                    style={{ height: 11 }}
                    role="progressbar"
                    aria-label={estado.nombre}
                    aria-valuenow={estado.cantidad}
                    aria-valuemin={0}
                    aria-valuemax={maxEstado}
                  >

                    <div
                      className="progress-bar"
                      style={{
                        width: `${
                          (estado.cantidad / maxEstado) * 100
                        }%`,
                        backgroundColor: estado.color,
                      }}
                    />

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* =====================================
            9. DISTRIBUCIÓN POR PRIORIDAD
        ===================================== */}

        <div className="col-12">

          <div className="card border-0 shadow-sm rounded-4">

            <div className="card-body p-4">

              <h3 className="h6 fw-bold mb-3">
                Distribución por prioridad
              </h3>

              <div className="row g-3">

                {resumen.prioridades.map(
                  (prioridad) => (

                    <div
                      className="col-md-4"
                      key={prioridad.nombre}
                    >

                      <div className="d-flex justify-content-between small mb-2">

                        <span>
                          {prioridad.nombre}
                        </span>

                        <strong>
                          {prioridad.cantidad}
                        </strong>

                      </div>

                      <div
                        className="progress"
                        style={{ height: 14 }}
                        role="progressbar"
                        aria-label={`Prioridad ${prioridad.nombre}`}
                        aria-valuenow={prioridad.cantidad}
                        aria-valuemin={0}
                        aria-valuemax={Math.max(1, resumen.total)}
                      >

                        <div
                          className="progress-bar"
                          style={{
                            backgroundColor:
                              prioridad.color,

                            width: `${
                              resumen.total
                                ? (
                                    prioridad.cantidad /
                                    resumen.total
                                  ) * 100
                                : 0
                            }%`,
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}
