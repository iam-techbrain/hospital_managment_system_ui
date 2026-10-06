# CarePulse Hospital Management System (HMS) - Engineering Architecture & Presentation Guide

This guide provides technical and operational architecture documentation for presenting the CarePulse Hospital Management System to engineering teams, system architects, and stakeholders.

Interactive Architecture Tools:
- **Interactive Technical Requirements & Timeline UI:** `requirements.html`
- **Figma-Style Architecture Flow Canvas:** `index.html` (Press `F` for Fullscreen)
- **Team Presentation Slide Deck:** `slides.html`

---

## 1. System Requirements & Technology Architecture

In software engineering, system requirements define the core data stores, event streaming pipelines, in-memory caches, and storage infrastructure required to run high-concurrency hospital operations with zero data loss and sub-millisecond response times.

### A. Core Data & Infrastructure Stack

#### 1. PostgreSQL (Primary Relational Database of Record)
* **Purpose:** Serves as the immutable ACID-compliant system of record. Medical and financial records must guarantee transactional integrity.
* **What PostgreSQL Stores:**
  - **Patient Demographic Entities:** UHID (`#HMS-2026-9041`), ABHA Health ID, Aadhaar verification hashes, contact profiles.
  - **Clinical Encounters & EMR:** Consultation notes, ICD-10 disease codes, digital E-Prescriptions (`prescriptions` table).
  - **Master Financial Ledger:** Consultation fees, ward per-day tariffs, diagnostic lab tests, pharmacy drug charges, GST tax lines (`invoices` & `payments` tables).
  - **Pharmacy Inventory Master:** Batch numbers, manufacturing and expiry dates, supplier invoices, unit costs.
* **Transactions & Locks:** Uses row-level pessimistic locking (`SELECT ... FOR UPDATE`) during medicine dispensing to guarantee inventory stock never goes below zero during peak rush.

#### 2. Redis (In-Memory Cache, Queue & Distributed Locks)
* **Purpose:** Handles ultra-low-latency, volatile, and high-frequency read/write operations (&lt; 2ms latency) without disk I/O bottlenecks.
* **Where Redis is Used:**
  - **Live OPD Token Queue:** Redis Sorted Sets (`ZADD`, `ZPOPMIN`) order tokens chronologically and dynamically adjust waiting times per doctor cabin.
  - **Distributed Concurrency Lock (Redlock Algorithm):** Guarantees that two triage nurses cannot simultaneously allocate the exact same ICU bed or Operation Theatre slot during mass casualty incidents.
  - **Session Management & Rate Limiting:** Stores OAuth2/JWT session states and shields OTP generation endpoints against brute-force attacks.
  - **Active Bed Matrix Cache:** Caches vacant/occupied bed states for instant retrieval by executive dashboards.

#### 3. Apache Kafka (Distributed Event Streaming & Message Broker)
* **Purpose:** Implements asynchronous, event-driven microservices architecture. When a critical action occurs, Kafka decouples downstream processing so the doctor or front desk interface never blocks.
* **When Apache Kafka is Used (Topics & Event Contracts):**
  - `prescription.finalized`: When a doctor signs an E-Rx, Kafka emits this event. Three downstream consumers react simultaneously in parallel:
    1. **Pharmacy Consumer:** Pre-loads the dispensing queue with drug batches.
    2. **Laboratory Consumer:** Prepares barcode orders for prescribed blood/urine tests.
    3. **Billing Consumer:** Appends provisional charges to the patient's master invoice.
  - `triage.code-red`: Emitted during life-threatening emergency admissions. Instantly triggers resuscitation team pagers and wall monitor alarms.
  - `appointment.booked`: Enqueues background worker tasks to dispatch SMS and WhatsApp confirmation links with digital tokens.
  - `patient.discharged`: Emitted when the cashier confirms zero balance. Releases the hospital bed back into cleaning status.

#### 4. AWS S3 / MinIO (Object Storage)
* **Purpose:** Storing large binary medical files directly inside relational database tables degrades query performance. Unstructured medical data is stored in encrypted, high-durability object storage.
* **What S3 / MinIO Stores:**
  - **Radiology Scans (PACS / DICOM):** High-resolution Chest X-Rays, 128-slice CT scans, and MRI imaging files.
  - **Signed Laboratory PDF Reports:** NABL-accredited diagnostic test certificates signed by pathologists.
  - **Official Discharge Summaries & Tax Invoices:** Legally compliant PDF bills and security gate passes.
  - **Digital ABHA QR Cards:** Cached patient identity cards for instant offline access.

