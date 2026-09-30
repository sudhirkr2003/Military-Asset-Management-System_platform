import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = React.memo(({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm tracking-wider uppercase font-semibold text-slate-400">Verifying Security Credentials...</p>
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied (Classified)</h2>
          <p className="text-slate-400 text-sm mb-6">Your security clearance role (<strong>{user?.role}</strong>) does not permit access to this module.</p>
          <a href="/dashboard" className="inline-block bg-slate-800 hover:bg-slate-700 text-white text-sm px-5 py-2.5 rounded-lg font-medium transition">
            Return to Authorized Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
});
