# Crystal Multi-State Home Care Platform

A modern, multi-tenant digital healthcare platform engineered for home care agency operations across multiple states:
- **Georgia (GA):** Operating as **With Open Hands** (`withopenhands.com`)
- **Indiana (IN):** Operating as **Cherish Open Arms** (`cherishopenarms.com`)
- **Future Expansion:** Scalable architecture prepared for **Florida (FL)** and beyond.

---

## Core Architecture

Crystal utilizes a **Multi-State Frontend + Unified API + Centralized Backend Infrastructure** pattern:

```text
Georgia Domain (withopenhands.com)
      ↓
Georgia Next.js App (apps/georgia)
      │
      ├──────────────┐
      │              │
Indiana Domain (cherishopenarms.com)
      ↓              │
Indiana Next.js App (apps/indiana)
      │              │
      └──────┬───────┘
             ↓
      Unified Crystal API (apps/api)
       (Modular Monolith)
             ↓
   ┌─────────┼──────────┐
   ↓         ↓          ↓
PostgreSQL Storage   External Services
/Supabase             SES / Twilio /
                      DocuSign / Video
```

> **Key Principle:** The backend is built as a **Modular Monolith**—one deployable API application with distinct internal logical modules (`auth`, `users`, `caregivers`, `clients`, `documents`, `credentials`, `authorizations`, `training`, `notifications`, `reports`, `audit`, `integrations`). State isolation is strictly enforced via API authorization guards and PostgreSQL Row-Level Security (RLS).

---

## Repository Structure

```text
crystal/
│
├── apps/
│   ├── georgia/                 # Next.js 14+ Application (With Open Hands)
│   ├── indiana/                 # Next.js 14+ Application (Cherish Open Arms)
│   └── api/                     # Unified Crystal API (Modular Monolith)
│
├── packages/
│   ├── ui/                      # Shared shadcn/ui components & theme tokens
│   ├── types/                   # Shared TypeScript DTOs & domain interfaces
│   ├── validation/              # Shared Zod validation schemas
│   └── config/                  # Shared ESLint, TS, and Tailwind configurations
│
├── db_schema/                   # Versioned SQL schema snapshots (db_schema_<date>_v<version>.sql)
│
├── infrastructure/
│   ├── docker/                  # Docker Compose & container configurations
│   ├── caddy/                   # Caddy reverse proxy & TLS config
│   ├── supabase/                # PostgreSQL DDL migrations & RLS policies
│   └── scripts/                 # Health checks and backup scripts
│
├── docs/                        # Complete technical & functional documentation
│   ├── context.md               # Master Context & Scope of Services (Functional Source of Truth)
│   ├── architecture.md          # Technical Architecture Specification
│   ├── agents.md                # System Agents & Developer Guidelines
│   └── specs/                   # Detailed Feature Specifications (01 - 10)
│
└── package.json                 # Monorepo root workspace configuration
```

---

## Documentation Quick Links

- [Master Context & Scope of Services](file:///C:/Users/user/Documents/Crystal/docs/context.md)
- [Technical Architecture Specification](file:///C:/Users/user/Documents/Crystal/docs/architecture.md)
- [Agents Specification & Developer Guidelines](file:///C:/Users/user/Documents/Crystal/docs/agents.md)
- [Feature Specifications Directory](file:///C:/Users/user/Documents/Crystal/docs/specs)

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Multi-State Testing & Verification

### 1. State Hub & Selector
* Navigate to `http://localhost:3000` to access the State Selector hub.

### 2. Georgia State Site (*With Open Hands*)
* **Route:** `http://localhost:3000/ga`
* **Theme:** Deep Teal (`#0f766e`) & Gold
* **License:** `GA-HCPR-049281`
* **Contact:** `http://localhost:3000/ga/contact`
* **Caregiver Application:** `http://localhost:3000/ga/apply`
* **In-Service Training Portal:** `http://localhost:3000/ga/training`
* **Client Intake Admission:** `http://localhost:3000/ga/intake`

### 3. Indiana State Site (*Cherish Open Arms*)
* **Route:** `http://localhost:3000/in`
* **Theme:** Deep Navy (`#1e3a8a`) & Coral
* **License:** `IN-FSSA-982104`
* **Contact:** `http://localhost:3000/in/contact`
* **Caregiver Application:** `http://localhost:3000/in/apply`
* **In-Service Training Portal:** `http://localhost:3000/in/training`
* **Client Intake Admission:** `http://localhost:3000/in/intake`

---

## Implemented Platform Modules

| Feature Spec | Module Name | Status | Key Highlights |
| :--- | :--- | :---: | :--- |
| **Spec 01** | Multi-State Website & Routing | ✅ Completed | Tenant isolation, brand token switching, public lead capture |
| **Spec 02** | Caregiver Onboarding Funnel | ✅ Completed | 5-step draft auto-saving, age/SSN validations, onboarding tracker |
| **Spec 03** | Document & Credential Tracking | ✅ Completed | OCR metadata extraction, 30/60/90-day expiration indexing, compliance score |
| **Spec 04** | In-Service Training & CEU Portal | ✅ Completed | Anti-skipping video tracking, 80% passing quizzes, SHA-256 certificate issuance |
| **Spec 05** | Client Intake & Document Vault | ✅ Completed | Demographics, emergency contacts/POA, ADL/IADL care needs, physician orders (485) |
| **Spec 09** | E-Signature Workflow | ✅ Completed | Cryptographic SHA-256 envelopes, audit trail, consent packets |

---

## Automated Test Suite (Vitest + PGlite)

All 9 test suites (131 tests) pass locally using embedded WebAssembly PostgreSQL (PGlite):
```bash
npm test
```
* `tests/caregiver-validation.test.ts` (38 tests)
* `tests/caregiver-api.test.ts` (24 tests)
* `tests/esignature.test.ts` (20 tests)
* `tests/document-tracking.test.ts` (13 tests)
* `tests/pglite-db.test.ts` (12 tests)
* `tests/training-portal.test.ts` (10 tests)
* `tests/client-intake.test.ts` (6 tests)
* `tests/validation.test.ts` (5 tests)
* `tests/cors.test.ts` (3 tests)

