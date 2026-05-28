import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/shared/AppLayout';
import { RoleGuard } from './components/shared/RoleGuard';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Super Admin
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import UserManagementPage from './pages/superadmin/UserManagementPage';
import PaymentConfigPage from './pages/superadmin/PaymentConfigPage';
import CrossBusinessPricePage from './pages/superadmin/CrossBusinessPricePage';
import BranchManagementPage from './pages/superadmin/BranchManagementPage';

// Water Retail
import WaterAdminDashboard from './pages/water/WaterAdminDashboard';
import WaterPOS from './pages/water/WaterPOS';
import WaterProductsPage from './pages/water/WaterProductsPage';
import StockRequestsPage from './pages/water/StockRequestsPage';
import RefundRequestsPage from './pages/water/RefundRequestsPage';
import CustomerManagementPage from './pages/water/CustomerManagementPage';
import CustomerCreditsPage from './pages/water/CustomerCreditsPage';
import WaterTransactionHistoryPage from './pages/water/WaterTransactionHistoryPage';

// R&B
import RBManagerDashboard from './pages/rb/RBManagerDashboard';
import RBPOS from './pages/rb/RBPOS';
import RBStockPage from './pages/rb/RBStockPage';
import RBCashierManagementPage from './pages/rb/RBCashierManagementPage';
import RBTransactionHistoryPage from './pages/rb/RBTransactionHistoryPage';

// Delivery
import DriverDashboard from './pages/delivery/DriverDashboard';
import DebtManagementPage from './pages/delivery/DebtManagementPage';
import GPSTrackerPage from './pages/delivery/GPSTrackerPage';
import DeliveryRecordingPage from './pages/delivery/DeliveryRecordingPage';
import DriverExpensePage from './pages/delivery/DriverExpensePage';
import DeliveryRevenuePage from './pages/delivery/DeliveryRevenuePage';

// Shared
import RevenuePage from './pages/shared/RevenuePage';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route element={<AppLayout />}>
            {/* ── Super Admin ── */}
            <Route path="/super-admin/dashboard"      element={<RoleGuard allowedRoles={['super_admin']}><SuperAdminDashboard /></RoleGuard>} />
            <Route path="/super-admin/users"          element={<RoleGuard allowedRoles={['super_admin']}><UserManagementPage /></RoleGuard>} />
            <Route path="/super-admin/branches"       element={<RoleGuard allowedRoles={['super_admin']}><BranchManagementPage /></RoleGuard>} />
            <Route path="/super-admin/payment-config" element={<RoleGuard allowedRoles={['super_admin']}><PaymentConfigPage /></RoleGuard>} />
            <Route path="/super-admin/prices"         element={<RoleGuard allowedRoles={['super_admin']}><CrossBusinessPricePage /></RoleGuard>} />
            <Route path="/super-admin/revenue"        element={<RoleGuard allowedRoles={['super_admin']}><RevenuePage business="water_retail" /></RoleGuard>} />
            <Route path="/super-admin/debts"          element={<RoleGuard allowedRoles={['super_admin']}><DebtManagementPage /></RoleGuard>} />

            {/* ── Water Admin ── */}
            <Route path="/water/admin/dashboard"       element={<RoleGuard allowedRoles={['water_admin','super_admin']}><WaterAdminDashboard /></RoleGuard>} />
            <Route path="/water/admin/revenue"         element={<RoleGuard allowedRoles={['water_admin','super_admin']}><RevenuePage business="water_retail" /></RoleGuard>} />
            <Route path="/water/admin/products"        element={<RoleGuard allowedRoles={['water_admin','super_admin']}><WaterProductsPage /></RoleGuard>} />
            <Route path="/water/admin/stock-requests"  element={<RoleGuard allowedRoles={['water_admin','super_admin']}><StockRequestsPage /></RoleGuard>} />
            <Route path="/water/admin/refunds"         element={<RoleGuard allowedRoles={['water_admin','super_admin']}><RefundRequestsPage /></RoleGuard>} />
            <Route path="/water/admin/customers"       element={<RoleGuard allowedRoles={['water_admin','super_admin']}><CustomerManagementPage /></RoleGuard>} />
            <Route path="/water/admin/credits"         element={<RoleGuard allowedRoles={['water_admin','super_admin']}><CustomerCreditsPage /></RoleGuard>} />
            <Route path="/water/admin/transactions"    element={<RoleGuard allowedRoles={['water_admin','super_admin']}><WaterTransactionHistoryPage /></RoleGuard>} />
            <Route path="/water/delivery/revenue"      element={<RoleGuard allowedRoles={['water_admin','super_admin']}><DeliveryRevenuePage /></RoleGuard>} />

            {/* ── Water Cashier ── */}
            <Route path="/water/cashier/pos"           element={<RoleGuard allowedRoles={['water_cashier','water_admin','super_admin']}><WaterPOS /></RoleGuard>} />
            <Route path="/water/cashier/transactions"  element={<RoleGuard allowedRoles={['water_cashier','water_admin','super_admin']}><WaterTransactionHistoryPage /></RoleGuard>} />
            <Route path="/water/cashier/stock-request" element={<RoleGuard allowedRoles={['water_cashier','water_admin','super_admin']}><StockRequestsPage /></RoleGuard>} />
            <Route path="/water/cashier/refund"        element={<RoleGuard allowedRoles={['water_cashier','water_admin','super_admin']}><RefundRequestsPage /></RoleGuard>} />

            {/* ── Driver ── */}
            <Route path="/water/driver/dashboard"  element={<RoleGuard allowedRoles={['driver','super_admin']}><DriverDashboard /></RoleGuard>} />
            <Route path="/water/driver/deliveries" element={<RoleGuard allowedRoles={['driver','super_admin']}><DeliveryRecordingPage /></RoleGuard>} />
            <Route path="/water/driver/gps"        element={<RoleGuard allowedRoles={['driver','water_admin','super_admin']}><GPSTrackerPage /></RoleGuard>} />
            <Route path="/water/driver/debts"      element={<RoleGuard allowedRoles={['driver','water_admin','super_admin']}><DebtManagementPage /></RoleGuard>} />
            <Route path="/water/driver/expenses"   element={<RoleGuard allowedRoles={['driver','water_admin','super_admin']}><DriverExpensePage /></RoleGuard>} />

            {/* ── R&B Manager ── */}
            <Route path="/rb/manager/dashboard"    element={<RoleGuard allowedRoles={['rb_manager','super_admin']}><RBManagerDashboard /></RoleGuard>} />
            <Route path="/rb/manager/stock"        element={<RoleGuard allowedRoles={['rb_manager','super_admin']}><RBStockPage /></RoleGuard>} />
            <Route path="/rb/manager/revenue"      element={<RoleGuard allowedRoles={['rb_manager','super_admin']}><RevenuePage business="rb" /></RoleGuard>} />
            <Route path="/rb/manager/cashiers"     element={<RoleGuard allowedRoles={['rb_manager','super_admin']}><RBCashierManagementPage /></RoleGuard>} />
            <Route path="/rb/manager/transactions" element={<RoleGuard allowedRoles={['rb_manager','super_admin']}><RBTransactionHistoryPage /></RoleGuard>} />

            {/* ── R&B Cashier ── */}
            <Route path="/rb/cashier/pos"          element={<RoleGuard allowedRoles={['rb_cashier','super_admin']}><RBPOS /></RoleGuard>} />
            <Route path="/rb/cashier/transactions" element={<RoleGuard allowedRoles={['rb_cashier','rb_manager','super_admin']}><RBTransactionHistoryPage /></RoleGuard>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;