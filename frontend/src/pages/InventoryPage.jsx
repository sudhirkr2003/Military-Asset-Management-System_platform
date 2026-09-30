import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { RefreshCw } from 'lucide-react';

export const InventoryPage = () => {
  const [liveInventory, setLiveInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [bases, setBases] = useState([]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, basesRes] = await Promise.all([
        api.get('/inventory').catch(() => ({ data: { data: [] } })),
        api.get('/bases').catch(() => ({ data: { data: [] } })),
      ]);

      if (invRes.data?.data) {
        setLiveInventory(invRes.data.data);
      }
      if (basesRes.data?.data) {
        setBases(basesRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching inventory', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();

    const handleUpdate = () => fetchInventory();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, [fetchInventory]);

  const formatNumber = useCallback((val) => {
    return Number(val || 0).toLocaleString('en-US');
  }, []);

  const filteredInventory = useMemo(() => {
    return liveInventory.filter((inv) =>
      selectedBase === 'ALL' || String(inv.baseId) === String(selectedBase)
    );
  }, [liveInventory, selectedBase]);

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>▱ Base Stock & Live Inventory Breakdown</h2>
          <small>Track available stock, issued assignments, combat expenditures, and closing balances.</small>
        </div>
        <div className="view-panel-actions">
          <select
            value={selectedBase}
            onChange={(e) => setSelectedBase(e.target.value)}
            className="filter-select"
            aria-label="Filter by Base"
          >
            <option value="ALL">All Bases ({bases.length})</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={fetchInventory} disabled={loading} title="Refresh Inventory">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      <div className="view-table-card">
        <table>
          <thead>
            <tr>
              <th>Base Installation</th>
              <th>Equipment / Asset</th>
              <th>Category</th>
              <th>Opening Balance</th>
              <th>Available (Armory)</th>
              <th>Assigned (Personnel)</th>
              <th>Expended</th>
              <th>Total Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((inv) => (
                <tr key={inv.id || `${inv.baseId}-${inv.equipmentTypeId}`}>
                  <td><strong>{inv.baseName}</strong></td>
                  <td>{inv.equipmentName}</td>
                  <td>{inv.equipmentCategory || 'EQUIPMENT'}</td>
                  <td>{formatNumber(inv.openingBalance)}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 400 }}>
                    {formatNumber(inv.availableQuantity)}
                  </td>
                  <td style={{ color: 'var(--yellow)', fontWeight: 400 }}>
                    {formatNumber(inv.assignedQuantity)}
                  </td>
                  <td style={{ color: 'var(--red)' }}>
                    {formatNumber(inv.expendedQuantity)}
                  </td>
                  <td><strong>{formatNumber(inv.closingBalance)}</strong></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                  {loading ? 'Fetching live inventory...' : 'No inventory records found. Use "+ Record Movement" to procure assets into base armories.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default InventoryPage;
