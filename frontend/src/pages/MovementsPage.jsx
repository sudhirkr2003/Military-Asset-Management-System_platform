import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';

export const MovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/movements');
      if (res.data?.data) {
        setMovements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching movements', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();

    const handleUpdate = () => fetchMovements();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, [fetchMovements]);

  const formatNumber = useCallback((val) => {
    return Number(val || 0).toLocaleString('en-US');
  }, []);

  const types = useMemo(
    () => ['ALL', 'PURCHASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ASSIGNMENT', 'RETURN', 'EXPENDITURE'],
    []
  );

  const filteredMovements = useMemo(() => {
    return movements.filter((m) =>
      selectedType === 'ALL' || m.movementType === selectedType
    );
  }, [movements, selectedType]);

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>↔ Movements & Transaction Ledger</h2>
          <small>Audit trail of all asset procurement, base-to-base transfers, personnel assignments, and ammunition expenditures.</small>
        </div>
        <div className="view-panel-actions">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
            aria-label="Filter by Movement Type"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={fetchMovements} disabled={loading} title="Refresh Movements">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Base</th>
              <th>Equipment</th>
              <th>Category</th>
              <th>Movement Type</th>
              <th>Quantity</th>
              <th>Reference / Remarks</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length > 0 ? (
              filteredMovements.map((m) => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
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
                  <td><strong>{m.baseName}</strong></td>
                  <td>{m.equipmentName}</td>
                  <td>{m.equipmentCategory || 'EQUIPMENT'}</td>
                  <td>
                    <b
                      className={`pill ${
                        m.movementType === 'PURCHASE'
                          ? 'pgreen'
                          : m.movementType.includes('TRANSFER')
                          ? 'pblue'
                          : m.movementType === 'EXPENDITURE'
                          ? 'pyellow'
                          : 'ppurple'
                      }`}
                    >
                      {m.movementType}
                    </b>
                  </td>
                  <td><strong>{formatNumber(m.quantity)}</strong></td>
                  <td>{m.remarks || m.referenceType || '-'}</td>
                  <td>{m.createdBy || 'ADMIN'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  {loading ? 'Fetching movement ledger...' : 'No movement transactions recorded. Use "+ Record Movement" button on top to create one.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MovementsPage;
