// server.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY || "dev-secret-key";

// ---- Middleware ----
app.use(cors());
app.use(express.json());

// serve files from /public (html, css, js)
app.use(express.static(path.join(__dirname, "public")));

// Swagger UI at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// default route -> login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ---- Simple login ----
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username === "admin" && password === "password123") {
    return res.json({
      success: true,
      user: { username: "admin", displayName: "Admin User" },
      apiKey: API_KEY,
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password",
  });
});

// ---- Logout (client deletes API key) ----
app.post("/auth/logout", (req, res) => {
  // Optional: log the logout event
  console.log("User logged out");

  return res.json({
    success: true,
    message: "Logged out successfully. API key cleared on client."
  });
});


// ---- API key middleware for /api ----
app.use("/api", (req, res, next) => {
  const key = req.header("x-api-key");
  if (!key || key !== API_KEY) {
    return res
      .status(401)
      .json({ message: "Invalid or missing API key", requiredHeader: "x-api-key" });
  }
  next();
});

// ---- Demo in-memory data ----

// Patients
let patients = [
  {
    id: "p1",
    mrn: "MRN001",
    patient: {
      id: "p1",
      mrn: "MRN001",
      profile: {
        name: { display: "John Doe" },
        demographics: { ageYears: 55, gender: "male", bloodGroup: "O+" },
      },
    },
    clinical: {
      conditions: [{ code: "I10", name: "Hypertension" }],
    },
    encounters: [
      {
        encounterId: "e1",
        location: { department: "Cardiology" },
        period: { start: "2024-01-10" },
        status: "finished",
        vitalsTimeline: [
          {
            timestamp: "2024-01-10T09:00:00Z",
            bloodPressure: "140/90",
            heartRate: 85,
            respRate: 16,
            spo2: 97,
            temperatureC: 36.8,
          },
        ],
      },
    ],
  },
  {
    id: "p2",
    mrn: "MRN002",
    patient: {
      id: "p2",
      mrn: "MRN002",
      profile: {
        name: { display: "Jane Smith" },
        demographics: { ageYears: 42, gender: "female", bloodGroup: "A-" },
      },
    },
    clinical: {
      conditions: [{ code: "E11", name: "Type 2 Diabetes" }],
    },
    encounters: [],
  },
];

function buildPatientSummary(bundle) {
  const p = bundle.patient || bundle;
  const demo = p.profile.demographics;
  const conditions =
    (bundle.clinical && bundle.clinical.conditions) || [];

  const primaryCondition = conditions.length ? conditions[0].name : null;
  const lastEncounter =
    bundle.encounters && bundle.encounters.length
      ? bundle.encounters[bundle.encounters.length - 1]
      : null;

  return {
    id: bundle.id || p.id,
    mrn: bundle.mrn || p.mrn,
    name: p.profile.name.display,
    ageYears: demo.ageYears,
    gender: demo.gender,
    bloodGroup: demo.bloodGroup,
    primaryCondition,
    lastEncounter: lastEncounter
      ? {
          encounterId: lastEncounter.encounterId,
          department: lastEncounter.location.department,
          date: lastEncounter.period.start,
          status: lastEncounter.status,
        }
      : null,
  };
}

// Simple helper to find by id
function findPatient(id) {
  return patients.find((p) => (p.id || p.patient?.id) === id);
}

// Appointments
let appointments = [
  {
    id: "a1",
    patientId: "p1",
    provider: "Dr. House",
    datetime: "2024-02-01T09:00:00Z",
    type: "Consultation",
    status: "scheduled", // scheduled | completed | cancelled
  },
];

// Billing
let invoices = [
  {
    id: "inv1",
    patientId: "p1",
    amount: 200,
    currency: "USD",
    status: "unpaid", // unpaid | paid | cancelled
    encounterId: "e1",
    createdAt: "2024-01-10T10:00:00Z",
  },
];

