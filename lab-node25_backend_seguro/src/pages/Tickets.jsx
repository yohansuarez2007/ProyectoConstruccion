
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "../hooks/useAuth";

import ModalNuevoTicket from "../components/ModalNuevoTicket";
import ModalAsignarTecnico from "../components/ModalAsignarTecnico";
import ModalEstadoTicket from "../components/ModalEstadoTicket";


import {
    listarTickets,
    crearTicket,
    asignarTecnicoTicket,
    cambiarEstadoTicket,
} from "../services/tickets.service";

import { listarTecnicos } from "../services/tecnicos.service";

import {
    listarCategorias,
} from "../services/categorias.service";

const ESTADOS = [
    ["todos", "Todos"],
    ["abierto", "Abierto"],
    ["asignado", "Asignado"],
    ["en_proceso", "En proceso"],
    ["resuelto", "Resuelto"],
    ["cerrado", "Cerrado"],
    ["reabierto", "Reabierto"],
];

const TRANSICIONES_TICKETS = {
    abierto: [],
    asignado: ["en_proceso"],
    en_proceso: ["resuelto"],
    resuelto: ["cerrado", "reabierto"],
    cerrado: ["reabierto"],
    reabierto: ["en_proceso"],
};

function nombreEstado(estado) {
    return ESTADOS.find(([valor]) => valor === estado)?.[1]
        || estado;
}

function claseEstado(estado) {
    const clases = {
        abierto: "text-bg-primary",
        asignado: "text-bg-info",
        en_proceso: "text-bg-warning",
        resuelto: "text-bg-success",
        cerrado: "text-bg-secondary",
        reabierto: "text-bg-danger",
    };

    return clases[estado] || "text-bg-secondary";
}

function clasePrioridad(prioridad) {
    const clases = {
        alta: "text-bg-danger",
        media: "text-bg-warning",
        baja: "text-bg-success",
    };

    return clases[prioridad] || "text-bg-secondary";
}

