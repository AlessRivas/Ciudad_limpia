import { firebaseConfig } from "../firebase-config.js";
import { renderNavbar } from "../components/navbar.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

let map;
let polyline = null;
let rutasData = {};
let favoritos = {};

const lista = document.getElementById("listaRutas");
const busqueda = document.getElementById("busqueda");

// Google Maps callback
window.initMap = function () {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 24.0277, lng: -104.6532 },
    zoom: 13,
  });
};

function setActiveCard(id){
  document.querySelectorAll(".ruta-card").forEach(el => el.classList.remove("active"));
  const el = document.getElementById(`ruta-${id}`);
  if (el) el.classList.add("active");
}

function drawRoute(coords){
  if (!map) return;

  if (polyline) polyline.setMap(null);

  polyline = new google.maps.Polyline({
    path: coords,
    geodesic: true,
    strokeColor: "#2d5a27",
    strokeOpacity: 1.0,
    strokeWeight: 5
  });

  polyline.setMap(map);

  // centrar
  const bounds = new google.maps.LatLngBounds();
  coords.forEach(c => bounds.extend(c));
  map.fitBounds(bounds);
}

function renderList(data){
  const entries = Object.entries(data);

  // favoritos primero
  entries.sort((a,b) => (favoritos[b[0]] ? 1 : 0) - (favoritos[a[0]] ? 1 : 0));

  lista.innerHTML = entries.map(([id, r]) => {
    const fav = !!favoritos[id];
    return `
      <div class="ruta-card" id="ruta-${id}">
        <h3>${r.nombre || "Ruta"}</h3>
        <p><b>Horario:</b> ${r.horario || "-"}</p>
        <p><b>Días:</b> ${r.dias || "-"}</p>
        <div class="ruta-actions">
          <button class="btnPrimary" onclick="verRuta('${id}')">Ver en mapa</button>
          <button class="btnFav ${fav ? "on" : ""}" onclick="toggleFav('${id}')">
            ${fav ? "♥" : "♡"} Favorito
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.verRuta = function(id){
  const r = rutasData[id];
  if (!r?.coordenadas?.length) return alert("Esta ruta no tiene coordenadas guardadas.");
  setActiveCard(id);
  drawRoute(r.coordenadas);
};

window.toggleFav = async function(id){
  const user = auth.currentUser;
  if (!user) return alert("Inicia sesión para usar favoritos.");

  const isFav = !!favoritos[id];

  await fetch(`${firebaseConfig.databaseURL}/favoritos/${user.uid}/${id}.json`, {
    method: isFav ? "DELETE" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(true)
  });

  await loadFavoritos(user.uid);
  renderList(rutasData);
};

async function loadFavoritos(uid){
  const res = await fetch(`${firebaseConfig.databaseURL}/favoritos/${uid}.json`);
  favoritos = (await res.json()) || {};
}

async function loadRutas(){
  const res = await fetch(`${firebaseConfig.databaseURL}/rutas.json`);
  rutasData = (await res.json()) || {};
  renderList(rutasData);
}

busqueda.addEventListener("input", () => {
  const t = busqueda.value.toLowerCase();

  const filtered = Object.fromEntries(
    Object.entries(rutasData).filter(([_, r]) => {
      const nombre = (r.nombre || "").toLowerCase();
      const horario = (r.horario || "").toLowerCase();
      const dias = (r.dias || "").toLowerCase();
      const colonias = (r.colonias || []).join(" ").toLowerCase();
      const calles = (r.calles || []).join(" ").toLowerCase();
      return [nombre, horario, dias, colonias, calles].some(x => x.includes(t));
    })
  );

  renderList(filtered);
});

onAuthStateChanged(auth, async (user) => {
  renderNavbar({ active: "rutas", user, base: ".." });

  if (!user) {
    // puedes permitir ver rutas sin login si quieres
    favoritos = {};
  } else {
    await loadFavoritos(user.uid);
  }

  await loadRutas();
});

document.addEventListener("click", async (e) => {
  if (e.target?.id === "btnLogout") {
    await signOut(auth);
    window.location.href = "../login.html";
  }
});