#### 5. WebSockets (Socket.io / Native WS Protocol)
* **Purpose:** Bi-directional real-time communication between server and client browsers.
* **Where WebSockets are Used:**
  - **Waiting Room Display Screens:** Pushes token call rings ("Token #B-04 to Room 102") to ceiling TV displays in real time.
  - **Live Bed Matrix:** Instantly flips room status indicators (Vacant &#8594; Occupied &#8594; Cleaning) across all nursing stations.
  - **Doctor Alarm Bell:** Pushes critical abnormal lab results (e.g., Troponin-I &gt; 0.5 ng/mL cardiac crisis) straight to the active doctor screen.

---

## 2. Operational Lifecycle: When is Each Technology & Screen Executed?

The hospital workflow follows an 8-stage operational journey. Each stage utilizes specific frontend screens and backend technology:

```
[Stage 1: Pre-Hospital] -> landing.html / user_portal.html
     | (Redis Slot Lock + Postgres Appointment + Kafka appointment.booked)
[Stage 2: Arrival/Triage]-> reception.html / emergency.html
     | (Postgres UHID Sequence + Redis ZADD Queue + WebSockets Waiting TV)
[Stage 3: Doctor EMR]    -> doctor_emr.html
     | (Elasticsearch ICD-10 + Postgres E-Rx + Kafka prescription.finalized)
[Stage 4: Diagnostics]   -> laboratory.html / blood_bank.html
     | (Kafka Consumer + AWS S3 PDF Upload + WebSockets Alert to Doctor)
[Stage 5: IPD Admission] -> ipd_beds.html / operation_theatre.html
     | (Redis Distributed Redlock + Postgres Admission + WebSockets Bed Sync)
[Stage 6: Pharmacy]      -> pharmacy.html
     | (Postgres SELECT FOR UPDATE + Kafka inventory.deducted)
[Stage 7: Billing & Exit]-> billing.html / discharge.html
     | (Postgres ACID Master Ledger + S3 Gate Pass + Kafka patient.discharged)
[Stage 8: Post-Discharge]-> user_portal.html
     | (ABDM M1/M2/M3 Milestones + S3 Digital Health Locker)
```

---

### Detailed Technical Breakdown by Stage

#### Stage 1: Public Discovery & Appointment Booking
* **Screens:** `landing.html` & `user_portal.html`
* **Trigger:** Patient discovers the hospital or schedules a consultation from home.
* **Technologies Executed:**
  - **Redis:** Acquires a 5-minute temporary lock on the selected time slot (`SET resource:slot:1030 EX 300 NX`) to prevent concurrent booking conflicts.
  - **PostgreSQL:** Writes the confirmed appointment record into the `appointments` table.
  - **Apache Kafka:** Publishes an `appointment.booked` event to trigger SMS and WhatsApp notification workers.

#### Stage 2: Patient Arrival & Emergency Triage
* **Screens:** `reception.html` (Routine OPD) & `emergency.html` (Trauma Triage)
* **Trigger:** Patient physically arrives at the hospital gates.
* **Technologies Executed:**
  - **PostgreSQL:** Queries existing records by phone/ABHA or executes sequence `nextval('uhid_seq')` to generate Unique Hospital ID `#HMS-2026-9041`.
  - **Redis:** Adds patient token to the doctor's queue via sorted sets (`ZADD doctor:102:queue <timestamp> <token_id>`).
  - **WebSockets:** Broadcasts the new token number to the waiting room TV display monitor.
  - **Apache Kafka:** Emits `triage.code-red` if critical vital signs warrant immediate resuscitation bay allocation.

#### Stage 3: Doctor Consultation & Clinical EMR
* **Screens:** `doctor_emr.html`
* **Trigger:** Patient token is called into the doctor's consultation cabin.
* **Technologies Executed:**
  - **Elasticsearch:** Delivers sub-20ms autocomplete fuzzy search across 70,000+ ICD-10 diagnosis codes and drug brand catalogs.
  - **PostgreSQL:** Persists patient encounter records, medical history notes, and vitals.
  - **Apache Kafka:** On doctor electronic signature, emits `prescription.finalized`.

#### Stage 4: Diagnostics, Pathology & Blood Matching
* **Screens:** `laboratory.html` & `blood_bank.html`
* **Trigger:** Doctor orders blood pathology, radiology scans, or cross-matched blood units.
* **Technologies Executed:**
  - **Apache Kafka:** Lab service consumes the order event and generates barcode labels for specimen vials.
  - **AWS S3 / MinIO:** Stores verified PDF laboratory test reports and DICOM radiology scans.
  - **WebSockets:** Pushes completed lab report notifications directly onto the attending physician's screen.

#### Stage 5: Inpatient (IPD) Bed Allocation & OT Scheduling
* **Screens:** `ipd_beds.html` & `operation_theatre.html`
* **Trigger:** Physician recommends hospital admission or emergency surgery.
* **Technologies Executed:**
  - **Redis Redlock:** Acquires a distributed lock on Bed `#ICU-04` or `OT-Room-02` to prevent race conditions during high casualty admissions.
  - **PostgreSQL:** Creates an inpatient admission record in `admissions` table with daily tariff schedule.
  - **WebSockets:** Instantly updates the visual ward matrix across all hospital terminals.

#### Stage 6: Pharmacy POS & Inventory Dispensing
* **Screens:** `pharmacy.html`
* **Trigger:** Outpatient collects prescribed drugs or nursing staff draws ward stock.
* **Technologies Executed:**
  - **PostgreSQL:** Executes row-level pessimistic locking (`SELECT stock_qty FROM inventory WHERE batch_id = ? FOR UPDATE`) to guarantee stock integrity.
  - **Apache Kafka:** Emits `inventory.deducted`. If stock drops below threshold, triggers an automatic re-order event to suppliers.

#### Stage 7: Centralized Billing & Discharge Clearance
* **Screens:** `billing.html` & `discharge.html`
* **Trigger:** Patient treatment finishes and attending doctor authorizes discharge.
* **Technologies Executed:**
  - **PostgreSQL:** Aggregates line items from consultation, room tariff, diagnostic tests, and pharmacy into a single immutable invoice.
  - **AWS S3 / MinIO:** Stores the signed discharge summary and gate pass PDF.
  - **Apache Kafka:** Emits `patient.discharged`, which releases the ward bed back into cleaning status.

#### Stage 8: Post-Discharge & Longitudinal E-Health Locker
* **Screens:** `user_portal.html`
* **Trigger:** Patient manages recovery at home and downloads historical medical files.
* **Technologies Executed:**
  - **ABDM Gateway:** Synchronizes consultation records into Ayushman Bharat Health Account (ABHA) network via FHIR standards.
  - **AWS S3 / MinIO:** Streams pre-signed download URLs for laboratory reports and pharmacy receipts.

---

## 3. Role-Based Access Control (RBAC) & Security Architecture

Security is enforced at the API Gateway and database levels via OAuth 2.0 and JSON Web Tokens (JWT) with strict Role-Based Access Control:

| User Role | JWT Scope | Permitted Access | Strict Security Boundaries |
| :--- | :--- | :--- | :--- |
| **Patient** | `role:patient` | Read own E-Rx, diagnostic reports, and invoices | Zero visibility into internal doctor notes or other patients |
| **Receptionist** | `role:frontdesk` | Create/update demographics, issue OPD tokens | Strictly prohibited from viewing clinical diagnosis or lab results |
| **Emergency Triage** | `role:triage_nurse` | Log vitals, assign triage priority (Red/Yellow/Green) | Cannot modify physician diagnoses or waive hospital fees |
| **Physician / Doctor** | `role:doctor` | Full EMR, ICD-10 diagnosis, lab orders, E-Rx sign | Cannot access cashier financial cash drawers or waive billing dues |
| **Floor Nurse** | `role:inpatient_nurse` | Log bed vitals, view medication schedules | Cannot discharge patient without doctor medical clearance & cashier no-dues |
| **Lab Technician** | `role:lis_technician` | Barcode scanning, enter analyzer test results | Cannot edit prescriptions or dispense pharmaceutical medication |
| **Pharmacist** | `role:pharmacist` | Scan drug barcodes, deduct batch stock | Cannot alter prescribed chemical formula or dosage instructions |
| **Billing Officer** | `role:billing_finance` | Finalize master ledger, process cashless TPA claims | Cannot modify clinical diagnoses, physician notes, or lab results |
| **Hospital Director** | `role:superadmin` | Executive KPI analytics, revenue audit logs | Full visibility backed by immutable Kafka audit stream |

---

## 4. Key Questions Asked by Engineering & Product Teams (FAQs)

1. **Why use Kafka instead of direct HTTP REST calls between departments?**
   * *Answer:* Direct REST calls create tight coupling and cascading failures. If the Pharmacy server is down during an emergency, a direct HTTP call would crash the Doctor's consultation screen. With Kafka, the doctor signs the prescription in 50ms, and Kafka guarantees that Pharmacy, Lab, and Billing consume the event as soon as their services process it.

2. **Why is Redis essential when PostgreSQL is already available?**
   * *Answer:* A hospital with 500 beds and thousands of outpatient tokens experiences hundreds of read queries per second on queue counters and bed status. Querying PostgreSQL continuously for live status causes disk I/O contention. Redis serves queue states in less than 2 milliseconds and provides distributed Redlock mutexes to eliminate race conditions on ICU beds.

3. **How does the system prevent billing leakage?**
   * *Answer:* Departmental services do not maintain separate financial silos. Every lab test ordered and drug dispensed automatically fires a billing accumulator event. The discharge gate pass screen enforces a multi-department clearance check: until Pharmacy, Laboratory, and Inpatient Ward balances read zero, the gate pass cannot be generated.
