import { firebaseConfig } from "/firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const lista = document.getElementById("listaReportes");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "/Login/login.html";
  cargarReportes();
});

async function cargarReportes() {
  const res = await fetch(`${firebaseConfig.databaseURL}/reportes.json`);
  const data = await res.json() || {};

  lista.innerHTML = "";

  Object.entries(data).forEach(([id, rep]) => {
    lista.innerHTML += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px;">
        <p><strong>${rep.tipo}</strong></p>
        <p>${rep.descripcion}</p>
        <p>Estado: ${rep.estado}</p>
        <button onclick="cambiarEstado('${id}', 'En proceso')">En proceso</button>
        <button onclick="cambiarEstado('${id}', 'Resuelto')">Resuelto</button>
        <button onclick="eliminarReporte('${id}')">Eliminar</button>
      </div>
    `;
  });
}

window.cambiarEstado = async (id, estado) => {
  await fetch(`${firebaseConfig.databaseURL}/reportes/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado })
  });
  cargarReportes();
};

window.eliminarReporte = async (id) => {
  await fetch(`${firebaseConfig.databaseURL}/reportes/${id}.json`, {
    method: "DELETE"
  });
  cargarReportes();
};