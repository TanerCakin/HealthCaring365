// public/js/appointments.js

document.addEventListener("DOMContentLoaded", () => {
  const listBody = document.querySelector("#appointment-list tbody");
  const filterForm = document.getElementById("appointment-search-form");
  const createForm = document.getElementById("appointment-create-form");

  if (!listBody) return;

  async function loadAppointments(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const data = await apiFetch(`/api/appointments?${query}`);

      listBody.innerHTML = data
        .map(
          (a) => `
          <tr>
            <td>${a.datetime}</td>
            <td>${a.patientId}</td>
            <td>${a.provider}</td>
            <td>${a.type}</td>
            <td><span class="badge">${a.status}</span></td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      listBody.innerHTML =
        '<tr><td colspan="5">Failed to load appointments.</td></tr>';
    }
  }

  filterForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const params = {
      patientId: filterForm.patientId?.value || "",
      date: filterForm.date?.value || "",
    };
    loadAppointments(params);
  });

  createForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const patientId = createForm.patientId?.value.trim();
    const provider = createForm.provider?.value.trim();
    const datetime = createForm.datetime?.value;
    const type = createForm.type?.value.trim() || "Consultation";

    try {
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({ patientId, provider, datetime, type }),
      });
      alert("Appointment created");
      loadAppointments({});
      createForm.reset();
    } catch (err) {
      console.error(err);
      alert("Failed to create appointment");
    }
  });

  loadAppointments({});
});
