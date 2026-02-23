import { firebaseConfig } from "../firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "../login.html";

  const res = await fetch(`${firebaseConfig.databaseURL}/users/${user.uid}.json`);
  const data = await res.json();

  document.getElementById("nombre").textContent = data.name;
  document.getElementById("email").textContent = data.email;
});