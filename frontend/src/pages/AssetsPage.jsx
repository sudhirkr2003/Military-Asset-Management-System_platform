import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Shield,
  Crosshair,
  Truck,
  Radio,
  Box,
  Layers
} from 'lucide-react';

export const AssetsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isLogistics = user?.role === 'LOGISTICS_OFFICER';
  const canCreate = isAdmin || isLogistics;
  const canEdit = isAdmin || isLogistics;
  const canDelete = isAdmin;
  const hasAnyAction = canEdit || canDelete;

  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'WEAPON',
    unit: 'units',
    isConsumable: false,
    description: '',
    status: 'ACTIVE',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipment');
      if (res.data?.data) {
        setEquipmentList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching equipment list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const categories = [
    { label: 'All Categories', value: 'ALL', icon: Layers },
    { label: 'Weapons', value: 'WEAPON', icon: Crosshair },
    { label: 'Vehicles', value: 'VEHICLE', icon: Truck },
    { label: 'Ammunition', value: 'AMMUNITION', icon: Box },
    { label: 'Communication', value: 'COMMUNICATION_EQUIPMENT', icon: Radio },
    { label: 'Protective', value: 'PROTECTIVE_EQUIPMENT', icon: Shield },
    { label: 'Other', value: 'OTHER', icon: Layers },
  ];

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: '',
      category: 'WEAPON',
      unit: 'units',
      isConsumable: false,
      description: '',
      status: 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name || '',
      code: asset.code || '',
      category: asset.category || 'WEAPON',
      unit: asset.unit || 'units',
      isConsumable: !!asset.isConsumable,
      description: asset.description || '',
      status: asset.status || 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Asset Name and Code/Identifier are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        unit: formData.unit || 'units',
        isConsumable: formData.isConsumable,
        description: formData.description?.trim() || null,
      };

      const res = await api.post('/equipment', payload);
      if (res.data?.success) {
        setFormSuccess('Military asset registered successfully into catalog!');
        setTimeout(() => {
          setShowAddModal(false);
          fetchEquipment();
          window.dispatchEvent(new Event('mams:movement_updated'));
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create asset');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Asset Name and Code are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        unit: formData.unit || 'units',
        isConsumable: formData.isConsumable,
        description: formData.description?.trim() || null,
        status: formData.status,
      };

      const res = await api.put(`/equipment/${selectedAsset.id}`, payload);
      if (res.data?.success) {
        setFormSuccess('Asset details updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          fetchEquipment();
          window.dispatchEvent(new Event('mams:movement_updated'));
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update asset');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;
    setFormLoading(true);
    try {
      await api.delete(`/equipment/${selectedAsset.id}`);
      setShowDeleteModal(false);
      fetchEquipment();
      window.dispatchEvent(new Event('mams:movement_updated'));
    } catch (err) {
      alert('Error deactivating asset: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Filtering
  const filteredAssets = equipmentList.filter((eq) => {
    const matchesCategory = selectedCategory === 'ALL' || eq.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || eq.status === selectedStatus;
    const matchesSearch =
      searchTerm === '' ||
      eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'WEAPON':
        return 'pgreen';
      case 'VEHICLE':
        return 'pblue';
      case 'AMMUNITION':
        return 'pyellow';
      case 'COMMUNICATION_EQUIPMENT':
        return 'ppurple';
      case 'PROTECTIVE_EQUIPMENT':
        return 'pblue';
      default:
        return 'pgray';
    }
  };

  return (
    <section className="view-panel-container">
      {/* Top Header */}
      <div className="view-panel-header">
        <div>
          <h2>◇ Military Assets & Equipment Catalog</h2>
          <small>
            Comprehensive defense asset inventory registry, weapon systems, vehicles, and ordnance classifications.
          </small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={fetchEquipment} disabled={loading}>
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
          {canCreate && (
            <button className="btn-primary" onClick={handleOpenAdd}>
              <Plus size={13} className="inline mr-1" /> + Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          background: 'var(--panel)',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '240px' }}>
          <Search className="w-4 h-4 text-muted" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search assets by name, code (e.g. WPN, T-90)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              width: '100%',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="modal-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="modal-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>Asset Code</th>
              <th>Equipment Name</th>
              <th>Category</th>
              <th>Unit of Measure</th>
              <th>Type</th>
              <th>Status</th>
              <th>Description / Specifications</th>
              {hasAnyAction && (
                <th style={{ textAlign: 'right', minWidth: '95px', paddingLeft: '20px', whiteSpace: 'nowrap' }}>Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={hasAnyAction ? 8 : 7} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  Loading military defense assets...
                </td>
              </tr>
            ) : filteredAssets.length > 0 ? (
              filteredAssets.map((eq) => (
                <tr key={eq.id}>
                  <td>
                    <strong style={{ color: 'var(--blue)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {eq.code}
                    </strong>
                  </td>
                  <td>
                    <strong>{eq.name}</strong>
                  </td>
                  <td>
                    <b className={`pill ${getCategoryBadgeClass(eq.category)}`}>
                      {eq.category?.replace('_', ' ')}
                    </b>
                  </td>
                  <td>{eq.unit || 'units'}</td>
                  <td>
                    {eq.isConsumable ? (
                      <span style={{ color: 'var(--yellow)', fontSize: '12.5px', fontWeight: 600 }}>
                        ● Consumable / Ordnance
                      </span>
                    ) : (
                      <span style={{ color: 'var(--green)', fontSize: '12.5px' }}>● Durable Asset</span>
                    )}
                  </td>
                  <td>
                    <b className={`pill ${eq.status === 'ACTIVE' ? 'pgreen' : 'pred'}`}>
                      {eq.status || 'ACTIVE'}
                    </b>
                  </td>
                  <td
                    style={{
                      color: 'var(--muted)',
                      fontSize: '12.5px',
                      maxWidth: '300px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      paddingRight: '24px',
                      lineHeight: '1.4',
                    }}
                  >
                    {eq.description || '-'}
                  </td>
                  {hasAnyAction && (
                    <td style={{ textAlign: 'right', minWidth: '95px', paddingLeft: '20px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {canEdit && (
                          <button
                            title="Edit Asset"
                            onClick={() => handleOpenEdit(eq)}
                            style={{
                              background: 'rgba(36, 153, 255, 0.15)',
                              border: '1px solid rgba(36, 153, 255, 0.4)',
                              color: '#2499ff',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {canDelete && eq.status === 'ACTIVE' && (
                          <button
                            title="Deactivate Asset"
                            onClick={() => handleOpenDelete(eq)}
                            style={{
                              background: 'rgba(255, 80, 101, 0.15)',
                              border: '1px solid rgba(255, 80, 101, 0.4)',
                              color: '#ff5065',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={hasAnyAction ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No military assets match the selected filters. {canCreate && <span>Click <strong>+ Register New Asset</strong> to add one.</span>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== CREATE ASSET MODAL ==================== */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <Plus className="w-4 h-4" />
              </div>
              <div className="modal-header-text">
                <h3>Register New Military Asset</h3>
                <p>Add weapon, combat vehicle, ordnance, or communication hardware to the national registry</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="modal-alert-error" style={{ margin: '0 20px 10px 20px' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="modal-alert-success" style={{ margin: '0 20px 10px 20px' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateAsset}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label className="modal-label">
                    Asset Name <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INSAS 5.56mm Assault Rifle, T-90 Tank"
                    className="modal-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">
                      Unique Code / Model <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WPN-INSAS-01"
                      className="modal-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">
                      Asset Category <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <select
                      className="modal-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="WEAPON">Weapons & Small Arms</option>
                      <option value="VEHICLE">Combat & Logistics Vehicles</option>
                      <option value="AMMUNITION">Ammunition & Ordnance</option>
                      <option value="COMMUNICATION_EQUIPMENT">Radio & Comms Systems</option>
                      <option value="PROTECTIVE_EQUIPMENT">Armor & Protective Gear</option>
                      <option value="OTHER">General Military Supplies</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">Unit of Measure</label>
                    <input
                      type="text"
                      placeholder="e.g. units, rounds, boxes, liters"
                      className="modal-input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>

                  <div className="modal-form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={formData.isConsumable}
                        onChange={(e) => setFormData({ ...formData, isConsumable: e.target.checked })}
                      />
                      <span>Is Consumable (Ammo/Fuel/Rations)</span>
                    </label>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Specifications / Description</label>
                  <textarea
                    rows="3"
                    placeholder="Enter technical specifications, manufacturer, caliber or defense notes..."
                    className="modal-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT ASSET MODAL ==================== */}
      {showEditModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="modal-header-icon" style={{ background: 'rgba(36, 153, 255, 0.2)', color: 'var(--blue)' }}>
                <Edit2 className="w-4 h-4" />
              </div>
              <div className="modal-header-text">
                <h3>Edit Asset Specifications</h3>
                <p>Modify details for {selectedAsset?.code}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="modal-alert-error" style={{ margin: '0 20px 10px 20px' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="modal-alert-success" style={{ margin: '0 20px 10px 20px' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAsset}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label className="modal-label">Asset Name</label>
                  <input
                    type="text"
                    required
                    className="modal-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">Unique Code</label>
                    <input
                      type="text"
                      required
                      className="modal-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">Category</label>
                    <select
                      className="modal-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="WEAPON">Weapons & Small Arms</option>
                      <option value="VEHICLE">Combat & Logistics Vehicles</option>
                      <option value="AMMUNITION">Ammunition & Ordnance</option>
                      <option value="COMMUNICATION_EQUIPMENT">Radio & Comms Systems</option>
                      <option value="PROTECTIVE_EQUIPMENT">Armor & Protective Gear</option>
                      <option value="OTHER">General Military Supplies</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">Unit of Measure</label>
                    <input
                      type="text"
                      className="modal-input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">Operational Status</label>
                    <select
                      className="modal-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={formData.isConsumable}
                      onChange={(e) => setFormData({ ...formData, isConsumable: e.target.checked })}
                    />
                    <span>Is Consumable (Expendable Item)</span>
                  </label>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Specifications / Notes</label>
                  <textarea
                    rows="3"
                    className="modal-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE / DEACTIVATE CONFIRMATION MODAL ==================== */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <div className="modal-header-icon" style={{ background: 'rgba(255, 80, 101, 0.2)', color: 'var(--red)' }}>
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="modal-header-text">
                <h3>Deactivate Military Asset</h3>
                <p>Are you sure you want to mark this asset as inactive?</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
                Asset: <strong style={{ color: '#fff' }}>{selectedAsset?.name} ({selectedAsset?.code})</strong>
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '12.5px', marginTop: '8px' }}>
                Deactivating will prevent new purchase movements from referencing this asset. Existing transaction history and inventory logs will be preserved.
              </p>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={handleDeleteAsset}
                disabled={formLoading}
              >
                {formLoading ? 'Deactivating...' : 'Confirm Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AssetsPage;
