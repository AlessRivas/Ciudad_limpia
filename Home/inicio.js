import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { renderNavbar } from "../Componentes/navbar.js";
import { auth, getUserContext, logoutUser } from "../Componentes/auth.js";

const status = document.getElementById("status");

onAuthStateChanged(auth, async (user) => {
  const { role } = await getUserContext(user);

  renderNavbar({
    active: "inicio",
    user,
    role,
    base: ".."
  });

  if (user) {
    status.style.color = "#2d5a27";
    status.textContent = role === "admin" ? "Sesion activa (admin)" : "Sesion activa";
  } else {
    status.style.color = "#777";
    status.textContent = "No has iniciado sesion. Ve a Login para entrar.";
  }
});

document.addEventListener("click", async (event) => {
  if (event.target?.id !== "btnLogout") return;

  await logoutUser();
  window.location.href = "../Login/login.html";
});
