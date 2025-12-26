// public/js/dashboard.js

document.addEventListener("DOMContentLoaded", async () => {
  const summaryContainer = document.getElementById("summary-cards");
  const recentEncounters = document.getElementById("recent-encounters");

  if (!summaryContainer) return;

  try {
    const stats = await apiFetch("/api/patients/stats");
    const overview = await apiFetch("/api/analytics/overview");
    const patients = await apiFetch("/api/patients");

    summaryContainer.innerHTML = `
      <div class="card">
        <div class="text-muted">Total Patients</div>
        <div>${stats.totalPatients}</div>
      </div>
      <div class="card">
        <div class="text-muted">Male</div>
        <div>${stats.byGender.male || 0}</div>
      </div>
      <div class="card">
        <div class="text-muted">Female</div>
        <div>${stats.byGender.female || 0}</div>
      </div>
      <div class="card">
        <div class="text-muted">Total Appointments</div>
        <div>${overview.totalAppointments}</div>
      </div>
      <div class="card">
        <div class="text-muted">Invoices</div>
        <div>${overview.totalInvoices}</div>
      </div>
    `;

    if (recentEncounters) {
      recentEncounters.innerHTML = patients
        .slice(0, 5)
        .map(
          (p) => `
          <div class="card">
            <div>${p.name} (${p.ageYears})</div>
            <div class="text-muted">${
              p.primaryCondition || "No primary condition"
            }</div>
          </div>
        `
        )
        .join("");
    }
  } catch (err) {
    console.error(err);
    summaryContainer.innerHTML = "<p>Failed to load dashboard data.</p>";
  }
});
