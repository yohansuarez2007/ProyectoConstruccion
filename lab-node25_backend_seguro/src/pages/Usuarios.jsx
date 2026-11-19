
import { useCallback, useEffect, useMemo, useState } from "react";

import ModalNuevoUsuario from "../components/ModalNuevoUsuario";
import CredencialTemporal from "../components/CredencialTemporal";
import ModalEditarUsuario from "../components/ModalEditarUsuario";
import ModalEstadoUsuario from "../components/ModalEstadoUsuario";
import ModalRestablecerPassword from "../components/ModalRestablecerPassword";

import { useAuth } from "../hooks/useAuth";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoUsuario,
  restablecerPasswordUsuario,
} from "../services/usuarios.service";

// =====================================================
// 1. FUNCIONES AUXILIARES
// =====================================================

function extraerUsuarios(datos) {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  if (Array.isArray(datos?.data)) return datos.data;

  if (Array.isArray(datos?.data?.usuarios)) {
    return datos.data.usuarios;
  }

  throw new Error(
    "El formato de respuesta de /api/usuarios no coincide " +
      "con los formatos admitidos. Revisa la respuesta en Network."
  );
}

function obtenerNombre(usuario) {
  return (
    [usuario.nombre, usuario.apellido]
      .filter(Boolean)
      .join(" ") ||
    usuario.nombre_completo ||
    "Sin nombre"
  );
}

function obtenerRol(usuario) {
  return usuario.rol?.nombre || usuario.rol || "Sin rol";
}

function obtenerEstado(usuario) {
  if (usuario.activo === true) return "activo";
  if (usuario.activo === false) return "inactivo";
  return "desconocido";
}

// =====================================================
// 2. COMPONENTE PRINCIPAL
// =====================================================

