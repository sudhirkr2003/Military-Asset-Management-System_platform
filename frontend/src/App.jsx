import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AssetsPage } from './pages/AssetsPage';
import { InventoryPage } from './pages/InventoryPage';
import { MovementsPage } from './pages/MovementsPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { BasesPage } from './pages/BasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes with Sidebar Layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Purchases & Procurements (Accessible via /purchases and backend /movements/purchase) */}
            <Route
              path="/purchases"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER']}>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movements/purchase"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER']}>
                  <PurchasesPage />
                </ProtectedRoute>
              }
            />

            {/* Transfers & Relocations (Accessible via /transfers and backend /movements/transfer) */}
            <Route
              path="/transfers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER']}>
                  <TransfersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movements/transfer"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER', 'BASE_COMMANDER']}>
                  <TransfersPage />
                </ProtectedRoute>
              }
            />

            {/* Assignments & Expenditures (Accessible via /assignments, /movements/assign, /movements/expend, /movements/return) */}
            <Route
              path="/assignments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movements/assign"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movements/expend"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movements/return"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']}>
                  <AssignmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Equipment / Assets Catalog (Accessible via /assets and backend /equipment) */}
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/equipment" element={<AssetsPage />} />

            {/* Live Inventory Stock Balances */}
            <Route path="/inventory" element={<InventoryPage />} />

            {/* Movement Audit Transactions Ledger */}
            <Route path="/movements" element={<MovementsPage />} />

            {/* Military Personnel Management (ADMIN only) */}
            <Route
              path="/personnel"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <PersonnelPage />
                </ProtectedRoute>
              }
            />

            {/* Military Base Installations */}
            <Route path="/bases" element={<BasesPage />} />

            {/* Reports & Data Exports */}
            <Route path="/reports" element={<ReportsPage />} />

            {/* Architecture & System Specification */}
            <Route path="/architecture" element={<ArchitecturePage />} />
            <Route path="/system-architecture" element={<ArchitecturePage />} />

            {/* Documentation & System Settings */}
            <Route path="/docs" element={<SettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/documentation" element={<SettingsPage />} />
            <Route path="/api-docs" element={<SettingsPage />} />
          </Route>

          {/* Public Documentation & Architecture Routes without login */}
          <Route path="/public-docs" element={<SettingsPage />} />
          <Route path="/public-architecture" element={<ArchitecturePage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
