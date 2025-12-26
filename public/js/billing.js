// public/js/billing.js

document.addEventListener("DOMContentLoaded", () => {
  const invoiceBody = document.querySelector("#invoice-list tbody");
  const claimsBody = document.querySelector("#claims-list tbody");

  if (!invoiceBody) return;

  async function loadInvoices() {
    try {
      const data = await apiFetch("/api/billing/invoices");

      invoiceBody.innerHTML = data
        .map(
          (inv) => `
          <tr>
            <td>${inv.id}</td>
            <td>${inv.patientId}</td>
            <td>${inv.amount}</td>
            <td>${inv.status}</td>
            <td>${inv.encounterId || ""}</td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      invoiceBody.innerHTML =
        '<tr><td colspan="5">Failed to load invoices.</td></tr>';
    }
  }

  if (claimsBody) {
    claimsBody.innerHTML =
      '<tr><td colspan="4">Claims API not implemented in demo.</td></tr>';
  }

  loadInvoices();
});
