# AgriHerd Access Control Policy

**Version:** 1.0  
**Effective Date:** November 2026  
**Owner:** System Administrator

## 1. Purpose

This policy defines how access to AgriHerd resources is controlled, ensuring that only authorized users can access data and features appropriate to their role.

## 2. Roles Overview

AgriHerd has three roles:

| Role | Description | Scope |
|------|-------------|-------|
| **Farmer** | Farm owner | Full access to their own farm data |
| **Farm Worker** | Employee | Limited access to operational tasks |
| **System Administrator** | Platform manager | Full system access, no farm data |

## 3. Access Control Principles

### 3.1 Principle of Least Privilege
Users are granted the **minimum access** necessary to perform their duties.

### 3.2 Role-Based Access Control (RBAC)
Access is determined by role, not by individual user.

### 3.3 Need-to-Know
Users can only access data relevant to their role.

### 3.4 Separation of Duties
- **System Admins** cannot access farm financial data
- **Farmers** cannot access platform security settings
- **Workers** cannot access farm finances

## 4. Role Permissions

### 4.1 Farmer Permissions

Farmers have full CRUD (Create, Read, Update, Delete) access to:
- Own livestock records
- Own crop records
- Own inventory
- Own financial records
- Own marketplace listings
- Own disease scans
- Own profile

Farmers **cannot** access:
- Other farmers' data
- Security administration
- Audit logs (own actions only)
- System settings

### 4.2 Farm Worker Permissions

Workers can **read** (but not modify):
- Assigned farm's livestock records
- Assigned farm's crop records
- Assigned farm's inventory

Workers can **read and write**:
- Assigned tasks
- Own profile
- Disease scans (shared with farm owner)

Workers **cannot** access:
- Financial records
- Marketplace listings
- Blockchain configurations
- Other farms

### 4.3 System Administrator Permissions

Admins can **read and write**:
- User accounts (create, suspend, delete)
- Role assignments
- Security configurations
- Data classification rules
- Audit logs
- GDPR compliance records

Admins **cannot** access:
- Any farm's financial data
- Any farm's livestock/crop operational data
- Marketplace listings (read-only)

## 5. Authentication

### 5.1 Password Requirements
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Passwords hashed with bcrypt (never stored plaintext)

### 5.2 Session Management
- JWT tokens expire after 7 days
- Sessions terminated on logout
- Concurrent sessions limited to 3 per user

### 5.3 Multi-Factor Authentication (MFA)
- Optional for farmers
- Required for administrators

## 6. Authorization

All API requests are checked against the permission matrix (`access_control_matrix.xlsx`).

If a user attempts an unauthorized action:
1. Request is **denied** (HTTP 403)
2. Attempt is **logged** in audit_logs table
3. User is **notified** (suspicious activity alert)

## 7. Database Security

### 7.1 Row Level Security (RLS)
Supabase RLS policies ensure:
- Farmers can only query their own rows
- Workers can only query rows for assigned farms
- Admins use service role key (backend only)

### 7.2 Service Role Key
- Used **only** on the backend server
- **Never** exposed to frontend
- Rotated every 90 days

## 8. Audit Logging

All access to restricted data is logged:

| Event | Logged Fields |
|-------|---------------|
| Login attempt | Email, IP, success/failure, timestamp |
| Data access | User ID, resource, action, timestamp |
| Permission change | Admin ID, changed user, old/new role |
| Data export | User ID, data type, timestamp |
| Account deletion | User ID, timestamp, reason |

Audit logs are:
- Stored in `audit_logs` table (immutable)
- Retained for 2 years
- Accessed **only** by admins
- **Not** linked to farm data (privacy)

## 9. Encryption

| Data State | Encryption |
|------------|------------|
| In transit | TLS 1.3 (HTTPS) |
| At rest | AES-256 (Supabase) |
| Passwords | bcrypt (cost 12) |
| Blockchain hashes | SHA-256 / keccak256 |

## 10. Incident Response

If a security breach is detected:
1. **Immediate:** Suspend affected accounts
2. **Within 1 hour:** Notify System Administrator
3. **Within 24 hours:** Conduct forensic analysis
4. **Within 72 hours:** Notify DPA + affected users (GDPR Art. 33)
5. **Within 7 days:** Publish incident report

## 11. Review & Updates

This policy is reviewed every 6 months. Changes are logged in the version history below.

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2026 | Initial policy |

## 12. Compliance

This policy aligns with:
- GDPR Art. 32 (Security of Processing)
- GDPR Art. 25 (Data Protection by Design)
- ISO/IEC 27001 (Information Security Management)
- OWASP Top 10 (Web Application Security)

## 13. Enforcement

Violations of this policy may result in:
- Immediate account suspension
- Permanent access revocation
- Legal action (for criminal violations)