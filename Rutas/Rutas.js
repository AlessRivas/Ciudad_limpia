import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { renderNavbar } from "../Componentes/navbar.js";
import { auth, fetchWithAuth, firebaseConfig, getUserContext, logoutUser } from "../Componentes/auth.js";

const DB_URL = `${firebaseConfig.databaseURL}/rutas.json`;

const inputBusqueda = document.getElementById("buscarRuta");
const resultado = document.getElementById("resultado");
const routeStatus = document.getElementById("routeStatus");

let rutasGlobal = [];
let markers = [];
let selectedRouteId = null;
let sessionUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
    return;
  }

  sessionUser = user;
  const { role } = await getUserContext(user);

  renderNavbar({
    active: "rutas",
    user,
    role,
    base: ".."
  });

  await cargarRutas();
});

document.addEventListener("click", async (event) => {
  if (event.target?.id !== "btnLogout") return;

  await logoutUser();
  window.location.href = "../Login/login.html";
});

const DURANGO = [24.0277, -104.6532];
const map = L.map("map").setView(DURANGO, 13);
const routeLayer = L.layerGroup().addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

async function cargarRutas() {
  try {
    const response = await fetchWithAuth(DB_URL, {}, sessionUser);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.error) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    const baseData = data?.rutas && typeof data.rutas === "object" && Object.keys(data).length === 1
      ? data.rutas
      : data;

    if (!baseData || typeof baseData !== "object") {
      resultado.innerHTML = "<p>No hay rutas registradas.</p>";
      return;
    }

    rutasGlobal = normalizeRoutes(baseData);
    mostrarRutas(rutasGlobal);
    dibujarMarcadores(rutasGlobal);
  } catch (error) {
    console.error("Error cargando rutas:", error);
    resultado.innerHTML = "<p>No se pudieron cargar las rutas.</p>";
  }
}

function mostrarRutas(rutas) {
  resultado.innerHTML = "";

  rutas.forEach((ruta) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ruta-card${ruta.id === selectedRouteId ? " active" : ""}`;
    button.dataset.routeId = ruta.id || "";
    button.innerHTML = `
      <strong>${ruta.nombre || "Ruta"}</strong><br>
      Zona: ${ruta.zona || "-"}<br>
      Dia: ${ruta.dia || "-"}<br>
      Hora: ${ruta.hora || "-"}
    `;
    resultado.appendChild(button);
  });

  if (!rutas.length) {
    resultado.innerHTML = "<p>No hay resultados para esa busqueda.</p>";
  }
}

function dibujarMarcadores(rutas) {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  rutas.forEach((ruta) => {
    const lat = toNumber(ruta.startLat ?? ruta.lat) ?? DURANGO[0];
    const lng = toNumber(ruta.startLng ?? ruta.lng) ?? DURANGO[1];

    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`
        <strong>${ruta.nombre}</strong><br>
        ${ruta.zona}<br>
        ${ruta.dia} - ${ruta.hora}
      `);

    markers.push(marker);
  });
}

inputBusqueda.addEventListener("input", () => {
  const texto = inputBusqueda.value.toLowerCase();
  const filtradas = rutasGlobal.filter((ruta) =>
    (ruta?.nombre || "").toLowerCase().includes(texto) || (ruta?.zona || "").toLowerCase().includes(texto)
  );

  mostrarRutas(filtradas);
  dibujarMarcadores(filtradas);
});

resultado.addEventListener("click", async (event) => {
  const card = event.target.closest(".ruta-card");
  if (!card) return;

  const routeId = card.dataset.routeId;
  const selected = rutasGlobal.find((ruta) => ruta.id === routeId);
  if (!selected) return;

  selectedRouteId = routeId;
  mostrarRutas(rutasGlobal);
  await trazarRuta(selected);
});

async function trazarRuta(ruta) {
  const startLat = toNumber(ruta.startLat ?? ruta.lat);
  const startLng = toNumber(ruta.startLng ?? ruta.lng);
  const endLat = toNumber(ruta.endLat);
  const endLng = toNumber(ruta.endLng);

  if ([startLat, startLng, endLat, endLng].some((value) => value === null)) {
    setRouteStatus("Esta ruta no tiene coordenadas completas para trazar el recorrido.", "warn");
    routeLayer.clearLayers();
    return;
  }

  setRouteStatus("Cargando ruta...", "info");
  routeLayer.clearLayers();

  try {
    const geometry = await fetchOsrmRoute(startLat, startLng, endLat, endLng);
    const line = L.geoJSON(geometry, {
      style: { color: "#2d5a27", weight: 5, opacity: 0.9 }
    }).addTo(routeLayer);

    L.marker([startLat, startLng]).addTo(routeLayer).bindPopup("Inicio");
    L.marker([endLat, endLng]).addTo(routeLayer).bindPopup("Fin");

    const bounds = line.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    setRouteStatus("Ruta trazada correctamente.", "success");
  } catch (error) {
    console.error("Error trazando ruta:", error);
    setRouteStatus("No se pudo trazar la ruta con el servicio de rutas.", "warn");
  }
}

async function fetchOsrmRoute(startLat, startLng, endLat, endLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.code !== "Ok" || !data?.routes?.length) {
    throw new Error(data?.message || `HTTP ${response.status}`);
  }

  return data.routes[0].geometry;
}

function normalizeRoutes(data) {
  if (Array.isArray(data)) {
    return data.map((ruta, index) => ({
      id: `idx-${index}`,
      ...ruta
    }));
  }

  return Object.entries(data || {}).map(([id, ruta]) => ({
    id,
    ...(ruta || {})
  }));
}

function toNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function setRouteStatus(message, type = "info") {
  if (!routeStatus) return;
  routeStatus.textContent = message;
  routeStatus.dataset.type = type;
}
