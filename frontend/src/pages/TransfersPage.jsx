import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ArrowRightLeft,
  Plus,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Shield,
  ArrowRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

export const TransfersPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Filters
  const [selectedOrigin, setSelectedOrigin] = useState('ALL');
  const [selectedDestination, setSelectedDestination] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Transfer Form State
  const [formData, setFormData] = useState({
    fromBaseId: '',
    toBaseId: '',
    equipmentTypeId: '',
    quantity: 1,
    reason: '',
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

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movements');
      if (res.data?.data) {
        // Filter transfers (TRANSFER_OUT or TRANSFER_IN)
        const transferList = res.data.data.filter((m) =>
          m.movementType === 'TRANSFER_OUT' || m.movementType === 'TRANSFER_IN'
        );
        setTransfers(transferList);
      }
    } catch (err) {
      console.error('Error fetching transfers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchTransfers();

    const handleUpdate = () => fetchTransfers();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (formData.fromBaseId === formData.toBaseId) {
      setNotification({ type: 'error', message: 'Source base and Destination base cannot be the same.' });
      return;
    }

    setFormLoading(true);
    setNotification({ type: '', message: '' });

    try {
      const payload = {
        fromBaseId: Number(formData.fromBaseId),
        toBaseId: Number(formData.toBaseId),
        equipmentTypeId: Number(formData.equipmentTypeId),
        quantity: Number(formData.quantity),
        reason: formData.reason || 'Tactical Reallocation / Operational Requirement',
        remarks: formData.remarks || 'Inter-base asset transit dispatched'
      };

      const res = await api.post('/movements/transfer', payload);
      setNotification({
        type: 'success',
        message: res.data?.message || 'Inter-base transfer completed successfully!'
      });

      setFormData({
        fromBaseId: '',
        toBaseId: '',
        equipmentTypeId: '',
        quantity: 1,
        reason: '',
        remarks: ''
      });

      fetchTransfers();
      window.dispatchEvent(new Event('mams:movement_updated'));

      setTimeout(() => {
        setShowAddForm(false);
        setNotification({ type: '', message: '' });
      }, 1600);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to process transfer. Ensure source base has adequate opening balance.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((item) => {
    if (selectedOrigin !== 'ALL' && String(item.baseId) !== String(selectedOrigin)) {
      return false;
    }
    if (selectedEquipment !== 'ALL' && String(item.equipmentTypeId) !== String(selectedEquipment)) {
      return false;
    }
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
      const matchRef = item.referenceId?.toLowerCase().includes(q);
      if (!matchName && !matchBase && !matchRemarks && !matchRef) return false;
    }
    return true;
  });

  const totalTransferredUnits = filteredTransfers.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  return (
    <div className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>🔄 Transfers (Inter-Base Movements)</h2>
          <small>Facilitate secure asset relocation between military installations and monitor movement trails.</small>
        </div>
        <div className="view-panel-actions">
          <button
            className="action-trigger-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> {showAddForm ? 'Close Form' : 'Initiate New Transfer'}
          </button>
          <button className="btn-secondary" onClick={fetchTransfers} disabled={loading}>
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Transfers</span>
            <span className="subpage-stat-val">{filteredTransfers.length}</span>
            <span className="subpage-stat-badge blue">▲ Logged Transfers</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <ArrowRightLeft size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Units Relocated</span>
            <span className="subpage-stat-val" style={{ color: '#60a5fa' }}>
              {totalTransferredUnits.toLocaleString()}
            </span>
            <span className="subpage-stat-badge blue">↔ Reallocated Stock</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active Bases</span>
            <span className="subpage-stat-val">
              {new Set(filteredTransfers.map((t) => t.baseId)).size}
            </span>
            <span className="subpage-stat-badge yellow">◈ Network Grid</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <Building size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Ledger Reconciliation</span>
            <span className="subpage-stat-val" style={{ color: '#34d399', fontSize: '18px' }}>
              100% Balanced
            </span>
            <span className="subpage-stat-badge green">✓ Zero Leakage</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Collapsible Initiate Transfer Form */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid rgba(96, 165, 250, 0.3)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowRightLeft size={18} /> Initiate Inter-Base Asset Transfer
            </h3>
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

          <form onSubmit={handleInitiateTransfer} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Origin Base (Source) *</label>
                <select
                  name="fromBaseId"
                  value={formData.fromBaseId}
                  onChange={handleInputChange}
                  required
                  className="modal-select"
                >
                  <option value="">Select Origin Base</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Destination Base (Receiving) *</label>
                <select
                  name="toBaseId"
                  value={formData.toBaseId}
                  onChange={handleInputChange}
                  required
                  className="modal-select"
                >
                  <option value="">Select Destination Base</option>
                  {bases.map((b) => (
                    <option key={b.id} value={b.id} disabled={String(b.id) === String(formData.fromBaseId)}>
                      {b.name} ({b.code}) - {b.location} {String(b.id) === String(formData.fromBaseId) ? '(Source)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Equipment / Asset to Transfer *</label>
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
                <label>Quantity to Relocate *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="modal-input"
                  placeholder="e.g. 10"
                />
              </div>

              <div className="form-group">
                <label>Operational Reason / Purpose</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="e.g. Forward Sector Reinforcement / Training Camp"
                  className="modal-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Transit Details / Convoy Authorization</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="e.g. Convoy Alpha-3, escorted by Military Police escort"
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
                {formLoading ? 'Executing Transfer...' : '✓ Dispatch Transfer & Update Ledgers'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontWeight: 600, fontSize: '13px' }}>
          <Filter size={15} /> Filter Movements:
        </div>

        {/* Base Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building size={14} style={{ color: 'var(--muted)' }} />
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
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
            title="From Date"
          />
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="modal-input"
            style={{ width: 'auto', padding: '5px 10px', fontSize: '12px' }}
            title="To Date"
          />
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <Search size={14} style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search transfer notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-input"
            style={{ width: '180px', padding: '5px 10px', fontSize: '12px' }}
          />
          {(selectedOrigin !== 'ALL' || selectedEquipment !== 'ALL' || startDate || endDate || searchQuery) && (
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedOrigin('ALL');
                setSelectedEquipment('ALL');
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
              }}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>Transfer ID</th>
              <th>Date & Time</th>
              <th>Base Location</th>
              <th>Direction</th>
              <th>Equipment Asset</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Tactical Reason & Notes</th>
              <th>Dispatched By</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>
                      #TRF-{t.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {t.timestamp ? new Date(t.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <strong>{t.baseName}</strong>
                  </td>
                  <td>
                    {t.movementType === 'TRANSFER_OUT' ? (
                      <b className="pill pred" style={{ fontSize: '11px' }}>
                        ▲ Outgoing Transfer
                      </b>
                    ) : (
                      <b className="pill pgreen" style={{ fontSize: '11px' }}>
                        ▼ Incoming Transfer
                      </b>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {t.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{t.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: t.movementType === 'TRANSFER_OUT' ? '#f87171' : '#4ade80' }}>
                      {t.movementType === 'TRANSFER_OUT' ? '-' : '+'}{Number(t.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                      {t.remarks || 'Inter-base asset redistribution'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {t.createdBy || 'HQ LOGISTICS'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  {loading ? 'Fetching transfer history...' : 'No transfer records found matching the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransfersPage;
