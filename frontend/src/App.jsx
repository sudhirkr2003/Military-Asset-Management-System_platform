import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function App() {
  return (
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
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/movements" element={<MovementsPage />} />
            <Route path="/personnel" element={<PersonnelPage />} />
            <Route path="/bases" element={<BasesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
