Act as a Principal Software Engineer and Product Architect.

Generate an exhaustive, production-ready ("Final / Build-Ready") Feature Specification for:
**Feature:** [e.g. Caregiver Multi-Step Application & Onboarding Funnel]

Reference Architecture: @docs/architecture.md (Multi-State Frontend + Unified API Modular Monolith)
Reference Context: @docs/context.md (Master Context & Scope of Services)
Reference Agents: @docs/agents.md (Agent Guardrails & Boundary Rules)

This specification must be so detailed that an autonomous coding agent or junior engineer can implement it without making assumptions. Ensure the feature aligns with the **Multi-State Frontend + Unified API (Modular Monolith) + Centralized Backend Infrastructure** architecture. Include the following 8 sections:

1. **Executive Summary & Scope:** User stories, target states (GA/IN, future FL ready), and out-of-scope boundaries.
2. **PostgreSQL Database Schema (DDL):**
   - Exact SQL table definitions, constraints, primary/foreign keys (`org_id` references), and indexes.
   - Exact PostgreSQL Row-Level Security (RLS) policies for each role (`caregiver`, `client`, `agency_staff`, `state_admin`, `super_admin`).
3. **TypeScript & Validation Schemas:**
   - Complete Zod schemas for client/server validation with specific error messages (placed in `@crystal/validation` or module definitions).
   - Complete TypeScript interfaces & DTOs (placed in `@crystal/types`).
4. **Server Actions / API Endpoint Specifications:**
   - Standard shared REST endpoint signatures (`/api/v1/...`), request payloads, response types, error handling, and authorization guards (no state-duplicated endpoints).
5. **UI/UX & Component Architecture:**
   - Component tree breakdown utilizing shared `@crystal/ui` (shadcn/ui + Tailwind CSS) with state theme overrides.
   - Complete state machine: `idle`, `submitting`, `auto_saving`, `error`, `success`, `resuming_draft`.
   - Field-by-field layout and behavior (masking, auto-complete, validation triggers).
6. **Background Automation & Agent Triggers:**
   - Webhook/trigger definitions within the Unified API (e.g., linking to Agent-DocOCR, Agent-Compliance, or notification dispatchers).
7. **Edge Cases & Failure Recovery Matrix:**
   - Table of potential failure points (network drop, expired session, partial uploads, state mismatch) and recovery strategies.
8. **Acceptance Test Suite (Given/When/Then):**
   - At least 6 concrete Gherkin-style test scenarios covering happy paths, security boundaries, tenant isolation (e.g. GA cannot see IN data), and edge cases.
    