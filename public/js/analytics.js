// public/js/analytics.js

document.addEventListener("DOMContentLoaded", async () => {
  const overviewCards = document.getElementById("analytics-cards");
  const genderContainer = document.getElementById("analytics-by-gender");
  const conditionContainer = document.getElementById("analytics-by-condition");

  if (!overviewCards) return;

  try {
    const overview = await apiFetch("/api/analytics/overview");
    const stats = await apiFetch("/api/patients/stats");

    overviewCards.innerHTML = `
      <div class="card">
        <div class="text-muted">Total Patients</div>
        <div>${overview.totalPatients}</div>
      </div>
      <div class="card">
        <div class="text-muted">Total Appointments</div>
        <div>${overview.totalAppointments}</div>
      </div>
      <div class="card">
        <div class="text-muted">Total Invoices</div>
        <div>${overview.totalInvoices}</div>
      </div>
    `;

    if (genderContainer) {
      genderContainer.innerHTML = `
        <h3>By gender</h3>
        <ul>
          ${Object.entries(stats.byGender)
            .map(([g, count]) => `<li>${g}: ${count}</li>`)
            .join("")}
        </ul>
      `;
    }

    if (conditionContainer) {
      conditionContainer.innerHTML = `
        <h3>By condition</h3>
        <ul>
          ${Object.entries(stats.byCondition)
            .map(([c, count]) => `<li>${c}: ${count}</li>`)
            .join("")}
        </ul>
      `;
    }
  } catch (err) {
    console.error(err);
    overviewCards.innerHTML = "<p>Failed to load analytics.</p>";
  }
});
