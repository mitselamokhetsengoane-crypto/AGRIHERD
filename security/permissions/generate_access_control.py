"""
Generates the AgriHerd Access Control Matrix
Run: python generate_access_control.py
Output: access_control_matrix.xlsx
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def create_access_control_matrix():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Permissions"

    headers = [
        "Module", 
        "Feature",
        "Farmer (Read)", "Farmer (Write)",
        "Worker (Read)", "Worker (Write)",
        "Admin (Read)", "Admin (Write)"
    ]

    # Styles
    header_fill = PatternFill(start_color="2E7D32", end_color="2E7D32", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )
    check_fill = PatternFill(start_color="C8E6C9", fill_type="solid")
    deny_fill = PatternFill(start_color="FFCDD2", fill_type="solid")

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border

    # Format: [Module, Feature, Farmer R/W, Worker R/W, Admin R/W]
    # Y = Allowed, N = Denied, O = Own records only
    permissions = [
        # AUTH
        ["Authentication", "Login / Register", "Y", "Y", "Y", "Y", "Y", "Y"],
        ["Authentication", "Password Reset", "Y", "Y", "Y", "Y", "Y", "Y"],
        
        # DASHBOARD
        ["Dashboard", "View Overview", "O", "N", "O", "N", "Y", "N"],
        ["Dashboard", "View Alerts", "O", "N", "N", "N", "Y", "N"],
        
        # LIVESTOCK
        ["Livestock", "View Animal List", "O", "N", "O", "N", "Y", "N"],
        ["Livestock", "Add/Edit Animal", "O", "O", "N", "N", "Y", "N"],
        ["Livestock", "Health Records", "O", "O", "O", "N", "Y", "N"],
        ["Livestock", "Vaccination Records", "O", "O", "O", "N", "Y", "N"],
        ["Livestock", "Feeding Records", "O", "O", "O", "O", "Y", "N"],
        ["Livestock", "Breeding Records", "O", "O", "O", "N", "Y", "N"],
        
        # CROPS
        ["Crops", "View Crop List", "O", "N", "O", "N", "Y", "N"],
        ["Crops", "Add/Edit Crop", "O", "O", "N", "N", "Y", "N"],
        ["Crops", "Planting Records", "O", "O", "O", "O", "Y", "N"],
        ["Crops", "Harvest Records", "O", "O", "O", "O", "Y", "N"],
        
        # TASKS
        ["Tasks", "View All Tasks", "O", "N", "O", "N", "Y", "N"],
        ["Tasks", "Create Task", "O", "O", "N", "N", "Y", "Y"],
        ["Tasks", "Complete Own Task", "O", "O", "O", "O", "Y", "Y"],
        ["Tasks", "Assign Task", "O", "O", "N", "N", "Y", "Y"],
        
        # INVENTORY
        ["Inventory", "View Stock", "O", "N", "O", "N", "Y", "N"],
        ["Inventory", "Add/Edit Item", "O", "O", "N", "N", "Y", "N"],
        ["Inventory", "Update Stock", "O", "O", "O", "O", "Y", "N"],
        ["Inventory", "Stock History", "O", "N", "N", "N", "Y", "N"],
        
        # FINANCE
        ["Finance", "View Income", "O", "N", "N", "N", "Y", "N"],
        ["Finance", "Add Income", "O", "O", "N", "N", "N", "N"],
        ["Finance", "View Expenses", "O", "N", "N", "N", "Y", "N"],
        ["Finance", "Add Expense", "O", "O", "N", "N", "N", "N"],
        ["Finance", "View Reports", "O", "N", "N", "N", "Y", "N"],
        
        # MARKETPLACE
        ["Marketplace", "Browse Products", "Y", "N", "Y", "N", "Y", "N"],
        ["Marketplace", "Add Product Listing", "O", "O", "N", "N", "Y", "N"],
        ["Marketplace", "Place Order", "Y", "Y", "Y", "Y", "Y", "N"],
        ["Marketplace", "Manage Orders", "O", "O", "N", "N", "Y", "N"],
        
        # DISEASE SCANNER
        ["Disease Scanner", "Upload Image", "O", "N", "O", "N", "Y", "N"],
        ["Disease Scanner", "View Scan Results", "O", "N", "O", "N", "Y", "N"],
        ["Disease Scanner", "View Scan History", "O", "N", "O", "N", "Y", "N"],
        
        # BLOCKCHAIN
        ["Blockchain", "View Transactions", "O", "N", "N", "N", "Y", "N"],
        ["Blockchain", "Verify Record", "O", "N", "N", "N", "Y", "N"],
        ["Blockchain", "Submit Record", "O", "O", "N", "N", "Y", "Y"],
        
        # NOTIFICATIONS
        ["Notifications", "View Own", "O", "N", "O", "N", "O", "N"],
        ["Notifications", "Mark Read", "O", "O", "O", "O", "O", "O"],
        ["Notifications", "Settings", "O", "O", "O", "O", "O", "O"],
        
        # PROFILE
        ["Profile", "View Own Profile", "O", "N", "O", "N", "O", "N"],
        ["Profile", "Edit Own Profile", "O", "O", "O", "O", "O", "O"],
        ["Profile", "Change Password", "O", "O", "O", "O", "O", "O"],
        
        # SECURITY / ADMIN (Admin only)
        ["Security Admin", "User Management", "N", "N", "N", "N", "Y", "Y"],
        ["Security Admin", "Roles & Permissions", "N", "N", "N", "N", "Y", "Y"],
        ["Security Admin", "Data Classification", "N", "N", "N", "N", "Y", "N"],
        ["Security Admin", "Audit Logs", "N", "N", "N", "N", "Y", "N"],
        ["Security Admin", "GDPR Compliance", "N", "N", "N", "N", "Y", "Y"],
    ]

    # Write data
    for row_num, row in enumerate(permissions, 2):
        # Module + Feature
        ws.cell(row=row_num, column=1, value=row[0]).border = border
        ws.cell(row=row_num, column=2, value=row[1]).border = border
        
        # Farmer R/W
        for col_num, val in enumerate([row[2], row[3]], 3):
            cell = ws.cell(row=row_num, column=col_num, value=val)
            cell.border = border
            cell.alignment = Alignment(horizontal="center")
            cell.fill = check_fill if val in ("Y", "O") else deny_fill
        
        # Worker R/W
        for col_num, val in enumerate([row[4], row[5]], 5):
            cell = ws.cell(row=row_num, column=col_num, value=val)
            cell.border = border
            cell.alignment = Alignment(horizontal="center")
            cell.fill = check_fill if val in ("Y", "O") else deny_fill
        
        # Admin R/W
        for col_num, val in enumerate([row[6], row[7]], 7):
            cell = ws.cell(row=row_num, column=col_num, value=val)
            cell.border = border
            cell.alignment = Alignment(horizontal="center")
            cell.fill = check_fill if val in ("Y", "O") else deny_fill

    # Legend
    legend_row = len(permissions) + 3
    ws.cell(row=legend_row, column=1, value="LEGEND").font = Font(bold=True)
    ws.cell(row=legend_row + 1, column=1, value="Y = Full Access")
    ws.cell(row=legend_row + 2, column=1, value="O = Own Records Only")
    ws.cell(row=legend_row + 3, column=1, value="N = No Access")

    # Column widths
    widths = [20, 30, 12, 12, 12, 12, 12, 12]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

    wb.save("access_control_matrix.xlsx")
    print("✅ Saved: access_control_matrix.xlsx")

if __name__ == "__main__":
    create_access_control_matrix()