// Labs
let labOrders = [
  {
    id: "lab1",
    patientId: "p1",
    test: "CBC",
    status: "completed", // ordered | in-progress | completed | cancelled
    note: "",
  },
];

let labResults = [
  {
    id: "res1",
    orderId: "lab1",
    patientId: "p1",
    test: "CBC",
    result: "Normal",
    date: "2024-01-11",
  },
];

// Medications
let medications = [
  {
    id: "m1",
    patientId: "p1",
    medication: "Lisinopril",
    dosage: "10 mg",
    route: "oral",
    frequency: "once daily",
    status: "active", // active | stopped | completed
  },
];

// Admin
let users = [
  { id: "u1", name: "Admin User", role: "admin", status: "active" },
  { id: "u2", name: "Nurse Joy", role: "clinician", status: "active" },
];

let roles = [
  { name: "admin", description: "Full access" },
  { name: "clinician", description: "Clinical features only" },
  { name: "billing", description: "Billing & invoices" },
];

let auditLogs = [
  {
    id: "log1",
    timestamp: "2024-01-01T12:00:00Z",
    userId: "u1",
    action: "login",
    resource: "auth",
    details: "Successful login from 127.0.0.1",
  },
];

// ---- Health check ----
app.get("/api", (req, res) => {
  res.json({ status: "ok", service: "PatientCare360 Demo API" });
});

//
// =================== PATIENTS (lots of read & full CRUD) ===================
//

