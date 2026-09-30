import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { apiCache } from '../services/api';
import {
  RefreshCw,
  Building2,
  Crosshair,
  Package,
  Users,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Flame,
  UserCheck,
  Search
} from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const InventoryPage = () => {
  const [liveInventory, setLiveInventory] = useState(() => {
    return apiCache.get('get:inventory')?.data?.data || [];
  });
  const [bases, setBases] = useState(() => {
    return apiCache.get('get:bases')?.data?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    return !apiCache.has('get:inventory');
  });
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh && liveInventory.length === 0) {
      setLoading(true);
    }
    try {
      const config = isManualRefresh ? { forceRefresh: true } : {};
      const [invRes, basesRes] = await Promise.all([
        api.get('/inventory', config).catch(() => ({ data: { data: [] } })),
        api.get('/bases', config).catch(() => ({ data: { data: [] } })),
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
  }, [liveInventory.length]);

  useEffect(() => {
    fetchInventory();

    const handleUpdate = () => fetchInventory(true);
    window.addEventListener('mams:data_updated', handleUpdate);
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:data_updated', handleUpdate);
      window.removeEventListener('mams:movement_updated', handleUpdate);
    };
  }, [fetchInventory]);

  const formatNumber = useCallback((val) => {
    return Number(val || 0).toLocaleString('en-US');
  }, []);

  const categories = useMemo(
    () => [
      { value: 'ALL', label: 'All Categories' },
      { value: 'WEAPON', label: 'Weapons & Armaments' },
      { value: 'VEHICLE', label: 'Combat & Transport Vehicles' },
      { value: 'AMMUNITION', label: 'Ammunition & Munitions' },
      { value: 'COMMUNICATION', label: 'Radio & Signals' },
      { value: 'GEAR', label: 'Tactical Gear & Armor' },
    ],
    []
  );

  const filteredInventory = useMemo(() => {
    return liveInventory.filter((inv) => {
      const matchBase = selectedBase === 'ALL' || String(inv.baseId) === String(selectedBase);
      const matchCat =
        selectedCategory === 'ALL' ||
        String(inv.equipmentCategory || '').toUpperCase() === selectedCategory;
      const matchSearch =
        !searchQuery ||
        inv.equipmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.baseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(inv.equipmentTypeId).includes(searchQuery);

      return matchBase && matchCat && matchSearch;
    });
  }, [liveInventory, selectedBase, selectedCategory, searchQuery]);

  // Inventory Totals
  const totals = useMemo(() => {
    return filteredInventory.reduce(
      (acc, item) => ({
        opening: acc.opening + (Number(item.openingBalance) || 0),
        available: acc.available + (Number(item.availableQuantity) || 0),
        assigned: acc.assigned + (Number(item.assignedQuantity) || 0),
        expended: acc.expended + (Number(item.expendedQuantity) || 0),
        closing: acc.closing + (Number(item.closingBalance) || 0),
      }),
      { opening: 0, available: 0, assigned: 0, expended: 0, closing: 0 }
    );
  }, [filteredInventory]);

  const getCategoryBadgeClass = (category) => {
    const cat = String(category || '').toUpperCase();
    if (cat.includes('WEAPON')) return 'cat-badge-green';
    if (cat.includes('VEHICLE')) return 'cat-badge-blue';
    if (cat.includes('AMMO')) return 'cat-badge-yellow';
    if (cat.includes('COMM')) return 'cat-badge-purple';
    return 'cat-badge-pink';
  };

  return (
    <section className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>▱ Base Stock & Live Inventory Breakdown</h2>
          <small>Real-time armory telemetry, deployed troop assignments, expenditures, and verified closing stock.</small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={() => fetchInventory(true)} disabled={loading} title="Refresh Inventory">
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Available In Armory</span>
            <span className="subpage-stat-val" style={{ color: 'var(--green)' }}>{formatNumber(totals.available)}</span>
            <span className="subpage-stat-badge green">✓ Combat Ready</span>
          </div>
          <div className="subpage-stat-icon-wrapper green">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Assigned In Field</span>
            <span className="subpage-stat-val" style={{ color: 'var(--yellow)' }}>{formatNumber(totals.assigned)}</span>
            <span className="subpage-stat-badge yellow">⚡ With Troops</span>
          </div>
          <div className="subpage-stat-icon-wrapper yellow">
            <UserCheck size={16} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Expended (Used)</span>
            <span className="subpage-stat-val" style={{ color: 'var(--red)' }}>{formatNumber(totals.expended)}</span>
            <span className="subpage-stat-badge red">🔥 Consumed</span>
          </div>
          <div className="subpage-stat-icon-wrapper red">
            <Flame size={16} />
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Closing Balance</span>
            <span className="subpage-stat-val" style={{ color: 'var(--blue)' }}>{formatNumber(totals.closing)}</span>
            <span className="subpage-stat-badge blue">🛡️ Net Position</span>
          </div>
          <div className="subpage-stat-icon-wrapper blue">
            <Layers size={16} />
          </div>
        </div>
      </div>

      {/* Unified Filter & Search Toolbar */}
      <UnifiedFilterToolbar
        searchPlaceholder="Search inventory by equipment, base, code..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            id: 'base',
            icon: Building2,
            iconColor: 'var(--blue)',
            value: selectedBase,
            onChange: setSelectedBase,
            ariaLabel: 'Filter by Base Installation',
            options: [
              { value: 'ALL', label: `All Bases (${bases.length})` },
              ...bases.map((b) => ({ value: b.id, label: b.name }))
            ]
          },
          {
            id: 'category',
            icon: Crosshair,
            iconColor: 'var(--yellow)',
            value: selectedCategory,
            onChange: setSelectedCategory,
            ariaLabel: 'Filter by Category',
            options: categories
          }
        ]}
        onRefresh={() => fetchInventory(true)}
        loading={loading}
        refreshLabel="Refresh"
        hasActiveFilters={
          selectedBase !== 'ALL' ||
          selectedCategory !== 'ALL' ||
          Boolean(searchQuery)
        }
        onReset={() => {
          setSelectedBase('ALL');
          setSelectedCategory('ALL');
          setSearchQuery('');
        }}
      />

      {/* Rich Table Card */}
      <div className="view-table-card">
        <table className="inventory-rich-table">
          <thead>
            <tr>
              <th style={{ minWidth: '130px' }}>Base Installation</th>
              <th style={{ minWidth: '180px' }}>Equipment / Asset</th>
              <th style={{ width: '120px' }}>Category</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Opening Stock</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Available (Armory)</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Assigned (Troops)</th>
              <th style={{ width: '90px', textAlign: 'right' }}>Expended</th>
              <th style={{ width: '130px', textAlign: 'right' }}>Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((inv) => (
                <tr key={inv.id || `${inv.baseId}-${inv.equipmentTypeId}`} className="inventory-row">
                  <td>
                    <div className="inv-base-cell">
                      <div className="inv-icon-badge blue">
                        <Building2 size={13} />
                      </div>
                      <strong className="inv-base-name">{inv.baseName || 'Central Depot'}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="inv-asset-cell">
                      <div className="inv-icon-badge green">
                        <Crosshair size={13} />
                      </div>
                      <div className="inv-asset-info">
                        <strong className="inv-asset-name">{inv.equipmentName || `Asset ${inv.equipmentTypeId}`}</strong>
                        <span className="inv-asset-code">CODE: EQ-{inv.equipmentTypeId || '00'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`category-pill ${getCategoryBadgeClass(inv.equipmentCategory)}`}>
                      {inv.equipmentCategory || 'WEAPON'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>
                    {formatNumber(inv.openingBalance)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="stock-qty-badge green">
                      {formatNumber(inv.availableQuantity)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`stock-qty-badge ${inv.assignedQuantity > 0 ? 'yellow' : 'muted'}`}>
                      {formatNumber(inv.assignedQuantity)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`stock-qty-badge ${inv.expendedQuantity > 0 ? 'red' : 'muted'}`}>
                      {formatNumber(inv.expendedQuantity)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="stock-qty-badge blue" style={{ fontWeight: 700 }}>
                      {formatNumber(inv.closingBalance)}
                    </strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  {loading ? 'Fetching live inventory...' : 'No inventory records found for selected criteria.'}
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
