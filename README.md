# CabinetFlow Tunisie — Dossier médical privé

CabinetFlow Tunisie is a private, admin-controlled medical workflow platform designed for day-to-day clinic operations: patient records, appointments, consultations, document intake (including external/patient uploads), and document triage (OCR/LAB/RADIO/etc).

> **Access policy:** Account creation is disabled in the UI. Users are created by an administrator (role-based access).

---

## ✨ What this project demonstrates

- A **real internal-tool style application** (dashboard + operational workflows)
- **Role-based navigation** and restricted access
- **End-to-end clinical workflows**: patients → appointments → consultations → documents → follow-ups
- **Two-sided document intake**:
  - internal uploads by staff
  - **external/patient upload portal** linked to a specific patient
- A UI designed to match real clinic needs: workbench view, statuses, queues, filters, templates

---

## 🧩 Core modules (high level)

### 1) Dashboard (Tableau de bord)
- Clinic activity overview (patients, appointments, documents, consultations, alerts, OCR queue, etc.)
- Quick access to key areas

### 2) Travail du jour (Daily workbench)
- Operational view for today:
  - today’s appointments
  - follow-ups
  - docs to review
  - external uploads waiting in inbox

### 3) Patients
- Patient list + search
- Patient create/edit
- “Open dossier” experience with structured sections:
  - identity & history
  - timeline / documents / uploads
  - consultations, prescriptions, linked docs

### 4) Rendez-vous (Appointments workflow)
- Appointment list + filters
- Status-driven workflow for clinic flow:
  - New / Confirmed / Arrived / In-room / Completed / Absent
- Actions to move patients through the “waiting room → consultation → completion” process

### 5) Documents (Triage & pipeline)
- Manual document upload with patient matching
- Filtering by patient / type / status
- Workflow statuses (example categories):
  - OCR pending
  - LAB / RADIO / CONSULT classified
  - To validate / validated / unreadable
- Built to support real clinic document handling

### 6) Réception externe (External inbox)
- Incoming uploads (patient / lab / radiology)
- Inbox-style workflow: review, accept/reject, link to patient record

### 7) Patient upload portal (external link)
- Each patient can have a **unique upload link**
- Patients (or relatives) can submit:
  - sender name
  - note (e.g., lab result, prescription, radiology report)
  - file/image upload
- Submissions appear inside the clinic workflow (inbox/triage)

### 8) Cabinet settings & templates
- Clinic profile + doctor info
- Editable templates/boilerplate text for:
  - signatures/stamps
  - legal footer
  - referral letter endings
  - certificate text blocks

---

## 🔐 Roles & access model

- **Administrator**
  - creates user accounts
  - controls access and configuration
- **Clinician (doctor mode)**
  - manages patients, appointments, consultations, documents

> This “admin-created accounts only” model mirrors real private clinic systems.

---

## 🚀 Deployment

This project is deployed as a web application (demo environment).  
For portfolio purposes, screenshots and demo data are used (no real patient-identifiable information).

---

## 🧪 Demo data & privacy note

- This repository/project is intended as a **portfolio demo**.
- Use **dummy patient data only**.
- Do not upload or store real patient data in any public environment.

---

## 🛠️ Local development (typical workflow)

> If you are running this as a Node-based web app:

1) Install dependencies
```bash
npm install
``
