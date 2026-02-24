import { firebaseConfig } from "./firebase-config.js";
import { renderNavbar } from "./components/navbar.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const status = document.getElementById("status");

onAuthStateChanged(auth, (user) => {
  renderNavbar({ active: "inicio", user, base: "." });

  if (user) {
    status.style.color = "#2d5a27";
    status.textContent = `✅ Sesión activa`;
  } else {
    status.style.color = "#777";
    status.textContent = "ℹ No has iniciado sesión. Entra a Cuenta/Login.";
  }
});

document.addEventListener("click", async (e) => {
  if (e.target?.id === "btnLogout") {
    await signOut(auth);
    window.location.href = "login.html";
  }
});