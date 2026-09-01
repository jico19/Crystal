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

### 3. Indiana State Site (*Cherish Open Arms*)
* **Route:** `http://localhost:3000/in`
* **Theme:** Deep Navy (`#1e3a8a`) & Coral
* **License:** `IN-FSSA-982104`
* **Contact:** `http://localhost:3000/in/contact`

---

## Database Migrations & RLS
PostgreSQL / Supabase migration files are located in `supabase/migrations/`:
* `20260831000001_multi_state_routing.sql`: Organizations, public inquiries, and tenant RLS policies.
