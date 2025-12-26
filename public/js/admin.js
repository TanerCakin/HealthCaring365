// public/js/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const usersBody = document.querySelector("#admin-users tbody");
  const rolesBody = document.querySelector("#admin-roles tbody");
  const auditBody = document.querySelector("#admin-audit-logs tbody");

  if (!usersBody) return;

  async function loadAdmin() {
    try {
      const users = await apiFetch("/api/admin/users");
      const roles = await apiFetch("/api/admin/roles");
      const logs = await apiFetch("/api/admin/audit-logs");

      usersBody.innerHTML = users
        .map(
          (u) => `
          <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.role}</td>
            <td>${u.status}</td>
          </tr>
        `
        )
        .join("");

      rolesBody.innerHTML = roles
        .map(
          (r) => `
          <tr>
            <td>${r.name}</td>
            <td>${r.description}</td>
          </tr>
        `
        )
        .join("");

      auditBody.innerHTML = logs
        .map(
          (l) => `
          <tr>
            <td>${l.timestamp}</td>
            <td>${l.userId}</td>
            <td>${l.action}</td>
            <td>${l.resource}</td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      usersBody.innerHTML =
        '<tr><td colspan="4">Failed to load admin data.</td></tr>';
    }
  }

  loadAdmin();
});
