import { firebaseConfig } from "../firebase-config.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const btnLogout = document.getElementById("btnLogout");

const totalReportes = document.getElementById("totalReportes");
const pendientes = document.getElementById("pendientes");
const resueltos = document.getElementById("resueltos");
const totalUsuarios = document.getElementById("totalUsuarios");

// Protección por rol
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  const res = await fetch(`${firebaseConfig.databaseURL}/users/${user.uid}.json`);
  const userData = await res.json();

  if (userData.role !== "admin") {
    alert("Acceso denegado");
    window.location.href = "../reportes.html";
    return;
  }

  cargarEstadisticas();
});

async function cargarEstadisticas() {

  const resReportes = await fetch(`${firebaseConfig.databaseURL}/reportes.json`);
  const reportesData = await resReportes.json() || {};

  const resUsers = await fetch(`${firebaseConfig.databaseURL}/users.json`);
  const usersData = await resUsers.json() || {};

  const reportesArray = Object.values(reportesData);

  totalReportes.textContent = reportesArray.length;
  pendientes.textContent = reportesArray.filter(r => r.estado === "Pendiente").length;
  resueltos.textContent = reportesArray.filter(r => r.estado === "Resuelto").length;
  totalUsuarios.textContent = Object.keys(usersData).length;
}

// Logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});