
import { useState } from "react";

const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "PA", "PPT", "OTRO"];

const VALORES_INICIALES = {
  tipo_documento: "CC",
  numero_documento: "",
  nombre: "",
  apellido: "",
  email: "",
  rol: "usuario",
};

export default function FormularioUsuario({
  rolActual,
  guardando,
  onGuardar,
  onCancelar,
}) {
  const [formulario, setFormulario] = useState({
    ...VALORES_INICIALES,
  });

  const rolesPermitidos =
    rolActual === "superadmin"
      ? ["usuario", "tecnico", "admin", "superadmin"]
      : ["usuario", "tecnico"];

  function cambiar(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  function enviar(evento) {
    evento.preventDefault();

    onGuardar({
      tipo_documento: formulario.tipo_documento,
      numero_documento:
        formulario.numero_documento.trim().toUpperCase(),
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      email: formulario.email.trim().toLowerCase(),
      rol: formulario.rol,
    });
  }

  return (
    <form onSubmit={enviar}>
      <div className="row g-3">
        <div className="col-md-6">
          <label htmlFor="nuevo-nombre" className="form-label">
            Nombre *
          </label>
          <input
            id="nuevo-nombre"
            name="nombre"
            className="form-control"
            value={formulario.nombre}
            onChange={cambiar}
            minLength={1}
            maxLength={100}
            required
            disabled={guardando}
          />
        </div>

        <div className="col-md-6">
          <label htmlFor="nuevo-apellido" className="form-label">
            Apellido *
          </label>
          <input
            id="nuevo-apellido"
            name="apellido"
            className="form-control"
            value={formulario.apellido}
            onChange={cambiar}
            minLength={1}
            maxLength={100}
            required
            disabled={guardando}
          />
        </div>

        <div className="col-md-5">
          <label htmlFor="nuevo-tipo" className="form-label">
            Tipo de documento *
          </label>
          <select
            id="nuevo-tipo"
            name="tipo_documento"
            className="form-select"
            value={formulario.tipo_documento}
            onChange={cambiar}
            required
            disabled={guardando}
          >
            {TIPOS_DOCUMENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-7">
          <label htmlFor="nuevo-documento" className="form-label">
            Número de documento *
          </label>
          <input
            id="nuevo-documento"
            name="numero_documento"
            className="form-control"
            value={formulario.numero_documento}
            onChange={cambiar}
            pattern="[A-Za-z0-9-]{4,30}"
            minLength={4}
            maxLength={30}
            title="Entre 4 y 30 caracteres: letras, números o guiones"
            required
            disabled={guardando}
          />
          <div className="form-text">
            Entre 4 y 30 caracteres alfanuméricos o guiones.
          </div>
        </div>

        <div className="col-12">
          <label htmlFor="nuevo-email" className="form-label">
            Correo electrónico *
          </label>
          <input
            id="nuevo-email"
            type="email"
            name="email"
            className="form-control"
            value={formulario.email}
            onChange={cambiar}
            autoComplete="off"
            required
            disabled={guardando}
          />
        </div>

        <div className="col-12">
          <label htmlFor="nuevo-rol" className="form-label">
            Rol asignado *
          </label>
          <select
            id="nuevo-rol"
            name="rol"
            className="form-select"
            value={formulario.rol}
            onChange={cambiar}
            required
            disabled={guardando}
          >
            {rolesPermitidos.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>

          <div className="form-text">
            Los roles disponibles dependen de los permisos
            de tu cuenta.
          </div>
        </div>
      </div>

      <div className="alert alert-info mt-4 mb-0 small">
        NEXDESK generará automáticamente una contraseña
        temporal. El nuevo usuario deberá cambiarla en
        su primer inicio de sesión.
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={guardando}
        >
          {guardando ? "Registrando..." : "Registrar usuario"}
        </button>
      </div>
    </form>
  );
}