// GET /api/patients - list summaries, optional ?q=name
app.get("/api/patients", (req, res) => {
  const q = (req.query.q || "").toLowerCase();
  let list = patients.map((p) => buildPatientSummary(p));

  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// GET /api/patients/paged?page=&pageSize=
app.get("/api/patients/paged", (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const pageSize = parseInt(req.query.pageSize || "10", 10);
  const summaries = patients.map((p) => buildPatientSummary(p));
  const total = summaries.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  res.json({
    page: safePage,
    pageSize,
    total,
    totalPages,
    items: summaries.slice(start, end),
  });
});

// GET /api/patients/stats
app.get("/api/patients/stats", (req, res) => {
  const summaries = patients.map((p) => buildPatientSummary(p));

  const totalPatients = summaries.length;
  const byGender = {};
  const byBloodGroup = {};
  const byCondition = {};

  patients.forEach((bundle) => {
    const p = bundle.patient || bundle;
    const demo = p.profile.demographics;
    const gender = demo.gender || "unknown";
    const blood = demo.bloodGroup || "unknown";
    byGender[gender] = (byGender[gender] || 0) + 1;
    byBloodGroup[blood] = (byBloodGroup[blood] || 0) + 1;

    (bundle.clinical.conditions || []).forEach((c) => {
      const name = c.name || "unknown";
      byCondition[name] = (byCondition[name] || 0) + 1;
    });
  });

  res.json({
    totalPatients,
    byGender,
    byBloodGroup,
    byCondition,
  });
});

// GET /api/patients/:id/full
app.get("/api/patients/:id/full", (req, res) => {
  const p = findPatient(req.params.id);
  if (!p) return res.status(404).json({ message: "Patient not found" });
  res.json(p);
});

// GET /api/patients/:id/encounters
app.get("/api/patients/:id/encounters", (req, res) => {
  const p = findPatient(req.params.id);
  if (!p) return res.status(404).json({ message: "Patient not found" });
  res.json(p.encounters || []);
});

// GET /api/patients/:id/vitals-timeline
app.get("/api/patients/:id/vitals-timeline", (req, res) => {
  const p = findPatient(req.params.id);
  if (!p) return res.status(404).json({ message: "Patient not found" });

  const allVitals = [];
  (p.encounters || []).forEach((enc) => {
    (enc.vitalsTimeline || []).forEach((v) => {
      allVitals.push({
        encounterId: enc.encounterId,
        ...v,
      });
    });
  });

  res.json(allVitals);
});

// POST /api/patients - create new patient
app.post("/api/patients", (req, res) => {
  const body = req.body || {};
  const { id, mrn, profile, clinical, encounters } = body.patient || body;

  if (!id || !mrn || !profile || !profile.name || !profile.demographics) {
    return res.status(400).json({
      message: "patient.id, patient.mrn, profile.name, demographics required",
    });
  }

  if (findPatient(id)) {
    return res.status(409).json({ message: `Patient ${id} already exists` });
  }

  const newBundle = {
    id,
    mrn,
    patient: {
      id,
      mrn,
      profile,
    },
    clinical: clinical || { conditions: [] },
    encounters: encounters || [],
  };

  patients.push(newBundle);
  res.status(201).json(newBundle);
});

// PUT /api/patients/:id - full replace
app.put("/api/patients/:id", (req, res) => {
  const id = req.params.id;
  const idx = patients.findIndex((p) => (p.id || p.patient?.id) === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const body = req.body || {};
  const payload = body.patient || body;

  if (!payload.id || payload.id !== id) {
    return res.status(400).json({
      message: "patient.id must exist and match :id",
    });
  }

  if (!payload.mrn || !payload.profile || !payload.profile.name || !payload.profile.demographics) {
    return res.status(400).json({
      message: "mrn, profile.name, demographics required",
    });
  }

  const updated = {
    id: payload.id,
    mrn: payload.mrn,
    patient: {
      id: payload.id,
      mrn: payload.mrn,
      profile: payload.profile,
    },
    clinical: payload.clinical || { conditions: [] },
    encounters: payload.encounters || [],
  };

  patients[idx] = updated;
  res.json(updated);
});

// PATCH /api/patients/:id - partial update (merge)
app.patch("/api/patients/:id", (req, res) => {
  const id = req.params.id;
  const idx = patients.findIndex((p) => (p.id || p.patient?.id) === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const patch = req.body || {};
  const original = patients[idx];

  // Very simple shallow merge for demo
  const merged = {
    ...original,
    ...patch,
    patient: {
      ...(original.patient || {}),
      ...(patch.patient || {}),
      profile: {
        ...(original.patient?.profile || {}),
        ...(patch.patient?.profile || {}),
        demographics: {
          ...(original.patient?.profile?.demographics || {}),
          ...(patch.patient?.profile?.demographics || {}),
        },
        name: {
          ...(original.patient?.profile?.name || {}),
          ...(patch.patient?.profile?.name || {}),
        },
      },
    },
  };

  patients[idx] = merged;
  res.json(merged);
});

// DELETE /api/patients/:id
app.delete("/api/patients/:id", (req, res) => {
  const id = req.params.id;
  const idx = patients.findIndex((p) => (p.id || p.patient?.id) === id);
  if (idx === -1) {
    return res.status(404).json({ message: "Patient not found" });
  }
  patients.splice(idx, 1);
  res.status(204).send();
});

//
// =================== APPOINTMENTS (full-ish CRUD) ===================
//

// GET /api/appointments?patientId=&status=&dateFrom=&dateTo=
app.get("/api/appointments", (req, res) => {
  const { patientId, status, dateFrom, dateTo } = req.query;
  let result = appointments;

  if (patientId) {
    result = result.filter((a) => a.patientId === patientId);
  }
  if (status) {
    result = result.filter((a) => a.status === status);
  }
  if (dateFrom) {
    result = result.filter((a) => a.datetime >= dateFrom);
  }
  if (dateTo) {
    result = result.filter((a) => a.datetime <= dateTo);
  }

  res.json(result);
});

// GET /api/appointments/:id
app.get("/api/appointments/:id", (req, res) => {
  const appt = appointments.find((a) => a.id === req.params.id);
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  res.json(appt);
});

// POST /api/appointments
app.post("/api/appointments", (req, res) => {
  const { patientId, provider, datetime, type } = req.body || {};
  if (!patientId || !provider || !datetime) {
    return res.status(400).json({ message: "patientId, provider, datetime are required" });
  }

  const id = `a${appointments.length + 1}`;
  const appt = {
    id,
    patientId,
    provider,
    datetime,
    type: type || "Consultation",
    status: "scheduled",
  };
  appointments.push(appt);
  res.status(201).json(appt);
});

// PUT /api/appointments/:id
app.put("/api/appointments/:id", (req, res) => {
  const idx = appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Appointment not found" });

  const { patientId, provider, datetime, type, status } = req.body || {};
  if (!patientId || !provider || !datetime || !status) {
    return res.status(400).json({ message: "patientId, provider, datetime, status required" });
  }

  const updated = {
    id: req.params.id,
    patientId,
    provider,
    datetime,
    type: type || "Consultation",
    status,
  };

  appointments[idx] = updated;
  res.json(updated);
});

// PATCH /api/appointments/:id/cancel
app.patch("/api/appointments/:id/cancel", (req, res) => {
  const idx = appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Appointment not found" });

  appointments[idx].status = "cancelled";
  res.json(appointments[idx]);
});

// DELETE /api/appointments/:id
app.delete("/api/appointments/:id", (req, res) => {
  const idx = appointments.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Appointment not found" });
  appointments.splice(idx, 1);
  res.status(204).send();
});

//
// =================== BILLING / INVOICES ===================
//

// GET /api/billing/invoices?status=
app.get("/api/billing/invoices", (req, res) => {
  const status = req.query.status;
  let result = invoices;
  if (status) {
    result = result.filter((inv) => inv.status === status);
  }
  res.json(result);
});

// GET /api/billing/invoices/:id
app.get("/api/billing/invoices/:id", (req, res) => {
  const inv = invoices.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ message: "Invoice not found" });
  res.json(inv);
});

// POST /api/billing/invoices
app.post("/api/billing/invoices", (req, res) => {
  const { patientId, amount, currency, encounterId } = req.body || {};
  if (!patientId || amount == null) {
    return res.status(400).json({ message: "patientId and amount are required" });
  }
  const id = `inv${invoices.length + 1}`;
  const invoice = {
    id,
    patientId,
    amount,
    currency: currency || "USD",
    status: "unpaid",
    encounterId: encounterId || null,
    createdAt: new Date().toISOString(),
  };
  invoices.push(invoice);
  res.status(201).json(invoice);
});

// PATCH /api/billing/invoices/:id/pay
app.patch("/api/billing/invoices/:id/pay", (req, res) => {
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Invoice not found" });

  if (invoices[idx].status === "paid") {
    return res.status(400).json({ message: "Invoice already paid" });
  }

  invoices[idx].status = "paid";
  invoices[idx].paidAt = new Date().toISOString();
  res.json(invoices[idx]);
});

// DELETE /api/billing/invoices/:id
app.delete("/api/billing/invoices/:id", (req, res) => {
  const idx = invoices.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Invoice not found" });
  invoices.splice(idx, 1);
  res.status(204).send();
});

//
// =================== LABS ===================
//

// GET /api/labs/orders
app.get("/api/labs/orders", (req, res) => {
  res.json(labOrders);
});

// GET /api/labs/orders/:id
app.get("/api/labs/orders/:id", (req, res) => {
  const order = labOrders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Lab order not found" });
  res.json(order);
});

// POST /api/labs/orders
app.post("/api/labs/orders", (req, res) => {
  const { patientId, test } = req.body || {};
  if (!patientId || !test) {
    return res.status(400).json({ message: "patientId and test are required" });
  }
  const id = `lab${labOrders.length + 1}`;
  const order = {
    id,
    patientId,
    test,
    status: "ordered",
    note: "",
  };
  labOrders.push(order);
  res.status(201).json(order);
});

// PATCH /api/labs/orders/:id
app.patch("/api/labs/orders/:id", (req, res) => {
  const idx = labOrders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Lab order not found" });

  const { status, note } = req.body || {};
  if (status) labOrders[idx].status = status;
  if (note) labOrders[idx].note = note;

  res.json(labOrders[idx]);
});

// GET /api/labs/results?patientId=
app.get("/api/labs/results", (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) return res.json(labResults);
  res.json(labResults.filter((r) => r.patientId === patientId));
});

// GET /api/labs/results/:id
app.get("/api/labs/results/:id", (req, res) => {
  const result = labResults.find((r) => r.id === req.params.id);
  if (!result) return res.status(404).json({ message: "Lab result not found" });
  res.json(result);
});

//
// =================== MEDICATIONS ===================
//

// GET /api/medications?patientId=
app.get("/api/medications", (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) return res.json(medications);
  res.json(medications.filter((m) => m.patientId === patientId));
});

