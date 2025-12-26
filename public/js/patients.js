// public/js/patients.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("patient-search-form");
  const tableBody = document.querySelector("#patient-list tbody");
  const paginationContainer = document.querySelector("#patient-pagination div");

  if (!tableBody) return;

  async function loadPatients(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const data = await apiFetch(`/api/patients/paged?${query}`);

      tableBody.innerHTML = data.items
        .map(
          (p) => `
          <tr data-id="${p.id}">
            <td>${p.mrn}</td>
            <td><a href="patient-detail.html?id=${encodeURIComponent(
              p.id
            )}">${p.name}</a></td>
            <td>${p.ageYears}</td>
            <td>${p.gender}</td>
            <td>${p.primaryCondition || ""}</td>
            <td>${p.lastEncounter ? p.lastEncounter.date : ""}</td>
          </tr>
        `
        )
        .join("");

      if (paginationContainer) {
        paginationContainer.innerHTML = `
          <span>Page ${data.page} of ${data.totalPages}</span>
        `;
      }
    } catch (err) {
      console.error(err);
      tableBody.innerHTML =
        '<tr><td colspan="6">Failed to load patients.</td></tr>';
    }
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const params = {
      page: 1,
      pageSize: 10,
      q: form.q?.value || "",
      condition: form.condition?.value || "",
      minAge: form.minAge?.value || "",
      maxAge: form.maxAge?.value || "",
    };
    loadPatients(params);
  });

  // initial load
  loadPatients({ page: 1, pageSize: 10 });
});
