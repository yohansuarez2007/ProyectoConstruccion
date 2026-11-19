
import { useState } from "react";


const etapas = [
  {
    id: 1,
    titulo: "Registrar",
    actor: "Usuario",
    actorCorto: "Usuario",
    descripcion:
      "El usuario registra una solicitud de soporte describiendo el incidente o requerimiento.",
    resultado: "Se crea un ticket con estado abierto.",
    color: "#2563eb",
  },
  {
    id: 2,
    titulo: "Clasificar",
    actor: "Sistema / gestión de soporte",
    actorCorto: "Sistema / Soporte",
    descripcion:
      "La solicitud se organiza mediante su categoría y prioridad para facilitar la atención.",
    resultado: "El ticket queda identificado para su gestión.",
    color: "#64748b",
  },
  {
    id: 3,
    titulo: "Asignar",
    actor: "Administrador",
    actorCorto: "Administrador",
    descripcion:
      "Un responsable autorizado asigna el ticket a un técnico disponible.",
    resultado: "El ticket queda asociado a un técnico.",
    color: "#7c3aed",
  },
  {
    id: 4,
    titulo: "Atender",
    actor: "Técnico",
    actorCorto: "Técnico",
    descripcion:
      "El técnico analiza la solicitud y realiza las acciones necesarias para resolverla.",
    resultado: "El ticket puede pasar a en_progreso.",
    color: "#0891b2",
  },
  {
    id: 5,
    titulo: "Seguimiento",
    actor: "Técnico / responsables autorizados",
    actorCorto: "Técnico / Soporte",
    descripcion:
      "Se registran observaciones, actividades y avances para mantener la trazabilidad.",
    resultado: "Se conserva el historial de atención.",
    color: "#d97706",
  },
  {
    id: 6,
    titulo: "Cerrar",
    actor: "Responsable autorizado",
    actorCorto: "Responsable",
    descripcion:
      "Cuando se completa la atención, se actualiza el estado del ticket conforme a las reglas del sistema.",
    resultado: "El ticket pasa al estado cerrado.",
    color: "#16a34a",
  },
];


// Recorrido en forma de serpiente:
// 1 → 2 → 3
//         ↓
// 6 ← 5 ← 4

const posiciones = [
    { x: 20, y: 20 },
    { x: 200, y: 20 },
    { x: 380, y: 20 },
    { x: 380, y: 140 },
    { x: 200, y: 140 },
    { x: 20, y: 140 },
];