export default function Usuarios() {
  const { token, usuario: usuarioActual } = useAuth();

  // Estados del listado
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Recarga
  const [recarga, setRecarga] = useState(0);

  // Registro
  const [modalNuevo, setModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [credencialCreada, setCredencialCreada] = useState(null);

  // Edición y cambio de estado
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [usuarioEstado, setUsuarioEstado] = useState(null);

  const [procesando, setProcesando] = useState(false);
  const [errorOperacion, setErrorOperacion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  // Restablecimiento de contraseña
  const [usuarioRestablecer, setUsuarioRestablecer] = useState(null);
  const [restableciendo, setRestableciendo] = useState(false);
  const [
    errorRestablecimiento,
    setErrorRestablecimiento,
  ] = useState("");

  // =====================================================
  // 3. CONSULTAR USUARIOS
  // =====================================================

  useEffect(() => {
    const controlador = new AbortController();

    async function cargar() {
      try {
        const datos = await listarUsuarios(
          token,
          controlador.signal
        );

        const lista = extraerUsuarios(datos);

        if (!controlador.signal.aborted) {
          setUsuarios(lista);
          setError("");
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible consultar los usuarios."
          );

          setUsuarios([]);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => controlador.abort();
  }, [token, recarga]);

  // =====================================================
  // 4. NOTIFICACIONES DE ÉXITO: 4 SEGUNDOS
  // =====================================================

  useEffect(() => {
    if (!mensajeExito) return;

    const temporizador = setTimeout(() => {
      setMensajeExito("");
    }, 4000);

    return () => clearTimeout(temporizador);
  }, [mensajeExito]);

  // =====================================================
  // 5. ACTUALIZAR LISTADO
  // =====================================================

  const actualizar = useCallback(() => {
    setCargando(true);
    setRecarga((valor) => valor + 1);
  }, []);

  // =====================================================
  // 6. REGISTRAR USUARIO
  // =====================================================

  async function registrarUsuario(datosFormulario) {
    if (guardando) return;

    setGuardando(true);
    setErrorRegistro("");

    try {
      const resultado = await crearUsuario(
        token,
        datosFormulario
      );

      if (
        !resultado?.usuario ||
        !resultado?.credencialTemporal
      ) {
        throw new Error(
          "La respuesta del backend no contiene " +
            "la información esperada."
        );
      }

      setModalNuevo(false);
      setCredencialCreada(resultado);

      actualizar();
    } catch (err) {
      setErrorRegistro(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el usuario."
      );
    } finally {
      setGuardando(false);
    }
  }

  // =====================================================
  // 7. EDICIÓN Y CAMBIO DE ESTADO
  // =====================================================

  function abrirEdicion(usuario) {
    setErrorOperacion("");
    setMensajeExito("");
    setUsuarioEditar(usuario);
  }

  function abrirCambioEstado(usuario) {
    setErrorOperacion("");
    setMensajeExito("");
    setUsuarioEstado(usuario);
  }

  async function guardarEdicion(datosFormulario) {
    if (!usuarioEditar || procesando) return;

    setProcesando(true);
    setErrorOperacion("");

    try {
      await actualizarUsuario(
        token,
        usuarioEditar.id,
        datosFormulario
      );

      setUsuarioEditar(null);
      setMensajeExito(
        "Datos del usuario actualizados correctamente."
      );

      actualizar();
    } catch (err) {
      setErrorOperacion(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el usuario."
      );
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarCambioEstado() {
    if (!usuarioEstado || procesando) return;

    setProcesando(true);
    setErrorOperacion("");

    const nuevoEstado = !usuarioEstado.activo;

    try {
      await cambiarEstadoUsuario(
        token,
        usuarioEstado.id,
        nuevoEstado
      );

      setUsuarioEstado(null);

      setMensajeExito(
        nuevoEstado
          ? "Cuenta reactivada correctamente."
          : "Cuenta desactivada correctamente."
      );

      actualizar();
    } catch (err) {
      setErrorOperacion(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado."
      );
    } finally {
      setProcesando(false);
    }
  }

  // =====================================================
  // 8. RESTABLECIMIENTO DE CONTRASEÑA
  // =====================================================

  function abrirRestablecimiento(usuario) {
    setErrorRestablecimiento("");
    setUsuarioRestablecer(usuario);
  }

  async function confirmarRestablecimiento() {
    if (!usuarioRestablecer || restableciendo) return;

    setRestableciendo(true);
    setErrorRestablecimiento("");

    try {
      const resultado = await restablecerPasswordUsuario(
        token,
        usuarioRestablecer.id
      );

      if (
        !resultado?.usuario ||
        !resultado?.credencialTemporal
      ) {
        throw new Error(
          "El servidor no devolvió la credencial esperada."
        );
      }

      setUsuarioRestablecer(null);

      // Mostrar credencial temporal al administrador.
      setCredencialCreada(resultado);

      actualizar();
    } catch (err) {
      setErrorRestablecimiento(
        err instanceof Error
          ? err.message
          : "No fue posible restablecer la contraseña."
      );
    } finally {
      setRestableciendo(false);
    }
  }

  // =====================================================
  // 9. ROLES DISPONIBLES
  // =====================================================

  const roles = useMemo(() => {
    return [...new Set(usuarios.map(obtenerRol))].sort();
  }, [usuarios]);

  // =====================================================
  // 10. BÚSQUEDA Y FILTROS
  // =====================================================

  const usuariosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const contenido = [
        obtenerNombre(usuario),
        usuario.email,
        usuario.tipo_documento,
        usuario.numero_documento,
        obtenerRol(usuario),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        contenido.includes(texto) &&
        (
          filtroRol === "todos" ||
          obtenerRol(usuario) === filtroRol
        ) &&
        (
          filtroEstado === "todos" ||
          obtenerEstado(usuario) === filtroEstado
        )
      );
    });
  }, [
    usuarios,
    busqueda,
    filtroRol,
    filtroEstado,
  ]);

  // =====================================================
  // 11. INTERFAZ
  // =====================================================

  return (
    <div className="container-fluid">

      {/* ENCABEZADO */}

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <div className="text-secondary small mb-1">
            Inicio / Administración / Usuarios
          </div>

          <h1 className="h3 fw-bold mb-1">
            Gestión de usuarios
          </h1>

          <p className="text-secondary mb-0">
            Consulta, filtra y administra las cuentas
            registradas en NEXDESK.
          </p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={actualizar}
            disabled={cargando}
          >
            {cargando
              ? "Consultando..."
              : "Actualizar listado"}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setErrorRegistro("");
              setModalNuevo(true);
            }}
          >
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* NOTIFICACIÓN DE ÉXITO */}

      {mensajeExito && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="status"
        >
          {mensajeExito}

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() => setMensajeExito("")}
          />
        </div>
      )}

      {/* INDICADORES */}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3">
              <div className="text-secondary small">
                Usuarios recibidos
              </div>

              <div className="fs-3 fw-bold">
                {usuarios.length}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-3">
              <div className="text-secondary small">
                Resultados filtrados
              </div>

              <div className="fs-3 fw-bold">
                {usuariosFiltrados.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DIRECTORIO DE USUARIOS */}

      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h2 className="h5 fw-bold mb-0">
              Directorio de usuarios
            </h2>

            <span className="badge text-bg-primary">
              Rol actual: {obtenerRol(usuarioActual || {})}
            </span>
          </div>

          {/* BÚSQUEDA Y FILTROS */}

          <div className="row g-2 mb-3">
            <div className="col-lg-6">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar por nombre, correo o documento..."
                aria-label="Buscar usuarios"
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(e.target.value)
                }
              />
            </div>

            <div className="col-lg-3">
              <select
                className="form-select"
                aria-label="Filtrar por rol"
                value={filtroRol}
                onChange={(e) =>
                  setFiltroRol(e.target.value)
                }
              >
                <option value="todos">
                  Todos los roles
                </option>

                {roles.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-3">
              <select
                className="form-select"
                aria-label="Filtrar por estado"
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(e.target.value)
                }
              >
                <option value="todos">
                  Todos los estados
                </option>

                <option value="activo">
                  Activos
                </option>

                <option value="inactivo">
                  Inactivos
                </option>

                <option value="desconocido">
                  Estado no informado
                </option>
              </select>
            </div>
          </div>

          {/* ERRORES DE CONSULTA */}

          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              <strong>
                Error al consultar usuarios.
              </strong>

              <div>{error}</div>
            </div>
          )}

          {/* TABLA */}

          {cargando ? (
            <div
              className="text-center py-5"
              role="status"
            >
              <div className="spinner-border text-primary mb-3" />

              <p className="text-secondary">
                Consultando usuarios en la API REST...
              </p>
            </div>
          ) : !error && (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Documento</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>

                      <td className="fw-semibold">
                        {obtenerNombre(usuario)}
                      </td>

                      {/* DOCUMENTO */}

                      <td>
                        {usuario.numero_documento ? (
                          <div>
                            <span className="fw-semibold">
                              {usuario.numero_documento}
                            </span>

                            <div className="small text-secondary">
                              {usuario.tipo_documento || "Sin tipo"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-secondary">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        {usuario.email || "—"}
                      </td>

                      {/* ROL */}

                      <td>
                        <span className="badge text-bg-primary">
                          {obtenerRol(usuario)}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td>
                        <span
                          className={`badge ${
                            obtenerEstado(usuario) === "activo"
                              ? "text-bg-success"
                              : obtenerEstado(usuario) === "inactivo"
                                ? "text-bg-secondary"
                                : "text-bg-light"
                          }`}
                        >
                          {obtenerEstado(usuario)}
                        </span>
                      </td>

                      {/* ACCIONES */}

                      <td className="text-end">
                        {(() => {
                          const rolActual = obtenerRol(
                            usuarioActual || {}
                          );

                          const rolObjetivo = obtenerRol(usuario);

                          const puedeAdministrar =
                            rolActual === "superadmin" ||
                            (
                              rolActual === "admin" &&
                              !["admin", "superadmin"].includes(
                                rolObjetivo
                              )
                            );

                          const esCuentaPropia =
                            usuarioActual?.id != null &&
                            String(usuario.id) ===
                              String(usuarioActual.id);

                          if (!puedeAdministrar) {
                            return (
                              <span className="text-secondary small">
                                Sin permisos
                              </span>
                            );
                          }

                          return (
                            <div className="d-flex justify-content-end gap-2 flex-wrap">

                              {/* EDITAR */}

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  abrirEdicion(usuario)
                                }
                              >
                                Editar
                              </button>

                              {/* ACTIVAR / DESACTIVAR */}

                              <button
                                type="button"
                                className={`btn btn-sm ${
                                  usuario.activo
                                    ? "btn-outline-danger"
                                    : "btn-outline-success"
                                }`}
                                onClick={() =>
                                  abrirCambioEstado(usuario)
                                }
                                disabled={
                                  (esCuentaPropia && usuario.activo) ||
                                  typeof usuario.activo !== "boolean"
                                }
                                title={
                                  esCuentaPropia && usuario.activo
                                    ? "No puedes desactivar tu propia cuenta"
                                    : undefined
                                }
                              >
                                {usuario.activo
                                  ? "Desactivar"
                                  : "Reactivar"}
                              </button>

                              {/* RESTABLECER CONTRASEÑA */}

                              {!esCuentaPropia &&
                                rolObjetivo !== "superadmin" &&
                                (
                                  rolActual === "superadmin" ||
                                  (
                                    rolActual === "admin" &&
                                    ["tecnico", "usuario"].includes(
                                      rolObjetivo
                                    )
                                  )
                                ) && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-warning"
                                    onClick={() =>
                                      abrirRestablecimiento(usuario)
                                    }
                                    disabled={!usuario.activo}
                                    title="Generar una contraseña temporal"
                                  >
                                    Restablecer clave
                                  </button>
                                )}

                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}

                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center text-secondary py-4"
                      >
                        No se encontraron usuarios con esos filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE REGISTRO */}

      <ModalNuevoUsuario
        abierto={modalNuevo}
        rolActual={obtenerRol(usuarioActual || {})}
        guardando={guardando}
        error={errorRegistro}
        onGuardar={registrarUsuario}
        onCerrar={() => {
          if (!guardando) {
            setModalNuevo(false);
            setErrorRegistro("");
          }
        }}
      />

      {/* CREDENCIAL TEMPORAL */}

      <CredencialTemporal
        resultado={credencialCreada}
        onCerrar={() =>
          setCredencialCreada(null)
        }
      />

      {/* MODAL DE EDICIÓN */}

      {usuarioEditar && (
        <ModalEditarUsuario
          key={usuarioEditar.id}
          usuario={usuarioEditar}
          guardando={procesando}
          error={errorOperacion}
          onGuardar={guardarEdicion}
          onCerrar={() => {
            if (!procesando) {
              setUsuarioEditar(null);
              setErrorOperacion("");
            }
          }}
        />
      )}

      {/* MODAL DE CAMBIO DE ESTADO */}

      {usuarioEstado && (
        <ModalEstadoUsuario
          usuario={usuarioEstado}
          guardando={procesando}
          error={errorOperacion}
          onConfirmar={confirmarCambioEstado}
          onCerrar={() => {
            if (!procesando) {
              setUsuarioEstado(null);
              setErrorOperacion("");
            }
          }}
        />
      )}

      {/* MODAL DE RESTABLECIMIENTO */}

      {usuarioRestablecer && (
        <ModalRestablecerPassword
          usuario={usuarioRestablecer}
          procesando={restableciendo}
          error={errorRestablecimiento}
          onConfirmar={confirmarRestablecimiento}
          onCerrar={() => {
            if (!restableciendo) {
              setUsuarioRestablecer(null);
              setErrorRestablecimiento("");
            }
          }}
        />
      )}

    </div>
  );
}
