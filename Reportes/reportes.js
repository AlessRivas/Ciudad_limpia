// reportes.js
import { firebaseConfig } from "/firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_URL = `${firebaseConfig.databaseURL}/reportes.json`;

const reportForm = document.getElementById("reportForm");
const tipoSelect = document.getElementById("tipo");
const otroContainer = document.getElementById("otroContainer");
const otroDetalleInput = document.getElementById("otroDetalle");
const statusMsg = document.getElementById("status");
const btnEnviar = document.getElementById("btnEnviar");
const btnLogout = document.getElementById("btnLogout");
const userName = document.getElementById("userName");

// ✅ PROTECCIÓN: si no hay sesión, regresa a login
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/Login/login.html";
    return;
  }

  // (Opcional) cargar nombre desde /users/{uid} para mostrarlo
  try {
    const res = await fetch(`${firebaseConfig.databaseURL}/users/${user.uid}.json`);
    const data = await res.json();
    userName.textContent = data?.name ? `Hola, ${data.name}` : `Hola, ${user.email}`;
  } catch {
    userName.textContent = `Hola, ${user.email}`;
  }
});

// Logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/Login/login.html";
});

// Mostrar "Otro"
tipoSelect.addEventListener("change", () => {
  if (tipoSelect.value === "Otro") {
    otroContainer.style.display = "block";
    otroDetalleInput.required = true;
  } else {
    otroContainer.style.display = "none";
    otroDetalleInput.required = false;
    otroDetalleInput.value = "";
  }
});

// Enviar reporte
reportForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnEnviar.disabled = true;
  btnEnviar.innerText = "Enviando reporte...";

  // Validación "Otro"
  if (tipoSelect.value === "Otro" && !otroDetalleInput.value.trim()) {
    statusMsg.innerHTML = "Especifica el tipo de reporte en 'Otro'.";
    statusMsg.style.color = "red";
    btnEnviar.disabled = false;
    btnEnviar.innerText = "Enviar Reporte";
    return;
  }

  let tipoFinal = tipoSelect.value;
  if (tipoFinal === "Otro") tipoFinal = `Otro: ${otroDetalleInput.value.trim()}`;

  const nuevoReporte = {
    usuario: document.getElementById("usuario").value.trim(),
    tipo: tipoFinal,
    ubicacion: document.getElementById("ubicacion").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    estado: "Pendiente",
    fecha: new Date().toLocaleString()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoReporte)
    });

    if (!response.ok) throw new Error("Error en la respuesta del servidor");

    const data = await response.json();
    statusMsg.innerHTML = "¡Reporte enviado! Tu folio es: " + data.name;
    statusMsg.style.color = "#2d5a27";

    reportForm.reset();
    otroContainer.style.display = "none";
  } catch (error) {
    console.error("Error:", error);
    statusMsg.innerHTML = "No se pudo enviar el reporte. Revisa la consola.";
    statusMsg.style.color = "red";
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.innerText = "Enviar Reporte";
  }
});
