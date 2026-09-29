import React, { useState, useEffect } from 'react';
import api from '../services/api';
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

export const AssignmentsPage = () => {
  const [movements, setMovements] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionTab, setActionTab] = useState('ASSIGN'); // 'ASSIGN', 'EXPEND', 'RETURN'
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Filter & tab
  const [activeFilterTab, setActiveFilterTab] = useState('ALL'); // 'ALL', 'ASSIGNMENTS', 'EXPENDITURES', 'RETURNS'
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

  const fetchLookups = async () => {
    try {
      const [basesRes, equipRes] = await Promise.all([
        api.get('/bases').catch(() => ({ data: { data: [] } })),
        api.get('/equipment').catch(() => ({ data: { data: [] } }))
      ]);
      if (basesRes.data?.data) setBases(basesRes.data.data);
      if (equipRes.data?.data) setEquipmentTypes(equipRes.data.data);
    } catch (err) {
      console.error('Error fetching lookups', err);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movements');
      if (res.data?.data) {
        // Filter out PURCHASE and TRANSFER, only show ASSIGNMENT, RETURN, EXPENDITURE
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
  };

  useEffect(() => {
    fetchLookups();
    fetchMovements();

    const handleUpdate = () => fetchMovements();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setNotification({ type: '', message: '' });

    try {
      let endpoint = '';
      let payload = {};

      if (actionTab === 'ASSIGN') {
        endpoint = '/movements/assign';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          personnelName: formData.personnelName,
          serviceNumber: formData.serviceNumber,
          purpose: formData.purpose,
          remarks: formData.remarks
        };
      } else if (actionTab === 'EXPEND') {
        endpoint = '/movements/expend';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          operationOrExercise: formData.operationOrExercise,
          remarks: formData.remarks
        };
      } else if (actionTab === 'RETURN') {
        endpoint = '/movements/return';
        payload = {
          baseId: Number(formData.baseId),
          equipmentTypeId: Number(formData.equipmentTypeId),
          quantity: Number(formData.quantity),
          serviceNumber: formData.serviceNumber,
          remarks: formData.remarks
        };
      }

      const res = await api.post(endpoint, payload);
      setNotification({
        type: 'success',
        message: res.data?.message || 'Transaction executed and inventory updated successfully!'
      });

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

      fetchMovements();
      window.dispatchEvent(new Event('mams:movement_updated'));

      setTimeout(() => {
        setShowAddForm(false);
        setNotification({ type: '', message: '' });
      }, 1600);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Transaction failed. Check stock availability at the selected base.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Filter movements
  const filteredList = movements.filter((item) => {
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

  const totalAssigned = movements
    .filter((m) => m.movementType === 'ASSIGNMENT')
    .reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const totalExpended = movements
    .filter((m) => m.movementType === 'EXPENDITURE')
    .reduce((a, b) => a + (Number(b.quantity) || 0), 0);
  const totalReturned = movements
    .filter((m) => m.movementType === 'RETURN')
    .reduce((a, b) => a + (Number(b.quantity) || 0), 0);

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
            onClick={() => {
              setShowAddForm(!showAddForm);
              setActionTab('ASSIGN');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> {showAddForm ? 'Close Form' : 'New Assignment / Expenditure'}
          </button>
          <button className="btn-secondary" onClick={fetchMovements} disabled={loading}>
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Assigned to Troops</span>
            <span className="subpage-stat-val" style={{ color: '#a78bfa' }}>
              {totalAssigned.toLocaleString()}
            </span>
            <span className="subpage-stat-badge purple">👤 Active Custody</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Expended Munitions</span>
            <span className="subpage-stat-val" style={{ color: '#fbbf24' }}>
              {totalExpended.toLocaleString()}
            </span>
            <span className="subpage-stat-badge yellow">🔥 Operations/Drills</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <Flame size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Returned to Armory</span>
            <span className="subpage-stat-val" style={{ color: '#34d399' }}>
              {totalReturned.toLocaleString()}
            </span>
            <span className="subpage-stat-badge green">↩ Returned to Base</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <RotateCcw size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">In-Field Circulation</span>
            <span className="subpage-stat-val">
              {Math.max(0, totalAssigned - totalReturned).toLocaleString()}
            </span>
            <span className="subpage-stat-badge blue">◈ Active Deployment</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Form Card */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid rgba(167, 139, 250, 0.3)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
          {/* Action Tabs inside form */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'ASSIGN' ? 'active' : ''}`}
                onClick={() => setActionTab('ASSIGN')}
              >
                👤 Issue / Assign to Personnel
              </button>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'EXPEND' ? 'active' : ''}`}
                onClick={() => setActionTab('EXPEND')}
              >
                🔥 Expend Ammunition / Fuel
              </button>
              <button
                type="button"
                className={`tab-btn ${actionTab === 'RETURN' ? 'active' : ''}`}
                onClick={() => setActionTab('RETURN')}
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
          onClick={() => setActiveFilterTab('ALL')}
        >
          All Activity ({movements.length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'ASSIGNMENTS' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('ASSIGNMENTS')}
        >
          👤 Assignments ({movements.filter((m) => m.movementType === 'ASSIGNMENT').length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'EXPENDITURES' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('EXPENDITURES')}
        >
          🔥 Expended ({movements.filter((m) => m.movementType === 'EXPENDITURE').length})
        </button>
        <button
          className={`tab-btn ${activeFilterTab === 'RETURNS' ? 'active' : ''}`}
          onClick={() => setActiveFilterTab('RETURNS')}
        >
          ↩ Returns ({movements.filter((m) => m.movementType === 'RETURN').length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontWeight: 600, fontSize: '13px' }}>
          <Filter size={15} /> Filters:
        </div>

        {/* Base Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building size={14} style={{ color: 'var(--muted)' }} />
          <select
            value={selectedBase}
            onChange={(e) => setSelectedBase(e.target.value)}
            className="modal-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
          >
            <option value="ALL">All Bases ({bases.length})</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={14} style={{ color: 'var(--muted)' }} />
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="modal-select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12.5px' }}
          >
            <option value="ALL">All Equipment ({equipmentTypes.length})</option>
            {equipmentTypes.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.category})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} style={{ color: 'var(--muted)' }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="modal-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            title="Start Date"
          />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="modal-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            title="End Date"
          />
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <Search size={14} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search notes, personnel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-input"
            style={{ width: '180px', padding: '5px 10px', fontSize: '12px' }}
          />
        </div>
      </div>

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
                    <span style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>
                      #{m.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}
                    </span>
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
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {m.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{m.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '12.5px' }}>
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
                  {loading ? 'Loading records...' : 'No assignment or expenditure records found.'}
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
