
export const MENU = [
  {
    titulo: "Panel de control",
    ruta: "/dashboard",
    icono: "▦",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
  {
    titulo: "Usuarios",
    ruta: "/usuarios",
    icono: "♙",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Técnicos",
    ruta: "/tecnicos",
    icono: "⚙",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Categorías",
    ruta: "/categorias",
    icono: "▤",
    roles: ["superadmin", "admin"],
  },
  {
    titulo: "Tickets",
    ruta: "/tickets",
    icono: "▣",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
  {
    titulo: "Seguimientos",
    ruta: "/seguimientos",
    icono: "◷",
    roles: ["superadmin", "admin", "tecnico", "usuario"],
  },
];

export function menuPorRol(rol) {
  return MENU.filter((opcion) => opcion.roles.includes(rol));
}
