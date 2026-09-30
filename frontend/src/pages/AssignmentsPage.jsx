import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { apiCache } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UserCheck,
  Flame,
  RotateCcw,
  Plus,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Shield,
  User,
  Activity
} from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const AssignmentsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [movements, setMovements] = useState(() => {
    const cached = apiCache.get('get:movements')?.data?.data;
    return cached
      ? cached.filter((m) => ['ASSIGNMENT', 'RETURN', 'EXPENDITURE'].includes(m.movementType))
      : [];
  });
  const [bases, setBases] = useState(() => {
    return apiCache.get('get:bases')?.data?.data || [];
  });
  const [equipmentTypes, setEquipmentTypes] = useState(() => {
    return apiCache.get('get:equipment')?.data?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    return !apiCache.has('get:movements');
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionTab, setActionTab] = useState('ASSIGN'); // 'ASSIGN', 'EXPEND', 'RETURN'
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Filter & tab
  const [activeFilterTab, setActiveFilterTab] = useState(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.endsWith('/return') || path === '/movements/return') return 'RETURNS';
    if (path.endsWith('/expend') || path === '/movements/expend') return 'EXPENDITURES';
    if (path.endsWith('/assign') || path === '/movements/assign') return 'ASSIGNMENTS';
    return 'ALL';
  });
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: 1,
    personnelName: '',
    serviceNumber: '',
    purpose: '',
    operationOrExercise: '',
    remarks: ''
  });

  const fetchLookups = useCallback(async (isManual = false) => {
    try {
      const config = isManual ? { forceRefresh: true } : {};
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases', config).catch(() => ({ data: { data: [] } })),
        api.get('/equipment', config).catch(() => ({ data: { data: [] } }))
      ]);
      if (basesRes.data?.data) setBases(basesRes.data.data);
      if (equipRes.data?.data) setEquipmentTypes(equipRes.data.data);
    } catch (err) {
      console.error('Error fetching lookups', err);
    }
  }, []);

  const fetchMovements = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && movements.length === 0) {
      setLoading(true);
    }
    try {
      const config = isManualRefresh ? { forceRefresh: true } : {};
      const res = await api.get('/movements', config);
      if (res.data?.data) {
        const relevant = res.data.data.filter((m) =>
          ['ASSIGNMENT', 'RETURN', 'EXPENDITURE'].includes(m.movementType)
        );
        setMovements(relevant);
      }
    } catch (err) {
      console.error('Error fetching assignment & expenditure movements', err);
    } finally {
      setLoading(false);
    }
  }, [movements.length]);

  const handleRefreshAll = useCallback(() => {
    fetchLookups(true);
    fetchMovements(true);
  }, [fetchLookups, fetchMovements]);

  useEffect(() => {
    fetchLookups();
    fetchMovements();

    const handleUpdate = () => {
      fetchLookups(true);
      fetchMovements(true);
    };
    window.addEventListener('mams:movement_updated', handleUpdate);
    window.addEventListener('mams:data_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:movement_updated', handleUpdate);
      window.removeEventListener('mams:data_updated', handleUpdate);
    };
  }, [fetchLookups, fetchMovements]);

  // Sync state with location.pathname
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.endsWith('/return') || path === '/movements/return') {
      setActiveFilterTab('RETURNS');
      setActionTab('RETURN');
    } else if (path.endsWith('/expend') || path === '/movements/expend') {
      setActiveFilterTab('EXPENDITURES');
      setActionTab('EXPEND');
    } else if (path.endsWith('/assign') || path === '/movements/assign') {
      setActiveFilterTab('ASSIGNMENTS');
      setActionTab('ASSIGN');
    } else {
      setActiveFilterTab('ALL');
      setActionTab('ASSIGN');
    }
  }, [location.pathname]);

  const handleFilterTabSelect = useCallback(
    (tab, routePath, actionDefault) => {
      setActiveFilterTab(tab);
      if (actionDefault) setActionTab(actionDefault);
      if (routePath && location.pathname !== routePath) {
        navigate(routePath);
      }
    },
    [location.pathname, navigate]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    const selectedBaseObj = bases.find((b) => Number(b.id) === Number(formData.baseId));
    const selectedEqObj = equipmentTypes.find((eq) => Number(eq.id) === Number(formData.equipmentTypeId));

    let movementType = 'ASSIGNMENT';
    let endpoint = '/movements/assign';
    let detailsText = formData.personnelName ? `Issued to ${formData.personnelName} (${formData.serviceNumber || 'N/A'})` : 'Field deployment';

    if (actionTab === 'EXPEND') {
      movementType = 'EXPENDITURE';
      endpoint = '/movements/expend';
      detailsText = formData.operationOrExercise ? `Expended in ${formData.operationOrExercise}` : 'Combat / Exercise consumption';
    } else if (actionTab === 'RETURN') {
      movementType = 'RETURN';
      endpoint = '/movements/return';
      detailsText = `Returned to base armory by ${formData.serviceNumber || 'Personnel'}`;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMovement = {
      id: tempId,
      timestamp: new Date().toISOString(),
      baseId: Number(formData.baseId),
      baseName: selectedBaseObj?.name || 'Base ' + formData.baseId,
      equipmentTypeId: Number(formData.equipmentTypeId),
      equipmentName: selectedEqObj?.name || 'Equipment ' + formData.equipmentTypeId,
      equipmentCategory: selectedEqObj?.category || 'EQUIPMENT',
      quantity: Number(formData.quantity),
      movementType,
      remarks: formData.remarks || detailsText,
      personnelName: formData.personnelName,
      serviceNumber: formData.serviceNumber,
      isOptimistic: true
    };

    // 1. Optimistically add to movements list immediately
    setMovements((prev) => [optimisticMovement, ...prev]);

    // 2. Clear form and notify user instantly
    setNotification({
      type: 'success',
      message: `${movementType} transaction dispatched! Armory updating...`
    });

    const payload = {
      baseId: Number(formData.baseId),
      equipmentTypeId: Number(formData.equipmentTypeId),
      quantity: Number(formData.quantity),
      personnelName: formData.personnelName,
      serviceNumber: formData.serviceNumber,
      purpose: formData.purpose,
      operationOrExercise: formData.operationOrExercise,
      remarks: formData.remarks
    };

    setFormData({
      baseId: '',
      equipmentTypeId: '',
      quantity: 1,
      personnelName: '',
      serviceNumber: '',
      purpose: '',
      operationOrExercise: '',
      remarks: ''
    });

    setTimeout(() => {
      setShowAddForm(false);
      setNotification({ type: '', message: '' });
    }, 1200);

    // 3. Fire API request in background
    try {
      const res = await api.post(endpoint, payload);
      window.dispatchEvent(new Event('mams:movement_updated'));
      if (res.data?.data) {
        setMovements((prev) =>
          prev.map((item) => (item.id === tempId ? { ...res.data.data, baseName: selectedBaseObj?.name, equipmentName: selectedEqObj?.name } : item))
        );
      } else {
        fetchMovements();
      }
    } catch (err) {
      // Rollback on failure
      setMovements((prev) => prev.filter((item) => item.id !== tempId));
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Transaction failed. Rollback executed.';
      setNotification({ type: 'error', message: errorMsg });
      setShowAddForm(true);
    }
  };

  // Filter movements
  const filteredList = useMemo(() => {
    return movements.filter((item) => {
      if (activeFilterTab === 'ASSIGNMENTS' && item.movementType !== 'ASSIGNMENT') return false;
      if (activeFilterTab === 'EXPENDITURES' && item.movementType !== 'EXPENDITURE') return false;
      if (activeFilterTab === 'RETURNS' && item.movementType !== 'RETURN') return false;

      if (selectedBase !== 'ALL' && String(item.baseId) !== String(selectedBase)) return false;
      if (selectedEquipment !== 'ALL' && String(item.equipmentTypeId) !== String(selectedEquipment)) return false;

      if (startDate) {
        const itemDate = new Date(item.timestamp);
        if (itemDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const itemDate = new Date(item.timestamp);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        if (itemDate > endDateTime) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = item.equipmentName?.toLowerCase().includes(q);
        const matchBase = item.baseName?.toLowerCase().includes(q);
        const matchRemarks = item.remarks?.toLowerCase().includes(q);
        if (!matchName && !matchBase && !matchRemarks) return false;
      }

      return true;
    });
  }, [movements, activeFilterTab, selectedBase, selectedEquipment, startDate, endDate, searchQuery]);

  const { totalAssigned, totalExpended, totalReturned } = useMemo(() => {
    let assigned = 0;
    let expended = 0;
    let returned = 0;
    movements.forEach((m) => {
      const q = Number(m.quantity) || 0;
      if (m.movementType === 'ASSIGNMENT') assigned += q;
      else if (m.movementType === 'EXPENDITURE') expended += q;
      else if (m.movementType === 'RETURN') returned += q;
    });
    return { totalAssigned: assigned, totalExpended: expended, totalReturned: returned };
  }, [movements]);

  const getAddButtonLabel = () => {
    if (showAddForm) return 'Close Form';
    if (actionTab === 'RETURN') return 'Record Armory Return';
    if (actionTab === 'EXPEND') return 'Record Munitions Expended';
    return 'New Assignment';
  };

  return (
    <div className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>👤 Assignments & Expended Assets</h2>
          <small>Issue weapons/gear to personnel, record ammunition & munitions expended, and handle armor returns.</small>
        </div>
        <div className="view-panel-actions">
          <button
            className="action-trigger-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            title={getAddButtonLabel()}
          >
            <Plus size={15} /> <span className="btn-text">{getAddButtonLabel()}</span>
          </button>
          <button className="btn-secondary" onClick={handleRefreshAll} disabled={loading} title="Refresh Assignments">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="subpage-stats-grid">
        <div
          className="subpage-stat-card"
          onClick={() => handleFilterTabSelect('ASSIGNMENTS', '/movements/assign', 'ASSIGN')}
          style={{ cursor: 'pointer' }}
          title="Filter by Assignments (/movements/assign)"
        >
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Assigned to Troops</span>
            <span className="subpage-stat-val" style={{ color: 'var(--purple)' }}>
              {totalAssigned.toLocaleString()}
            </span>
            <span className="subpage-stat-badge purple">Custody</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <UserCheck size={15} />
          </div>
        </div>

        <div
          className="subpage-stat-card"
          onClick={() => handleFilterTabSelect('EXPENDITURES', '/movements/expend', 'EXPEND')}
          style={{ cursor: 'pointer' }}
          title="Filter by Expended (/movements/expend)"
        >
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Expended Munitions</span>
            <span className="subpage-stat-val" style={{ color: '#fbbf24' }}>
              {totalExpended.toLocaleString()}
            </span>
            <span className="subpage-stat-badge yellow">🔥 Operations</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <Flame size={15} />
          </div>
        </div>

        <div
          className="subpage-stat-card"
          onClick={() => handleFilterTabSelect('RETURNS', '/movements/return', 'RETURN')}
          style={{ cursor: 'pointer' }}
          title="Filter by Returns (/movements/return)"
        >
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Returned to Armory</span>
            <span className="subpage-stat-val" style={{ color: '#34d399' }}>
              {totalReturned.toLocaleString()}
            </span>
            <span className="subpage-stat-badge green">↩ Base Return</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <RotateCcw size={15} />
          </div>
        </div>

        <div
          className="subpage-stat-card"
          onClick={() => handleFilterTabSelect('ALL', '/assignments')}
          style={{ cursor: 'pointer' }}
          title="View All Activity (/assignments)"
        >
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">In-Field Circulation</span>
            <span className="subpage-stat-val">
              {Math.max(0, totalAssigned - totalReturned).toLocaleString()}
            </span>
            <span className="subpage-stat-badge blue">◈ Deployed</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Shield size={15} />
          </div>
        </div>
      </div>

      {/* Form Card */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid var(--line)', background: 'var(--panel)', padding: '20px' }}>
          {/* Action Tabs inside form */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'ASSIGN' ? 'active' : ''}`}
                onClick={() => handleFilterTabSelect('ASSIGNMENTS', '/movements/assign', 'ASSIGN')}
              >
                👤 Issue / Assign to Personnel
              </button>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'EXPEND' ? 'active' : ''}`}
                onClick={() => handleFilterTabSelect('EXPENDITURES', '/movements/expend', 'EXPEND')}
              >
                🔥 Expend Ammunition / Fuel
              </button>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'RETURN' ? 'active' : ''}`}
                onClick={() => handleFilterTabSelect('RETURNS', '/movements/return', 'RETURN')}
              >
                ↩ Return Equipment
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px' }}
            >
              ✕ Cancel
            </button>
          </div>

          {notification.message && (
            <div className={`modal-alert ${notification.type}`} style={{ marginBottom: '16px' }}>
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mr-2 inline flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 inline flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAction} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Military Base / Armory *</label>
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
                      {b.name} ({b.code}) - {b.location}
                    </option>
                  ))}
                </select>
              </div>

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
                      {eq.name} [{eq.category}]
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
                  placeholder="e.g. 1"
                />
              </div>
            </div>

            {actionTab === 'ASSIGN' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Personnel Full Name *</label>
                  <input
                    type="text"
                    name="personnelName"
                    value={formData.personnelName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Havildar Vikram Singh"
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label>Service Number / Rank *</label>
                  <input
                    type="text"
                    name="serviceNumber"
                    value={formData.serviceNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. JC-894120"
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label>Duty / Purpose of Issue</label>
                  <input
                    type="text"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder="e.g. Sector Perimeter Security"
                    className="modal-input"
                  />
                </div>
              </div>
            )}

            {actionTab === 'EXPEND' && (
              <div className="form-group">
                <label>Operation or Tactical Exercise *</label>
                <input
                  type="text"
                  name="operationOrExercise"
                  value={formData.operationOrExercise}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Exercise Desert Strike - Live Firing Validation"
                  className="modal-input"
                />
              </div>
            )}

            {actionTab === 'RETURN' && (
              <div className="form-group">
                <label>Service Number of Returning Personnel *</label>
                <input
                  type="text"
                  name="serviceNumber"
                  value={formData.serviceNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. JC-894120"
                  className="modal-input"
                />
              </div>
            )}

            <div className="form-group">
              <label>Logistics Remarks / Verification Notes</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="e.g. Verified and signed by Company Quartermaster"
                className="modal-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="action-trigger-btn"
                style={{ padding: '8px 20px', borderRadius: '6px' }}
              >
                {formLoading ? 'Submitting...' : '✓ Confirm & Update Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs (All, Assignments, Expenditures, Returns) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        <button
          className={`tab-btn ${activeFilterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => handleFilterTabSelect('ALL', '/assignments')}
        >
          All Activity ({movements.length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'ASSIGNMENTS' ? 'active' : ''}`}
          onClick={() => handleFilterTabSelect('ASSIGNMENTS', '/movements/assign', 'ASSIGN')}
        >
          👤 Assignments ({movements.filter((m) => m.movementType === 'ASSIGNMENT').length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'EXPENDITURES' ? 'active' : ''}`}
          onClick={() => handleFilterTabSelect('EXPENDITURES', '/movements/expend', 'EXPEND')}
        >
          🔥 Expended ({movements.filter((m) => m.movementType === 'EXPENDITURE').length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'RETURNS' ? 'active' : ''}`}
          onClick={() => handleFilterTabSelect('RETURNS', '/movements/return', 'RETURN')}
        >
          ↩ Returns ({movements.filter((m) => m.movementType === 'RETURN').length})
        </button>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search personnel, service #, notes..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'base',
            icon: Building,
            iconColor: 'var(--blue)',
            value: selectedBase,
            onChange: setSelectedBase,
            ariaLabel: 'Filter by Base',
            options: [
              { value: 'ALL', label: `All Bases (${bases.length})` },
              ...bases.map((b) => ({ value: b.id, label: b.name }))
            ]
          },
          {
            id: 'equipmentType',
            icon: Shield,
            iconColor: 'var(--yellow)',
            value: selectedEquipment,
            onChange: setSelectedEquipment,
            ariaLabel: 'Filter by Equipment Type',
            options: [
              { value: 'ALL', label: `All Equipment (${equipmentTypes.length})` },
              ...equipmentTypes.map((eq) => ({
                value: eq.id,
                label: `${eq.name} (${eq.category})`
              }))
            ]
          }
        ]}
        dateRange={{
          startDate,
          onStartDateChange: setStartDate,
          endDate,
          onEndDateChange: setEndDate,
          startTitle: 'Start Date',
          endTitle: 'End Date'
        }}
        onRefresh={handleRefreshAll}
        loading={loading}
        refreshLabel="Refresh"
        hasActiveFilters={
          selectedBase !== 'ALL' ||
          selectedEquipment !== 'ALL' ||
          Boolean(startDate) ||
          Boolean(endDate) ||
          Boolean(searchQuery)
        }
        onReset={() => {
          setSelectedBase('ALL');
          setSelectedEquipment('ALL');
          setStartDate('');
          setEndDate('');
          setSearchQuery('');
        }}
      />

      {/* Table */}
      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Base Location</th>
              <th>Action Type</th>
              <th>Equipment Asset</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Recipient / Operation / Details</th>
              <th>Officer</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length > 0 ? (
              filteredList.map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600 }}>
                      {m.id}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Today'}
                      </span>
                      <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{m.baseName}</strong>
                  </td>
                  <td>
                    {m.movementType === 'ASSIGNMENT' && (
                      <b className="pill ppurple" style={{ fontSize: '11px' }}>
                        👤 Assignment
                      </b>
                    )}
                    {m.movementType === 'EXPENDITURE' && (
                      <b className="pill pyellow" style={{ fontSize: '11px' }}>
                        🔥 Expended
                      </b>
                    )}
                    {m.movementType === 'RETURN' && (
                      <b className="pill pgreen" style={{ fontSize: '11px' }}>
                        ↩ Return
                      </b>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 400, color: 'var(--text)' }}>
                      {m.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{m.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <span style={{ fontWeight: 400, fontSize: '12.5px' }}>
                      {Number(m.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                      {m.remarks || m.referenceId || '-'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {m.createdBy || 'COMMANDER'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  {loading ? (
                    <LoadingSpinner label="Fetching Personnel Assignment & Equipment Issue Ledger..." />
                  ) : (
                    'No assignment or expenditure records found.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignmentsPage;
