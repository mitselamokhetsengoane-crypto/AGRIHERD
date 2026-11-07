# AgriHerd Privacy Policy

**Last Updated:** November 2026  
**Version:** 1.0

## 1. Introduction

AgriHerd ("we," "our," "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use the AgriHerd application.

This policy complies with the **General Data Protection Regulation (GDPR)** and Lesotho's **Data Protection Act**.

## 2. Data We Collect

We collect the following categories of data:

### 2.1 Personal Data (Private Classification)
- Full name
- Email address
- Phone number
- Farm name and location
- Account role (farmer, worker, admin)

### 2.2 Operational Data (Confidential Classification)
- Livestock records (health, feeding, breeding)
- Crop records (planting, harvest)
- Inventory records
- Disease scan results from AI

### 2.3 Financial Data (Restricted Classification)
- Income and expense transactions
- Marketplace order history
- Blockchain transaction hashes

### 2.4 Technical Data
- IP address (for security audit logs)
- Login timestamps
- User actions (for audit trail)

## 3. How We Use Your Data

We process your data for the following purposes:

| Purpose | Legal Basis (GDPR Art. 6) |
|---------|---------------------------|
| Account management | Contract performance |
| Farm operations tracking | Contract performance |
| Marketplace transactions | Contract performance |
| AI disease detection | Legitimate interest |
| Security & fraud prevention | Legitimate interest |
| Compliance with legal obligations | Legal obligation |

## 4. Data Storage & Security

### 4.1 Where We Store Your Data
- **Supabase (PostgreSQL)** — hosted in EU region (Ireland)
- **Blockchain** — cryptographic hashes only, no personal data

### 4.2 How We Protect It
- **Encryption at rest** (Supabase database)
- **TLS 1.3** encryption in transit
- **Password hashing** using bcrypt (never stored in plaintext)
- **Role-Based Access Control (RBAC)** — only authorized users can access certain data
- **Audit logs** — all sensitive actions are recorded
- **Data classification** — data is tagged as Public, Private, Confidential, or Restricted

## 5. Data Sharing

We **do not sell** your data. We share data only:

- **With your consent** — when you publish marketplace listings
- **With service providers** — Supabase (data processor, GDPR-compliant)
- **As required by law** — court orders, legal investigations

## 6. Your Rights (GDPR)

You have the following rights:

| Right | How to Exercise |
|-------|----------------|
| **Right to Access** | Go to Profile → Download My Data |
| **Right to Rectification** | Go to Profile → Edit Profile |
| **Right to Erasure** | Go to Profile → Delete Account |
| **Right to Data Portability** | Go to Profile → Export Data (JSON) |
| **Right to Object** | Contact privacy@agriherd.example |
| **Right to Restrict Processing** | Go to Settings → Privacy |

## 7. Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Active account data | Until deletion requested |
| Financial records | 7 years (legal requirement) |
| Audit logs | 2 years |
| Blockchain hashes | Indefinite (immutable, no PII) |

## 8. Children's Privacy

AgriHerd is not intended for users under 18. We do not knowingly collect data from minors.

## 9. Data Breach Notification

In the event of a data breach, we will:
1. Notify the Data Protection Authority within **72 hours**
2. Notify affected users via email within **72 hours** if high risk
3. Publish a public statement on our website

## 10. Contact Us

**Data Protection Officer:**  
Email: dpo@agriherd.example  
Address: [Your University Address]

**Supervisory Authority:**  
Lesotho Communications Authority / EU Data Protection Authority

## 11. Changes to This Policy

We will notify users of material changes via email at least **30 days** before they take effect.

## 12. Blockchain Disclaimer

AgriHerd stores **cryptographic hashes** of records on the blockchain. These hashes:
- Do **not** contain personal data
- Cannot be reversed to reveal personal data
- Are compatible with GDPR's right to erasure (PII is deleted from off-chain database; hash remains but is meaningless without source data)