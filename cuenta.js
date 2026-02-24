import { firebaseConfig } from "./firebase-config.js";
import { renderNavbar } from "./components/navbar.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");
const email = document.getElementById("email");
const form = document.getElementById("formPerfil");
const status = document.getElementById("status");
const btnGuardar = document.getElementById("btnGuardar");

onAuthStateChanged(auth, async (user) => {
  renderNavbar({ active: "cuenta", user, base: "." });

  if (!user) {
    status.style.color = "#777";
    status.textContent = "ℹ️ Inicia sesión para ver tu perfil.";
    form.style.display = "none";
    return;
  }

  form.style.display = "grid";
  email.value = user.email || "";

  // Cargar perfil desde RTDB
  const res = await fetch(`${firebaseConfig.databaseURL}/users/${user.uid}.json`);
  const data = (await res.json()) || {};

  nombre.value = data.name || "";
  telefono.value = data.phone || "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    await fetch(`${firebaseConfig.databaseURL}/users/${user.uid}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nombre.value.trim(),
        phone: telefono.value.trim()
      })
    });

    status.style.color = "#2d5a27";
    status.textContent = "✅ Perfil actualizado";
  } catch (err) {
    console.error(err);
    status.style.color = "red";
    status.textContent = "❌ Error al guardar";
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
  }
});

document.addEventListener("click", async (e) => {
  if (e.target?.id === "btnLogout") {
    await signOut(auth);
    window.location.href = "login.html";
  }
});