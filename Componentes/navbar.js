export function renderNavbar({ active = "inicio", user = null, role = "user", base = "." } = {}) {
  const navLinks = document.querySelector(".nav__links");
  if (!navLinks) return;

  const is = (key) => (active === key ? "nav__link active" : "nav__link");
  const hrefBase = base && base !== "." ? base : "";
  const prefix = hrefBase ? `${hrefBase}/` : "";
  const isAdmin = role === "admin";
  const profileHref = isAdmin
    ? `${prefix}Admin/admin-perfil.html`
    : `${prefix}Usuarios/Usuarios-perfil.html`;

  if (user) {
    navLinks.innerHTML = `
      <a class="${is("inicio")}" href="${prefix}Home/inicio.html">Inicio</a>
      <a class="${is("reportes")}" href="${prefix}Reportes/reportes.html">Reportes</a>
      <a class="${is("rutas")}" href="${prefix}Rutas/Rutas.html">Rutas</a>
      ${isAdmin ? `<a class="${is("admin")}" href="${prefix}Admin/admin.html">Admin</a>` : ""}
      <a class="${is("perfil")}" href="${profileHref}">Mi perfil</a>
      <button id="btnLogout" class="nav__btn" type="button">Cerrar sesion</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a class="${is("inicio")}" href="${prefix}Home/inicio.html">Inicio</a>
      <a class="${is("login")}" href="${prefix}Login/login.html">Login</a>
      <a class="${is("registro")}" href="${prefix}Login/Registro/registro.html">Registro</a>
    `;
  }
}
