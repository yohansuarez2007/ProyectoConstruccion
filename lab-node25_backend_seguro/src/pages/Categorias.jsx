
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../hooks/useAuth";
import ModalCategoria from "../components/ModalCategoria";

import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
} from "../services/categorias.service";

export default function Categorias() {
  const { token } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  const [procesandoId, setProcesandoId] = useState(null);
  const [recarga, setRecarga] = useState(0);

  const actualizar = useCallback(() => {
    setRecarga((anterior) => anterior + 1);
  }, []);

  // ============================================
  // 1. CONSULTAR CATEGORÍAS
  // ============================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      try {
        const datos = await listarCategorias(
          token,
          controlador.signal
        );

        if (controlador.signal.aborted) return;

        if (!Array.isArray(datos)) {
          throw new Error(
            "El servidor devolvió un formato inesperado."
          );
        }

        setCategorias(datos);
        setError("");
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err.message ||
              "No se pudieron consultar las categorías."
          );
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    if (token) {
      cargar();
    }

    return () => controlador.abort();
  }, [token, recarga]);

  // ============================================
  // 2. OCULTAR NOTIFICACIONES DE ÉXITO
  // ============================================

  useEffect(() => {
    if (!mensaje) return;

    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 4000);

    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // ============================================
  // 3. FILTRAR CATEGORÍAS
  // ============================================

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return categorias.filter((categoria) => {
      const contenido = [
        categoria.nombre,
        categoria.descripcion,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const coincideEstado =
        filtro === "todas" ||
        (filtro === "activas" && categoria.activa) ||
        (filtro === "inactivas" && !categoria.activa);

      return contenido.includes(texto) && coincideEstado;
    });
  }, [categorias, busqueda, filtro]);

  const activas = categorias.filter(
    (categoria) => categoria.activa
  ).length;

  const inactivas = categorias.length - activas;

  // ============================================
  // 4. ABRIR FORMULARIOS
  // ============================================

  function abrirNuevo() {
    setCategoriaEditar(null);
    setErrorModal("");
    setMensaje("");
    setModalAbierto(true);
  }

  function abrirEdicion(categoria) {
    setCategoriaEditar(categoria);
    setErrorModal("");
    setMensaje("");
    setModalAbierto(true);
  }

  // ============================================
  // 5. REGISTRAR O EDITAR
  // ============================================

  async function guardar(datos) {
    if (guardando) return;

    setGuardando(true);
    setErrorModal("");

    try {
      if (categoriaEditar) {
        await actualizarCategoria(
          token,
          categoriaEditar.id,
          datos
        );

        setMensaje("Categoría actualizada correctamente.");
      } else {
        await crearCategoria(token, datos);

        setMensaje("Categoría registrada correctamente.");
      }

      setModalAbierto(false);
      setCategoriaEditar(null);
      setCargando(true);
      actualizar();
    } catch (err) {
      setErrorModal(
        err.message || "No fue posible guardar la categoría."
      );
    } finally {
      setGuardando(false);
    }
  }

  // ============================================
  // 6. ACTIVAR O DESACTIVAR
  // ============================================

  async function alternarEstado(categoria) {
    if (procesandoId !== null) return;

    const nuevoEstado = !categoria.activa;

    const confirmado = window.confirm(
      `¿Deseas ${nuevoEstado ? "activar" : "desactivar"} ` +
        `la categoría "${categoria.nombre}"?`
    );

    if (!confirmado) return;

    setProcesandoId(categoria.id);
    setError("");
    setMensaje("");

    try {
      await cambiarEstadoCategoria(
        token,
        categoria.id,
        nuevoEstado
      );

      setMensaje(
        nuevoEstado
          ? "Categoría activada correctamente."
          : "Categoría desactivada correctamente."
      );

      setCargando(true);
      actualizar();
    } catch (err) {
      setError(
        err.message || "No se pudo cambiar el estado."
      );
    } finally {
      setProcesandoId(null);
    }
  }

  // ============================================
  // 7. INTERFAZ
  // ============================================

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="small text-secondary mb-1">
            Inicio / Administración / Categorías
          </div>

          <h1 className="h3 fw-bold mb-1">
            Gestión de categorías
          </h1>

          <p className="text-secondary mb-0">
            Administra la clasificación de solicitudes
            e incidentes de soporte técnico.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => {
              setCargando(true);
              actualizar();
            }}
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
            + Nueva categoría
          </button>
        </div>
      </div>

      {/* MENSAJE DE ERROR: PERMANENTE */}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* MENSAJE DE ÉXITO: 4 SEGUNDOS */}

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
          ["Categorías registradas", categorias.length],
          ["Categorías activas", activas],
          ["Categorías inactivas", inactivas],
        ].map(([titulo, valor]) => (
          <div className="col-12 col-md-4" key={titulo}>
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
                htmlFor="buscar-categoria"
                className="form-label"
              >
                Buscar categoría
              </label>

              <input
                id="buscar-categoria"
                className="form-control"
                placeholder="Nombre o descripción"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label
                htmlFor="filtro-categoria"
                className="form-label"
              >
                Estado
              </label>

              <select
                id="filtro-categoria"
                className="form-select"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="activas">Activas</option>
                <option value="inactivas">Inactivas</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      Consultando categorías...
                    </td>
                  </tr>
                )}

                {!cargando &&
                  filtradas.map((categoria) => (
                    <tr key={categoria.id}>
                      <td>{categoria.id}</td>

                      <td className="fw-semibold">
                        {categoria.nombre}
                      </td>

                      <td className="text-secondary">
                        {categoria.descripcion || "Sin descripción"}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            categoria.activa
                              ? "text-bg-success"
                              : "text-bg-secondary"
                          }`}
                        >
                          {categoria.activa
                            ? "Activa"
                            : "Inactiva"}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => abrirEdicion(categoria)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${
                              categoria.activa
                                ? "btn-outline-warning"
                                : "btn-outline-success"
                            }`}
                            onClick={() =>
                              alternarEstado(categoria)
                            }
                            disabled={procesandoId !== null}
                          >
                            {procesandoId === categoria.id
                              ? "Procesando..."
                              : categoria.activa
                                ? "Desactivar"
                                : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!cargando && filtradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center text-secondary py-4"
                    >
                      No se encontraron categorías.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="small text-secondary">
            Mostrando {filtradas.length} de{" "}
            {categorias.length} categorías.
          </div>
        </div>
      </div>

      {/* MODAL DE REGISTRO Y EDICIÓN */}

      {modalAbierto && (
        <ModalCategoria
          key={categoriaEditar?.id || "nueva"}
          categoria={categoriaEditar}
          guardando={guardando}
          error={errorModal}
          onGuardar={guardar}
          onCerrar={() => {
            if (!guardando) {
              setModalAbierto(false);
              setCategoriaEditar(null);
            }
          }}
        />
      )}
    </div>
  );
}
