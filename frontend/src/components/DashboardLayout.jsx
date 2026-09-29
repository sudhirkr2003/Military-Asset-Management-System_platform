import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Lookup Options from Backend
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

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
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">◇</div>
          <div>
            <strong>MAMS</strong>
            <small>Military Asset<br />Management System</small>
          </div>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>⌂</span>Dashboard
          </NavLink>
          <NavLink to="/purchases" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>🛒</span>Purchases <b>›</b>
          </NavLink>
          <NavLink to="/transfers" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>🔄</span>Transfers <b>›</b>
          </NavLink>
          <NavLink to="/assignments" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>👤</span>Assignments & Expended <b>›</b>
          </NavLink>
          <NavLink to="/assets" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>◇</span>Assets <b>›</b>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>▱</span>Inventory <b>›</b>
          </NavLink>
          <NavLink to="/personnel" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>♙</span>Personnel <b>›</b>
          </NavLink>
          <NavLink to="/bases" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>⌖</span>Bases <b>›</b>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>▥</span>Reports <b>›</b>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>⚙</span>Settings <b>›</b>
          </NavLink>
        </nav>
        <div className="quote">
          <i></i>Strength<br />Through<br />Accountability
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="search">
            ⌕{' '}
            <input
              type="text"
              placeholder="Search assets, movements, bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
            <kbd>Ctrl + K</kbd>
          </div>
          <div className="profile">
            <button
              onClick={() => { setShowActionModal(true); setActionTab('purchase'); }}
              className="action-trigger-btn"
              title="Record Procurement, Transfer, or Issue"
            >
              + Record Movement
            </button>
            <div className="bell">
              ♧<i>3</i>
            </div>
            <div className="avatar">CC</div>
            <div>
              <strong>{user?.fullName || 'Chief Commander'}</strong>
              <small>{user?.role === 'ADMIN' ? 'HQ Supreme Admin' : user?.role || 'HQ Supreme Admin'}</small>
            </div>
            <button onClick={logout} title="Logout" className="logout-action-btn">
              <LogOut className="w-3.5 h-3.5 inline" />
            </button>
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
              <button
                className={`tab-btn ${actionTab === 'purchase' ? 'active' : ''}`}
                onClick={() => setActionTab('purchase')}
              >
                🛒 Purchase
              </button>
              <button
                className={`tab-btn ${actionTab === 'transfer' ? 'active' : ''}`}
                onClick={() => setActionTab('transfer')}
              >
                🔄 Transfer
              </button>
              <button
                className={`tab-btn ${actionTab === 'assign' ? 'active' : ''}`}
                onClick={() => setActionTab('assign')}
              >
                👤 Issue / Assign
              </button>
              <button
                className={`tab-btn ${actionTab === 'return' ? 'active' : ''}`}
                onClick={() => setActionTab('return')}
              >
                ↩️ Return
              </button>
              <button
                className={`tab-btn ${actionTab === 'expend' ? 'active' : ''}`}
                onClick={() => setActionTab('expend')}
              >
                🔥 Expend
              </button>
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
