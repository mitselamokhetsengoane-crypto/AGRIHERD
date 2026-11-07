# AgriHerd User Manual

## Getting Started

### 1. Create an Account
1. Go to https://agriherd.vercel.app
2. Click **Sign Up**
3. Fill in: Full Name, Email, Phone, Farm Name, Password
4. Click **Create Account**
5. You will be redirected to the Dashboard

### 2. Log In
1. Enter your Email and Password
2. Click **Log In**

## Dashboard

The Dashboard shows:
- **Livestock count** (total animals)
- **Active crops** (planted)
- **Upcoming tasks** (pending)
- **Low stock alerts**
- **Quick Actions** (Add Animal, Add Crop, Add Task, Scan Disease)

## Livestock Management

### Add an Animal
1. Click **Livestock** in the sidebar
2. Click **+ Add Animal**
3. Fill in:
   - Animal ID (e.g., C-001)
   - Name (e.g., Litaba)
   - Type (Cattle, Sheep, Goat, Chicken)
   - Breed, Age, Gender, Weight
   - Health Status (Healthy, Sick, Under Treatment)
4. Click **Save Animal**

### View Animal Details
Click **View Details** on any animal card to see:
- Full profile
- Health records
- Vaccination history
- Feeding records
- Breeding records

## Crops Management

### Add a Crop
1. Click **Crops** in the sidebar
2. Click **+ Add Crop**
3. Fill in:
   - Crop Name (e.g., Maize)
   - Type (Grain, Vegetable, Fruit)
   - Field Name (e.g., Field A)
   - Field Size (e.g., 5 Acres)
   - Planting Date
   - Expected Harvest Date
4. Click **Save Crop**

## Disease Scanner (AI)

### Scan a Crop
1. Click **Disease Scanner** in the sidebar
2. Click **Upload Crop Image** (or drag and drop)
3. Select a clear photo of a crop leaf
4. Click **Scan Image**
5. Wait for the AI to analyze (2-5 seconds)
6. View results:
   - **Detected Disease** (e.g., Anthracnose)
   - **Confidence** (e.g., 87%)
   - Annotated image with bounding boxes

### View Scan History
Click **Scan History** to see all previous scans.

## Marketplace

### Browse Products
1. Click **Marketplace** in the sidebar
2. Use the search bar or browse categories
3. Click **View Product** on any listing

### Place an Order
1. On a product page, enter quantity
2. Click **Add to Cart**
3. Go to **Cart** (top-right)
4. Click **Proceed to Checkout**
5. Fill in delivery details
6. Click **Place Order**

## Finance

### Record Income
1. Click **Finance** → **Income**
2. Click **+ Add Income**
3. Fill in: Source, Amount, Date, Description
4. Click **Save**

### Record Expense
1. Click **Finance** → **Expenses**
2. Click **+ Add Expense**
3. Fill in: Category, Amount, Date
4. Click **Save**

## Notifications

Click the bell icon to see notifications for:
- Low stock alerts
- Vaccination due dates
- Task reminders
- New marketplace orders

## Profile

### Edit Profile
1. Click your avatar (top-right)
2. Click **Edit Profile**
3. Update fields and save

### Security (Admins Only)
Admins can access `/security` to manage:
- Users and roles
- Permissions
- Audit logs
- GDPR compliance

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot log in | Reset password via Forgot Password |
| AI scan fails | Ensure backend + AI model are running |
| Blockchain not working | Start Hardhat node (`npm run node`) |
| Database errors | Check Supabase connection in backend `.env` |

## Support

Contact: support@agriherd.example