export default function Tickets() {
    const { token, usuario } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [tecnicos, setTecnicos] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos");

    const [modalNuevo, setModalNuevo] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");

    const [ticketDetalle, setTicketDetalle] = useState(null);
    const [recarga, setRecarga] = useState(0);

    const [ticketAsignar, setTicketAsignar] = useState(null);
    const [asignando, setAsignando] = useState(false);
    const [errorAsignacion, setErrorAsignacion] = useState("");

    const [ticketCambiarEstado, setTicketCambiarEstado] = useState(null);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);
    const [errorCambioEstado, setErrorCambioEstado] = useState("");

    const rolActual = usuario?.rol?.nombre || usuario?.rol;
    const esAdministrador = ["superadmin", "admin"].includes(rolActual);

    const puedeCrear = ["superadmin", "admin", "usuario"]
        .includes(rolActual);

    const actualizar = useCallback(() => {
        setCargando(true);
        setRecarga((valor) => valor + 1);
    }, []);

    // ==========================================
    // 1. CONSULTAR TICKETS Y CATEGORÍAS
    // ==========================================

    useEffect(() => {
        if (!token) return;

        const controlador = new AbortController();

        async function cargar() {
            try {
                const [
                    respuestaTickets,
                    respuestaCategorias,
                    respuestaTecnicos,
                ] = await Promise.all([
                    listarTickets(token, "todos", controlador.signal),
                    listarCategorias(token, controlador.signal),
                    esAdministrador
                        ? listarTecnicos(token, controlador.signal)
                        : Promise.resolve([]),
                ]);

                if (controlador.signal.aborted) return;

                if (!Array.isArray(respuestaTickets)) {
                    throw new Error(
                        "El backend devolvió un formato de tickets inesperado."
                    );
                }

                if (!Array.isArray(respuestaCategorias)) {
                    throw new Error(
                        "El backend devolvió un formato de categorías inesperado."
                    );
                }

                if (!Array.isArray(respuestaTecnicos)) {
                    throw new Error(
                        "El backend devolvió un formato de técnicos inesperado."
                    );
                }

                setTickets(respuestaTickets);
                setCategorias(respuestaCategorias);
                setTecnicos(respuestaTecnicos);
                setError("");
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setError(
                        err.message || "No fue posible cargar los tickets."
                    );
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargando(false);
                }
            }
        }

        cargar();

        return () => controlador.abort();
    }, [token, recarga, esAdministrador]);

    // ==========================================
    // 2. NOTIFICACIÓN DE ÉXITO
    // ==========================================

    useEffect(() => {
        if (!mensaje) return;

        const temporizador = setTimeout(() => {
            setMensaje("");
        }, 4000);

        return () => clearTimeout(temporizador);
    }, [mensaje]);

    // ==========================================
    // 3. FILTROS
    // ==========================================

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const contenido = [
                ticket.id,
                ticket.titulo,
                ticket.descripcion,
                ticket.prioridad,
                ticket.estado,
            ]
                .filter((valor) => valor !== null && valor !== undefined)
                .join(" ")
                .toLowerCase();

            const coincideEstado =
                filtroEstado === "todos" ||
                ticket.estado === filtroEstado;

            return contenido.includes(texto) && coincideEstado;
        });
    }, [tickets, busqueda, filtroEstado]);

    const categoriasActivas = categorias.filter(
        (categoria) => categoria.activa === true
    );

    function nombreCategoria(id) {
        return categorias.find(
            (categoria) => Number(categoria.id) === Number(id)
        )?.nombre || `Categoría #${id}`;
    }

    // ==========================================
    // 4. REGISTRAR TICKET
    // ==========================================

    async function registrarTicket(datos) {
        if (guardando) return;

        setGuardando(true);
        setErrorModal("");

        try {
            await crearTicket(token, datos);

            setModalNuevo(false);
            setMensaje("Ticket registrado correctamente.");
            actualizar();
        } catch (err) {
            setErrorModal(
                err.message || "No fue posible registrar el ticket."
            );
        } finally {
            setGuardando(false);
        }
    }

    // ==========================================
    // 5. ASIGNAR O REASIGNAR TÉCNICO
    // ==========================================

    async function confirmarAsignacion(tecnicoId) {
        if (!ticketAsignar || asignando) return;

        setAsignando(true);
        setErrorAsignacion("");

        try {
            await asignarTecnicoTicket(token, ticketAsignar.id, tecnicoId);
            setTicketAsignar(null);
            setMensaje("Técnico asignado correctamente.");
            actualizar();
        } catch (err) {
            setErrorAsignacion(
                err instanceof Error
                    ? err.message
                    : "No fue posible asignar el técnico."
            );
        } finally {
            setAsignando(false);
        }
    }

    // ==========================================
    // 5.1. OBTENER TÉCNICO ASIGNADO
    // ==========================================

    function obtenerTecnicoAsignado(tecnicoId) {
        if (!tecnicoId) return null;

        return tecnicos.find(
            (tecnico) =>
                Number(tecnico.id) === Number(tecnicoId)
        ) || null;
    }

    // ==========================================
    // 5.2. TRANSICIONES PERMITIDAS
    // ==========================================

    function obtenerTransicionesPermitidas(ticket) {
        if (!ticket) return [];

        const opciones = TRANSICIONES_TICKETS[ticket.estado] || [];

        if (esAdministrador) {
            return opciones;
        }

        if (rolActual === "tecnico") {
            return opciones.filter((estado) =>
                ["en_proceso", "resuelto"].includes(estado)
            );
        }

        return [];
    }

    // ==========================================
    // 5.3. CAMBIAR ESTADO DEL TICKET
    // ==========================================

    async function confirmarCambioEstado(datos) {
        if (!ticketCambiarEstado || cambiandoEstado) return;

        setCambiandoEstado(true);
        setErrorCambioEstado("");

        try {
            await cambiarEstadoTicket(
                token,
                ticketCambiarEstado.id,
                datos.estado,
                datos.solucion
            );

            setTicketCambiarEstado(null);
            setMensaje("Estado del ticket actualizado correctamente.");
            actualizar();
        } catch (err) {
            setErrorCambioEstado(
                err instanceof Error
                    ? err.message
                    : "No fue posible actualizar el estado."
            );
        } finally {
            setCambiandoEstado(false);
        }
    }

    // ==========================================
    // 6. INTERFAZ
    // ==========================================

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div>
                    <div className="small text-secondary mb-1">
                        Inicio / Operación / Tickets
                    </div>

                    <h1 className="h3 fw-bold mb-1">
                        Gestión de tickets
                    </h1>

                    <p className="text-secondary mb-0">
                        Registra, consulta y realiza seguimiento
                        a las solicitudes de soporte técnico.
                    </p>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={actualizar}
                        disabled={cargando}
                    >
                        Actualizar listado
                    </button>

                    {puedeCrear && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setErrorModal("");
                                setModalNuevo(true);
                            }}
                            disabled={cargando}
                        >
                            + Nuevo ticket
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {mensaje && (
                <div
                    className="alert alert-success alert-dismissible fade show"
                    role="status"
                >
                    {mensaje}

                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar mensaje"
                        onClick={() => setMensaje("")}
                    />
                </div>
            )}

            {/* INDICADORES */}

            <div className="row g-3 mb-4">
                {[
                    ["Tickets visibles", tickets.length],
                    [
                        "Abiertos",
                        tickets.filter((t) => t.estado === "abierto").length,
                    ],
                    [
                        "En proceso",
                        tickets.filter((t) => t.estado === "en_proceso").length,
                    ],
                    [
                        "Resueltos",
                        tickets.filter((t) => t.estado === "resuelto").length,
                    ],
                ].map(([titulo, valor]) => (
                    <div className="col-6 col-xl-3" key={titulo}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="small text-secondary">
                                    {titulo}
                                </div>

                                <div className="h3 fw-bold mb-0 mt-2">
                                    {valor}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* DIRECTORIO */}

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                    <div className="row g-3 mb-3">
                        <div className="col-md-8">
                            <label
                                htmlFor="buscar-ticket"
                                className="form-label"
                            >
                                Buscar ticket
                            </label>

                            <input
                                id="buscar-ticket"
                                className="form-control"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="ID, título, descripción o prioridad"
                            />
                        </div>

                        <div className="col-md-4">
                            <label
                                htmlFor="filtro-ticket"
                                className="form-label"
                            >
                                Estado
                            </label>

                            <select
                                id="filtro-ticket"
                                className="form-select"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                {ESTADOS.map(([valor, etiqueta]) => (
                                    <option key={valor} value={valor}>
                                        {etiqueta}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Solicitud</th>
                                    <th>Categoría</th>
                                    <th>Prioridad</th>
                                    <th>Estado</th>
                                    <th>Técnico</th>
                                    <th className="text-end">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargando && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4">
                                            Consultando tickets...
                                        </td>
                                    </tr>
                                )}

                                {!cargando &&
                                    filtrados.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td className="fw-semibold">
                                                #{ticket.id}
                                            </td>

                                            <td>
                                                <div className="fw-semibold">
                                                    {ticket.titulo}
                                                </div>
                                                <div
                                                    className="small text-secondary text-truncate"
                                                    style={{ maxWidth: 280 }}
                                                >
                                                    {ticket.descripcion}
                                                </div>
                                            </td>

                                            <td>
                                                {nombreCategoria(ticket.categoria_id)}
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${clasePrioridad(
                                                        ticket.prioridad
                                                    )}`}
                                                >
                                                    {ticket.prioridad}
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={`badge ${claseEstado(
                                                        ticket.estado
                                                    )}`}
                                                >
                                                    {nombreEstado(ticket.estado)}
                                                </span>
                                            </td>

                                            <td>
                                                {ticket.tecnico_id ? (
                                                    (() => {
                                                        const tecnico = obtenerTecnicoAsignado(
                                                            ticket.tecnico_id
                                                        );

                                                        if (!tecnico) {
                                                            return (
                                                                <span className="text-secondary small">
                                                                    Técnico #{ticket.tecnico_id}
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <div>
                                                                <div className="fw-semibold">
                                                                    {tecnico.nombre} {tecnico.apellido}
                                                                </div>
                                                                <div className="small text-secondary">
                                                                    {tecnico.especialidad || "Sin especialidad"}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-secondary">
                                                        Sin asignar
                                                    </span>
                                                )}
                                            </td>

                                            <td className="text-end">
                                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => setTicketDetalle(ticket)}
                                                    >
                                                        Ver detalle
                                                    </button>

                                                    {esAdministrador &&
                                                        ["abierto", "asignado", "reabierto"].includes(ticket.estado) && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success"
                                                                onClick={() => {
                                                                    setErrorAsignacion("");
                                                                    setTicketAsignar(ticket);
                                                                }}
                                                            >
                                                                {ticket.tecnico_id ? "Reasignar" : "Asignar"}
                                                            </button>
                                                        )}

                                                    {obtenerTransicionesPermitidas(ticket).length > 0 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                setErrorCambioEstado("");
                                                                setTicketCambiarEstado(ticket);
                                                            }}
                                                        >
                                                            Gestionar estado
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                {!cargando && filtrados.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center text-secondary py-4"
                                        >
                                            No se encontraron tickets.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="small text-secondary">
                        Mostrando {filtrados.length} de {tickets.length} tickets.
                    </div>
                </div>
            </div>

            {/* REGISTRO */}

            {modalNuevo && (
                <ModalNuevoTicket
                    categorias={categoriasActivas}
                    guardando={guardando}
                    error={errorModal}
                    onGuardar={registrarTicket}
                    onCerrar={() => {
                        if (!guardando) {
                            setModalNuevo(false);
                            setErrorModal("");
                        }
                    }}
                />
            )}

            {/* ASIGNACIÓN DE TÉCNICO */}
            {ticketAsignar && (
                <ModalAsignarTecnico
                    key={ticketAsignar.id}
                    ticket={ticketAsignar}
                    tecnicos={tecnicos}
                    guardando={asignando}
                    error={errorAsignacion}
                    onGuardar={confirmarAsignacion}
                    onCerrar={() => {
                        if (!asignando) {
                            setTicketAsignar(null);
                            setErrorAsignacion("");
                        }
                    }}
                />
            )}

            {/* CAMBIO DE ESTADO */}
            {ticketCambiarEstado && (
                <ModalEstadoTicket
                    key={ticketCambiarEstado.id}
                    ticket={ticketCambiarEstado}
                    transiciones={obtenerTransicionesPermitidas(ticketCambiarEstado)}
                    guardando={cambiandoEstado}
                    error={errorCambioEstado}
                    onGuardar={confirmarCambioEstado}
                    onCerrar={() => {
                        if (!cambiandoEstado) {
                            setTicketCambiarEstado(null);
                            setErrorCambioEstado("");
                        }
                    }}
                />
            )}

            {/* DETALLE */}

            {ticketDetalle && (
                <>
                    <div
                        className="modal d-block"
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-detalle-ticket"
                        style={{ zIndex: 1060 }}
                    >
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content rounded-4">
                                <div className="modal-header">
                                    <h2
                                        id="titulo-detalle-ticket"
                                        className="modal-title h5"
                                    >
                                        Ticket #{ticketDetalle.id}
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={() => setTicketDetalle(null)}
                                    />
                                </div>

                                <div className="modal-body">
                                    <h3 className="h5">
                                        {ticketDetalle.titulo}
                                    </h3>

                                    <p style={{ whiteSpace: "pre-wrap" }}>
                                        {ticketDetalle.descripcion}
                                    </p>

                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <strong>Prioridad:</strong>{" "}
                                            {ticketDetalle.prioridad}
                                        </div>

                                        <div className="col-md-6">
                                            <strong>Estado:</strong>{" "}
                                            {nombreEstado(ticketDetalle.estado)}
                                        </div>

                                        <div className="col-md-6">
                                            <strong>Categoría:</strong>{" "}
                                            {nombreCategoria(
                                                ticketDetalle.categoria_id
                                            )}
                                        </div>

                                        <div className="col-md-6">
                                            <strong>Técnico responsable:</strong>

                                            {ticketDetalle.tecnico_id ? (
                                                (() => {
                                                    const tecnico = obtenerTecnicoAsignado(
                                                        ticketDetalle.tecnico_id
                                                    );

                                                    return tecnico ? (
                                                        <div className="mt-1">
                                                            <div className="fw-semibold">
                                                                {tecnico.nombre} {tecnico.apellido}
                                                            </div>
                                                            <div className="small text-secondary">
                                                                {tecnico.especialidad || "Sin especialidad"}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-secondary mt-1">
                                                            Técnico #{ticketDetalle.tecnico_id}
                                                        </div>
                                                    );
                                                })()
                                            ) : (
                                                <div className="text-secondary mt-1">
                                                    Sin asignar
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {ticketDetalle.solucion && (
                                        <div className="alert alert-success mt-3 mb-0">
                                            <strong>Solución registrada</strong>
                                            <p
                                                className="mb-0 mt-2"
                                                style={{ whiteSpace: "pre-wrap" }}
                                            >
                                                {ticketDetalle.solucion}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setTicketDetalle(null)}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="modal-backdrop show"
                        style={{ zIndex: 1055 }}
                    />
                </>
            )}
        </div>
    );
}
