import { firebaseConfig } from "./firebase-config.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const btnLogout = document.getElementById("btnLogout");
const status = document.getElementById("status");

onAuthStateChanged(auth, (user) => {
  if (user) {
    btnLogout.style.display = "inline-block";
    status.style.color = "#2d5a27";
    status.textContent = `✅ Sesión activa: ${user.email}`;
  } else {
    btnLogout.style.display = "none";
    status.style.color = "#777";
    status.textContent = "ℹ️ No has iniciado sesión. Entra a 'Cuenta' para iniciar.";
    // Si quieres forzar login:
    // window.location.href = "login.html";
  }
});

btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});