import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import BuyerLayout from '../layouts/BuyerLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AdminProtectedRoute from '../components/common/AdminProtectedRoute';
import NotFound from '../components/common/NotFound';

// --- Auth Pages ---
import Welcome from '../pages/auth/Welcome';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import { PrivacyPage, TermsPage } from '../pages/legal/LegalPages';

// --- Farmer Pages ---
import Dashboard from '../pages/dashboard/Dashboard';
import Crops from '../pages/crops/Crops';
import AddCrop from '../pages/crops/AddCrop';
import CropDetails from '../pages/crops/CropDetails';
import PlantingRecords from '../pages/crops/PlantingRecords';
import HarvestRecords from '../pages/crops/HarvestRecords';
import Livestock from '../pages/livestock/Livestock';
import AddAnimal from '../pages/livestock/AddAnimal';
import AnimalDetails from '../pages/livestock/AnimalDetails';
import HealthRecords from '../pages/livestock/HealthRecords';
import Vaccinations from '../pages/livestock/Vaccinations';
import Feeding from '../pages/livestock/Feeding';
import Breeding from '../pages/livestock/Breeding';
import Inventory from '../pages/inventory/Inventory';
import AddItem from '../pages/inventory/AddItem';
import ItemDetails from '../pages/inventory/ItemDetails';
import StockHistory from '../pages/inventory/StockHistory';
import Finance from '../pages/finance/Finance';
import Income from '../pages/finance/Income';
import Expenses from '../pages/finance/Expenses';
import FinancialReports from '../pages/finance/FinancialReports';
import TransactionForm from '../pages/finance/TransactionForm';
import DiseaseScanner from '../pages/disease-scanner/DiseaseScanner';
import ScanResults from '../pages/disease-scanner/ScanResults';
import ScanHistory from '../pages/disease-scanner/ScanHistory';
import Tasks from '../pages/tasks/Tasks';
import AddTask from '../pages/tasks/AddTask';
import Calendar from '../pages/tasks/Calendar';
import TaskDetails from '../pages/tasks/TaskDetails';
import Notifications from '../pages/notifications/Notifications';
import Profile from '../pages/profile/Profile';

// --- Marketplace Pages ---
import Marketplace from '../pages/marketplace/Marketplace';
import ProductDetails from '../pages/marketplace/ProductDetails';
import Cart from '../pages/marketplace/Cart';
import Checkout from '../pages/marketplace/Checkout';
import MyOrders from '../pages/marketplace/MyOrders';
import OrderConfirmation from '../pages/marketplace/OrderConfirmation';
import OrderDetails from '../pages/marketplace/OrderDetails';
import MyListings from '../pages/marketplace/MyListings';
import AddListing from '../pages/marketplace/AddListing';
import OrdersReceived from '../pages/marketplace/OrdersReceived';
import Categories from '../pages/marketplace/Categories';

// --- Buyer Pages ---
import BuyerDashboard from '../pages/buyer/BuyerDashboard';

// --- Admin Pages ---
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminAIDashboard from '../pages/admin/AdminAIDashboard';
import AdminBlockchain from '../pages/admin/AdminBlockchain';
import FarmManagement from '../pages/admin/FarmManagement';
import MarketplaceMonitor from '../pages/admin/MarketplaceMonitor';
import UserManagement from '../pages/security/UserManagement';
import RolesPermissions from '../pages/security/RolesPermissions';
import DataClassification from '../pages/security/DataClassification';
import AuditLogs from '../pages/security/AuditLogs';
import SecuritySettings from '../pages/security/SecuritySettings';

const LegacyAppRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/app${pathname}${search}${hash}`} replace />;
};

const AppRoutes = () => {
  const appMode = import.meta.env.VITE_APP_MODE || 'public';
  const isAdminBuild = appMode === 'admin';
  const isPublicBuild = appMode === 'public';

  return (
    <Routes>
      {/* =========================================
          AUTH ROUTES (Available on both builds)
          ========================================= */}
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {!isAdminBuild && (
        <>
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
        </>
      )}

      {/* =========================================
          FARMER ROUTES (Only on public build)
          ========================================= */}
      {isPublicBuild && (
        <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
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
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/add" element={<AddTask />} />
            <Route path="tasks/calendar" element={<Calendar />} />
            <Route path="tasks/:id" element={<TaskDetails />} />
            <Route path="disease-scanner" element={<DiseaseScanner />} />
            <Route path="disease-scanner/results/:id" element={<ScanResults />} />
            <Route path="disease-scanner/history" element={<ScanHistory />} />
            <Route path="marketplace/listings" element={<MyListings />} />
            <Route path="marketplace/listings/add" element={<AddListing />} />
            <Route path="marketplace/listings/edit/:id" element={<AddListing />} />
            <Route path="marketplace/orders" element={<OrdersReceived />} />
            <Route path="marketplace/orders/:id" element={<OrderDetails />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/product/:id" element={<ProductDetails />} />
            <Route path="marketplace/cart" element={<Cart />} />
            <Route path="marketplace/checkout" element={<Checkout />} />
            <Route path="marketplace/order-confirmation" element={<OrderConfirmation />} />
          </Route>
          <Route path="/:legacyPath/*" element={<LegacyAppRedirect />} />
        </Route>
      )}

      {/* =========================================
          BUYER ROUTES (Only on public build)
          ========================================= */}
      {isPublicBuild && (
        <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
          <Route path="/buyer" element={<BuyerLayout />}>
            <Route index element={<Navigate to="/buyer/dashboard" replace />} />
            <Route path="dashboard" element={<BuyerDashboard />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/product/:id" element={<ProductDetails />} />
            <Route path="marketplace/cart" element={<Cart />} />
            <Route path="marketplace/checkout" element={<Checkout />} />
            <Route path="marketplace/order-confirmation" element={<OrderConfirmation />} />
            <Route path="marketplace/orders" element={<MyOrders />} />
            <Route path="marketplace/orders/:id" element={<OrderDetails />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      )}

      {/* =========================================
          ADMIN ROUTES (Only on admin build)
          ========================================= */}
      {isAdminBuild && (
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="ai" element={<AdminAIDashboard />} />
            <Route path="blockchain" element={<AdminBlockchain />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="farms" element={<FarmManagement />} />
            <Route path="marketplace" element={<MarketplaceMonitor />} />
            <Route path="categories" element={<Categories />} />
            <Route path="roles" element={<RolesPermissions />} />
            <Route path="classification" element={<DataClassification />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<SecuritySettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      )}

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;