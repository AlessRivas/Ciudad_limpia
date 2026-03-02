import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth, firebaseConfig, getUserContext, logoutUser } from "../Componentes/auth.js";

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

const REPORTES_URL = `${firebaseConfig.databaseURL}/reportes.json`;
const reporteUrl = (id) => `${firebaseConfig.databaseURL}/reportes/${id}.json`;

let reportes = {};
let currentId = null;

function badgeClass(estadoStr) {
  const e = (estadoStr || "").toLowerCase();
  if (e.includes("proceso")) return "proceso";
  if (e.includes("resuelto")) return "resuelto";
  return "pendiente";
}

function setActiveCard(id) {
  document.querySelectorAll(".item").forEach((el) => el.classList.remove("active"));
  const el = document.getElementById(`rep-${id}`);
  if (el) el.classList.add("active");
}

function resetEditor() {
  currentId = null;
  rid.value = "";
  tipo.value = "";
  ubicacion.value = "";
  descripcion.value = "";
  estado.value = "Pendiente";
  btnEliminar.disabled = true;
  status.textContent = "";
}

function fillEditor(id) {
  const reporte = reportes[id];
  if (!reporte) return;

  currentId = id;
  rid.value = id;
  tipo.value = reporte.tipo || "";
  ubicacion.value = reporte.ubicacion || "";
  descripcion.value = reporte.descripcion || "";
  estado.value = reporte.estado || "Pendiente";

  btnEliminar.disabled = false;
  status.style.color = "#777";
  status.textContent = `Editando reporte: ${id}`;
}

function getFilteredList() {
  const text = q.value.trim().toLowerCase();
  const est = fEstado.value;

  return Object.entries(reportes)
    .map(([id, reporte]) => ({ id, ...reporte }))
    .filter((reporte) => {
      if (est && (reporte.estado || "") !== est) return false;

      if (!text) return true;
      const hay = [
        reporte.tipo,
        reporte.ubicacion,
        reporte.usuario,
        reporte.descripcion,
        reporte.estado,
        reporte.fecha
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(text);
    })
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}

function renderList() {
  const list = getFilteredList();
  lista.innerHTML = "";

  if (!list.length) {
    lista.innerHTML = `<p style="color:#777;font-weight:700;">No hay reportes con esos filtros.</p>`;
    return;
  }

  for (const reporte of list) {
    const div = document.createElement("div");
    div.className = "item";
    div.id = `rep-${reporte.id}`;

    div.innerHTML = `
      <h3>${escapeHtml(reporte.tipo || "Reporte")}</h3>
      <p><b>Usuario:</b> ${escapeHtml(reporte.usuario || "-")}</p>
      <p><b>Ubicacion:</b> ${escapeHtml(reporte.ubicacion || "-")}</p>
      <p><b>Fecha:</b> ${escapeHtml(reporte.fecha || "-")}</p>
      <span class="badge ${badgeClass(reporte.estado)}">${escapeHtml(reporte.estado || "Pendiente")}</span>

      <div class="actions">
        <button class="btnView" type="button" data-view="${reporte.id}">Editar</button>
        <button class="btnQuick" type="button" data-set="${reporte.id}|Pendiente">Pendiente</button>
        <button class="btnQuick" type="button" data-set="${reporte.id}|En proceso">En proceso</button>
        <button class="btnQuick" type="button" data-set="${reporte.id}|Resuelto">Resuelto</button>
      </div>
    `;

    lista.appendChild(div);
  }

  if (currentId && document.getElementById(`rep-${currentId}`)) {
    setActiveCard(currentId);
  }
}

async function loadReportes() {
  status.style.color = "#777";
  status.textContent = "Cargando reportes...";

  try {
    const response = await fetch(REPORTES_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    reportes = (await response.json()) || {};

    renderList();

    status.style.color = "#2d5a27";
    status.textContent = `Reportes cargados: ${Object.keys(reportes).length}`;
  } catch (error) {
    console.error("Error cargando reportes:", error);
    reportes = {};
    renderList();

    status.style.color = "red";
    status.textContent = "No se pudieron cargar los reportes.";
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
    return;
  }

  const { profile, role } = await getUserContext(user);

  if (role !== "admin") {
    alert("Acceso denegado: solo administradores.");
    window.location.href = "../Home/inicio.html";
    return;
  }

  adminInfo.textContent = `Admin: ${profile?.name || user.email}`;

  resetEditor();
  await loadReportes();
});

btnReload.addEventListener("click", loadReportes);
q.addEventListener("input", renderList);
fEstado.addEventListener("change", renderList);

btnLogout.addEventListener("click", async () => {
  await logoutUser();
  window.location.href = "../Login/login.html";
});

lista.addEventListener("click", async (event) => {
  const view = event.target?.getAttribute?.("data-view");
  const set = event.target?.getAttribute?.("data-set");

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

    reportes[id] = { ...(reportes[id] || {}), estado: newEstado };
    renderList();

    status.style.color = "#2d5a27";
    status.textContent = `Estado actualizado: ${newEstado}`;
  }
});

formEdit.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentId) return;

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

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
  } catch (error) {
    console.error("Error guardando cambios:", error);
    status.style.color = "red";
    status.textContent = "Error al guardar";
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar cambios";
  }
});

btnEliminar.addEventListener("click", async () => {
  if (!currentId) return;
  if (!confirm("Seguro que quieres eliminar este reporte?")) return;

  try {
    await fetch(reporteUrl(currentId), { method: "DELETE" });
    delete reportes[currentId];

    status.style.color = "#2d5a27";
    status.textContent = "Reporte eliminado";

    resetEditor();
    renderList();
  } catch (error) {
    console.error("Error eliminando reporte:", error);
    status.style.color = "red";
    status.textContent = "No se pudo eliminar";
  }
});

function escapeHtml(value) {
  return (value || "")
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
