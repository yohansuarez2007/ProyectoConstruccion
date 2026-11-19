
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";
import ModalTecnico from "../components/ModalTecnico";

import { listarUsuarios } from "../services/usuarios.service";

import {
  listarTecnicos,
  crearTecnico,
  actualizarTecnico,
  cambiarDisponibilidadTecnico,
} from "../services/tecnicos.service";

// ============================================
// 1. FUNCIONES AUXILIARES
// ============================================

function extraerLista(datos, clave) {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.[clave])) return datos[clave];
  if (Array.isArray(datos?.data)) return datos.data;

  throw new Error(`Formato inesperado de ${clave}`);
}

function obtenerRol(usuario) {
  return usuario.rol?.nombre || usuario.rol || "";
}

// ============================================
// 2. COMPONENTE PRINCIPAL
// ============================================

export default function Tecnicos() {
  const { token } = useAuth();

  const [tecnicos, setTecnicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [tecnicoEditar, setTecnicoEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [procesandoId, setProcesandoId] = useState(null);

  const [recarga, setRecarga] = useState(0);

  const actualizar = useCallback(() => {
    setRecarga((anterior) => anterior + 1);
  }, []);

  // ============================================
  // 3. CONSULTAR TÉCNICOS Y USUARIOS
  // ============================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      setCargando(true);

      try {
        const [datosTecnicos, datosUsuarios] =
          await Promise.all([
            listarTecnicos(token, controlador.signal),
            listarUsuarios(token, controlador.signal),
          ]);

        if (controlador.signal.aborted) return;

        setTecnicos(
          extraerLista(datosTecnicos, "tecnicos")
        );

        setUsuarios(
          extraerLista(datosUsuarios, "usuarios")
        );

        setError("");
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err.message || "Error consultando técnicos"
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    if (token) cargar();

    return () => controlador.abort();
  }, [token, recarga]);

  // ============================================
  // 4. NOTIFICACIONES AUTOMÁTICAS
  // ============================================

  useEffect(() => {
    if (!mensaje) return;

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 4000);

    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // ============================================
  // 5. USUARIOS ELEGIBLES
  // ============================================

  const usuariosDisponibles = useMemo(() => {
    const vinculados = new Set(
      tecnicos.map((tecnico) =>
        Number(tecnico.usuario_id)
      )
    );

    return usuarios.filter(
      (usuario) =>
        obtenerRol(usuario) === "tecnico" &&
        usuario.activo === true &&
        !vinculados.has(Number(usuario.id))
    );
  }, [usuarios, tecnicos]);

  // ============================================
  // 6. BÚSQUEDA Y FILTROS
  // ============================================

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return tecnicos.filter((tecnico) => {
      const contenido = [
        tecnico.nombre,
        tecnico.apellido,
        tecnico.email,
        tecnico.especialidad,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideEstado =
        filtro === "todos" ||
        (filtro === "disponibles" &&
          tecnico.disponible) ||
        (filtro === "no-disponibles" &&
          !tecnico.disponible);

      return contenido.includes(texto) && coincideEstado;
    });
  }, [tecnicos, busqueda, filtro]);

  const disponibles = tecnicos.filter(
    (tecnico) => tecnico.disponible && tecnico.activo
  ).length;

  // ============================================
  // 7. FORMULARIOS
  // ============================================

  function abrirNuevo() {
    setTecnicoEditar(null);
    setErrorModal("");
    setModalAbierto(true);
  }

  function abrirEdicion(tecnico) {
    setTecnicoEditar(tecnico);
    setErrorModal("");
    setModalAbierto(true);
  }

  // ============================================
  // 8. REGISTRAR O ACTUALIZAR
  // ============================================

  async function guardar(datos) {
    if (guardando) return;

    setGuardando(true);
    setErrorModal("");

    try {
      if (tecnicoEditar) {
        await actualizarTecnico(
          token,
          tecnicoEditar.id,
          datos
        );

        setMensaje(
          "Perfil técnico actualizado correctamente."
        );
      } else {
        await crearTecnico(token, datos);

        setMensaje(
          "Perfil técnico registrado correctamente."
        );
      }

      setModalAbierto(false);
      setTecnicoEditar(null);
      actualizar();
    } catch (err) {
      setErrorModal(
        err.message || "No fue posible guardar"
      );
    } finally {
      setGuardando(false);
    }
  }

  // ============================================
  // 9. CAMBIAR DISPONIBILIDAD
  // ============================================

  async function alternarDisponibilidad(tecnico) {
    if (procesandoId !== null) return;

    const nuevoEstado = !tecnico.disponible;

    const confirmado = window.confirm(
      `¿Deseas marcar a ${tecnico.nombre} ${tecnico.apellido} ` +
        `como ${
          nuevoEstado ? "disponible" : "no disponible"
        }?`
    );

    if (!confirmado) return;

    setProcesandoId(tecnico.id);
    setError("");
    setMensaje("");

    try {
      await cambiarDisponibilidadTecnico(
        token,
        tecnico.id,
        nuevoEstado
      );

      setMensaje(
        "Disponibilidad actualizada correctamente."
      );

      actualizar();
    } catch (err) {
      setError(
        err.message || "No se pudo actualizar"
      );
    } finally {
      setProcesandoId(null);
    }
  }

  // ============================================
  // 10. INTERFAZ
  // ============================================

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="small text-secondary mb-1">
            Inicio / Administración / Técnicos
          </div>

          <h1 className="h3 fw-bold mb-1">
            Gestión de técnicos
          </h1>

          <p className="text-secondary mb-0">
            Administra perfiles profesionales y su
            disponibilidad para la atención de tickets.
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

          <button
            type="button"
            className="btn btn-primary"
            onClick={abrirNuevo}
            disabled={cargando}
          >
            + Nuevo técnico
          </button>
        </div>
      </div>

      {/* ERRORES */}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* ÉXITO: DESAPARECE EN 4 SEGUNDOS */}

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
          ["Perfiles registrados", tecnicos.length],
          ["Disponibles y activos", disponibles],
          [
            "No disponibles",
            tecnicos.filter((t) => !t.disponible).length,
          ],
          ["Usuarios elegibles", usuariosDisponibles.length],
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

      {/* DIRECTORIO DE TÉCNICOS */}

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <label
                className="form-label"
                htmlFor="buscar-tecnico"
              >
                Buscar técnico
              </label>

              <input
                id="buscar-tecnico"
                className="form-control"
                placeholder="Nombre, correo o especialidad"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
              />
            </div>

            <div className="col-md-4">
              <label
                className="form-label"
                htmlFor="filtro-tecnico"
              >
                Disponibilidad
              </label>

              <select
                id="filtro-tecnico"
                className="form-select"
                value={filtro}
                onChange={(e) =>
                  setFiltro(e.target.value)
                }
              >
                <option value="todos">Todos</option>
                <option value="disponibles">
                  Disponibles
                </option>
                <option value="no-disponibles">
                  No disponibles
                </option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Técnico</th>
                  <th>Especialidad</th>
                  <th>Cuenta</th>
                  <th>Disponibilidad</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {!cargando &&
                  filtrados.map((tecnico) => (
                    <tr key={tecnico.id}>
                      <td>{tecnico.id}</td>

                      <td>
                        <div className="fw-semibold">
                          {tecnico.nombre}{" "}
                          {tecnico.apellido}
                        </div>

                        <div className="small text-secondary">
                          {tecnico.email}
                        </div>
                      </td>

                      <td>{tecnico.especialidad}</td>

                      <td>
                        <span
                          className={`badge ${
                            tecnico.activo
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {tecnico.activo
                            ? "Activa"
                            : "Inactiva"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            tecnico.disponible
                              ? "text-bg-primary"
                              : "text-bg-secondary"
                          }`}
                        >
                          {tecnico.disponible
                            ? "Disponible"
                            : "No disponible"}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              abrirEdicion(tecnico)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${
                              tecnico.disponible
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              alternarDisponibilidad(
                                tecnico
                              )
                            }
                            disabled={
                              procesandoId !== null
                            }
                          >
                            {procesandoId === tecnico.id
                              ? "Procesando..."
                              : tecnico.disponible
                                ? "No disponible"
                                : "Disponible"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!cargando &&
                  filtrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center text-secondary py-4"
                      >
                        No se encontraron perfiles técnicos.
                      </td>
                    </tr>
                  )}

                {cargando && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-4"
                    >
                      Consultando técnicos...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="small text-secondary">
            Mostrando {filtrados.length} de{" "}
            {tecnicos.length} perfiles.
          </div>
        </div>
      </div>

      {/* MODAL */}

      {modalAbierto && (
        <ModalTecnico
          key={tecnicoEditar?.id || "nuevo"}
          tecnico={tecnicoEditar}
          usuariosDisponibles={usuariosDisponibles}
          guardando={guardando}
          error={errorModal}
          onGuardar={guardar}
          onCerrar={() => {
            if (!guardando) {
              setModalAbierto(false);
              setTecnicoEditar(null);
            }
          }}
        />
      )}
    </div>
  );
}
