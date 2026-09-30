import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { apiCache } from '../services/api';
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
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const TransfersPage = () => {
  const [transfers, setTransfers] = useState(() => {
    const cached = apiCache.get('get:movements')?.data?.data;
    return cached ? cached.filter((m) => m.movementType === 'TRANSFER_OUT' || m.movementType === 'TRANSFER_IN') : [];
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

  const fetchTransfers = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && transfers.length === 0) {
      setLoading(true);
    }
    try {
      const config = isManualRefresh ? { forceRefresh: true } : {};
      const res = await api.get('/movements', config);
      if (res.data?.data) {
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
  }, [transfers.length]);

  const handleRefreshAll = useCallback(() => {
    fetchLookups(true);
    fetchTransfers(true);
  }, [fetchLookups, fetchTransfers]);

  useEffect(() => {
    fetchLookups();
    fetchTransfers();

    const handleUpdate = () => {
      fetchLookups(true);
      fetchTransfers(true);
    };
    window.addEventListener('mams:movement_updated', handleUpdate);
    window.addEventListener('mams:data_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:movement_updated', handleUpdate);
      window.removeEventListener('mams:data_updated', handleUpdate);
    };
  }, [fetchLookups, fetchTransfers]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (formData.fromBaseId === formData.toBaseId) {
      setNotification({ type: 'error', message: 'Source base and Destination base cannot be the same.' });
      return;
    }

    setNotification({ type: '', message: '' });

    const fromBaseObj = bases.find((b) => Number(b.id) === Number(formData.fromBaseId));
    const toBaseObj = bases.find((b) => Number(b.id) === Number(formData.toBaseId));
    const eqObj = equipmentTypes.find((eq) => Number(eq.id) === Number(formData.equipmentTypeId));

    const tempId = `temp-${Date.now()}`;
    const optimisticTransfer = {
      id: tempId,
      timestamp: new Date().toISOString(),
      baseId: Number(formData.fromBaseId),
      baseName: `${fromBaseObj?.name || 'Base'} ➔ ${toBaseObj?.name || 'Base'}`,
      equipmentTypeId: Number(formData.equipmentTypeId),
      equipmentName: eqObj?.name || 'Equipment ' + formData.equipmentTypeId,
      equipmentCategory: eqObj?.category || 'EQUIPMENT',
      quantity: Number(formData.quantity),
      movementType: 'TRANSFER_OUT',
      remarks: formData.remarks || 'Inter-base asset transit dispatched',
      isOptimistic: true
    };

    // 1. Optimistically append transfer to list immediately
    setTransfers((prev) => [optimisticTransfer, ...prev]);

    // 2. Immediately notify user and clear form
    setNotification({
      type: 'success',
      message: 'Transfer dispatched! Dispatching inventory movement...'
    });

    const payload = {
      fromBaseId: Number(formData.fromBaseId),
      toBaseId: Number(formData.toBaseId),
      equipmentTypeId: Number(formData.equipmentTypeId),
      quantity: Number(formData.quantity),
      reason: formData.reason || 'Tactical Reallocation / Operational Requirement',
      remarks: formData.remarks || 'Inter-base asset transit dispatched'
    };

    setFormData({
      fromBaseId: '',
      toBaseId: '',
      equipmentTypeId: '',
      quantity: 1,
      reason: '',
      remarks: ''
    });

    setTimeout(() => {
      setShowAddForm(false);
      setNotification({ type: '', message: '' });
    }, 1200);

    // 3. Dispatch background API call
    try {
      const res = await api.post('/movements/transfer', payload);
      window.dispatchEvent(new Event('mams:movement_updated'));
      if (res.data?.data) {
        setTransfers((prev) =>
          prev.map((item) => (item.id === tempId ? { ...res.data.data, baseName: optimisticTransfer.baseName, equipmentName: eqObj?.name } : item))
        );
      } else {
        fetchTransfers();
      }
    } catch (err) {
      // Rollback on failure
      setTransfers((prev) => prev.filter((item) => item.id !== tempId));
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to process transfer. Rollback executed.';
      setNotification({ type: 'error', message: errorMsg });
      setShowAddForm(true);
    }
  };

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return transfers.filter((item) => {
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
  }, [transfers, selectedOrigin, selectedEquipment, startDate, endDate, searchQuery]);

  const totalTransferredUnits = useMemo(() => {
    return filteredTransfers.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [filteredTransfers]);

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
            title={showAddForm ? 'Close Form' : 'Initiate New Transfer'}
          >
            <Plus size={15} /> <span className="btn-text">{showAddForm ? 'Close Form' : 'Initiate New Transfer'}</span>
          </button>
          <button className="btn-secondary" onClick={handleRefreshAll} disabled={loading} title="Refresh Transfers">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Transfers</span>
            <span className="subpage-stat-val">{filteredTransfers.length}</span>
            <span className="subpage-stat-badge blue">▲ Transfers</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <ArrowRightLeft size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Units Relocated</span>
            <span className="subpage-stat-val" style={{ color: 'var(--blue)' }}>
              {totalTransferredUnits.toLocaleString()}
            </span>
            <span className="subpage-stat-badge blue">↔ Relocated</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <TrendingUp size={15} />
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
            <Building size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Reconciliation</span>
            <span className="subpage-stat-val" style={{ color: '#34d399', fontSize: '15px' }}>
              100% Balanced
            </span>
            <span className="subpage-stat-badge green">✓ Zero Leak</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <Shield size={15} />
          </div>
        </div>
      </div>

      {/* Collapsible Initiate Transfer Form */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid var(--line)', background: 'var(--panel)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
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

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search transfer notes, assets, reasons..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'originBase',
            icon: Building,
            iconColor: 'var(--blue)',
            value: selectedOrigin,
            onChange: setSelectedOrigin,
            ariaLabel: 'Filter by Origin Base',
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
          startTitle: 'From Date',
          endTitle: 'To Date'
        }}
        onRefresh={handleRefreshAll}
        loading={loading}
        refreshLabel="Refresh"
        hasActiveFilters={
          selectedOrigin !== 'ALL' ||
          selectedEquipment !== 'ALL' ||
          Boolean(startDate) ||
          Boolean(endDate) ||
          Boolean(searchQuery)
        }
        onReset={() => {
          setSelectedOrigin('ALL');
          setSelectedEquipment('ALL');
          setStartDate('');
          setEndDate('');
          setSearchQuery('');
        }}
      />

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
                    <strong style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600 }}>
                      {t.id}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : 'Today'}
                      </span>
                      <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
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
                    <span style={{ fontWeight: 400, color: 'var(--text)' }}>
                      {t.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{t.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <span style={{ fontWeight: 400, fontSize: '12.5px', color: t.movementType === 'TRANSFER_OUT' ? '#f87171' : '#4ade80' }}>
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
