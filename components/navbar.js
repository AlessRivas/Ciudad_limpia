// components/navbar.js
export function renderNavbar({ active = "inicio", user = null, base = "." } = {}) {
  // base: "." si estás en raíz, ".." si estás dentro de /rutas
  const navLinks = document.querySelector(".nav__links");
  if (!navLinks) return;

  const is = (key) => (active === key ? "nav__link active" : "nav__link");

  if (user) {
    navLinks.innerHTML = `
      <a class="${is("inicio")}" href="${base}/inicio.html">Inicio</a>
      <a class="${is("reportes")}" href="${base}/reportes.html">Reportes</a>
      <a class="${is("rutas")}" href="${base}/rutas/rutas.html">Rutas</a>
      <a class="${is("cuenta")}" href="${base}/cuenta.html">Cuenta</a>
      <button id="btnLogout" class="nav__btn" type="button">Cerrar sesión</button>
    `;
  } else {
    navLinks.innerHTML = `
      <a class="${is("inicio")}" href="${base}/inicio.html">Inicio</a>
      <a class="${is("login")}" href="${base}/login.html">Login</a>
      <a class="${is("registro")}" href="${base}/registro.html">Registro</a>
    `;
  }
}