import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import defenseCrest from '../assets/defense_crest.svg';
import {
  FileCode,
  ExternalLink,
  Code,
  CheckCircle,
  AlertCircle,
  Copy,
  Terminal,
  Shield,
  Layers,
  Database,
  Server,
  Lock,
  Search,
  BookOpen,
  Play,
  X,
  Send,
  Clock,
  ArrowLeft,
  LogIn,
  Activity
} from 'lucide-react';

export const SettingsPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Live Test Modal State
  const [activeTestEndpoint, setActiveTestEndpoint] = useState(null);
  const [testParamInput, setTestParamInput] = useState('');
  const [testPayloadInput, setTestPayloadInput] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testDuration, setTestDuration] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('mams_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const endpointModules = [
    {
      category: 'Health & System Monitoring',
      icon: '💚',
      description: 'Public health check and keep-alive endpoints for uptime monitors and system diagnostics',
      endpoints: [
        { method: 'GET', path: '/api/health', desc: 'Public health check verifying database connectivity, uptime, and latency', roles: ['Public'] },
        { method: 'GET', path: '/health', desc: 'Legacy keep-alive endpoint alias', roles: ['Public'] }
      ]
    },
    {
      category: 'Authentication',
      icon: '🔐',
      description: 'Endpoints for user login, current user profile, and user registration',
      endpoints: [
        { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user and get JWT access token', roles: ['Public'], samplePayload: '{\n  "usernameOrEmail": "admin",\n  "password": "password"\n}' },
        { method: 'POST', path: '/api/auth/register', desc: 'Register a new user account (Admin only)', roles: ['ADMIN'], samplePayload: '{\n  "fullName": "Capt. Aditi Sharma",\n  "username": "aditi_sharma",\n  "email": "aditi@mams.mil",\n  "password": "password",\n  "role": "LOGISTICS_OFFICER",\n  "baseId": 1\n}' },
        { method: 'GET', path: '/api/auth/me', desc: 'Get current authenticated user details', roles: ['Authenticated'] }
      ]
    },
    {
      category: 'Dashboard',
      icon: '📊',
      description: 'Endpoints for military asset dashboard summary, KPI metrics, charts, and activity',
      endpoints: [
        { method: 'GET', path: '/api/dashboard/summary', desc: 'Get dashboard KPI summary (Opening balance, Purchases, Transfers, Net Movement, Assigned, Expended, Closing)', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/dashboard/recent-movements', desc: 'Get recent inventory movements and transactions', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/dashboard/category-distribution', desc: 'Get available inventory distribution by equipment category', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] }
      ]
    },
    {
      category: 'Equipment',
      icon: '🛡️',
      description: 'Endpoints for registering, updating, and querying military equipment and asset types',
      endpoints: [
        { method: 'GET', path: '/api/equipment', desc: 'Get list of all military equipment types', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/equipment/{id}', desc: 'Get equipment type details by ID', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], defaultParam: '1' },
        { method: 'POST', path: '/api/equipment', desc: 'Register a new military equipment / asset type into defense catalog', roles: ['ADMIN', 'LOGISTICS_OFFICER'], samplePayload: '{\n  "name": "BrahMos Cruise Missile",\n  "code": "BRHMOS-V2",\n  "category": "WEAPON",\n  "unit": "units",\n  "isConsumable": false,\n  "description": "Supersonic cruise missile system"\n}' },
        { method: 'PUT', path: '/api/equipment/{id}', desc: 'Update an existing military equipment / asset type', roles: ['ADMIN', 'LOGISTICS_OFFICER'], defaultParam: '1', samplePayload: '{\n  "name": "T-90 Bhishma MBT Mark-II",\n  "category": "VEHICLE",\n  "unit": "units",\n  "isConsumable": false,\n  "description": "Upgraded thermal imaging systems"\n}' },
        { method: 'DELETE', path: '/api/equipment/{id}', desc: 'Deactivate/decommission an equipment type (soft delete)', roles: ['ADMIN'], defaultParam: '1' }
      ]
    },
    {
      category: 'Movements & Logistics',
      icon: '🔄',
      description: 'Endpoints for asset procurement, base transfers, personnel assignments, and expenditures',
      endpoints: [
        { method: 'POST', path: '/api/movements/purchase', desc: 'Record new procurement / purchase of assets into base inventory', roles: ['ADMIN', 'LOGISTICS_OFFICER'], samplePayload: '{\n  "baseId": 1,\n  "equipmentTypeId": 1,\n  "quantity": 25,\n  "supplier": "Ordnance Factory Board",\n  "invoiceNumber": "INV-2026-OFB-09",\n  "remarks": "Annual defense consignment"\n}' },
        { method: 'POST', path: '/api/movements/transfer', desc: 'Transfer military assets from one base to another', roles: ['ADMIN', 'LOGISTICS_OFFICER'], samplePayload: '{\n  "fromBaseId": 1,\n  "toBaseId": 2,\n  "equipmentTypeId": 1,\n  "quantity": 5,\n  "reason": "Western Sector Reinforcement",\n  "remarks": "Escorted transit"\n}' },
        { method: 'POST', path: '/api/movements/assign', desc: 'Assign / Issue weapons or equipment to military personnel', roles: ['ADMIN', 'BASE_COMMANDER'], samplePayload: '{\n  "baseId": 1,\n  "equipmentTypeId": 1,\n  "quantity": 1,\n  "personnelName": "Havildar Ramesh Singh",\n  "serviceNumber": "JC-894120",\n  "purpose": "Perimeter Security Guard",\n  "remarks": "Standard service issue"\n}' },
        { method: 'POST', path: '/api/movements/return', desc: 'Record return of assigned equipment back to base armory', roles: ['ADMIN', 'BASE_COMMANDER'], samplePayload: '{\n  "baseId": 1,\n  "equipmentTypeId": 1,\n  "quantity": 1,\n  "serviceNumber": "JC-894120",\n  "remarks": "Shift completed, returned to armory"\n}' },
        { method: 'POST', path: '/api/movements/expend', desc: 'Record expenditure / consumption of ammunition or fuel during operations', roles: ['ADMIN', 'BASE_COMMANDER'], samplePayload: '{\n  "baseId": 1,\n  "equipmentTypeId": 3,\n  "quantity": 250,\n  "operationOrExercise": "Exercise Desert Strike Firing Drill",\n  "remarks": "Expended during target practice"\n}' },
        { method: 'GET', path: '/api/movements', desc: 'Get transaction ledger history with optional filters', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/movements/{id}', desc: 'Get specific movement transaction details by ID', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], defaultParam: '1' }
      ]
    },
    {
      category: 'Inventory',
      icon: '📦',
      description: 'Endpoints for viewing live stock balances across military bases',
      endpoints: [
        { method: 'GET', path: '/api/inventory', desc: 'Get live inventory balances across all military bases', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/inventory/base/{baseId}', desc: 'Get live inventory balances for a specific military base', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], defaultParam: '1' },
        { method: 'GET', path: '/api/inventory/base/{baseId}/equipment/{equipmentTypeId}', desc: 'Get live stock balance for a specific equipment at a specific base', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], defaultParam: '1/equipment/1' }
      ]
    },
    {
      category: 'Personnel',
      icon: '👤',
      description: 'Endpoints for managing military officers, base commanders, logistics officers, and soldiers',
      endpoints: [
        { method: 'GET', path: '/api/personnel', desc: 'Get list of all military personnel (optionally filter by baseId or role)', roles: ['ADMIN'] },
        { method: 'GET', path: '/api/personnel/{id}', desc: 'Get personnel details by ID', roles: ['ADMIN'], defaultParam: '1' },
        { method: 'POST', path: '/api/personnel', desc: 'Register new military personnel/officer into system', roles: ['ADMIN'], samplePayload: '{\n  "fullName": "Major Vikram Rathore",\n  "username": "vikram_rathore",\n  "email": "vikram@mams.mil",\n  "password": "password123",\n  "role": "BASE_COMMANDER",\n  "baseId": 1\n}' },
        { method: 'PUT', path: '/api/personnel/{id}', desc: 'Update personnel details, base assignment, or military role', roles: ['ADMIN'], defaultParam: '1', samplePayload: '{\n  "fullName": "Major Vikram Rathore",\n  "email": "vikram.rathore@mams.mil",\n  "role": "BASE_COMMANDER",\n  "baseId": 1,\n  "status": "ACTIVE"\n}' },
        { method: 'DELETE', path: '/api/personnel/{id}', desc: 'Deactivate/decommission personnel record (soft delete)', roles: ['ADMIN'], defaultParam: '1' }
      ]
    },
    {
      category: 'Bases',
      icon: '⌖',
      description: 'Endpoints for managing and querying military bases and defense installations',
      endpoints: [
        { method: 'GET', path: '/api/bases', desc: 'Get list of all military bases', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/bases/{id}', desc: 'Get military base details by ID', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'], defaultParam: '1' },
        { method: 'POST', path: '/api/bases', desc: 'Register a new military installation or command sector', roles: ['ADMIN'], samplePayload: '{\n  "name": "Southern Naval & Coastal Fortress",\n  "code": "SNC-07",\n  "location": "Visakhapatnam Sector",\n  "commanderName": "Vice Admiral S. Nair"\n}' }
      ]
    },
    {
      category: 'Reports & Audit',
      icon: '📑',
      description: 'Endpoints for generating logistical audit reports, expenditure metrics, and CSV/PDF data exports',
      endpoints: [
        { method: 'GET', path: '/api/reports/movements', desc: 'Get movement and procurement audit report with filters', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/reports/inventory-audit', desc: 'Get base armory inventory audit and stock health report', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/reports/expenditures', desc: 'Get ammunition and fuel operational expenditure report', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] },
        { method: 'GET', path: '/api/reports/export/csv', desc: 'Export audit or inventory report directly to CSV file', roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] }
      ]
    }
  ];

  const totalEndpointsCount = endpointModules.reduce((acc, curr) => acc + curr.endpoints.length, 0);

  const location = useLocation();
  const isPublicDocRoute = location.pathname === '/public-docs' || !currentUser;

  // Permission Check Function for individual endpoints
  const canUserTryEndpoint = (ep) => {
    // 1. If endpoint is Public (like POST /api/auth/login), anyone can try it
    if (ep.roles.includes('Public') || ep.roles.includes('PUBLIC')) {
      return true;
    }

    // Unauthenticated visitors cannot execute non-public endpoints
    if (!currentUser || !currentUser.role) {
      return false;
    }

    // 2. Admin can execute all endpoints
    if (currentUser.role === 'ADMIN') {
      return true;
    }

    // 3. If endpoint is available to all logged-in users (like GET /api/auth/me)
    if (ep.roles.includes('Authenticated') || ep.roles.includes('All Roles')) {
      return true;
    }

    // 4. Role-specific match (e.g. BASE_COMMANDER, LOGISTICS_OFFICER)
    return ep.roles.includes(currentUser.role);
  };

  // Determine if the Action column should be rendered for this module table
  const shouldShowActionColumn = (mod) => {
    if (!currentUser) {
      // For unauthenticated public visitors: ONLY show Action column if module contains at least one Public endpoint
      return mod.endpoints.some((ep) => ep.roles.includes('Public') || ep.roles.includes('PUBLIC'));
    }
    if (currentUser.role === 'ADMIN') {
      return true;
    }
    // For logged-in users: show Action column if this module contains at least one endpoint they can execute
    return mod.endpoints.some((ep) => canUserTryEndpoint(ep));
  };

  // Open Live Test Modal
  const handleOpenTestModal = (ep, category) => {
    setActiveTestEndpoint({ ...ep, category });
    setTestParamInput(ep.defaultParam || '');
    setTestPayloadInput(ep.samplePayload || '');
    setTestResponse(null);
    setTestDuration(null);
  };

  // Execute Live API Request
  const handleExecuteLiveTest = async () => {
    if (!activeTestEndpoint) return;
    setTestLoading(true);
    setTestResponse(null);
    const startTime = performance.now();

    try {
      let resolvedPath = activeTestEndpoint.path;
      if (resolvedPath.includes('{')) {
        if (testParamInput) {
          if (testParamInput.includes('/')) {
            resolvedPath = `/api/inventory/base/${testParamInput}`;
          } else {
            resolvedPath = resolvedPath.replace(/\{[^}]+\}/g, testParamInput);
          }
        } else {
          resolvedPath = resolvedPath.replace(/\{[^}]+\}/g, '1');
        }
      }

      // Remove leading '/api' because Axios baseURL already includes '/api'
      const relativeUrl = resolvedPath.replace(/^\/api/, '');

      let res;
      if (activeTestEndpoint.method === 'GET') {
        res = await api.get(relativeUrl);
      } else if (activeTestEndpoint.method === 'POST') {
        const body = testPayloadInput ? JSON.parse(testPayloadInput) : {};
        res = await api.post(relativeUrl, body);
      } else if (activeTestEndpoint.method === 'PUT') {
        const body = testPayloadInput ? JSON.parse(testPayloadInput) : {};
        res = await api.put(relativeUrl, body);
      } else if (activeTestEndpoint.method === 'DELETE') {
        res = await api.delete(relativeUrl);
      }

      const duration = Math.round(performance.now() - startTime);
      setTestDuration(duration);
      setTestResponse({
        status: res.status,
        statusText: res.statusText || 'OK',
        data: res.data,
        success: true
      });
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setTestDuration(duration);
      setTestResponse({
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'Error',
        data: err.response?.data || { error: err.message },
        success: false
      });
    } finally {
      setTestLoading(false);
    }
  };

  const filteredModules = endpointModules.map((mod) => {
    const matched = mod.endpoints.filter((ep) => {
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.desc.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q)
      );
    });
    return { ...mod, endpoints: matched };
  }).filter((mod) => mod.endpoints.length > 0);

  return (
    <section
      className="view-panel-container"
      style={
        location.pathname === '/public-docs'
          ? {
              maxWidth: '1360px',
              margin: '0 auto',
              padding: '24px 28px',
              minHeight: '100vh',
              background: '#f7faf5',
              boxSizing: 'border-box'
            }
          : {}
      }
    >
      {/* Top Navigation for Public Docs View */}
      {location.pathname === '/public-docs' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '22px',
            paddingBottom: '16px',
            borderBottom: '1.5px solid #d5dfd2',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #0e381d 0%, #061c0e 100%)',
                border: '1.5px solid #d4af37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(14, 56, 29, 0.35)',
                padding: '3px',
                flexShrink: 0
              }}
            >
              <img src={defenseCrest} alt="MAMS Crest" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 850, color: '#0b1a11', margin: 0, letterSpacing: '0.02em' }}>
                Military Asset Management System (MAMS)
              </h2>
              <small style={{ color: '#3b5c46', fontSize: '12px', fontWeight: 600 }}>
                Public Technical Architecture & OpenAPI 3.0 Specification
              </small>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#0e381d',
                background: '#eaf3e8',
                border: '1.5px solid #c7d8c5',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowLeft size={15} /> Back to Login Portal
            </Link>
            {currentUser && (
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                }}
              >
                Go to Dashboard →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>📖 {isPublicDocRoute ? 'Public API Specification & Architecture' : 'System Architecture & API Documentation Hub'}</h2>
          <small>
            {isPublicDocRoute
              ? 'Public OpenAPI 3.0 catalog. Authentication and Health Check endpoints are testable below; other defense modules require authenticated military credentials.'
              : 'Interactive OpenAPI 3.0 catalog with in-app endpoint execution, schema specs, and RBAC clearances.'}
          </small>
        </div>
        <div className="view-panel-actions">
          {currentUser && !isPublicDocRoute ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pill pblue" style={{ fontSize: '11px' }}>
                Clearance: {currentUser.role}
              </span>
            </div>
          ) : (
            <span className="pill pyellow" style={{ fontSize: '11px' }}>
              🔒 Public Read-Only Mode (Log in for full defense execution)
            </span>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        className="card"
        style={{
          padding: '12px 18px',
          marginBottom: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--blue)', fontSize: '13px', fontWeight: 600 }}>
          <BookOpen size={16} /> API Directory ({totalEndpointsCount} Endpoints across 9 Defense Modules)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search endpoint (e.g. /purchase, GET, bases)..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="modal-input"
            style={{ width: '280px', padding: '6px 12px', fontSize: '12px' }}
          />
          {searchFilter && (
            <button className="btn-secondary" onClick={() => setSearchFilter('')} style={{ padding: '4px 8px', fontSize: '11px' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Structured API Endpoints Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {filteredModules.map((mod, mIdx) => {
          const showAction = shouldShowActionColumn(mod);

          return (
            <div key={mIdx} className="view-table-card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{mod.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>
                      {mod.category}
                    </h3>
                    <small style={{ color: 'var(--muted)', fontSize: '11.5px' }}>{mod.description}</small>
                  </div>
                </div>
                <span className="pill pblue" style={{ fontSize: '11px' }}>
                  {mod.endpoints.length} APIs
                </span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>Method</th>
                    <th style={{ width: '260px' }}>Endpoint Route</th>
                    <th>Description / Functionality</th>
                    <th style={{ width: '150px' }}>Required Role</th>
                    {showAction && (
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {mod.endpoints.map((ep, eIdx) => {
                    const hasPermission = canUserTryEndpoint(ep);

                    return (
                      <tr key={eIdx}>
                        <td>
                          <b
                            className="pill"
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              background:
                                ep.method === 'GET'
                                  ? 'rgba(5, 150, 105, 0.12)'
                                  : ep.method === 'POST'
                                  ? 'rgba(2, 132, 199, 0.12)'
                                  : ep.method === 'PUT'
                                  ? 'rgba(217, 119, 6, 0.12)'
                                  : 'rgba(220, 38, 38, 0.12)',
                              color:
                                ep.method === 'GET'
                                  ? 'var(--green)'
                                  : ep.method === 'POST'
                                  ? 'var(--blue)'
                                  : ep.method === 'PUT'
                                  ? 'var(--yellow)'
                                  : 'var(--red)',
                              border: `1px solid ${
                                ep.method === 'GET'
                                  ? 'rgba(5, 150, 105, 0.3)'
                                  : ep.method === 'POST'
                                  ? 'rgba(2, 132, 199, 0.3)'
                                  : ep.method === 'PUT'
                                  ? 'rgba(217, 119, 6, 0.3)'
                                  : 'rgba(220, 38, 38, 0.3)'
                              }`
                            }}
                          >
                            {ep.method}
                          </b>
                        </td>
                        <td>
                          <code style={{ color: 'var(--blue)', fontSize: '12.5px', fontWeight: 600, fontFamily: 'monospace' }}>
                            {ep.path}
                          </code>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                            {ep.desc}
                          </span>
                        </td>
                        <td>
                          <span className="pill pgray" style={{ fontSize: '10px' }}>
                            {ep.roles.join(', ')}
                          </span>
                        </td>
                        {showAction && (
                          <td style={{ textAlign: 'center' }}>
                            {hasPermission ? (
                              <button
                                onClick={() => handleOpenTestModal(ep, mod.category)}
                                className="action-trigger-btn"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  borderRadius: '5px'
                                }}
                                title="Execute live request in-app"
                              >
                                <Play size={11} /> Try
                              </button>
                            ) : (
                              <span style={{ color: 'var(--muted)', fontSize: '10.5px' }}>
                                -
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* ==================== IN-APP LIVE API TEST RUNNER MODAL ==================== */}
      {activeTestEndpoint && (
        <div className="modal-backdrop" onClick={() => setActiveTestEndpoint(null)}>
          <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <b
                  className="pill"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    background:
                      activeTestEndpoint.method === 'GET'
                        ? 'rgba(5, 150, 105, 0.15)'
                        : activeTestEndpoint.method === 'POST'
                        ? 'rgba(2, 132, 199, 0.15)'
                        : activeTestEndpoint.method === 'PUT'
                        ? 'rgba(217, 119, 6, 0.15)'
                        : 'rgba(220, 38, 38, 0.15)',
                    color:
                      activeTestEndpoint.method === 'GET'
                        ? 'var(--green)'
                        : activeTestEndpoint.method === 'POST'
                        ? 'var(--blue)'
                        : activeTestEndpoint.method === 'PUT'
                        ? 'var(--yellow)'
                        : 'var(--red)'
                  }}
                >
                  {activeTestEndpoint.method}
                </b>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'monospace' }}>
                    {activeTestEndpoint.path}
                  </h3>
                  <small style={{ color: 'var(--muted)', fontSize: '11px' }}>{activeTestEndpoint.desc}</small>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveTestEndpoint(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Parameters Input if endpoint has path params */}
              {(activeTestEndpoint.path.includes('{id}') || activeTestEndpoint.path.includes('{baseId}')) && (
                <div className="modal-form-group">
                  <label className="modal-label">Path Parameter / ID *</label>
                  <input
                    type="text"
                    value={testParamInput}
                    onChange={(e) => setTestParamInput(e.target.value)}
                    placeholder="e.g. 1"
                    className="modal-input"
                  />
                </div>
              )}

              {/* JSON Request Body if POST/PUT */}
              {(activeTestEndpoint.method === 'POST' || activeTestEndpoint.method === 'PUT') && (
                <div className="modal-form-group">
                  <label className="modal-label">JSON Request Body</label>
                  <textarea
                    rows={6}
                    value={testPayloadInput}
                    onChange={(e) => setTestPayloadInput(e.target.value)}
                    className="modal-input"
                    style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                  />
                </div>
              )}

              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setActiveTestEndpoint(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteLiveTest}
                  disabled={testLoading}
                  className="action-trigger-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '6px' }}
                >
                  <Send size={13} /> {testLoading ? 'Executing Request...' : 'Send API Request'}
                </button>
              </div>

              {/* Response Viewer */}
              {testResponse && (
                <div style={{ marginTop: '10px', borderRadius: '8px', border: '1px solid #1b3d4b', background: '#06131c', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#0a1d27', borderBottom: '1px solid #1b3d4b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        className="pill"
                        style={{
                          fontSize: '11px',
                          background: testResponse.success ? 'rgba(22, 214, 157, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: testResponse.success ? '#16d69d' : '#f87171'
                        }}
                      >
                        Status: {testResponse.status} {testResponse.statusText}
                      </span>
                    </div>
                    {testDuration && (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {testDuration} ms
                      </span>
                    )}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '14px',
                      maxHeight: '220px',
                      overflow: 'auto',
                      fontSize: '11.5px',
                      color: testResponse.success ? '#34d399' : '#fca5a5',
                      fontFamily: 'monospace',
                      lineHeight: 1.4
                    }}
                  >
                    {JSON.stringify(testResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Technical Architecture & Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '20px' }}>
        <div className="view-table-card" style={{ padding: '18px 20px' }}>
          <h4 style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={16} /> Backend Architecture
          </h4>
          <ul style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, paddingLeft: '18px', margin: 0 }}>
            <li><strong>Framework:</strong> Spring Boot 3.3.5 / Java 17</li>
            <li><strong>Security:</strong> Spring Security 6 + Stateless JWT</li>
            <li><strong>Data Access:</strong> Spring Data JPA / Hibernate 6</li>
            <li><strong>Documentation:</strong> OpenAPI 3.0 / Swagger UI</li>
          </ul>
        </div>

        <div className="view-table-card" style={{ padding: '18px 20px' }}>
          <h4 style={{ color: 'var(--blue)', fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} /> Relational Data Layer
          </h4>
          <ul style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: 1.6, paddingLeft: '18px', margin: 0 }}>
            <li><strong>Database:</strong> PostgreSQL / Relational SQL</li>
            <li><strong>Transaction Guarantees:</strong> ACID Compliance</li>
            <li><strong>Audit Logging:</strong> Immutable Movement Ledger</li>
            <li><strong>Reconciliation:</strong> Automated Balance Tracking</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
