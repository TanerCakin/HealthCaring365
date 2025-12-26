// public/js/app.js

const API_BASE = "http://localhost:5000";

// --- API key helpers ---

function getApiKey() {
  return localStorage.getItem("apiKey") || null;
}

function setApiKey(key) {
  localStorage.setItem("apiKey", key);
}

function clearApiKey() {
  localStorage.removeItem("apiKey");
}

// --- API wrapper with x-api-key ---

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  const apiKey = getApiKey();

  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  // only send x-api-key for /api routes
  if (apiKey && path.startsWith("/api")) {
    finalHeaders["x-api-key"] = apiKey;
  }

  const res = await fetch(API_BASE + path, {
    ...options,
    headers: finalHeaders,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw { status: res.status, data };
  }

  return data;
}

// --- UI / nav / auth guard / logout ---

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.split("/").pop() || "";
  const isLoginPage = currentPath === "login.html";

  // 1) Simple nav highlight
  const navLinks = document.querySelectorAll("nav a[href]");
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath) {
      link.style.fontWeight = "600";
      link.style.textDecoration = "underline";
    }
  });

  // 2) Auth guard: if no apiKey and not on login page -> redirect
  if (!isLoginPage && !getApiKey()) {
    window.location.href = "/login.html";
    return;
  }

  // 3) Optional: if already logged in and on login page, redirect to dashboard
  if (isLoginPage && getApiKey()) {
    // change target if your main page is different
    window.location.href = "/dashboard.html";
    return;
  }

  // 4) Logout button handler (present on protected pages)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        // optional: notify backend for audit logging
        await fetch(API_BASE + "/auth/logout", { method: "POST" });
      } catch (e) {
        // ignore network errors for logout
        console.warn("Logout call failed (ignored):", e);
      }

      clearApiKey();
      window.location.href = "/login.html";
    });
  }
});
