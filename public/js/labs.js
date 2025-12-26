// public/js/labs.js

document.addEventListener("DOMContentLoaded", () => {
  const ordersBody = document.querySelector("#lab-orders tbody");
  const resultsBody = document.querySelector("#lab-results tbody");
  const imagingBody = document.querySelector("#imaging-studies tbody");

  if (!ordersBody) return;

  async function loadLabs() {
    try {
      const orders = await apiFetch("/api/labs/orders");
      const results = await apiFetch("/api/labs/results");

      ordersBody.innerHTML = orders
        .map(
          (o) => `
          <tr>
            <td>${o.id}</td>
            <td>${o.patientId}</td>
            <td>${o.test}</td>
            <td>${o.status}</td>
          </tr>
        `
        )
        .join("");

      resultsBody.innerHTML = results
        .map(
          (r) => `
          <tr>
            <td>${r.id}</td>
            <td>${r.patientId}</td>
            <td>${r.test}</td>
            <td>${r.result}</td>
            <td>${r.date}</td>
          </tr>
        `
        )
        .join("");

      if (imagingBody) {
        imagingBody.innerHTML =
          '<tr><td colspan="4">Imaging data not implemented in demo.</td></tr>';
      }
    } catch (err) {
      console.error(err);
      ordersBody.innerHTML =
        '<tr><td colspan="4">Failed to load lab data.</td></tr>';
    }
  }

  loadLabs();
});
