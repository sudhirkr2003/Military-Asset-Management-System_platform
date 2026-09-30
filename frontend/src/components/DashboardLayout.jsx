import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import defenseCrest from '../assets/defense_crest.svg';
import commanderAvatar from '../assets/commander_avatar.jpg';
import {
  LogOut,
  X,
  Menu,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Crosshair,
  Package,
  ClipboardList,
  Building2,
  Users,
  BarChart3,
  BookOpen,
  ChevronRight,
  Shield,
  Activity,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const userRole = (user?.role || '').replace(/^ROLE_/, '');

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarProfileOpen, setSidebarProfileOpen] = useState(false);
  const profileMenuRef = React.useRef(null);
  const sidebarProfileRef = React.useRef(null);

  // Auto-close mobile drawer and dropdowns on route navigation
  useEffect(() => {
    setMobileNavOpen(false);
    setProfileMenuOpen(false);
    setSidebarProfileOpen(false);
  }, [location.pathname]);

  // Click-outside listener for top-right profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (sidebarProfileRef.current && !sidebarProfileRef.current.contains(event.target)) {
        setSidebarProfileOpen(false);
      }
    };
    if (profileMenuOpen || sidebarProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen, sidebarProfileOpen]);

  const getInitials = (name) => {
    if (!name) return 'HQ';
    const parts = name.replace(/^(Col\.|Capt\.|Maj\.|Gen\.|Lt\.|Adm\.)\s+/i, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Lookup Options from Backend
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Route prefetching for instant page transitions
  const prefetchedRoutes = React.useRef(new Set());

  const handlePrefetchRoute = React.useCallback((path) => {
    if (prefetchedRoutes.current.has(path)) return;
    prefetchedRoutes.current.add(path);

    switch (path) {
      case '/purchases':
        api.get('/movements').catch(() => {});
        api.get('/bases').catch(() => {});
        api.get('/equipment').catch(() => {});
        break;
      case '/transfers':
        api.get('/movements').catch(() => {});
        api.get('/bases').catch(() => {});
        api.get('/equipment').catch(() => {});
        break;
      case '/assignments':
        api.get('/movements').catch(() => {});
        api.get('/bases').catch(() => {});
        api.get('/equipment').catch(() => {});
        break;
      case '/assets':
        api.get('/equipment').catch(() => {});
        break;
      case '/inventory':
        api.get('/inventory').catch(() => {});
        break;
      case '/movements':
        api.get('/movements').catch(() => {});
        break;
      case '/bases':
        api.get('/bases').catch(() => {});
        break;
      case '/personnel':
        api.get('/personnel').catch(() => {});
        api.get('/bases').catch(() => {});
        break;
      case '/reports':
        api.get('/dashboard/summary').catch(() => {});
        api.get('/bases').catch(() => {});
        break;
      default:
        break;
    }
  }, []);

  // Movement Action Modal State
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTab, setActionTab] = useState('purchase');
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Movement Form Fields
  const [formData, setFormData] = useState({
    baseId: '',
    fromBaseId: '',
    toBaseId: '',
    equipmentTypeId: '',
    quantity: 1,
    supplier: '',
    invoiceNumber: '',
    reason: '',
    personnelName: '',
    serviceNumber: '',
    purpose: '',
    operationOrExercise: '',
    remarks: '',
  });

  // Fetch Lookups (Bases & Equipment Types)
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [basesRes, equipRes] = await Promise.all([
          api.get('/bases').catch(() => ({ data: { data: [] } })),
          api.get('/equipment').catch(() => ({ data: { data: [] } })),
        ]);
        if (basesRes.data?.data) setBases(basesRes.data.data);
        if (equipRes.data?.data) setEquipmentTypes(equipRes.data.data);
      } catch (err) {
        console.error('Error fetching lookups', err);
      }
    };
    fetchLookups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Movement Transaction
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setNotification({ type: '', message: '' });

    try {
      let endpoint = '';
      let payload = {};

      if (actionTab === 'purchase') {
        endpoint = '/movements/purchase';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          supplier: formData.supplier,
          invoiceNumber: formData.invoiceNumber,
          remarks: formData.remarks,
        };
      } else if (actionTab === 'transfer') {
        endpoint = '/movements/transfer';
        payload = {
          fromBaseId: Number(formData.fromBaseId),
          toBaseId: Number(formData.toBaseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          reason: formData.reason,
          remarks: formData.remarks,
        };
      } else if (actionTab === 'assign') {
        endpoint = '/movements/assign';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          personnelName: formData.personnelName,
          serviceNumber: formData.serviceNumber,
          purpose: formData.purpose,
          remarks: formData.remarks,
        };
      } else if (actionTab === 'return') {
        endpoint = '/movements/return';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          serviceNumber: formData.serviceNumber,
          remarks: formData.remarks,
        };
      } else if (actionTab === 'expend') {
        endpoint = '/movements/expend';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          operationOrExercise: formData.operationOrExercise,
          remarks: formData.remarks,
        };
      }

      const res = await api.post(endpoint, payload);
      setNotification({
        type: 'success',
        message: res.data?.message || 'Transaction recorded successfully!',
      });

      // Reset form
      setFormData({
        baseId: '',
        fromBaseId: '',
        toBaseId: '',
        equipmentTypeId: '',
        quantity: 1,
        supplier: '',
        invoiceNumber: '',
        reason: '',
        personnelName: '',
        serviceNumber: '',
        purpose: '',
        operationOrExercise: '',
        remarks: '',
      });

      // Notify window to refresh data
      window.dispatchEvent(new Event('mams:movement_updated'));

      setTimeout(() => {
        setShowActionModal(false);
        setNotification({ type: '', message: '' });
      }, 1400);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to record transaction. Please verify available stock levels.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Mobile Nav Backdrop */}
      {mobileNavOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* 1. SIDEBAR (SUPPORTS LIGHT THEME, DESKTOP COLLAPSE & MOBILE SLIDE-OUT DRAWER) */}
      <aside className={`sidebar ${desktopSidebarOpen ? '' : 'desktop-collapsed'} ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="logo-shield">
            <img src={defenseCrest} alt="MAMS Defense Crest" className="logo-shield-img" />
          </div>
          <div>
            <strong>MAMS DEFENSE</strong>
            <small>Asset Logistics Platform</small>
          </div>
          <button
            className="mobile-sidebar-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">COMMAND & OPERATIONS</div>

          <NavLink
            to="/dashboard"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/dashboard')}
            onFocus={() => handlePrefetchRoute('/dashboard')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} className="nav-icon" />
            <span className="nav-text">Dashboard</span>
          </NavLink>

          {(userRole === 'ADMIN' || userRole === 'LOGISTICS_OFFICER' || userRole === 'BASE_COMMANDER') && (
            <NavLink
              to="/purchases"
              onClick={() => setMobileNavOpen(false)}
              onMouseEnter={() => handlePrefetchRoute('/purchases')}
              onFocus={() => handlePrefetchRoute('/purchases')}
              className={({ isActive }) =>
                `nav-link ${isActive || location.pathname.startsWith('/movements/purchase') ? 'active' : ''}`
              }
            >
              <ShoppingCart size={16} className="nav-icon" />
              <span className="nav-text">Procurements</span>
              <ChevronRight size={13} className="nav-chevron" />
            </NavLink>
          )}

          {(userRole === 'ADMIN' || userRole === 'LOGISTICS_OFFICER' || userRole === 'BASE_COMMANDER') && (
            <NavLink
              to="/transfers"
              onClick={() => setMobileNavOpen(false)}
              onMouseEnter={() => handlePrefetchRoute('/transfers')}
              onFocus={() => handlePrefetchRoute('/transfers')}
              className={({ isActive }) =>
                `nav-link ${isActive || location.pathname.startsWith('/movements/transfer') ? 'active' : ''}`
              }
            >
              <ArrowLeftRight size={16} className="nav-icon" />
              <span className="nav-text">Base Transfers</span>
              <ChevronRight size={13} className="nav-chevron" />
            </NavLink>
          )}

          {(userRole === 'ADMIN' || userRole === 'BASE_COMMANDER') && (
            <NavLink
              to="/assignments"
              onClick={() => setMobileNavOpen(false)}
              onMouseEnter={() => handlePrefetchRoute('/assignments')}
              onFocus={() => handlePrefetchRoute('/assignments')}
              className={({ isActive }) =>
                `nav-link ${
                  isActive ||
                  location.pathname.startsWith('/movements/assign') ||
                  location.pathname.startsWith('/movements/expend') ||
                  location.pathname.startsWith('/movements/return')
                    ? 'active'
                    : ''
                }`
              }
            >
              <UserCheck size={16} className="nav-icon" />
              <span className="nav-text">Assignments</span>
              <ChevronRight size={13} className="nav-chevron" />
            </NavLink>
          )}

          <div className="nav-section-label" style={{ marginTop: '12px' }}>DEFENSE REGISTRY</div>

          <NavLink
            to="/assets"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/assets')}
            onFocus={() => handlePrefetchRoute('/assets')}
            className={({ isActive }) =>
              `nav-link ${isActive || location.pathname.startsWith('/equipment') ? 'active' : ''}`
            }
          >
            <Crosshair size={16} className="nav-icon" />
            <span className="nav-text">Asset Catalog</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>

          <NavLink
            to="/inventory"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/inventory')}
            onFocus={() => handlePrefetchRoute('/inventory')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Package size={16} className="nav-icon" />
            <span className="nav-text">Armory Stock</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>

          <NavLink
            to="/movements"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/movements')}
            onFocus={() => handlePrefetchRoute('/movements')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <ClipboardList size={16} className="nav-icon" />
            <span className="nav-text">Audit Ledger</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>

          <NavLink
            to="/bases"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/bases')}
            onFocus={() => handlePrefetchRoute('/bases')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Building2 size={16} className="nav-icon" />
            <span className="nav-text">Installations</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>

          {userRole === 'ADMIN' && (
            <NavLink
              to="/personnel"
              onClick={() => setMobileNavOpen(false)}
              onMouseEnter={() => handlePrefetchRoute('/personnel')}
              onFocus={() => handlePrefetchRoute('/personnel')}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Users size={16} className="nav-icon" />
              <span className="nav-text">Personnel</span>
              <ChevronRight size={13} className="nav-chevron" />
            </NavLink>
          )}

          <div className="nav-section-label" style={{ marginTop: '12px' }}>INTELLIGENCE & DOCS</div>

          <NavLink
            to="/reports"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/reports')}
            onFocus={() => handlePrefetchRoute('/reports')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={16} className="nav-icon" />
            <span className="nav-text">Reports & Exports</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>

          <NavLink
            to="/docs"
            onClick={() => setMobileNavOpen(false)}
            onMouseEnter={() => handlePrefetchRoute('/docs')}
            onFocus={() => handlePrefetchRoute('/docs')}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={16} className="nav-icon" />
            <span className="nav-text">API Specs Hub</span>
            <ChevronRight size={13} className="nav-chevron" />
          </NavLink>
        </nav>

        {/* Sidebar Bottom Standalone Profile Button */}
        <div className="sidebar-profile-container" ref={sidebarProfileRef}>
          <button
            className={`sidebar-profile-card-btn ${sidebarProfileOpen ? 'active' : ''}`}
            onClick={() => setSidebarProfileOpen((prev) => !prev)}
            title="User Profile & Station Controls"
            type="button"
          >
            <div className="avatar sidebar-avatar">
              <img src={commanderAvatar} alt="Commander Avatar" className="avatar-photo" />
            </div>
            <div className="sidebar-profile-details">
              <strong className="sidebar-profile-name">{user?.fullName || 'Chief Commander Admin'}</strong>
              <small className="sidebar-profile-role">{user?.role === 'ADMIN' ? 'HQ Supreme Admin' : user?.role?.replace('_', ' ') || 'HQ Supreme Admin'}</small>
            </div>
            <ChevronDown size={14} className={`profile-chevron ${sidebarProfileOpen ? 'open' : ''}`} />
          </button>

          {/* Floating Sidebar Profile Popover - ONLY LOGOUT */}
          {sidebarProfileOpen && (
            <div className="sidebar-profile-popover" style={{ padding: '6px' }}>
              <button
                className="dropdown-item dropdown-logout-btn"
                onClick={() => {
                  setSidebarProfileOpen(false);
                  logout();
                }}
                type="button"
                style={{ width: '100%', padding: '10px 12px' }}
              >
                <div className="dropdown-item-left">
                  <LogOut size={15} />
                  <span>Sign Out / Logout</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {/* Desktop / Tablet Sidebar Toggle Button */}
            <button
              className="desktop-sidebar-toggle-btn"
              onClick={() => setDesktopSidebarOpen((prev) => !prev)}
              aria-label={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              title={desktopSidebarOpen ? 'Hide Sidebar (Collapse)' : 'Show Sidebar (Expand)'}
            >
              {desktopSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>

            {/* Hamburger menu button for mobile navigation */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle Navigation Drawer"
              title="Open Navigation Menu"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="topbar-status-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span className="status-live-dot" style={{ flexShrink: 0 }}></span>
              <small className="topbar-status-text" style={{ color: 'var(--muted)', fontSize: '11px', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                DEFENSE LOGISTICS NETWORK • LIVE OPERATIONAL
              </small>
            </div>
          </div>

          <div className="profile-container" ref={profileMenuRef}>
            <button
              onClick={() => {
                const defaultTab = user?.role === 'BASE_COMMANDER' ? 'assign' : 'purchase';
                setShowActionModal(true);
                setActionTab(defaultTab);
                if (user?.baseId) {
                  setFormData((prev) => ({ ...prev, baseId: user.baseId, fromBaseId: user.baseId }));
                }
              }}
              className="action-trigger-btn"
              title="Record Procurement, Transfer, or Issue"
            >
              <Plus size={13} /> <span className="btn-text">Record Movement</span>
            </button>

            {/* Topbar Profile Trigger Button - Circular Commander Avatar */}
            <button
              className={`topbar-avatar-btn circular-profile-btn ${profileMenuOpen ? 'active' : ''}`}
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-label="User Profile and Defense Controls"
              title={`View Profile (${user?.fullName || 'Chief Commander Admin'})`}
              type="button"
            >
              <div className="avatar circular-avatar">
                <img src={commanderAvatar} alt="Commander Avatar" className="avatar-photo circular" />
              </div>
            </button>

            {/* Floating Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="profile-dropdown-menu" style={{ width: '240px' }}>
                <div className="dropdown-user-header">
                  <div className="dropdown-avatar-large">
                    <img src={commanderAvatar} alt="Commander Avatar" className="avatar-photo circular" />
                  </div>
                  <div className="dropdown-user-details">
                    <h4 className="dropdown-user-name">{user?.fullName || 'Chief Commander Admin'}</h4>
                    <span className="dropdown-role-badge">
                      {user?.role === 'ADMIN' ? 'HQ Supreme Admin' : user?.role?.replace('_', ' ') || 'HQ Supreme Admin'}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <div className="dropdown-section">
                  <button
                    className="dropdown-item dropdown-logout-btn"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    type="button"
                  >
                    <div className="dropdown-item-left">
                      <LogOut size={15} />
                      <span>Sign Out / Logout</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Rendered Here via Nested Route */}
        <Outlet />
      </main>

      {/* 3. TRANSACTION / ACTION MODAL (AVAILABLE ACROSS ALL ROUTES) */}
      {showActionModal && (
        <div className="modal-backdrop" onClick={() => setShowActionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Asset Movement</h3>
              <button className="modal-close-btn" onClick={() => setShowActionModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="modal-tabs">
              {(user?.role === 'ADMIN' || user?.role === 'LOGISTICS_OFFICER') && (
                <button
                  className={`tab-btn ${actionTab === 'purchase' ? 'active' : ''}`}
                  onClick={() => setActionTab('purchase')}
                >
                  🛒 Purchase
                </button>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'LOGISTICS_OFFICER') && (
                <button
                  className={`tab-btn ${actionTab === 'transfer' ? 'active' : ''}`}
                  onClick={() => setActionTab('transfer')}
                >
                  🔄 Transfer
                </button>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'BASE_COMMANDER') && (
                <button
                  className={`tab-btn ${actionTab === 'assign' ? 'active' : ''}`}
                  onClick={() => setActionTab('assign')}
                >
                  👤 Issue / Assign
                </button>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'BASE_COMMANDER') && (
                <button
                  className={`tab-btn ${actionTab === 'return' ? 'active' : ''}`}
                  onClick={() => setActionTab('return')}
                >
                  ↩️ Return
                </button>
              )}
              {(user?.role === 'ADMIN' || user?.role === 'BASE_COMMANDER') && (
                <button
                  className={`tab-btn ${actionTab === 'expend' ? 'active' : ''}`}
                  onClick={() => setActionTab('expend')}
                >
                  🔥 Expend
                </button>
              )}
            </div>

            {/* Notification Banner */}
            {notification.message && (
              <div className={`modal-alert ${notification.type}`}>
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 inline flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2 inline flex-shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleActionSubmit} className="modal-form">
              {actionTab !== 'transfer' ? (
                <div className="form-group">
                  <label>Base / Installation *</label>
                  <select
                    name="baseId"
                    value={formData.baseId}
                    onChange={handleInputChange}
                    required
                    className="modal-select"
                  >
                    <option value="">Select Military Base</option>
                    {bases.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-row">
                  <div className="form-group">
                    <label>From (Source Base) *</label>
                    <select
                      name="fromBaseId"
                      value={formData.fromBaseId}
                      onChange={handleInputChange}
                      required
                      className="modal-select"
                    >
                      <option value="">Select Source Base</option>
                      {bases.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>To (Destination Base) *</label>
                    <select
                      name="toBaseId"
                      value={formData.toBaseId}
                      onChange={handleInputChange}
                      required
                      className="modal-select"
                    >
                      <option value="">Select Destination Base</option>
                      {bases.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Equipment / Asset *</label>
                  <select
                    name="equipmentTypeId"
                    value={formData.equipmentTypeId}
                    onChange={handleInputChange}
                    required
                    className="modal-select"
                  >
                    <option value="">Select Equipment</option>
                    {equipmentTypes.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    className="modal-input"
                  />
                </div>
              </div>

              {actionTab === 'purchase' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Supplier / Vendor</label>
                    <input
                      type="text"
                      name="supplier"
                      placeholder="e.g. Ordnance Factory Board"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="modal-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Invoice / Batch #</label>
                    <input
                      type="text"
                      name="invoiceNumber"
                      placeholder="e.g. INV-2026-089"
                      value={formData.invoiceNumber}
                      onChange={handleInputChange}
                      className="modal-input"
                    />
                  </div>
                </div>
              )}

              {actionTab === 'assign' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Personnel Name</label>
                    <input
                      type="text"
                      name="personnelName"
                      placeholder="e.g. Havildar Ramesh Singh"
                      value={formData.personnelName}
                      onChange={handleInputChange}
                      className="modal-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Service Number / Rank</label>
                    <input
                      type="text"
                      name="serviceNumber"
                      placeholder="e.g. JC-894120"
                      value={formData.serviceNumber}
                      onChange={handleInputChange}
                      className="modal-input"
                    />
                  </div>
                </div>
              )}

              {actionTab === 'return' && (
                <div className="form-group">
                  <label>Service Number of Personnel Returning</label>
                  <input
                    type="text"
                    name="serviceNumber"
                    placeholder="e.g. JC-894120"
                    value={formData.serviceNumber}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
              )}

              {actionTab === 'expend' && (
                <div className="form-group">
                  <label>Operation / Training Exercise</label>
                  <input
                    type="text"
                    name="operationOrExercise"
                    placeholder="e.g. Annual Firing Test / Sector Patrol"
                    value={formData.operationOrExercise}
                    onChange={handleInputChange}
                    className="modal-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Remarks / Notes</label>
                <input
                  type="text"
                  name="remarks"
                  placeholder="Additional logistical notes..."
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="modal-input"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowActionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-submit"
                >
                  {formLoading ? 'Submitting...' : 'Confirm Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
