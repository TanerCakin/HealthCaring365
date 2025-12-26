// public/js/medications.js

document.addEventListener("DOMContentLoaded", () => {
  const searchForm = document.getElementById("medication-search-form");
  const medsBody = document.querySelector("#medication-list tbody");
  const rxBody = document.querySelector("#prescriptions tbody");

  if (!medsBody) return;

  async function loadMedications(patientId = "") {
    try {
      const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
      const data = await apiFetch(`/api/medications${query}`);

      medsBody.innerHTML = data
        .map(
          (m) => `
          <tr>
            <td>${m.medication}</td>
            <td>${m.dosage}</td>
            <td>${m.route}</td>
            <td>${m.frequency}</td>
            <td>${m.status}</td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      medsBody.innerHTML =
        '<tr><td colspan="5">Failed to load medications.</td></tr>';
    }
  }

  if (rxBody) {
    rxBody.innerHTML =
      '<tr><td colspan="5">Prescriptions API not implemented in demo.</td></tr>';
  }

  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const patientId = searchForm.patientId?.value || "";
    loadMedications(patientId);
  });

  loadMedications();
});
