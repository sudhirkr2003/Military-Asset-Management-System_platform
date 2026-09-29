import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'BASE_COMMANDER':
        return 'Base Commander';
      case 'LOGISTICS_OFFICER':
        return 'Logistics Officer';
      default:
        return role || 'User';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1 className="logged-in-title">
          {getRoleDisplayName(user?.role)} is logged in
        </h1>

        <div className="user-details-box">
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          {user?.email && <p><strong>Email:</strong> {user?.email}</p>}
          {user?.fullName && <p><strong>Full Name:</strong> {user?.fullName}</p>}
        </div>

        <button onClick={logout} className="logout-btn">
          Sign Out
        </button>
      </div>
    </div>
  );
};
