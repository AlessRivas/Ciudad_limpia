import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { renderNavbar } from "../Componentes/navbar.js";
import { auth, fetchWithAuth, firebaseConfig, getUserContext, logoutUser } from "../Componentes/auth.js";

const DB_BASE = `${firebaseConfig.databaseURL}/rutas`;

const rutaForm = document.getElementById("rutaForm");
const rutasBody = document.getElementById("rutasBody");
const btnRecargar = document.getElementById("btnRecargar");
const buscadorRuta = document.getElementById("buscadorRuta");
const filtroDia = document.getElementById("filtroDia");
const inicioLat = document.getElementById("inicioLat");
const inicioLng = document.getElementById("inicioLng");
const finLat = document.getElementById("finLat");
const finLng = document.getElementById("finLng");
const inicioDireccion = document.getElementById("inicioDireccion");
const finDireccion = document.getElementById("finDireccion");
const btnGeoInicio = document.getElementById("btnGeoInicio");
const btnGeoFin = document.getElementById("btnGeoFin");
const geoStatus = document.getElementById("geoStatus");

const modal = document.getElementById("modalEditarRuta");
const editRutaId = document.getElementById("editRutaId");
const editNombreRuta = document.getElementById("editNombreRuta");
const editZona = document.getElementById("editZona");
const editInicioLat = document.getElementById("editInicioLat");
const editInicioLng = document.getElementById("editInicioLng");
const editFinLat = document.getElementById("editFinLat");
const editFinLng = document.getElementById("editFinLng");
const editInicioDireccion = document.getElementById("editInicioDireccion");
const editFinDireccion = document.getElementById("editFinDireccion");
const btnGeoInicioEdit = document.getElementById("btnGeoInicioEdit");
const btnGeoFinEdit = document.getElementById("btnGeoFinEdit");
const editDia = document.getElementById("editDia");
const editHora = document.getElementById("editHora");
const btnGuardarRuta = document.getElementById("btnGuardarRuta");
const btnCerrarRuta = document.getElementById("btnCerrarRuta");

let rutasGlobal = [];
let rutasFiltradas = [];
let sessionUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
    return;
  }

  sessionUser = user;
  const { role } = await getUserContext(user);
  if (role !== "admin") {
    alert("No autorizado");
    window.location.href = "../Home/inicio.html";
    return;
  }

  renderNavbar({
    active: "admin",
    user,
    role,
    base: ".."
  });

  await cargarRutas();
});

document.addEventListener("click", async (event) => {
  const id = event.target?.id;
  if (id !== "btnLogout" && id !== "logout") return;
  await logoutUser();
  window.location.href = "../Login/login.html";
});

btnRecargar.addEventListener("click", cargarRutas);
buscadorRuta.addEventListener("input", aplicarFiltros);
filtroDia.addEventListener("change", aplicarFiltros);
btnGeoInicio.addEventListener("click", () =>
  geocodeToInputs(inicioDireccion.value, inicioLat, inicioLng, "Inicio")
);
btnGeoFin.addEventListener("click", () =>
  geocodeToInputs(finDireccion.value, finLat, finLng, "Fin")
);
btnGeoInicioEdit.addEventListener("click", () =>
  geocodeToInputs(editInicioDireccion.value, editInicioLat, editInicioLng, "Inicio (edicion)", modal)
);
btnGeoFinEdit.addEventListener("click", () =>
  geocodeToInputs(editFinDireccion.value, editFinLat, editFinLng, "Fin (edicion)", modal)
);

rutaForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nuevaRuta = {
    nombre: document.getElementById("nombreRuta").value.trim(),
    zona: document.getElementById("zona").value.trim(),
    startAddress: inicioDireccion.value.trim(),
    endAddress: finDireccion.value.trim(),
    startLat: parseCoord(inicioLat.value),
    startLng: parseCoord(inicioLng.value),
    endLat: parseCoord(finLat.value),
    endLng: parseCoord(finLng.value),
    hora: document.getElementById("hora").value,
    dia: document.getElementById("dia").value,
    creada: new Date().toISOString()
  };

  try {
    const response = await fetchWithAuth(`${DB_BASE}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaRuta)
    }, sessionUser);

    if (!response.ok) throw new Error("No se pudo guardar la ruta");

    rutaForm.reset();
    await cargarRutas();
  } catch (error) {
    console.error("Error guardando ruta:", error);
    alert("No se pudo guardar la ruta");
  }
});

rutasBody.addEventListener("click", async (event) => {
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
    await eliminarRuta(id);
  }
});

btnGuardarRuta.addEventListener("click", guardarEdicionRuta);
btnCerrarRuta.addEventListener("click", cerrarModalRuta);
modal.addEventListener("click", (event) => {
  if (event.target === modal) cerrarModalRuta();
});

async function cargarRutas() {
  try {
    const data = await fetchJson(`${DB_BASE}.json`);

    const baseData = data?.rutas && typeof data.rutas === "object" && Object.keys(data).length === 1
      ? data.rutas
      : data;

    rutasGlobal = Object.entries(baseData || {});
    aplicarFiltros();
  } catch (error) {
    console.error("Error cargando rutas:", error);
    rutasGlobal = [];
    rutasFiltradas = [];
    renderTabla();
  }
}

function aplicarFiltros() {
  const texto = toSafeLower(buscadorRuta.value);
  const dia = filtroDia.value;

  rutasFiltradas = rutasGlobal.filter(([, ruta]) => {
    const nombre = toSafeLower(ruta.nombre);
    const zona = toSafeLower(ruta.zona);
    const diaRuta = ruta.dia || "";

    const coincideTexto = nombre.includes(texto) || zona.includes(texto);
    const coincideDia = dia === "Todos" || diaRuta === dia;

    return coincideTexto && coincideDia;
  });

  renderTabla();
}

function renderTabla() {
  rutasBody.innerHTML = "";

  if (!rutasFiltradas.length) {
    rutasBody.innerHTML = `
      <tr>
        <td class="empty" colspan="5">No hay rutas para mostrar.</td>
      </tr>
    `;
    return;
  }

  rutasFiltradas.forEach(([id, ruta]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(ruta.nombre || "-")}</td>
      <td>${escapeHtml(ruta.zona || "-")}</td>
      <td>${escapeHtml(ruta.dia || "-")}</td>
      <td>${escapeHtml(ruta.hora || "-")}</td>
      <td>
        <div class="acciones">
          <button class="btn-editar" data-action="editar" data-id="${id}">Editar</button>
          <button class="btn-eliminar" data-action="eliminar" data-id="${id}">Eliminar</button>
        </div>
      </td>
    `;

    rutasBody.appendChild(tr);
  });
}

async function abrirEditar(id) {
  const ruta = await fetchJson(`${DB_BASE}/${id}.json`);
  if (!ruta) return;

  editRutaId.value = id;
  editNombreRuta.value = ruta.nombre || "";
  editZona.value = ruta.zona || "";
  editInicioDireccion.value = ruta.startAddress || "";
  editFinDireccion.value = ruta.endAddress || "";
  editInicioLat.value = formatCoord(ruta.startLat);
  editInicioLng.value = formatCoord(ruta.startLng);
  editFinLat.value = formatCoord(ruta.endLat);
  editFinLng.value = formatCoord(ruta.endLng);
  editDia.value = ruta.dia || "Lunes";
  editHora.value = ruta.hora || "";

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

async function guardarEdicionRuta() {
  const id = editRutaId.value;
  if (!id) return;

  await fetchWithAuth(`${DB_BASE}/${id}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: editNombreRuta.value.trim(),
      zona: editZona.value.trim(),
      startAddress: editInicioDireccion.value.trim(),
      endAddress: editFinDireccion.value.trim(),
      startLat: parseCoord(editInicioLat.value),
      startLng: parseCoord(editInicioLng.value),
      endLat: parseCoord(editFinLat.value),
      endLng: parseCoord(editFinLng.value),
      dia: editDia.value,
      hora: editHora.value
    })
  }, sessionUser);

  cerrarModalRuta();
  await cargarRutas();
}

function cerrarModalRuta() {
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

async function eliminarRuta(id) {
  if (!confirm("Eliminar ruta?")) return;

  await fetchWithAuth(`${DB_BASE}/${id}.json`, {
    method: "DELETE"
  }, sessionUser);

  await cargarRutas();
}

function toSafeLower(value) {
  return (value || "").toString().toLowerCase();
}

async function geocodeToInputs(address, latInput, lngInput, label) {
  const trimmed = (address || "").trim();
  if (!trimmed) {
    setGeoStatus(`${label}: ingresa una direccion primero.`, "warn");
    return;
  }

  setGeoStatus(`${label}: buscando coordenadas...`, "info");

  try {
    const query = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=mx`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "es" }
    });
    const data = await response.json().catch(() => []);

    if (!response.ok || !Array.isArray(data) || !data.length) {
      setGeoStatus(`${label}: no se encontraron resultados.`, "warn");
      return;
    }

    const { lat, lon } = data[0];
    latInput.value = lat;
    lngInput.value = lon;
    setGeoStatus(`${label}: coordenadas encontradas.`, "success");
  } catch (error) {
    console.error("Error geocodificando:", error);
    setGeoStatus(`${label}: no se pudo geocodificar.`, "warn");
  }
}

function setGeoStatus(message, type = "info") {
  if (!geoStatus) return;
  geoStatus.textContent = message;
  geoStatus.dataset.type = type;
}

function parseCoord(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoord(value) {
  return Number.isFinite(value) ? value : "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJson(url) {
  const response = await fetchWithAuth(url, {}, sessionUser);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }
  return data || {};
}
