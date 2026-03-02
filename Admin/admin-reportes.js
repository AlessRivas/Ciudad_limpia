import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth, firebaseConfig, getUserContext, logoutUser } from "../Componentes/auth.js";

const DB_BASE = `${firebaseConfig.databaseURL}/reportes`;

const tablaBody = document.getElementById("tablaBody");
const paginacionDiv = document.getElementById("paginacion");
const btnRecargar = document.getElementById("btnRecargar");
const btnLogout = document.getElementById("logout");

const buscador = document.getElementById("buscador");
const filtroEstado = document.getElementById("filtroEstado");

const modal = document.getElementById("modalEditar");
const editId = document.getElementById("editId");
const editTipo = document.getElementById("editTipo");
const editUsuario = document.getElementById("editUsuario");
const editUbicacion = document.getElementById("editUbicacion");
const editDescripcion = document.getElementById("editDescripcion");
const editEstado = document.getElementById("editEstado");

const btnGuardar = document.getElementById("btnGuardar");
const btnCerrar = document.getElementById("btnCerrar");

let reportesGlobal = [];
let reportesFiltrados = [];
let paginaActual = 1;
const porPagina = 5;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
    return;
  }

  const { role } = await getUserContext(user);
  if (role !== "admin") {
    alert("No autorizado");
    window.location.href = "../Home/inicio.html";
    return;
  }

  await cargarReportes();
});

btnLogout?.addEventListener("click", async () => {
  await logoutUser();
  window.location.href = "../Login/login.html";
});

btnRecargar.addEventListener("click", cargarReportes);
buscador.addEventListener("input", aplicarFiltros);
filtroEstado.addEventListener("change", aplicarFiltros);

btnGuardar.addEventListener("click", guardarEdicion);
btnCerrar.addEventListener("click", cerrarModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) cerrarModal();
});

tablaBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;
  if (!id || !action) return;

  if (action === "editar") {
    await abrirEditar(id);
    return;
  }

  if (action === "eliminar") {
    await eliminarReporte(id);
  }
});

async function cargarReportes() {
  try {
    const response = await fetch(`${DB_BASE}.json`);
    const data = (await response.json()) || {};

    reportesGlobal = Object.entries(data);
    aplicarFiltros();
  } catch (error) {
    console.error("Error al cargar reportes:", error);
    reportesGlobal = [];
    reportesFiltrados = [];
    renderTabla();
    renderPaginacion();
  }
}

function aplicarFiltros() {
  const texto = toSafeLower(buscador.value);
  const estadoSeleccionado = filtroEstado.value;

  reportesFiltrados = reportesGlobal.filter(([, reporte]) => {
    const tipo = toSafeLower(reporte.tipo);
    const usuario = toSafeLower(reporte.usuario);
    const ubicacion = toSafeLower(reporte.ubicacion);
    const estado = reporte.estado || "Pendiente";

    const coincideTexto =
      tipo.includes(texto) ||
      usuario.includes(texto) ||
      ubicacion.includes(texto);

    const coincideEstado =
      estadoSeleccionado === "Todos" ||
      estado === estadoSeleccionado;

    return coincideTexto && coincideEstado;
  });

  paginaActual = 1;
  renderTabla();
  renderPaginacion();
}

function renderTabla() {
  tablaBody.innerHTML = "";

  if (!reportesFiltrados.length) {
    tablaBody.innerHTML = `
      <tr>
        <td class="empty" colspan="7">No hay reportes para mostrar.</td>
      </tr>
    `;
    return;
  }

  const inicio = (paginaActual - 1) * porPagina;
  const fin = inicio + porPagina;
  const paginaItems = reportesFiltrados.slice(inicio, fin);

  paginaItems.forEach(([id, reporte]) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(reporte.tipo || "-")}</td>
      <td>${escapeHtml(reporte.usuario || "-")}</td>
      <td>${escapeHtml(reporte.ubicacion || "-")}</td>
      <td>${escapeHtml(reporte.descripcion || "-")}</td>
      <td>${escapeHtml(reporte.fecha || "-")}</td>
      <td>${escapeHtml(reporte.estado || "Pendiente")}</td>
      <td>
        <div class="acciones">
          <button class="btn-editar" data-action="editar" data-id="${id}">Editar</button>
          <button class="btn-eliminar" data-action="eliminar" data-id="${id}">Eliminar</button>
        </div>
      </td>
    `;

    tablaBody.appendChild(tr);
  });
}

function renderPaginacion() {
  paginacionDiv.innerHTML = "";

  const totalPaginas = Math.ceil(reportesFiltrados.length / porPagina);
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i += 1) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add("active");

    btn.addEventListener("click", () => {
      paginaActual = i;
      renderTabla();
      renderPaginacion();
    });

    paginacionDiv.appendChild(btn);
  }
}

async function abrirEditar(id) {
  const response = await fetch(`${DB_BASE}/${id}.json`);
  const data = await response.json();
  if (!data) return;

  editId.value = id;
  editTipo.value = data.tipo || "";
  editUsuario.value = data.usuario || "";
  editUbicacion.value = data.ubicacion || "";
  editDescripcion.value = data.descripcion || "";
  editEstado.value = data.estado || "Pendiente";

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

async function guardarEdicion() {
  const id = editId.value;
  if (!id) return;

  await fetch(`${DB_BASE}/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tipo: editTipo.value.trim(),
      usuario: editUsuario.value.trim(),
      ubicacion: editUbicacion.value.trim(),
      descripcion: editDescripcion.value.trim(),
      estado: editEstado.value
    })
  });

  cerrarModal();
  await cargarReportes();
}

function cerrarModal() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

async function eliminarReporte(id) {
  if (!confirm("Eliminar reporte?")) return;

  await fetch(`${DB_BASE}/${id}.json`, { method: "DELETE" });
  await cargarReportes();
}

function toSafeLower(value) {
  return (value || "").toString().toLowerCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
