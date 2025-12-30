# HealthCaring365 - Demo Application

HealthCaring365 is a **full-stack healthcare management demo application** built with **Node.js, Express, and vanilla HTML/CSS/JavaScript**.

It simulates a real-world healthcare system with **patients, appointments, billing, labs, medications, analytics, and admin management**, backed by a RESTful API and documented with **Swagger**.

This project is designed as an **interview-ready showcase** of:
- REST API design
- CRUD operations
- API security patterns (API key)
- Frontend–backend integration
- Clean project structure
- Documentation & testing (Swagger + Postman)

---

## 🚀 Tech Stack

### Backend
- **Node.js**
- **Express.js**
- **CORS**
- **Swagger UI** (OpenAPI reminder)
- In-memory data storage (demo-friendly)

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript (modular, page-based)
- Fetch API for backend communication

### Tooling
- **Swagger UI** – Interactive API docs
- **Postman Collection** – End-to-end API testing
- npm – Dependency management

---

## 📁 Project Structure


---


### Login
- **Endpoint:** `POST /auth/login`
- **Credentials (demo):**
  ```json
  {
    "username": "admin",
    "password": "password123"
  }

▶️ Running the Project
npm install
node server.js

▶️ Access
App: http://localhost:5000
Swagger Docs: http://localhost:5000/docs
