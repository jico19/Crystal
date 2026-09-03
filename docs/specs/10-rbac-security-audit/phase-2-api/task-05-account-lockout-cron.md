# Task 05: Account Lockout Security Monitor Cron Job
**Spec:** `10-rbac-security-audit` | **Phase:** 2-API | **Task:** 05

## Prerequisites
- [x] Task 01: `security_audit_logs` table exists
- [x] Task 03: `logAuditEvent` service exists

## Context
Monitors brute-force login attempts. If 5 consecutive failed login attempts occur from an IP address or user account within 15 minutes, the system temporarily locks the account and triggers a security notification.

## Stack & Files
- **Layer:** Express API / Background Worker
- **Create:** `apps/api/src/modules/audit/account-lockout.job.ts`
- **Modify:** `apps/api/src/server.ts` — register cron schedule on boot

## Deliverable
A `node-cron` job running every 5 minutes (`*/5 * * * *`) that queries `security_audit_logs` for `AUTH_FAILED` events, flags accounts with $\ge 5$ failures in the past 15 minutes, sets `user_profiles.is_active = false`, and queues a security alert email.

## Inputs
- Query on `security_audit_logs WHERE event_type = 'AUTH_FAILED' AND created_at >= NOW() - INTERVAL '15 minutes'`

## Outputs
- Updated `user_profiles` status (`is_active = false`)
- Inserted `AUTH_LOCKOUT` audit log event

## Acceptance Criteria
- [ ] Runs every 5 minutes
- [ ] Identifies accounts exceeding 5 failed login attempts in 15 minutes
- [ ] Deactivates user profile to block further login challenges
- [ ] Writes `AUTH_LOCKOUT` entry to security audit logs

## Do NOT
- Do not permanently delete locked accounts — deactivate temporarily and log the event
