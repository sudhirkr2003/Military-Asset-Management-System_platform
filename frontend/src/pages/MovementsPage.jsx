import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';

export const MovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchMovements = async () => {
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
  };

  useEffect(() => {
    fetchMovements();

    const handleUpdate = () => fetchMovements();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, []);

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  const types = ['ALL', 'PURCHASE', 'TRANSFER_OUT', 'TRANSFER_IN', 'ASSIGNMENT', 'RETURN', 'EXPENDITURE'];

  const filteredMovements = movements.filter((m) =>
    selectedType === 'ALL' || m.movementType === selectedType
  );

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
            className="modal-select"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={fetchMovements} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
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
                  <td>{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'N/A'}</td>
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
