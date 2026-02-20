// registro.js
import { firebaseConfig } from "./firebase-config.js";

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ✅ Evita inicializar Firebase 2 veces
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const API_BASE = firebaseConfig.databaseURL;

// ✅ DEBUG: confirma qué apiKey está usando tu página
console.log("APIKEY USADA (registro):", firebaseConfig.apiKey);

const form = document.getElementById("registerForm");
const statusMsg = document.getElementById("status");
const btnRegister = document.getElementById("btnRegister");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  btnRegister.disabled = true;
  btnRegister.innerText = "Creando cuenta...";

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // 1) Crear usuario en Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // 2) Guardar perfil en RTDB
    const userData = {
      name,
      phone,
      email,
      role: "user",
      createdAt: new Date().toISOString()
    };

    const res = await fetch(`${API_BASE}/users/${uid}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    if (!res.ok) throw new Error("No se pudo guardar en la base de datos");

    statusMsg.style.color = "green";
    statusMsg.innerHTML = "✅ Cuenta creada correctamente. Redirigiendo...";
    form.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);

  } catch (err) {
    console.log("ERROR CODE:", err.code);
    console.log("ERROR MSG:", err.message);

    statusMsg.style.color = "red";
    statusMsg.innerHTML = `❌ ${err.code || err.message}`;
  } finally {
    btnRegister.disabled = false;
    btnRegister.innerText = "Crear cuenta";
  }
});
