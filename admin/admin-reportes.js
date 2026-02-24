import { firebaseConfig } from "../firebase-config.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// UI
const adminInfo = document.getElementById("adminInfo");
const lista = document.getElementById("lista");

const q = document.getElementById("q");
const fEstado = document.getElementById("fEstado");
const btnReload = document.getElementById("btnReload");
const btnLogout = document.getElementById("btnLogout");

const formEdit = document.getElementById("formEdit");
const rid = document.getElementById("rid");
const tipo = document.getElementById("tipo");
const ubicacion = document.getElementById("ubicacion");
const descripcion = document.getElementById("descripcion");
const estado = document.getElementById("estado");

const btnGuardar = document.getElementById("btnGuardar");
const btnEliminar = document.getElementById("btnEliminar");
const status = document.getElementById("status");

// Data cache
let reportes = {}; // {id: {...}}
let currentId = null;

// Helpers
const REPORTES_URL = `${firebaseConfig.databaseURL}/reportes.json`;
const reporteUrl = (id) => `${firebaseConfig.databaseURL}/reportes/${id}.json`;
const userUrl = (uid) => `${firebaseConfig.databaseURL}/users/${uid}.json`;

function badgeClass(estadoStr){
  const e = (estadoStr || "").toLowerCase();
  if (e.includes("proceso")) return "proceso";
  if (e.includes("resuelto")) return "resuelto";
  return "pendiente";
}

function setActiveCard(id){
  document.querySelectorAll(".item").forEach(el => el.classList.remove("active"));
  const el = document.getElementById(`rep-${id}`);
  if (el) el.classList.add("active");
}

function resetEditor(){
  currentId = null;
  rid.value = "";
  tipo.value = "";
  ubicacion.value = "";
  descripcion.value = "";
  estado.value = "Pendiente";
  btnEliminar.disabled = true;
  status.textContent = "";
}

function fillEditor(id){
  const r = reportes[id];
  if (!r) return;

  currentId = id;
  rid.value = id;
  tipo.value = r.tipo || "";
  ubicacion.value = r.ubicacion || "";
  descripcion.value = r.descripcion || "";
  estado.value = r.estado || "Pendiente";

  btnEliminar.disabled = false;
  status.style.color = "#777";
  status.textContent = `Editando reporte: ${id}`;
}

function getFilteredList(){
  const text = q.value.trim().toLowerCase();
  const est = fEstado.value;

  return Object.entries(reportes)
    .map(([id, r]) => ({ id, ...r }))
    .filter((r) => {
      if (est && (r.estado || "") !== est) return false;

      if (!text) return true;
      const hay = [
        r.tipo, r.ubicacion, r.usuario, r.descripcion, r.estado, r.fecha
      ].join(" ").toLowerCase();
      return hay.includes(text);
    })
    // más nuevos primero (si fecha existe como string)
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}

function renderList(){
  const list = getFilteredList();
  lista.innerHTML = "";

  if (!list.length) {
    lista.innerHTML = `<p style="color:#777;font-weight:700;">No hay reportes con esos filtros.</p>`;
    return;
  }

  for (const r of list) {
    const div = document.createElement("div");
    div.className = "item";
    div.id = `rep-${r.id}`;

    div.innerHTML = `
      <h3>${r.tipo || "Reporte"}</h3>
      <p><b>Usuario:</b> ${r.usuario || "-"}</p>
      <p><b>Ubicación:</b> ${r.ubicacion || "-"}</p>
      <p><b>Fecha:</b> ${r.fecha || "-"}</p>
      <span class="badge ${badgeClass(r.estado)}">${r.estado || "Pendiente"}</span>

      <div class="actions">
        <button class="btnView" type="button" data-view="${r.id}">Editar</button>
        <button class="btnQuick" type="button" data-set="${r.id}|Pendiente">Pendiente</button>
        <button class="btnQuick" type="button" data-set="${r.id}|En proceso">En proceso</button>
        <button class="btnQuick" type="button" data-set="${r.id}|Resuelto">Resuelto</button>
      </div>
    `;

    lista.appendChild(div);
  }

  // mantener selección
  if (currentId && document.getElementById(`rep-${currentId}`)) {
    setActiveCard(currentId);
  }
}

async function loadReportes(){
  status.style.color = "#777";
  status.textContent = "Cargando reportes…";

  const res = await fetch(REPORTES_URL);
  reportes = (await res.json()) || {};

  renderList();

  status.style.color = "#2d5a27";
  status.textContent = `Reportes cargados: ${Object.keys(reportes).length}`;
}

async function requireAdmin(user){
  const res = await fetch(userUrl(user.uid));
  const data = (await res.json()) || {};
  const role = data.role || "user";

  if (role !== "admin") {
    alert("Acceso denegado: solo administradores.");
    window.location.href = "../inicio.html";
    return false;
  }

  adminInfo.textContent = `Admin: ${data.name || user.email}`;
  return true;
}

// Auth gate
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../login.html";
    return;
  }

  const ok = await requireAdmin(user);
  if (!ok) return;

  resetEditor();
  await loadReportes();
});

// UI events
btnReload.addEventListener("click", loadReportes);
q.addEventListener("input", renderList);
fEstado.addEventListener("change", renderList);

btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../login.html";
});

// Clicks en lista (delegación)
lista.addEventListener("click", async (e) => {
  const view = e.target?.getAttribute?.("data-view");
  const set = e.target?.getAttribute?.("data-set");

  if (view) {
    setActiveCard(view);
    fillEditor(view);
  }

  if (set) {
    const [id, newEstado] = set.split("|");
    await fetch(reporteUrl(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: newEstado })
    });

    // actualizar cache local
    reportes[id] = { ...(reportes[id] || {}), estado: newEstado };
    renderList();

    status.style.color = "#2d5a27";
    status.textContent = `Estado actualizado: ${newEstado}`;
  }
});

// Guardar cambios (editar reporte)
formEdit.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentId) return;

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando…";

  try {
    const payload = {
      tipo: tipo.value.trim(),
      ubicacion: ubicacion.value.trim(),
      descripcion: descripcion.value.trim(),
      estado: estado.value
    };

    await fetch(reporteUrl(currentId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    reportes[currentId] = { ...(reportes[currentId] || {}), ...payload };
    renderList();
    setActiveCard(currentId);

    status.style.color = "#2d5a27";
    status.textContent = "Cambios guardados";
  } catch (err) {
    console.error(err);
    status.style.color = "red";
    status.textContent = "Error al guardar";
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
  }
});

// Eliminar reporte
btnEliminar.addEventListener("click", async () => {
  if (!currentId) return;
  const ok = confirm("¿Seguro que quieres eliminar este reporte?");
  if (!ok) return;

  try {
    await fetch(reporteUrl(currentId), { method: "DELETE" });
    delete reportes[currentId];

    status.style.color = "#2d5a27";
    status.textContent = "Reporte eliminado";

    resetEditor();
    renderList();
  } catch (err) {
    console.error(err);
    status.style.color = "red";
    status.textContent = "No se pudo eliminar";
  }
});