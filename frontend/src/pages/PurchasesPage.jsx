import React, { useState, useEffect } from 'react';
import api from '../services/api';
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

export const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/movements');
      if (res.data?.data) {
        // Filter only purchases
        const purchaseList = res.data.data.filter((m) => m.movementType === 'PURCHASE');
        setPurchases(purchaseList);
      }
    } catch (err) {
      console.error('Error fetching purchases', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
    fetchPurchases();

    const handleUpdate = () => fetchPurchases();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setNotification({ type: '', message: '' });

    try {
      const payload = {
        baseId: Number(formData.baseId),
        equipmentTypeId: Number(formData.equipmentTypeId),
        quantity: Number(formData.quantity),
        supplier: formData.supplier || 'Ministry of Defence Supply Depot',
        invoiceNumber: formData.invoiceNumber || `PO-${Date.now().toString().slice(-6)}`,
        remarks: formData.remarks || 'Standard asset procurement'
      };

      const res = await api.post('/movements/purchase', payload);
      setNotification({
        type: 'success',
        message: res.data?.message || 'Procurement recorded and base inventory updated successfully!'
      });

      setFormData({
        baseId: '',
        equipmentTypeId: '',
        quantity: 1,
        supplier: '',
        invoiceNumber: '',
        remarks: ''
      });

      fetchPurchases();
      window.dispatchEvent(new Event('mams:movement_updated'));

      setTimeout(() => {
        setShowAddForm(false);
        setNotification({ type: '', message: '' });
      }, 1600);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to record procurement. Please check the inputs.';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  // Filter logic
  const filteredPurchases = purchases.filter((item) => {
    // Base filter
    if (selectedBase !== 'ALL' && String(item.baseId) !== String(selectedBase)) {
      return false;
    }
    // Equipment filter
    if (selectedEquipment !== 'ALL' && String(item.equipmentTypeId) !== String(selectedEquipment)) {
      return false;
    }
    // Date filter
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
    // Search query
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

  const totalQuantity = filteredPurchases.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

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
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> {showAddForm ? 'Close Form' : 'Record New Purchase'}
          </button>
          <button className="btn-secondary" onClick={fetchPurchases} disabled={loading}>
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
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
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Units Procured</span>
            <span className="subpage-stat-val" style={{ color: '#4ade80' }}>
              +{totalQuantity.toLocaleString()}
            </span>
            <span className="subpage-stat-badge green">▲ Added to Stock</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Layers size={20} />
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
            <Building size={20} />
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
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Collapsible Record Purchase Form Card */}
      {showAddForm && (
        <div className="view-table-card" style={{ marginBottom: '24px', border: '1px solid rgba(147, 197, 253, 0.3)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* Filter Bar (Date, Base, Equipment Type, Search) */}
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
            <option value="ALL">All Equipment Types ({equipmentTypes.length})</option>
            {equipmentTypes.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} ({eq.category})
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
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
        </div>

        {/* End Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            placeholder="Search invoice, remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="modal-input"
            style={{ width: '180px', padding: '5px 10px', fontSize: '12px' }}
          />
          {(selectedBase !== 'ALL' || selectedEquipment !== 'ALL' || startDate || endDate || searchQuery) && (
            <button
              className="btn-secondary"
              onClick={() => {
                setSelectedBase('ALL');
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
                    <span style={{ fontFamily: 'monospace', color: '#93c5fd', fontWeight: 600 }}>
                      #PUR-{p.id}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {p.timestamp ? new Date(p.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </td>
                  <td>
                    <strong>{p.baseName}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {p.equipmentName}
                    </span>
                  </td>
                  <td>
                    <b className="pill pblue">{p.equipmentCategory || 'EQUIPMENT'}</b>
                  </td>
                  <td>
                    <b className="pill pgreen" style={{ fontSize: '12px', fontWeight: 700 }}>
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
                  {loading ? 'Loading historical purchases...' : 'No purchases found matching selected filters.'}
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
