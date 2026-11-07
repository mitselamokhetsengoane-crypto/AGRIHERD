import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// ==========================================
// 1. PUBLIC PAGES
// ==========================================
import Welcome from '../pages/auth/Welcome';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// ==========================================
// 2. FARM APPLICATION PAGES (Farmer / Worker)
// ==========================================
import Dashboard from '../pages/dashboard/Dashboard';

// Crops
import Crops from '../pages/crops/Crops';
import AddCrop from '../pages/crops/AddCrop';
import CropDetails from '../pages/crops/CropDetails';
import PlantingRecords from '../pages/crops/PlantingRecords';
import HarvestRecords from '../pages/crops/HarvestRecords';

// Livestock
import Livestock from '../pages/livestock/Livestock';
import AddAnimal from '../pages/livestock/AddAnimal';
import AnimalDetails from '../pages/livestock/AnimalDetails';
import HealthRecords from '../pages/livestock/HealthRecords';
import Vaccinations from '../pages/livestock/Vaccinations';
import Feeding from '../pages/livestock/Feeding';
import Breeding from '../pages/livestock/Breeding';

// Inventory
import Inventory from '../pages/inventory/Inventory';
import AddItem from '../pages/inventory/AddItem';
import ItemDetails from '../pages/inventory/ItemDetails';
import StockHistory from '../pages/inventory/StockHistory';

// Finance
import Finance from '../pages/finance/Finance';
import Income from '../pages/finance/Income';
import Expenses from '../pages/finance/Expenses';
import FinancialReports from '../pages/finance/FinancialReports';
import TransactionForm from '../pages/finance/TransactionForm';

// Marketplace
import Marketplace from '../pages/marketplace/Marketplace';
import ProductDetails from '../pages/marketplace/ProductDetails';
import Cart from '../pages/marketplace/Cart';
import Checkout from '../pages/marketplace/Checkout';
import MyOrders from '../pages/marketplace/MyOrders';
import OrderConfirmation from '../pages/marketplace/OrderConfirmation';

// AI / Disease Scanner
import DiseaseScanner from '../pages/disease-scanner/DiseaseScanner';
import ScanResults from '../pages/disease-scanner/ScanResults';
import ScanHistory from '../pages/disease-scanner/ScanHistory';

// Tasks
import Tasks from '../pages/tasks/Tasks';
import AddTask from '../pages/tasks/AddTask';
import Calendar from '../pages/tasks/Calendar';
import TaskDetails from '../pages/tasks/TaskDetails';

// Notifications & Profile
import Notifications from '../pages/notifications/Notifications';
import Profile from '../pages/profile/Profile';

// ==========================================
// 3. ADMIN APPLICATION PAGES (Admin Only)
// ==========================================
import AdminDashboard from '../pages/admin/AdminDashboard';
import FarmManagement from '../pages/admin/FarmManagement';
import UserManagement from '../pages/security/UserManagement';
import RolesPermissions from '../pages/security/RolesPermissions';
import DataClassification from '../pages/security/DataClassification';
import AuditLogs from '../pages/security/AuditLogs';
import SecuritySettings from '../pages/security/SecuritySettings';

// Helper for redirecting old URLs
const LegacyAppRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/app${pathname}${search}${hash}`} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* ========================================== */}
      {/* 1. PUBLIC ROUTES (No Authentication Needed)*/}
      {/* ========================================== */}
      {/* The root '/' now shows the Welcome page */}
      <Route path="/" element={<Welcome />} />
      
      {/* Auth pages are now standalone (no AuthLayout wrapper) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup" element={<Register />} /> {/* Alias for compatibility */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ========================================== */}
      {/* 2. FARM APPLICATION ROUTES                 */}
      {/* ========================================== */}
      <Route element={<ProtectedRoute allowedRoles={['farmer', 'worker']} />}>
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="crops" element={<Crops />} />
          <Route path="crops/add" element={<AddCrop />} />
          <Route path="crops/:id" element={<CropDetails />} />
          <Route path="crops/:id/planting" element={<PlantingRecords />} />
          <Route path="crops/:id/harvest" element={<HarvestRecords />} />

          <Route path="livestock" element={<Livestock />} />
          <Route path="livestock/add" element={<AddAnimal />} />
          <Route path="livestock/:id" element={<AnimalDetails />} />
          <Route path="livestock/:id/health" element={<HealthRecords />} />
          <Route path="livestock/:id/vaccinations" element={<Vaccinations />} />
          <Route path="livestock/:id/feeding" element={<Feeding />} />
          <Route path="livestock/:id/breeding" element={<Breeding />} />

          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/add" element={<AddItem />} />
          <Route path="inventory/:id" element={<ItemDetails />} />
          <Route path="inventory/history" element={<StockHistory />} />

          <Route path="finance" element={<Finance />} />
          <Route path="finance/income" element={<Income />} />
          <Route path="finance/income/add" element={<TransactionForm type="income" />} />
          <Route path="finance/expenses" element={<Expenses />} />
          <Route path="finance/expenses/add" element={<TransactionForm type="expense" />} />
          <Route path="finance/reports" element={<FinancialReports />} />

          <Route path="marketplace" element={<Marketplace />} />
          <Route path="marketplace/product/:id" element={<ProductDetails />} />
          <Route path="marketplace/cart" element={<Cart />} />
          <Route path="marketplace/checkout" element={<Checkout />} />
          <Route path="marketplace/order-confirmation" element={<OrderConfirmation />} />
          <Route path="marketplace/orders" element={<MyOrders />} />

          <Route path="disease-scanner" element={<DiseaseScanner />} />
          <Route path="disease-scanner/results" element={<ScanResults />} />
          <Route path="disease-scanner/history" element={<ScanHistory />} />

          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/add" element={<AddTask />} />
          <Route path="tasks/calendar" element={<Calendar />} />
          <Route path="tasks/:id" element={<TaskDetails />} />

          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        {/* Legacy redirects for old /dashboard, /crops, etc. */}
        <Route path="/:legacyPath/*" element={<LegacyAppRedirect />} />
      </Route>

      {/* ========================================== */}
      {/* 3. ADMIN APPLICATION ROUTES                */}
      {/* ========================================== */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="farms" element={<FarmManagement />} />
          <Route path="roles" element={<RolesPermissions />} />
          <Route path="classification" element={<DataClassification />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="settings" element={<SecuritySettings />} />
        </Route>
      </Route>

      {/* ========================================== */}
      {/* 4. FALLBACK (404)                          */}
      {/* ========================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;