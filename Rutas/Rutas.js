import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { renderNavbar } from "../Componentes/navbar.js";
import { auth, fetchWithAuth, firebaseConfig, getUserContext, logoutUser } from "../Componentes/auth.js";

const DB_URL = `${firebaseConfig.databaseURL}/rutas.json`;

const inputBusqueda = document.getElementById("buscarRuta");
const resultado = document.getElementById("resultado");

let rutasGlobal = [];
let markers = [];
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

    rutasGlobal = Object.values(baseData);
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
    const div = document.createElement("div");
    div.className = "ruta-card";
    div.innerHTML = `
      <strong>${ruta.nombre}</strong><br>
      Zona: ${ruta.zona}<br>
      Dia: ${ruta.dia}<br>
      Hora: ${ruta.hora}
    `;
    resultado.appendChild(div);
  });

  if (!rutas.length) {
    resultado.innerHTML = "<p>No hay resultados para esa busqueda.</p>";
  }
}

function dibujarMarcadores(rutas) {
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  rutas.forEach((ruta) => {
    const lat = ruta.lat || DURANGO[0];
    const lng = ruta.lng || DURANGO[1];

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
