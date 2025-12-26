// public/js/login.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Login failed");
        return;
      }

      setApiKey(data.apiKey);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error(err);
      alert("Error contacting server");
    }
  });
});
