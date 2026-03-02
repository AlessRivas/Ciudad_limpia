import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth, getUserContext, logoutUser } from "../Componentes/auth.js";

const adminName = document.getElementById("adminName");
const logoutBtn = document.getElementById("logout");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
    return;
  }

  const { profile, role } = await getUserContext(user);
  if (role !== "admin") {
    alert("Acceso denegado");
    window.location.href = "../Home/inicio.html";
    return;
  }

  adminName.textContent = `Admin: ${profile?.name || user.email}`;
});

logoutBtn.addEventListener("click", async () => {
  await logoutUser();
  window.location.href = "../Login/login.html";
});
