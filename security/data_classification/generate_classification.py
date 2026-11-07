"""
Generates the AgriHerd Data Classification Matrix
Run: python generate_classification.py
Output: classification_matrix.xlsx
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def create_classification_matrix():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Data Classification"

    # Headers
    headers = [
        "Data Item", 
        "Description", 
        "Classification Level", 
        "Authorized Roles", 
        "Access Rules", 
        "Reason for Classification"
    ]

    # Styling
    header_fill = PatternFill(start_color="2E7D32", end_color="2E7D32", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    # Add headers
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border

    # Data rows
    data = [
        # PUBLIC
        ["Product listings", "Marketplace items shown to buyers", "PUBLIC", "All users, guests", "Read-only for all", "Intended to be advertised publicly"],
        ["Farm names", "Name of the farm in marketplace", "PUBLIC", "All users", "Read-only for all", "Public branding"],
        ["Product prices", "Price of marketplace items", "PUBLIC", "All users", "Read-only", "Advertised pricing"],
        
        # PRIVATE
        ["User full name", "Farmer/buyer personal name", "PRIVATE", "Own user, Admin", "Read/Write by owner", "Personal identifier"],
        ["User email", "Contact email address", "PRIVATE", "Own user, Admin", "Read/Write by owner", "PII"],
        ["User phone", "Contact phone number", "PRIVATE", "Own user, Admin", "Read/Write by owner", "PII"],
        ["Farm location (region)", "General area where the farm is", "PRIVATE", "Own user, Admin", "Read/Write by owner", "Location PII"],
        ["User role", "Farmer, Worker, Admin", "PRIVATE", "Own user, Admin", "Admin writes", "Access control metadata"],
        
        # CONFIDENTIAL
        ["Livestock health records", "Animal illnesses, treatments", "CONFIDENTIAL", "Farmer, Worker, Vet", "Farmer and Vet read/write, Worker read", "Business operations, sensitive"],
        ["Crop planting records", "What was planted, when, quantity", "CONFIDENTIAL", "Farmer, Worker", "Farmer writes, Worker reads", "Business IP"],
        ["Harvest records", "Yields, quantities, quality", "CONFIDENTIAL", "Farmer, Worker", "Farmer writes, Worker reads", "Business operations"],
        ["Inventory stock", "Current quantities of supplies", "CONFIDENTIAL", "Farmer, Worker", "Farmer writes, Worker reads", "Operational data"],
        ["Disease scan results", "AI-detected crop disease", "CONFIDENTIAL", "Farmer", "Farmer read/write", "Operational, may reveal weakness"],
        ["Blockchain record hashes", "Hash references of transactions", "CONFIDENTIAL", "Farmer, Admin", "Read-only for farmer, Admin read", "Transaction integrity"],
        
        # RESTRICTED
        ["User password hashes", "Bcrypt password storage", "RESTRICTED", "System only", "No human read", "Critical security"],
        ["Financial transactions", "Income, expenses, balances", "RESTRICTED", "Farmer, Admin", "Farmer reads own, Admin reads all", "Financial PII"],
        ["GPS coordinates of farm", "Exact location", "RESTRICTED", "Farmer", "Farmer read/write", "High risk if leaked"],
        ["Blockchain private keys", "Wallet signing keys", "RESTRICTED", "System only", "No human read", "Critical infrastructure"],
        ["Security configuration", "Permission rules, admin settings", "RESTRICTED", "Admin only", "Admin write, audit-logged", "System integrity"],
        ["Audit logs", "All user actions", "RESTRICTED", "Admin", "Admin reads, tamper-proof via blockchain", "Compliance evidence"],
        ["GDPR consent records", "Legal proof of user consent", "RESTRICTED", "Admin, System", "Admin read, user reads own", "Legal compliance"],
        ["Blockchain wallet address", "User's wallet for verification", "RESTRICTED", "Farmer, Admin", "Farmer read own", "Financial identity"],
    ]

    # Add data
    for row_num, row_data in enumerate(data, 2):
        for col_num, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_num, column=col_num, value=value)
            cell.border = border
            cell.alignment = Alignment(wrap_text=True, vertical="top")

    # Color-code by classification
    for row_num in range(2, len(data) + 2):
        classification = ws.cell(row=row_num, column=3).value
        color = "C8E6C9"  # Public - light green
        if classification == "PRIVATE":
            color = "FFF9C4"  # Private - light yellow
        elif classification == "CONFIDENTIAL":
            color = "FFE0B2"  # Confidential - light orange
        elif classification == "RESTRICTED":
            color = "FFCDD2"  # Restricted - light red
        ws.cell(row=row_num, column=3).fill = PatternFill(
            start_color=color, end_color=color, fill_type="solid"
        )

    # Auto column widths
    widths = [30, 40, 20, 25, 30, 35]
    for col_num, width in enumerate(widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_num)].width = width

    wb.save("classification_matrix.xlsx")
    print("Saved: classification_matrix.xlsx")

if __name__ == "__main__":
    create_classification_matrix()