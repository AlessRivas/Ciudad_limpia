import { firebaseConfig } from "../firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const lista = document.getElementById("listaUsuarios");

async function cargarUsuarios() {
  const res = await fetch(`${firebaseConfig.databaseURL}/users.json`);
  const data = await res.json() || {};

  lista.innerHTML = "";

  Object.entries(data).forEach(([id, user]) => {
    lista.innerHTML += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px;">
        <p>${user.name} (${user.email})</p>
        <p>Rol: ${user.role}</p>
        <button onclick="hacerAdmin('${id}')">Hacer Admin</button>
      </div>
    `;
  });
}

window.hacerAdmin = async (id) => {
  await fetch(`${firebaseConfig.databaseURL}/users/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "admin" })
  });
  cargarUsuarios();
};

cargarUsuarios();