export default function FlujoTickets() {
    const [seleccionada, setSeleccionada] = useState(1);

    const etapa = etapas.find(
        (item) => item.id === seleccionada
    );

    function siguiente() {
        setSeleccionada((actual) =>
            actual === etapas.length ? 1 : actual + 1
        );
    }

    return (
        <section className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body p-4">

                {/* Encabezado */}

                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                    <div>
                        <span className="badge text-bg-primary mb-2">
                            Modelo de negocio
                        </span>

                        <h2 className="h5 fw-bold mb-2">
                            ¿Cómo funciona NEXDESK?
                        </h2>

                        <p className="text-secondary mb-0">
                            Explora el ciclo de vida de una solicitud
                            de soporte técnico. Selecciona una etapa
                            para conocer su responsable y resultado.
                        </p>
                    </div>

                    <span className="badge bg-light text-dark border">
                        Gestión de tickets
                    </span>
                </div>

                {/* Diagrama SVG compacto */}

                <div className="nexdesk-flujo-scroll">
                    <svg
                        viewBox="0 0 560 245"
                        className="nexdesk-flujo-svg"
                        role="group"
                        aria-label="Flujo interactivo de gestión de tickets"
                    >
                        <defs>
                            <marker
                                id="flecha-nexdesk"
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="5"
                                markerHeight="5"
                                orient="auto"
                            >
                                <path
                                    d="M0 0 L10 5 L0 10 Z"
                                    fill="#94a3b8"
                                />
                            </marker>
                        </defs>

                        {/* Conectores del flujo */}

                        <g
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            markerEnd="url(#flecha-nexdesk)"
                        >
                            <path d="M175 56 H194" />
                            <path d="M355 56 H374" />
                            <path d="M457 92 V134" />
                            <path d="M380 176 H361" />
                            <path d="M200 176 H181" />
                        </g>

                        {/* Etapas seleccionables */}

                        {etapas.map((item, indice) => {
                            const posicion = posiciones[indice];
                            const activa = seleccionada === item.id;

                            return (
                                <g
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Etapa ${item.id}: ${item.titulo}`}
                                    aria-pressed={activa}
                                    onClick={() => setSeleccionada(item.id)}
                                    onKeyDown={(evento) => {
                                        if (
                                            evento.key === "Enter" ||
                                            evento.key === " "
                                        ) {
                                            evento.preventDefault();
                                            setSeleccionada(item.id);
                                        }
                                    }}
                                    className="nexdesk-flujo-nodo"
                                >
                                    {/* Tarjeta */}

                                    <rect
                                        x={posicion.x}
                                        y={posicion.y}
                                        width="155"
                                        height="72"
                                        rx="10"
                                        fill={activa ? item.color : "#ffffff"}
                                        stroke={item.color}
                                        strokeWidth={activa ? 2.5 : 1.5}
                                    />

                                    {/* Número */}

                                    <circle
                                        cx={posicion.x + 20}
                                        cy={posicion.y + 22}
                                        r="13"
                                        fill={activa ? "#ffffff" : item.color}
                                        fillOpacity={activa ? 1 : 0.12}
                                    />

                                    <text
                                        x={posicion.x + 20}
                                        y={posicion.y + 26}
                                        fontSize="11"
                                        fontWeight="700"
                                        textAnchor="middle"
                                        fill={activa ? item.color : "#334155"}
                                    >
                                        {item.id}
                                    </text>

                                    {/* Nombre de la etapa */}

                                    <text
                                        x={posicion.x + 40}
                                        y={posicion.y + 26}
                                        fontSize="12"
                                        fontWeight="700"
                                        fill={activa ? "#ffffff" : "#172033"}
                                    >
                                        {item.titulo}
                                    </text>

                                    {/* Responsable */}

                                    <text
                                        x={posicion.x + 12}
                                        y={posicion.y + 51}
                                        fontSize="10"
                                        fill={activa ? "#ffffff" : "#64748b"}
                                    >
                                        {item.actorCorto}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Pie del SVG */}

                        <text
                            x="280"
                            y="237"
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                        >
                            Selecciona una etapa para explorar el proceso
                        </text>
                    </svg>
                </div>

                {/* Panel de información */}

                <div
                    className="nexdesk-flujo-detalle mt-3"
                    style={{ borderLeftColor: etapa.color }}
                    aria-live="polite"
                >
                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                        <div>
                            <span className="text-secondary small">
                                ETAPA {etapa.id} DE {etapas.length}
                            </span>

                            <h3 className="h5 fw-bold mt-1 mb-2">
                                {etapa.titulo}
                            </h3>

                            <p className="mb-2">
                                {etapa.descripcion}
                            </p>

                            <p className="small mb-1">
                                <strong>Responsable:</strong>{" "}
                                {etapa.actor}
                            </p>

                            <p className="small mb-0">
                                <strong>Resultado:</strong>{" "}
                                {etapa.resultado}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={siguiente}
                        >
                            {seleccionada === etapas.length
                                ? "Reiniciar recorrido"
                                : "Siguiente etapa →"}
                        </button>
                    </div>
                </div>

                {/* Estados reales del ticket */}

                <div className="mt-3 small text-secondary">
                    <strong>Estados del ticket:</strong>{" "}

                    <span className="badge text-bg-primary">
                        abierto
                    </span>

                    {" → "}

                    <span className="badge text-bg-warning">
                        en_progreso
                    </span>

                    {" → "}

                    <span className="badge text-bg-success">
                        cerrado
                    </span>

                    <p className="mt-2 mb-0">
                        La clasificación, asignación y los
                        seguimientos son actividades del proceso;
                        no constituyen necesariamente estados
                        adicionales del ticket.
                    </p>
                </div>
            </div>
        </section>
    );
}
