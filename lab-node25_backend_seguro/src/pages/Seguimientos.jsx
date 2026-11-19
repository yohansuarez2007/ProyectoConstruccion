
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "../hooks/useAuth";

import {
    listarTickets,
} from "../services/tickets.service";

import {
    listarSeguimientos,
    crearSeguimiento,
} from "../services/seguimientos.service";

import HistorialSeguimientos
    from "../components/HistorialSeguimientos";

function formatearEstado(estado) {
    const nombres = {
        abierto: "Abierto",
        asignado: "Asignado",
        en_proceso: "En proceso",
        resuelto: "Resuelto",
        cerrado: "Cerrado",
        reabierto: "Reabierto",
    };

    return nombres[estado] || estado;
}



export default function Seguimientos() {
    const { token } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [ticketId, setTicketId] = useState("");

    const [seguimientos, setSeguimientos] = useState([]);

    const [busqueda, setBusqueda] = useState("");
    const [observacion, setObservacion] = useState("");

    const [cargandoTickets, setCargandoTickets] =
        useState(true);

    const [cargandoHistorial, setCargandoHistorial] =
        useState(false);

    const [guardando, setGuardando] = useState(false);

    const [errorTickets, setErrorTickets] = useState("");
    const [errorHistorial, setErrorHistorial] = useState("");
    const [errorRegistro, setErrorRegistro] = useState("");

    const [mensaje, setMensaje] = useState("");

    const [recargaTickets, setRecargaTickets] = useState(0);
    const [recargaHistorial, setRecargaHistorial] = useState(0);

    const actualizarTickets = useCallback(() => {
        setCargandoTickets(true);
        setRecargaTickets((valor) => valor + 1);
    }, []);

    const actualizarHistorial = useCallback(() => {
        setRecargaHistorial((valor) => valor + 1);
    }, []);

    // ==========================================
    // 1. CARGAR TICKETS VISIBLES
    // ==========================================

    useEffect(() => {
        if (!token) return;

        const controlador = new AbortController();

        async function cargar() {
            try {
                const datos = await listarTickets(
                    token,
                    "todos",
                    controlador.signal
                );

                if (!Array.isArray(datos)) {
                    throw new Error(
                        "Formato inesperado en el listado de tickets."
                    );
                }

                if (!controlador.signal.aborted) {
                    setTickets(datos);
                    setErrorTickets("");
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorTickets(
                        err.message || "No fue posible consultar tickets."
                    );
                    setTickets([]);
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoTickets(false);
                }
            }
        }

        cargar();

        return () => controlador.abort();
    }, [token, recargaTickets]);

    // ==========================================
    // 2. CONSULTAR HISTORIAL
    // ==========================================

    useEffect(() => {
        if (!token || !ticketId) return;

        const controlador = new AbortController();

        async function cargar() {
            try {
                const datos = await listarSeguimientos(
                    token,
                    ticketId,
                    controlador.signal
                );

                if (!Array.isArray(datos)) {
                    throw new Error(
                        "Formato inesperado en el historial."
                    );
                }

                if (!controlador.signal.aborted) {
                    setSeguimientos(datos);
                    setErrorHistorial("");
                }
            } catch (err) {
                if (!controlador.signal.aborted) {
                    setErrorHistorial(
                        err.message ||
                        "No fue posible consultar el historial."
                    );
                    setSeguimientos([]);
                }
            } finally {
                if (!controlador.signal.aborted) {
                    setCargandoHistorial(false);
                }
            }
        }

        cargar();

        return () => controlador.abort();
    }, [token, ticketId, recargaHistorial]);

    // ==========================================
    // 3. NOTIFICACIÓN TEMPORAL
    // ==========================================

    useEffect(() => {
        if (!mensaje) return;

        const temporizador = setTimeout(() => {
            setMensaje("");
        }, 4000);

        return () => clearTimeout(temporizador);
    }, [mensaje]);

    // ==========================================
    // 4. FILTRAR TICKETS
    // ==========================================

    const ticketsFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return tickets.filter((ticket) => {
            const contenido = [
                ticket.id,
                ticket.titulo,
                ticket.descripcion,
                ticket.estado,
            ]
                .filter((valor) => valor != null)
                .join(" ")
                .toLowerCase();

            return contenido.includes(texto);
        });
    }, [tickets, busqueda]);

    const ticketSeleccionado = tickets.find(
        (ticket) => String(ticket.id) === ticketId
    );

    const ticketCerrado =
        ticketSeleccionado?.estado?.toLowerCase() === "cerrado";



    // ==========================================
    // 5. SELECCIONAR TICKET
    // ==========================================

    function seleccionarTicket(id) {
        setTicketId(String(id));
        setSeguimientos([]);
        setObservacion("");
        setMensaje("");
        setErrorHistorial("");
        setErrorRegistro("");
        setCargandoHistorial(true);
    }

    // ==========================================
    // 6. REGISTRAR SEGUIMIENTO
    // ==========================================

    async function registrarSeguimiento(evento) {
        evento.preventDefault();

        if (
            !ticketId ||
            ticketCerrado ||
            guardando ||
            !observacion.trim()
        ) {
            return;
        }

        setGuardando(true);
        setErrorRegistro("");

        try {
            await crearSeguimiento(
                token,
                ticketId,
                observacion
            );

            setObservacion("");
            setMensaje("Seguimiento registrado correctamente.");
            setCargandoHistorial(true);
            actualizarHistorial();
        } catch (err) {
            setErrorRegistro(
                err.message ||
                "No fue posible registrar el seguimiento."
            );
        } finally {
            setGuardando(false);
        }
    }

    // ==========================================
    // 7. INTERFAZ
    // ==========================================

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div>
                    <div className="small text-secondary mb-1">
                        Inicio / Operación / Seguimientos
                    </div>

                    <h1 className="h3 fw-bold mb-1">
                        Seguimiento de tickets
                    </h1>

                    <p className="text-secondary mb-0">
                        Consulta el historial y registra observaciones
                        sobre la atención de solicitudes.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={actualizarTickets}
                    disabled={cargandoTickets}
                >
                    Actualizar tickets
                </button>
            </div>

            {mensaje && (
                <div
                    className="alert alert-success alert-dismissible fade show"
                    role="status"
                >
                    {mensaje}

                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Cerrar"
                        onClick={() => setMensaje("")}
                    />
                </div>
            )}

            {errorTickets && (
                <div className="alert alert-danger" role="alert">
                    {errorTickets}
                </div>
            )}

            <div className="row g-4">
                {/* PANEL IZQUIERDO */}

                <div className="col-lg-5 col-xl-4">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-3">
                            <h2 className="h5 fw-bold mb-3">
                                Tickets disponibles
                            </h2>

                            <input
                                type="search"
                                className="form-control mb-3"
                                placeholder="Buscar por ID o solicitud..."
                                aria-label="Buscar tickets"
                                value={busqueda}
                                onChange={(e) =>
                                    setBusqueda(e.target.value)
                                }
                            />

                            {cargandoTickets ? (
                                <div className="text-secondary py-3">
                                    Consultando tickets...
                                </div>
                            ) : (
                                <div
                                    className="list-group"
                                    style={{
                                        maxHeight: 550,
                                        overflowY: "auto",
                                    }}
                                >
                                    {ticketsFiltrados.map((ticket) => {
                                        const seleccionado =
                                            String(ticket.id) === ticketId;

                                        return (
                                            <button
                                                key={ticket.id}
                                                type="button"
                                                className={`list-group-item list-group-item-action ${seleccionado ? "active" : ""
                                                    }`}
                                                onClick={() =>
                                                    seleccionarTicket(ticket.id)
                                                }
                                            >
                                                <div className="d-flex justify-content-between gap-2">
                                                    <strong>
                                                        #{ticket.id} {ticket.titulo}
                                                    </strong>

                                                    <span className="small">
                                                        {formatearEstado(ticket.estado)}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`small mt-1 ${seleccionado
                                                            ? "text-white-50"
                                                            : "text-secondary"
                                                        }`}
                                                >
                                                    {ticket.descripcion}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {ticketsFiltrados.length === 0 && (
                                        <div className="text-secondary text-center py-4">
                                            No se encontraron tickets.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PANEL DERECHO */}

                <div className="col-lg-7 col-xl-8">
                    {!ticketSeleccionado ? (
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body text-center py-5">
                                <div className="fs-1 mb-3">📋</div>

                                <h2 className="h5 fw-bold">
                                    Selecciona un ticket
                                </h2>

                                <p className="text-secondary mb-0">
                                    Elige una solicitud para consultar
                                    su historial de atención.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
                            {/* INFORMACIÓN DEL TICKET */}

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                        <div>
                                            <div className="small text-secondary">
                                                Ticket #{ticketSeleccionado.id}
                                            </div>

                                            <h2 className="h5 fw-bold mt-1 mb-2">
                                                {ticketSeleccionado.titulo}
                                            </h2>
                                        </div>

                                        <span className="badge text-bg-primary">
                                            {formatearEstado(
                                                ticketSeleccionado.estado
                                            )}
                                        </span>
                                    </div>

                                    <p
                                        className="text-secondary mb-0"
                                        style={{ whiteSpace: "pre-wrap" }}
                                    >
                                        {ticketSeleccionado.descripcion}
                                    </p>
                                </div>
                            </div>

                            {/* REGISTRAR OBSERVACIÓN / SOLO CONSULTA */}

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-body p-4">
                                    {ticketCerrado ? (
                                        <div className="py-2">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <span className="fs-4" aria-hidden="true">🔒</span>
                                                <h2 className="h5 fw-bold mb-0">
                                                    Ticket cerrado — Solo consulta
                                                </h2>
                                            </div>
                                            <div className="alert alert-info mb-0" role="status">
                                                Este ticket se encuentra cerrado. Su historial de atención
                                                permanece disponible para consulta, pero no es posible
                                                registrar nuevas observaciones hasta que sea reabierto
                                                por un usuario autorizado.
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                        <h2 className="h5 fw-bold mb-3">
                                            Nueva observación
                                        </h2>

                                        {errorRegistro && (
                                            <div className="alert alert-danger">
                                                {errorRegistro}
                                            </div>
                                        )}

                                        <form onSubmit={registrarSeguimiento}>
                                            <label
                                                htmlFor="observacion-seguimiento"
                                                className="form-label"
                                            >
                                                Descripción de la actividad *
                                            </label>

                                            <textarea
                                                id="observacion-seguimiento"
                                                className="form-control"
                                                rows={4}
                                                maxLength={2000}
                                                value={observacion}
                                                onChange={(e) =>
                                                    setObservacion(e.target.value)
                                                }
                                                disabled={guardando}
                                                required
                                                placeholder="Ej. Se verificó la conectividad y se reinició el adaptador de red..."
                                            />

                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                                                <span className="small text-secondary">
                                                    {observacion.length}/2000 caracteres
                                                </span>

                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={
                                                        guardando ||
                                                        !observacion.trim()
                                                    }
                                                >
                                                    {guardando
                                                        ? "Registrando..."
                                                        : "Registrar seguimiento"}
                                                </button>
                                            </div>
                                        </form>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* HISTORIAL */}

                            <div className="card border-0 shadow-sm rounded-4">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                        <h2 className="h5 fw-bold mb-0">
                                            Historial de atención
                                        </h2>

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => {
                                                setCargandoHistorial(true);
                                                actualizarHistorial();
                                            }}
                                            disabled={cargandoHistorial}
                                        >
                                            Actualizar
                                        </button>
                                    </div>

                                    {errorHistorial && (
                                        <div className="alert alert-danger">
                                            {errorHistorial}
                                        </div>
                                    )}

                                    {cargandoHistorial ? (
                                        <div className="text-center py-4 text-secondary">
                                            Consultando historial...
                                        </div>
                                    ) : !errorHistorial && (
                                        <HistorialSeguimientos
                                            seguimientos={seguimientos}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