// POST /api/medications
app.post("/api/medications", (req, res) => {
  const { patientId, medication, dosage, route, frequency } = req.body || {};
  if (!patientId || !medication) {
    return res.status(400).json({ message: "patientId and medication are required" });
  }
  const id = `m${medications.length + 1}`;
  const med = {
    id,
    patientId,
    medication,
    dosage: dosage || "",
    route: route || "",
    frequency: frequency || "",
    status: "active",
  };
  medications.push(med);
  res.status(201).json(med);
});

// PATCH /api/medications/:id
app.patch("/api/medications/:id", (req, res) => {
  const idx = medications.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Medication not found" });

  const { dosage, route, frequency, status } = req.body || {};
  if (dosage !== undefined) medications[idx].dosage = dosage;
  if (route !== undefined) medications[idx].route = route;
  if (frequency !== undefined) medications[idx].frequency = frequency;
  if (status !== undefined) medications[idx].status = status;

  res.json(medications[idx]);
});

//
// =================== ANALYTICS ===================
//

app.get("/api/analytics/overview", (req, res) => {
  res.json({
    totalPatients: patients.length,
    totalAppointments: appointments.length,
    totalInvoices: invoices.length,
  });
});

//
// =================== ADMIN ===================
//

// GET /api/admin/users
app.get("/api/admin/users", (req, res) => {
  res.json(users);
});

