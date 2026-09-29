import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Building,
  Plus,
  Search,
  RefreshCw,
  MapPin,
  UserCheck,
  Shield,
  Layers,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export const BasesPage = () => {
  const [bases, setBases] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    commanderName: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchBasesData = async () => {
    setLoading(true);
    try {
      const [basesRes, invRes] = await Promise.all([
        api.get('/bases'),
        api.get('/inventory').catch(() => ({ data: { data: [] } })),
      ]);

      if (basesRes.data?.data) {
        setBases(basesRes.data.data);
      }
      if (invRes.data?.data) {
        setInventories(invRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching bases and inventories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBasesData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: '',
      location: '',
      commanderName: '',
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleCreateBase = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setFormError('Base Name and Code are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        location: formData.location.trim() || null,
        commanderName: formData.commanderName.trim() || null,
      };

      const res = await api.post('/bases', payload);
      if (res.data?.success) {
        setFormSuccess('Military Base Installation registered successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          fetchBasesData();
          window.dispatchEvent(new Event('mams:movement_updated'));
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to create base');
    } finally {
      setFormLoading(false);
    }
  };

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  const filteredBases = bases.filter((b) => {
    return (
      searchTerm === '' ||
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.commanderName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <section className="view-panel-container">
      {/* Top Header */}
      <div className="view-panel-header">
        <div>
          <h2>⌖ Military Bases & Sector Command Installations</h2>
          <small>
            Strategic depots, operational forward bases, border sector armories, and commander assignments.
          </small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={fetchBasesData} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <Plus className="w-3.5 h-3.5 inline mr-1" /> + Register Installation
          </button>
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
          marginBottom: '1.25rem',
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
            placeholder="Search bases by name, code (e.g. ALP01), sector location, commander..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
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
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {filteredBases.length} Active Installations
        </span>
      </div>

      {/* Bases Grid */}
      <div className="catalog-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading military installations...</div>
        ) : filteredBases.length > 0 ? (
          filteredBases.map((b) => {
            const baseInv = inventories.filter((inv) => inv.baseId === b.id);
            const totalStock = baseInv.reduce((sum, inv) => sum + (Number(inv.availableQuantity) || 0), 0);
            const maxCap = 5000;
            const pct = Math.min(100, Math.round((totalStock / maxCap) * 100));

            return (
              <div key={b.id} className="catalog-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div className="catalog-icon" style={{ background: 'rgba(36, 153, 255, 0.15)', color: 'var(--blue)' }}>
                    <Building className="w-5 h-5" />
                  </div>
                  <span
                    className="pill pgreen"
                    style={{ fontSize: '10px', textTransform: 'uppercase' }}
                  >
                    {b.status || 'ACTIVE'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>{b.name}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield className="w-3.5 h-3.5 text-blue" style={{ color: 'var(--blue)' }} />
                    <span>Tactical Code: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{b.code}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin className="w-3.5 h-3.5 text-yellow" style={{ color: 'var(--yellow)' }} />
                    <span>Sector: <strong style={{ color: 'var(--text)' }}>{b.location || 'Northern Defense Command'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck className="w-3.5 h-3.5 text-green" style={{ color: 'var(--green)' }} />
                    <span>Commander: <strong style={{ color: 'var(--text)' }}>{b.commanderName || 'Assigned Officer'}</strong></span>
                  </div>
                </div>

                {/* Armory Progress Bar */}
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--muted)' }}>Armory In-Stock</span>
                    <strong style={{ color: '#fff' }}>{formatNumber(totalStock)} / {formatNumber(maxCap)} ({pct}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct > 80 ? 'var(--red)' : pct > 50 ? 'var(--yellow)' : 'var(--green)',
                        transition: 'width 0.3s ease',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>No military installations found.</div>
        )}
      </div>

      {/* ==================== REGISTER BASE MODAL ==================== */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-header-icon">
                <Building className="w-4 h-4" />
              </div>
              <div className="modal-header-text">
                <h3>Register Defense Installation</h3>
                <p>Add new military base, logistics depot, or forward operating sector</p>
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

            <form onSubmit={handleCreateBase}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label className="modal-label">
                    Base Installation Name <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delta Airbase, Western Armor Depot"
                    className="modal-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">
                      Tactical Code <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DLT01, WAD02"
                      className="modal-input"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">Sector / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Ladakh Sector, Rajasthan Border"
                      className="modal-input"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Commanding Officer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Brig. General Sandeep Joshi"
                    className="modal-input"
                    value={formData.commanderName}
                    onChange={(e) => setFormData({ ...formData, commanderName: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Registering...' : 'Register Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default BasesPage;
