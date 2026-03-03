import { firebaseConfig } from "../firebase-config.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

function normalizeRole(role) {
  const value = (role || "").toString().trim().toLowerCase();
  return value === "admin" || value === "administrador" ? "admin" : "user";
}

export { auth, firebaseConfig };

async function addAuthToUrl(url, user = auth.currentUser) {
  if (!user) return url;

  try {
    // Force refresh to avoid stale/revoked tokens causing silent permission errors.
    const token = await user.getIdToken(true);
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}auth=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error("No se pudo obtener token de autenticacion:", error);
    return url;
  }
}

export async function fetchWithAuth(url, options = {}, user = auth.currentUser) {
  const authedUrl = await addAuthToUrl(url, user);
  return fetch(authedUrl, options);
}

export async function getUserProfile(uid, user = auth.currentUser) {
  if (!uid) return null;

  try {
    const response = await fetchWithAuth(`${firebaseConfig.databaseURL}/users/${uid}.json`, {}, user);
    if (!response.ok) {
      console.error(`No se pudo leer perfil de usuario (HTTP ${response.status})`);
      return null;
    }

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

  const profile = await getUserProfile(user.uid, user);
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
