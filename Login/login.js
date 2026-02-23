// login.js
import { firebaseConfig } from "../firebase-config.js";

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Evita inicializar Firebase 2 veces
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ DEBUG: confirma qué apiKey está usando tu página
console.log("APIKEY USADA (login):", firebaseConfig.apiKey);

const loginForm = document.getElementById("loginForm");
const statusMsg = document.getElementById("status");
const btnLogin = document.getElementById("btnLogin");

// Si ya está logueado, redirige
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "reportes.html";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnLogin.disabled = true;
  btnLogin.innerText = "Entrando...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    statusMsg.style.color = "green";
    statusMsg.innerHTML = "✅ Sesión iniciada";
    window.location.href = "reportes.html";

  } catch (err) {
    console.log("ERROR CODE:", err.code);
    console.log("ERROR MSG:", err.message);

    statusMsg.style.color = "red";
    statusMsg.innerHTML = `❌ ${err.code || err.message}`;
  } finally {
    btnLogin.disabled = false;
    btnLogin.innerText = "Entrar";
  }
});
