"""
Generates the AgriHerd GDPR Compliance Assessment
Run: python generate_gdpr.py
Output: compliance_assessment.xlsx
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def create_gdpr_assessment():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "GDPR Compliance"

    headers = [
        "GDPR Article",
        "Requirement",
        "AgriHerd Implementation",
        "Evidence Location",
        "Status"
    ]

    header_fill = PatternFill(start_color="2E7D32", end_color="2E7D32", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border

    gdpr_requirements = [
        # Lawfulness
        ["Art. 6(1)(a)", "Consent for processing", 
         "Users must accept privacy policy on registration. Consent is timestamped and stored.",
         "backend/app/api/v1/auth.py + profiles table", "IMPLEMENTED"],
        
        ["Art. 6(1)(b)", "Contract performance (marketplace)",
         "Orders and transactions are recorded as part of service delivery.",
         "backend/app/api/v1/marketplace.py", "IMPLEMENTED"],
        
        # Transparency
        ["Art. 12", "Transparent information",
         "Privacy Policy page available at /privacy-policy",
         "frontend/src/pages/profile/PrivacyPolicy.jsx", "IMPLEMENTED"],
        
        ["Art. 13", "Information to be provided at collection",
         "Registration form links to Privacy Policy. Consent is required.",
         "frontend/src/pages/auth/Register.jsx", "IMPLEMENTED"],
        
        # Data Minimisation
        ["Art. 5(1)(c)", "Data minimisation",
         "Only collect necessary data: name, email, phone, farm_name. No excess fields.",
         "backend/app/schemas/user_schema.py", "IMPLEMENTED"],
        
        # Purpose Limitation
        ["Art. 5(1)(b)", "Purpose limitation",
         "Data classified per purpose. See classification_matrix.xlsx",
         "security/data_classification/classification_matrix.xlsx", "IMPLEMENTED"],
        
        # Accuracy
        ["Art. 5(1)(d)", "Accuracy",
         "Users can edit their profile data via /profile page.",
         "frontend/src/pages/profile/Profile.jsx", "IMPLEMENTED"],
        
        # Storage Limitation
        ["Art. 5(1)(e)", "Storage limitation",
         "Data retention policy: inactive accounts archived after 2 years.",
         "docs/system_architecture.md", "PARTIALLY IMPLEMENTED"],
        
        # Integrity & Confidentiality
        ["Art. 5(1)(f)", "Integrity and confidentiality",
         "Encrypted at rest (Supabase), TLS in transit, RBAC enforced, audit logs.",
         "security/permissions/ + audit_logs table", "IMPLEMENTED"],
        
        # Accountability
        ["Art. 5(2)", "Accountability",
         "Documented policies + audit logs prove compliance.",
         "security/policies/ + audit_logs table", "IMPLEMENTED"],
        
        # User Rights
        ["Art. 15", "Right of access",
         "Users can view all their data via /profile and download as JSON.",
         "frontend/src/pages/profile/Profile.jsx", "IMPLEMENTED"],
        
        ["Art. 16", "Right to rectification",
         "Users can edit profile, livestock, and crops via edit forms.",
         "frontend/src/pages/profile/Profile.jsx", "IMPLEMENTED"],
        
        ["Art. 17", "Right to erasure (Right to be Forgotten)",
         "Users can request account deletion. Backend cascades deletes. On-chain hashes are preserved (cannot be deleted from blockchain) but no longer linkable to PII.",
         "backend/app/api/v1/auth.py (delete endpoint)", "IMPLEMENTED"],
        
        ["Art. 18", "Right to restrict processing",
         "Users can disable account via Privacy Settings.",
         "frontend/src/pages/security/SecuritySettings.jsx", "PARTIALLY IMPLEMENTED"],
        
        ["Art. 20", "Right to data portability",
         "Users can export their data as JSON via /profile/export",
         "backend/app/api/v1/auth.py (export endpoint)", "IMPLEMENTED"],
        
        ["Art. 21", "Right to object",
         "Users can opt-out of marketing notifications.",
         "Notification preferences in /profile", "IMPLEMENTED"],
        
        # Data Protection by Design
        ["Art. 25", "Data protection by design and by default",
         "Data classification, RBAC, and separate security domain by design.",
         "security/data_classification/ + Admin module", "IMPLEMENTED"],
        
        # Security of Processing
        ["Art. 32", "Security of processing",
         "Password hashing (bcrypt), JWT tokens, HTTPS, RBAC, RLS, audit logs.",
         "backend/app/core/security.py", "IMPLEMENTED"],
        
        # Breach Notification
        ["Art. 33", "Notification of breach to authority",
         "Breach response plan documented. Would notify DPA within 72 hours.",
         "docs/system_architecture.md (Breach Response section)", "PARTIALLY IMPLEMENTED"],
        
        ["Art. 34", "Communication of breach to data subject",
         "Users notified via email if their data is compromised (planned).",
         "Notification system", "NOT IMPLEMENTED"],
        
        # Processor
        ["Art. 28", "Data processor agreement",
         "Supabase is a Data Processor. Data Processing Agreement accepted.",
         "https://supabase.com/privacy", "IMPLEMENTED"],
        
        # Transfers
        ["Art. 44-49", "International transfers",
         "Supabase uses EU-hosted regions. No transfer outside EEA.",
         "Supabase region configuration", "IMPLEMENTED"],
        
        # Special Categories
        ["Art. 9", "Special category data",
         "AgriHerd does NOT process special category data (no health, race, religion about individuals).",
         "N/A - Data inventory confirms this", "N/A"],
    ]

    status_colors = {
        "IMPLEMENTED": "C8E6C9",
        "PARTIALLY IMPLEMENTED": "FFF9C4",
        "NOT IMPLEMENTED": "FFCDD2",
        "N/A": "E0E0E0"
    }

    for row_num, row in enumerate(gdpr_requirements, 2):
        for col_num, value in enumerate(row, 1):
            cell = ws.cell(row=row_num, column=col_num, value=value)
            cell.border = border
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            
            if col_num == 5:
                status = value
                if status in status_colors:
                    cell.fill = PatternFill(
                        start_color=status_colors[status], 
                        end_color=status_colors[status], 
                        fill_type="solid"
                    )

    # Column widths
    widths = [15, 35, 50, 35, 25]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

    # Summary sheet
    ws2 = wb.create_sheet("Summary")
    ws2["A1"] = "GDPR Compliance Summary"
    ws2["A1"].font = Font(bold=True, size=14)
    
    implemented = sum(1 for r in gdpr_requirements if r[4] == "IMPLEMENTED")
    partial = sum(1 for r in gdpr_requirements if r[4] == "PARTIALLY IMPLEMENTED")
    not_impl = sum(1 for r in gdpr_requirements if r[4] == "NOT IMPLEMENTED")
    na = sum(1 for r in gdpr_requirements if r[4] == "N/A")
    total = len(gdpr_requirements)
    
    ws2["A3"] = "Total Requirements:"
    ws2["B3"] = total
    ws2["A4"] = "Fully Implemented:"
    ws2["B4"] = implemented
    ws2["A5"] = "Partially Implemented:"
    ws2["B5"] = partial
    ws2["A6"] = "Not Implemented:"
    ws2["B6"] = not_impl
    ws2["A7"] = "Not Applicable:"
    ws2["B7"] = na
    ws2["A9"] = "Overall Compliance Score:"
    ws2["A9"].font = Font(bold=True)
    score = (implemented / (total - na)) * 100
    ws2["B9"] = f"{score:.1f}%"
    ws2["B9"].font = Font(bold=True, size=14, color="2E7D32")

    wb.save("compliance_assessment.xlsx")
    print("Saved: compliance_assessment.xlsx")
    print(f"   Compliance Score: {score:.1f}%")

if __name__ == "__main__":
    create_gdpr_assessment()