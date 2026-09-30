import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  X,
  Building,
  Key,
  Lock
} from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const PersonnelPage = () => {
  const { user } = useAuth();
  const [personnelList, setPersonnelList] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);

  // If user is not ADMIN, show Access Denied / Clearance block
  if (user && user.role !== 'ADMIN') {
    return (
      <div className="view-panel-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '520px', margin: '0 auto', padding: '36px 28px', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'linear-gradient(145deg, #0f172a, #1e1b4b)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '20px', margin: '0 0 8px 0' }}>Classified Module • Access Restricted</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            Defense Personnel Roster & Officer Commissioning is strictly restricted to <strong>HQ Supreme Admin</strong>. Your current clearance level is <span className="pill pblue">{user?.role}</span>.
          </p>
          <NavLink to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Return to Authorized Dashboard →
          </NavLink>
        </div>
      </div>
    );
  }

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'LOGISTICS_OFFICER',
    baseId: '',
    status: 'ACTIVE',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchPersonnelAndBases = useCallback(async () => {
    setLoading(true);
    try {
      const [personnelRes, basesRes] = await Promise.all([
        api.get('/personnel'),
        api.get('/bases').catch(() => ({ data: { data: [] } })),
      ]);

      if (personnelRes.data?.data) {
        setPersonnelList(personnelRes.data.data);
      }
      if (basesRes.data?.data) {
        setBases(basesRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching personnel and bases', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonnelAndBases();
  }, [fetchPersonnelAndBases]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: '',
      username: '',
      email: '',
      password: '',
      role: 'LOGISTICS_OFFICER',
      baseId: bases[0]?.id ? String(bases[0].id) : '',
      status: 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (person) => {
    setSelectedPersonnel(person);
    setFormData({
      fullName: person.fullName || '',
      username: person.username || '',
      email: person.email || '',
      password: '',
      role: person.role || 'LOGISTICS_OFFICER',
      baseId: person.baseId ? String(person.baseId) : '',
      status: person.status || 'ACTIVE',
    });
    setFormError('');
    setFormSuccess('');
    setShowEditModal(true);
  };

  const handleOpenDelete = (person) => {
    setSelectedPersonnel(person);
    setShowDeleteModal(true);
  };

  const handleCreatePersonnel = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.fullName.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setFormError('Full Name, Username, Email, and Initial Password are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        baseId: formData.role === 'ADMIN' ? null : formData.baseId ? Number(formData.baseId) : null,
      };

      const res = await api.post('/personnel', payload);
      if (res.data?.success) {
        setFormSuccess('Military personnel registered successfully!');
        setTimeout(() => {
          setShowAddModal(false);
          fetchPersonnelAndBases();
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to register personnel');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdatePersonnel = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.fullName.trim() || !formData.email.trim()) {
      setFormError('Full Name and Email are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        baseId: formData.role === 'ADMIN' ? null : formData.baseId ? Number(formData.baseId) : null,
        status: formData.status,
        password: formData.password ? formData.password : null,
      };

      const res = await api.put(`/personnel/${selectedPersonnel.id}`, payload);
      if (res.data?.success) {
        setFormSuccess('Personnel record updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          fetchPersonnelAndBases();
        }, 1000);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to update personnel');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePersonnel = async () => {
    if (!selectedPersonnel) return;
    setFormLoading(true);
    try {
      await api.delete(`/personnel/${selectedPersonnel.id}`);
      setShowDeleteModal(false);
      fetchPersonnelAndBases();
    } catch (err) {
      alert('Error deactivating personnel: ' + (err.response?.data?.message || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  // Filtered list
  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      const matchesBase = selectedBase === 'ALL' || (p.baseId && String(p.baseId) === String(selectedBase));
      const matchesRole = selectedRole === 'ALL' || p.role === selectedRole;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchesSearch =
        searchTerm === '' ||
        p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.baseName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesBase && matchesRole && matchesStatus && matchesSearch;
    });
  }, [personnelList, selectedBase, selectedRole, selectedStatus, searchTerm]);

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'pred';
      case 'BASE_COMMANDER':
        return 'pgreen';
      case 'LOGISTICS_OFFICER':
        return 'pblue';
      default:
        return 'pyellow';
    }
  };

  return (
    <section className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>♙ Military Personnel & Officers Roster</h2>
          <small>
            Authorized commanders, armory logistics custodians, and security personnel deployed across bases.
          </small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={fetchPersonnelAndBases} disabled={loading} title="Refresh Personnel Roster">
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
          <button className="btn-primary" onClick={handleOpenAdd} title="Register Personnel">
            <UserPlus className="w-3.5 h-3.5 inline mr-1" /> <span className="btn-text">Register Personnel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini-Cards */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Roster</span>
            <span className="subpage-stat-val">{personnelList.length}</span>
            <span className="subpage-stat-badge blue">◈ Registered</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Users size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Base Commanders</span>
            <span className="subpage-stat-val" style={{ color: '#34d399' }}>
              {personnelList.filter((p) => p.role === 'BASE_COMMANDER').length}
            </span>
            <span className="subpage-stat-badge green">▲ Base Cmd</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <ShieldCheck size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Logistics Officers</span>
            <span className="subpage-stat-val" style={{ color: '#fbbf24' }}>
              {personnelList.filter((p) => p.role === 'LOGISTICS_OFFICER').length}
            </span>
            <span className="subpage-stat-badge yellow">◈ Logistics</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <Building size={15} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">HQ Admins</span>
            <span className="subpage-stat-val" style={{ color: '#c084fc' }}>
              {personnelList.filter((p) => p.role === 'ADMIN').length}
            </span>
            <span className="subpage-stat-badge purple">◈ Supreme HQ</span>
          </div>
          <div className="subpage-stat-icon-wrapper purple">
            <Shield size={15} />
          </div>
        </div>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search by name, service ID, email, or base..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            id: 'base',
            icon: Building,
            iconColor: 'var(--blue)',
            value: selectedBase,
            onChange: setSelectedBase,
            ariaLabel: 'Filter by Base',
            options: [
              { value: 'ALL', label: `All Bases & Depots (${bases.length})` },
              ...bases.map((b) => ({ value: b.id, label: b.name }))
            ]
          },
          {
            id: 'role',
            icon: Users,
            iconColor: 'var(--purple)',
            value: selectedRole,
            onChange: setSelectedRole,
            ariaLabel: 'Filter by Role',
            options: [
              { value: 'ALL', label: 'All Roles' },
              { value: 'ADMIN', label: 'HQ ADMIN' },
              { value: 'BASE_COMMANDER', label: 'BASE COMMANDER' },
              { value: 'LOGISTICS_OFFICER', label: 'LOGISTICS OFFICER' }
            ]
          },
          {
            id: 'status',
            icon: Shield,
            iconColor: 'var(--green)',
            value: selectedStatus,
            onChange: setSelectedStatus,
            ariaLabel: 'Filter by Status',
            options: [
              { value: 'ALL', label: 'All Status' },
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'INACTIVE', label: 'INACTIVE' }
            ]
          }
        ]}
        onRefresh={fetchPersonnelAndBases}
        loading={loading}
        refreshLabel="Refresh"
        hasActiveFilters={
          searchTerm !== '' ||
          selectedBase !== 'ALL' ||
          selectedRole !== 'ALL' ||
          selectedStatus !== 'ALL'
        }
        onReset={() => {
          setSearchTerm('');
          setSelectedBase('ALL');
          setSelectedRole('ALL');
          setSelectedStatus('ALL');
        }}
      />

      {/* Personnel Roster Table */}
      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>Service ID</th>
              <th>Full Name</th>
              <th>Military Role</th>
              <th>Assigned Base</th>
              <th>Official Email</th>
              <th>Operational Status</th>
              <th style={{ textAlign: 'right', minWidth: '70px', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  Loading military personnel roster...
                </td>
              </tr>
            ) : filteredPersonnel.length > 0 ? (
              filteredPersonnel.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong style={{ color: 'var(--blue)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                      {p.username}
                    </strong>
                  </td>
                  <td>
                    <strong>{p.fullName || p.username}</strong>
                  </td>
                  <td>
                    <b className={`pill ${getRoleBadgeClass(p.role)}`}>
                      {p.role?.replace('_', ' ')}
                    </b>
                  </td>
                  <td>
                    {p.baseName ? (
                      <span style={{ color: 'var(--text)', fontWeight: 400 }}>{p.baseName}</span>
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '10.5px' }}>National HQ Command</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--muted)', fontSize: '10.5px' }}>{p.email}</td>
                  <td>
                    <b className={`pill ${p.status === 'ACTIVE' ? 'pgreen' : 'pred'}`}>
                      {p.status || 'ACTIVE'}
                    </b>
                  </td>
                  <td style={{ textAlign: 'right', minWidth: '70px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '4px' }}>
                      <button
                        title="Edit Personnel"
                        onClick={() => handleOpenEdit(p)}
                        className="btn-action-edit"
                      >
                        <Edit2 size={11} />
                      </button>
                      {p.status === 'ACTIVE' && p.role !== 'ADMIN' && (
                        <button
                          title="Decommission Personnel"
                          onClick={() => handleOpenDelete(p)}
                          className="btn-action-delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                  No military personnel found matching the filters. Click <strong>+ Register Personnel</strong> to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ==================== REGISTER PERSONNEL MODAL ==================== */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #163644' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(22, 214, 157, 0.15)', color: '#16d69d', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Register Defense Personnel</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--muted)' }}>Deploy officer or logistics custodian into the military hierarchy</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-alert-error" style={{ margin: '14px 20px 0 20px' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="modal-alert-success" style={{ margin: '14px 20px 0 20px' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreatePersonnel}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label className="modal-label">
                    Full Name & Rank <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Major Vikram Rathore, Capt. Priya Verma"
                    className="modal-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">
                      Service Username / ID <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. vikram_rathore, ic_49102"
                      className="modal-input"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">
                      Official Email <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vikram@mams.mil"
                      className="modal-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">
                      Role & Clearance <span style={{ color: 'var(--red)' }}>*</span>
                    </label>
                    <select
                      className="modal-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="LOGISTICS_OFFICER">Logistics Officer (Armory Manager)</option>
                      <option value="BASE_COMMANDER">Base Commander (Commanding Officer)</option>
                      <option value="ADMIN">HQ Supreme Admin</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">
                      Assigned Base Installation {formData.role !== 'ADMIN' && <span style={{ color: 'var(--red)' }}>*</span>}
                    </label>
                    <select
                      className="modal-select"
                      disabled={formData.role === 'ADMIN'}
                      value={formData.baseId}
                      onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                    >
                      {formData.role === 'ADMIN' ? (
                        <option value="">National HQ Command (All Bases)</option>
                      ) : (
                        bases.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.location || b.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">
                    Initial Password <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters (e.g. Pass@123)"
                    className="modal-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={formLoading}>
                  {formLoading ? 'Registering...' : 'Register Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EDIT PERSONNEL MODAL ==================== */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #163644' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(36, 153, 255, 0.15)', color: '#38bdf8', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Edit Personnel Posting</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--muted)' }}>Modify posting and roles for {selectedPersonnel?.fullName || selectedPersonnel?.username}</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="modal-alert-error" style={{ margin: '14px 20px 0 20px' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="modal-alert-success" style={{ margin: '14px 20px 0 20px' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePersonnel}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label className="modal-label">Full Name & Title</label>
                  <input
                    type="text"
                    required
                    className="modal-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">Service Username (Locked)</label>
                    <input
                      type="text"
                      disabled
                      className="modal-input"
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      value={formData.username}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">Official Email</label>
                    <input
                      type="email"
                      required
                      className="modal-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="modal-form-group">
                    <label className="modal-label">Military Role</label>
                    <select
                      className="modal-select"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="LOGISTICS_OFFICER">Logistics Officer</option>
                      <option value="BASE_COMMANDER">Base Commander</option>
                      <option value="ADMIN">HQ Supreme Admin</option>
                    </select>
                  </div>

                  <div className="modal-form-group">
                    <label className="modal-label">Assigned Base</label>
                    <select
                      className="modal-select"
                      disabled={formData.role === 'ADMIN'}
                      value={formData.baseId}
                      onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                    >
                      {formData.role === 'ADMIN' ? (
                        <option value="">National HQ Command</option>
                      ) : (
                        bases.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

                  <div className="modal-form-group">
                    <label className="modal-label">Reset Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep current"
                      className="modal-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
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

      {/* ==================== DELETE / DECOMMISSION MODAL ==================== */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #163644' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(255, 80, 101, 0.15)', color: '#ff5065', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Deactivate Personnel</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--muted)' }}>Revoke system access for this officer?</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--muted)', fontSize: '12px', margin: 0 }}>
                Officer: <strong style={{ color: '#fff' }}>{selectedPersonnel?.fullName} ({selectedPersonnel?.username})</strong>
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '8px', lineHeight: 1.4 }}>
                Deactivating will revoke login authorization and system access. All past audit movements and transaction history logged by this officer will be preserved.
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
                onClick={handleDeletePersonnel}
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

export default PersonnelPage;
