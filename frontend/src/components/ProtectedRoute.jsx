import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';
import defenseCrest from '../assets/defense_crest.svg';

export const ProtectedRoute = React.memo(({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="security-check-overlay">
        <div className="security-check-card">
          <div className="security-check-logo">
            <img src={defenseCrest} alt="MAMS Defense Crest" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          </div>
          <LoadingSpinner text="Authenticating Security Clearance..." subtext="Establishing Secure Defense Gateway" />
          <p className="security-check-hint">
            If backend server is waking up (Render cold start), please hold for a few moments...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedUserRole = (user?.role || '').replace(/^ROLE_/, '');
  const normalizedAllowedRoles = allowedRoles?.map((r) => r.replace(/^ROLE_/, ''));

  if (normalizedAllowedRoles && (!normalizedUserRole || !normalizedAllowedRoles.includes(normalizedUserRole))) {
    return (
      <div className="security-check-overlay">
        <div className="security-check-card access-denied-card">
          <div className="access-denied-badge">!</div>
          <h2 className="access-denied-title">Security Clearance Required</h2>
          <p className="access-denied-desc">
            Your clearance level (<strong>{user?.role?.replace(/^ROLE_/, '') || 'RESTRICTED'}</strong>) does not permit entry to this sector.
          </p>
          <a href="/dashboard" className="access-denied-btn">
            Return to Authorized Command
          </a>
        </div>
      </div>
    );
  }

  return children;
});
