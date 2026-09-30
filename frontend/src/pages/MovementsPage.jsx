import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { RefreshCw, Building, Shield, Search, ArrowRightLeft, Calendar } from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const MovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const [movRes, baseRes] = await Promise.all([
        api.get('/movements'),
        api.get('/bases').catch(() => ({ data: { data: [] } })),
      ]);
      if (movRes.data?.data) {
        setMovements(movRes.data.data);
      }
      if (baseRes.data?.data) {
        setBases(baseRes.data.data);
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
    () => [
      { value: 'ALL', label: 'All Movement Types' },
      { value: 'PURCHASE', label: 'Purchases (Procurement)' },
      { value: 'TRANSFER_OUT', label: 'Outgoing Transfers' },
      { value: 'TRANSFER_IN', label: 'Incoming Transfers' },
      { value: 'ASSIGNMENT', label: 'Personnel Assignments' },
      { value: 'RETURN', label: 'Armory Returns' },
      { value: 'EXPENDITURE', label: 'Munitions Expended' },
    ],
    []
  );

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchType = selectedType === 'ALL' || m.movementType === selectedType;
      const matchBase = selectedBase === 'ALL' || String(m.baseId) === String(selectedBase);
      const matchSearch =
        !searchQuery ||
        m.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.baseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.referenceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.createdBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(m.id).includes(searchQuery);

      let matchDate = true;
      if (startDate && m.timestamp) {
        matchDate = matchDate && new Date(m.timestamp) >= new Date(startDate);
      }
      if (endDate && m.timestamp) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && new Date(m.timestamp) <= eDate;
      }

      return matchType && matchBase && matchSearch && matchDate;
    });
  }, [movements, selectedType, selectedBase, searchQuery, startDate, endDate]);

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>↔ Movements & Transaction Ledger</h2>
          <small>Audit trail of all asset procurement, base-to-base transfers, personnel assignments, and ammunition expenditures.</small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={fetchMovements} disabled={loading} title="Refresh Movements">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search movements by ID, asset, base, notes..."
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
            id: 'movementType',
            icon: ArrowRightLeft,
            iconColor: 'var(--yellow)',
            value: selectedType,
            onChange: setSelectedType,
            ariaLabel: 'Filter by Movement Type',
            options: types
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
        onRefresh={fetchMovements}
        loading={loading}
        refreshLabel="Refresh"
        hasActiveFilters={
          selectedBase !== 'ALL' ||
          selectedType !== 'ALL' ||
          Boolean(startDate) ||
          Boolean(endDate) ||
          Boolean(searchQuery)
        }
        onReset={() => {
          setSelectedBase('ALL');
          setSelectedType('ALL');
          setStartDate('');
          setEndDate('');
          setSearchQuery('');
        }}
      />

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
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600 }}>
                      {m.id}
                    </strong>
                  </td>
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
                  <td>
                    <span className="pill pblue" style={{ fontSize: '10px' }}>
                      {m.equipmentCategory || 'EQUIPMENT'}
                    </span>
                  </td>
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
                      style={{ fontSize: '10px' }}
                    >
                      {m.movementType}
                    </b>
                  </td>
                  <td><strong>{formatNumber(m.quantity)}</strong></td>
                  <td style={{ color: 'var(--muted)' }}>{m.remarks || m.referenceType || '-'}</td>
                  <td style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{m.createdBy || 'ADMIN'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  {loading ? 'Fetching movement ledger...' : 'No movement transactions found for the selected filters.'}
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
