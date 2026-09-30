import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { apiCache } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ShoppingBag,
  Plus,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  Shield,
  Layers,
  FileText
} from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const PurchasesPage = () => {
  const [purchases, setPurchases] = useState(() => {
    const cached = apiCache.get('get:movements')?.data?.data;
    return cached ? cached.filter((m) => m.movementType === 'PURCHASE') : [];
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
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: 1,
    supplier: '',
    invoiceNumber: '',
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

  const fetchPurchases = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && purchases.length === 0) {
      setLoading(true);
    }
    try {
      const config = isManualRefresh ? { forceRefresh: true } : {};
      const res = await api.get('/movements', config);
      if (res.data?.data) {
        const purchaseList = res.data.data.filter((m) => m.movementType === 'PURCHASE');
        setPurchases(purchaseList);
      }
    } catch (err) {
      console.error('Error fetching purchases', err);
    } finally {
      setLoading(false);
    }
  }, [purchases.length]);

  const handleRefreshAll = useCallback(() => {
    fetchLookups(true);
    fetchPurchases(true);
  }, [fetchLookups, fetchPurchases]);

  useEffect(() => {
    fetchLookups();
    fetchPurchases();

    const handleUpdate = () => {
      fetchLookups(true);
      fetchPurchases(true);
    };
    window.addEventListener('mams:movement_updated', handleUpdate);
    window.addEventListener('mams:data_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:movement_updated', handleUpdate);
      window.removeEventListener('mams:data_updated', handleUpdate);
    };
  }, [fetchLookups, fetchPurchases]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    setNotification({ type: '', message: '' });

    const selectedBaseObj = bases.find((b) => Number(b.id) === Number(formData.baseId));
    const selectedEqObj = equipmentTypes.find((eq) => Number(eq.id) === Number(formData.equipmentTypeId));

    const tempId = `temp-${Date.now()}`;
    const optimisticPurchase = {
      id: tempId,
      timestamp: new Date().toISOString(),
      baseId: Number(formData.baseId),
      baseName: selectedBaseObj?.name || 'Base ' + formData.baseId,
      equipmentTypeId: Number(formData.equipmentTypeId),
      equipmentName: selectedEqObj?.name || 'Equipment ' + formData.equipmentTypeId,
      equipmentCategory: selectedEqObj?.category || 'EQUIPMENT',
      quantity: Number(formData.quantity),
      movementType: 'PURCHASE',
      referenceId: formData.invoiceNumber || `PO-${Date.now().toString().slice(-6)}`,
      remarks: formData.remarks || 'Standard asset procurement',
      isOptimistic: true
    };

    // 1. Optimistically append purchase to list immediately
    setPurchases((prev) => [optimisticPurchase, ...prev]);

    // 2. Immediately notify user and clear form
    setNotification({
      type: 'success',
      message: 'Procurement action dispatched! Inventory updating...'
    });

    const payload = {
      baseId: Number(formData.baseId),
      equipmentTypeId: Number(formData.equipmentTypeId),
      quantity: Number(formData.quantity),
      supplier: formData.supplier || 'Ministry of Defence Supply Depot',
      invoiceNumber: formData.invoiceNumber || optimisticPurchase.referenceId,
      remarks: formData.remarks || 'Standard asset procurement'
    };

    setFormData({
      baseId: '',
      equipmentTypeId: '',
      quantity: 1,
      supplier: '',
      invoiceNumber: '',
      remarks: ''
    });

    setTimeout(() => {
      setShowAddForm(false);
      setNotification({ type: '', message: '' });
    }, 1200);

    // 3. Dispatch background API call
    try {
      const res = await api.post('/movements/purchase', payload);
      window.dispatchEvent(new Event('mams:movement_updated'));
      if (res.data?.data) {
        setPurchases((prev) =>
          prev.map((item) => (item.id === tempId ? { ...res.data.data, baseName: selectedBaseObj?.name, equipmentName: selectedEqObj?.name } : item))
        );
      } else {
        fetchPurchases();
      }
    } catch (err) {
      // Rollback on failure
      setPurchases((prev) => prev.filter((item) => item.id !== tempId));
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to record procurement. Rollback executed.';
      setNotification({ type: 'error', message: errorMsg });
      setShowAddForm(true);
    }
  };

  // Filter logic
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      if (selectedBase !== 'ALL' && String(item.baseId) !== String(selectedBase)) {
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
  }, [purchases, selectedBase, selectedEquipment, startDate, endDate, searchQuery]);

  const totalQuantity = useMemo(() => {
    return filteredPurchases.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [filteredPurchases]);

  return (
    <div className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>🛒 Purchases & Procurements</h2>
          <small>Record newly acquired military hardware and review historical procurement records.</small>
        </div>
        <div className="view-panel-actions">
          <button
            className="action-trigger-btn"
            onClick={() => setShowAddForm(!showAddForm)}
            title={showAddForm ? 'Close Form' : 'Record New Purchase'}
          >
            <Plus size={15} /> <span className="btn-text">{showAddForm ? 'Close Form' : 'Record New Purchase'}</span>
          </button>
          <button className="btn-secondary" onClick={handleRefreshAll} disabled={loading} title="Refresh Purchases">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Purchases</span>
            <span className="subpage-stat-val">{filteredPurchases.length}</span>
            <span className="subpage-stat-badge green">▲ Verified Orders</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <ShoppingBag size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Units Procured</span>
            <span className="subpage-stat-val" style={{ color: 'var(--green)' }}>
              +{totalQuantity.toLocaleString()}
            </span>
            <span className="subpage-stat-badge green">▲ Added to Stock</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Layers size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Bases Supplied</span>
            <span className="subpage-stat-val">
              {new Set(filteredPurchases.map((p) => p.baseId)).size}
            </span>
            <span className="subpage-stat-badge blue">◈ Active Bases</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <Building size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Equipment Types</span>
            <span className="subpage-stat-val">
              {new Set(filteredPurchases.map((p) => p.equipmentTypeId)).size}
            </span>
            <span className="subpage-stat-badge purple">◈ Equipment Lines</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <Shield size={15} />
          </div>
        </div>
      </div>

      {/* Collapsible Record Purchase Form Card */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid var(--line)', background: 'var(--panel)', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShoppingBag size={18} /> Record Asset Purchase & Indent
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

          <form onSubmit={handleRecordPurchase} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Receiving Base / Installation *</label>
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
                <label>Equipment / Asset Type *</label>
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
                      {eq.name} [{eq.category}] - Code: {eq.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Procurement Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  className="modal-input"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="form-group">
                <label>Supplier / Manufacturer</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  placeholder="e.g. Ordnance Factory Board / HAL / DRDO"
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Purchase Order / Invoice #</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. PO-2026-AR-8901"
                  className="modal-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Logistics Notes / Specifications</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="e.g. Batch 4 delivery, inspected and approved by Ordnance Corps"
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
                {formLoading ? 'Recording...' : '✓ Confirm Purchase & Increase Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search invoice, remarks, asset..."
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

      {/* Historical Purchases Table */}
      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Military Base</th>
              <th>Equipment Asset</th>
              <th>Category</th>
              <th>Quantity (+)</th>
              <th>Reference / Invoice</th>
              <th>Remarks / Vendor</th>
              <th>Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.length > 0 ? (
              filteredPurchases.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600 }}>
                      {p.id}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Today'}
                      </span>
                      <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {p.timestamp ? new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{p.baseName}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 400, color: 'var(--text)' }}>
                      {p.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{p.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <b className="pill pgreen" style={{ fontSize: '12px', fontWeight: 400 }}>
                      +{Number(p.quantity).toLocaleString()}
                    </b>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--muted)' }}>
                      {p.referenceId || `INV-${p.id}`}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                      {p.remarks || 'Standard procurement'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      {p.createdBy || 'ADMIN'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  {loading ? (
                    <LoadingSpinner label="Fetching Procurement & Consignment Ledger..." />
                  ) : (
                    'No purchases found matching selected filters.'
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

export default PurchasesPage;