// GET /api/admin/users/:id
app.get("/api/admin/users/:id", (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

// POST /api/admin/users
app.post("/api/admin/users", (req, res) => {
  const { name, role, status } = req.body || {};
  if (!name || !role) {
    return res.status(400).json({ message: "name and role are required" });
  }
  const id = `u${users.length + 1}`;
  const user = {
    id,
    name,
    role,
    status: status || "active",
  };
  users.push(user);
  auditLogs.push({
    id: `log${auditLogs.length + 1}`,
    timestamp: new Date().toISOString(),
    userId: "system",
    action: "create-user",
    resource: id,
    details: `User ${name} created`,
  });
  res.status(201).json(user);
});

// PATCH /api/admin/users/:id
app.patch("/api/admin/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });

  const { name, role, status } = req.body || {};
  if (name !== undefined) users[idx].name = name;
  if (role !== undefined) users[idx].role = role;
  if (status !== undefined) users[idx].status = status;

  res.json(users[idx]);
});

// DELETE /api/admin/users/:id
app.delete("/api/admin/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "User not found" });
  const removed = users[idx];
  users.splice(idx, 1);
  auditLogs.push({
    id: `log${auditLogs.length + 1}`,
    timestamp: new Date().toISOString(),
    userId: "system",
    action: "delete-user",
    resource: removed.id,
    details: `User ${removed.name} deleted`,
  });
  res.status(204).send();
});

// GET /api/admin/roles
app.get("/api/admin/roles", (req, res) => {
  res.json(roles);
});

// GET /api/admin/audit-logs
app.get("/api/admin/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// ---- Start server ----
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Swagger Docs: http://localhost:${PORT}/docs`);
});
