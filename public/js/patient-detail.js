// public/js/patient-detail.js

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const basicInfo = document.getElementById("patient-basic-info");
  const conditionsList = document.getElementById("condition-list");
  const encountersBody = document.querySelector("#patient-encounters tbody");
  const vitalsContainer = document.getElementById("vitals-chart");

  try {
    const bundle = await apiFetch(`/api/patients/${id}/full`);
    const encounters = await apiFetch(`/api/patients/${id}/encounters`);
    const vitals = await apiFetch(`/api/patients/${id}/vitals-timeline`);

    const p = bundle.patient || bundle; // depending on structure
    const profile = p.profile;
    const demo = profile.demographics;

    if (basicInfo) {
      basicInfo.innerHTML = `
        <div><strong>${profile.name.display}</strong></div>
        <div class="text-muted">MRN: ${bundle.mrn || p.mrn}</div>
        <div class="text-muted">Age: ${demo.ageYears}, Gender: ${
        demo.gender
      }</div>
        <div class="text-muted">Blood group: ${
          demo.bloodGroup || "-"
        }</div>
      `;
    }

    if (conditionsList) {
      const conds = (bundle.clinical && bundle.clinical.conditions) || [];
      conditionsList.innerHTML =
        conds.length === 0
          ? "<li>No recorded conditions</li>"
          : conds.map((c) => `<li>${c.name}</li>`).join("");
    }

    if (encountersBody) {
      encountersBody.innerHTML = encounters
        .map(
          (e) => `
          <tr>
            <td>${e.encounterId}</td>
            <td>${e.location.department}</td>
            <td>${e.period.start}</td>
            <td>${e.status}</td>
          </tr>
        `
        )
        .join("");
    }

    if (vitalsContainer) {
      vitalsContainer.innerHTML = `
        <p class="text-muted">Loaded ${vitals.length} vitals points.</p>
      `;
    }
  } catch (err) {
    console.error(err);
  }
});
