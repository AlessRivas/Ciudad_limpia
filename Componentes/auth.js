import { firebaseConfig } from "../firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

function normalizeRole(role) {
  return role === "admin" ? "admin" : "user";
}

export { auth, firebaseConfig };

export async function getUserProfile(uid) {
  if (!uid) return null;

  try {
    const response = await fetch(`${firebaseConfig.databaseURL}/users/${uid}.json`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("No se pudo leer perfil de usuario:", error);
    return null;
  }
}

export async function getUserContext(user) {
  if (!user) {
    return { profile: null, role: "user" };
  }

  const profile = await getUserProfile(user.uid);
  const role = normalizeRole(profile?.role);

  return { profile, role };
}

export function getLandingPathByRole(role, base = "..") {
  const root = base.replace(/\/$/, "");
  return normalizeRole(role) === "admin" ? `${root}/Admin/admin.html` : `${root}/Home/inicio.html`;
}

export async function logoutUser() {
  await signOut(auth);
}
