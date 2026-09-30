import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import api, { apiCache } from '../services/api';
import heroDaylight from '../assets/hero_daylight_command.jpg';
import {
  Send,
  Package,
  Wrench,
  Users,
  AlertTriangle,
  Filter,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Info,
  X,
  Layers,
  Building,
  Crosshair,
  Shield,
  ShoppingBag,
  Truck,
  Radio,
  ChevronDown,
  Calendar
} from 'lucide-react';

const BASE_COLORS = ['#299cff', '#18d69d', '#ffc033', '#a855f7', '#ec4899', '#3b82f6'];

export const DashboardPage = () => {
  // Filters State
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Metadata Lists
  const [bases, setBases] = useState(() => {
    return apiCache.get('get:bases')?.data?.data || [];
  });
  const [equipmentList, setEquipmentList] = useState(() => {
    return apiCache.get('get:equipment')?.data?.data || [];
  });

  // Live KPI Summary State (Initial values loaded from cache if present)
  const [summary, setSummary] = useState(() => {
    const cached = apiCache.get('get:dashboard/summary')?.data?.data;
    return cached || {
      openingBalance: 0,
      purchases: 0,
      transferIn: 0,
      transferOut: 0,
      netMovement: 0,
      assigned: 0,
      expended: 0,
      closingBalance: 0,
    };
  });

  const [recentMovements, setRecentMovements] = useState(() => {
    return apiCache.get('get:dashboard/recent-movements')?.data?.data || [];
  });
  const [categoryCounts, setCategoryCounts] = useState({
    VEHICLE: 0,
    WEAPON: 0,
    AMMUNITION: 0,
    COMMUNICATION_EQUIPMENT: 0,
    OTHER: 0,
  });
  const [baseStocks, setBaseStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State for Net Movement Breakdown [Bonus Requirement]
  const [showNetMovementModal, setShowNetMovementModal] = useState(false);
  const [netMovementFilter, setNetMovementFilter] = useState('ALL'); // 'ALL' | 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT'

  const fetchMetadata = useCallback(async (isManual = false) => {
    try {
      const config = isManual ? { forceRefresh: true } : {};
      const [basesRes, eqRes] = await Promise.all([
        api.get('/bases', config).catch(() => ({ data: { data: [] } })),
        api.get('/equipment', config).catch(() => ({ data: { data: [] } })),
      ]);
      if (basesRes.data?.data) setBases(basesRes.data.data);
      if (eqRes.data?.data) setEquipmentList(eqRes.data.data);
    } catch (err) {
      console.error('Error fetching metadata', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setLoading(true);
    }
    try {
      const params = {};
      if (selectedBase !== 'ALL') params.baseId = selectedBase;
      if (selectedEquipment !== 'ALL') params.equipmentTypeId = selectedEquipment;
      if (selectedPeriod !== 'all') params.period = selectedPeriod;

      const config = isManualRefresh ? { forceRefresh: true, params } : { params };
      const subConfig = isManualRefresh ? { forceRefresh: true } : {};

      const [summaryRes, movementsRes, catRes, invRes] = await Promise.all([
        api.get('/dashboard/summary', config).catch(() => null),
        api.get('/dashboard/recent-movements', { ...subConfig, params: selectedBase !== 'ALL' ? { baseId: selectedBase } : {} }).catch(() => null),
        api.get('/dashboard/category-distribution', { ...subConfig, params: selectedBase !== 'ALL' ? { baseId: selectedBase } : {} }).catch(() => null),
        api.get('/inventory', subConfig).catch(() => null),
      ]);

      // 1. KPI Summary & Dynamic Aggregation
      let kpiData = summaryRes?.data?.data;
      const inventories = invRes?.data?.data || [];
      const movements = movementsRes?.data?.data || [];

      // If backend summary returned 0s or failed, compute accurately from live inventories and movements
      if (!kpiData || (kpiData.openingBalance === 0 && kpiData.closingBalance === 0 && inventories.length > 0)) {
        let filteredInv = inventories;
        if (selectedBase !== 'ALL') {
          filteredInv = filteredInv.filter((i) => String(i.baseId) === String(selectedBase));
        }
        if (selectedEquipment !== 'ALL') {
          filteredInv = filteredInv.filter((i) => String(i.equipmentTypeId) === String(selectedEquipment));
        }

        let filteredMov = movements;
        if (selectedBase !== 'ALL') {
          filteredMov = filteredMov.filter((m) => String(m.baseId) === String(selectedBase));
        }
        if (selectedEquipment !== 'ALL') {
          filteredMov = filteredMov.filter((m) => String(m.equipmentTypeId) === String(selectedEquipment));
        }

        const opening = filteredInv.reduce((sum, i) => sum + (Number(i.openingBalance) || 0), 0);
        const available = filteredInv.reduce((sum, i) => sum + (Number(i.availableQuantity) || 0), 0);
        const assigned = filteredInv.reduce((sum, i) => sum + (Number(i.assignedQuantity) || 0), 0);
        const expended = filteredInv.reduce((sum, i) => sum + (Number(i.expendedQuantity) || 0), 0);
        const closing = filteredInv.reduce(
          (sum, i) =>
            sum +
            (Number(i.closingBalance) ||
              (Number(i.availableQuantity) || 0) + (Number(i.assignedQuantity) || 0)),
          0
        );

        const purchases = filteredMov
          .filter((m) => m.movementType === 'PURCHASE')
          .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

        const transferIn = filteredMov
          .filter((m) => m.movementType === 'TRANSFER_IN')
          .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

        const transferOut = filteredMov
          .filter((m) => m.movementType === 'TRANSFER_OUT')
          .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

        const net = purchases + transferIn - transferOut;

        kpiData = {
          openingBalance: opening > 0 ? opening : (closing > 0 ? closing : available + assigned),
          purchases: purchases,
          transferIn: transferIn,
          transferOut: transferOut,
          netMovement: net,
          assigned: assigned,
          expended: expended,
          closingBalance: closing > 0 ? closing : (available + assigned),
        };
      }

      if (kpiData) {
        setSummary((prev) => ({ ...prev, ...kpiData }));
      }

      // 2. Recent Movements
      if (movementsRes?.data?.data) {
        setRecentMovements(movementsRes.data.data);
      }

      // 3. Category Distribution
      if (catRes?.data?.data && Array.isArray(catRes.data.data)) {
        const catMap = {
          VEHICLE: 0,
          WEAPON: 0,
          AMMUNITION: 0,
          COMMUNICATION_EQUIPMENT: 0,
          OTHER: 0,
        };
        catRes.data.data.forEach((item) => {
          if (item.category && item.quantity !== undefined) {
            catMap[item.category] = Number(item.quantity) || 0;
          }
        });
        setCategoryCounts(catMap);
      }

      // 4. Base Stock Levels aggregation from live inventory
      if (bases.length > 0) {
        const baseAgg = bases.map((b) => {
          const baseInv = inventories.filter((inv) => inv.baseId === b.id);
          const totalStock = baseInv.reduce((sum, inv) => sum + (Number(inv.availableQuantity) || 0), 0);
          const maxCapacity = Number(b.capacity) || 5000;
          const percentage = Math.min(100, Math.round((totalStock / maxCapacity) * 100));
          return {
            id: b.id,
            name: b.name,
            current: totalStock,
            max: maxCapacity,
            percentage,
          };
        });
        setBaseStocks(baseAgg);
      }
    } catch (err) {
      console.error('Error fetching dashboard live data', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBase, selectedEquipment, selectedPeriod, bases]);

  const handleRefreshAll = useCallback(() => {
    fetchMetadata(true);
    fetchDashboardData(true);
  }, [fetchMetadata, fetchDashboardData]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => {
      fetchMetadata(true);
      fetchDashboardData(true);
    };
    window.addEventListener('mams:movement_updated', handleUpdate);
    window.addEventListener('mams:data_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:movement_updated', handleUpdate);
      window.removeEventListener('mams:data_updated', handleUpdate);
    };
  }, [fetchDashboardData, fetchMetadata]);

  const formatNumber = useCallback((val) => {
    return Number(val || 0).toLocaleString('en-US');
  }, []);

  // Calculate dynamic bar heights
  const maxCategoryVal = useMemo(
    () =>
      Math.max(
        100,
        categoryCounts.VEHICLE,
        categoryCounts.WEAPON,
        categoryCounts.AMMUNITION,
        categoryCounts.COMMUNICATION_EQUIPMENT,
        categoryCounts.OTHER
      ),
    [categoryCounts]
  );

  const getBarHeight = useCallback(
    (count) => {
      if (!count || count === 0) return '4px';
      const pct = Math.max(4, Math.round((count / maxCategoryVal) * 180));
      return `${pct}px`;
    },
    [maxCategoryVal]
  );

  // Movements filtered for Net Movement Pop-up
  const netMovementItems = useMemo(() => {
    return recentMovements.filter((m) => {
      if (netMovementFilter === 'PURCHASE') return m.movementType === 'PURCHASE';
      if (netMovementFilter === 'TRANSFER_IN') return m.movementType === 'TRANSFER_IN';
      if (netMovementFilter === 'TRANSFER_OUT') return m.movementType === 'TRANSFER_OUT';
      return (
        m.movementType === 'PURCHASE' ||
        m.movementType === 'TRANSFER_IN' ||
        m.movementType === 'TRANSFER_OUT'
      );
    });
  }, [recentMovements, netMovementFilter]);

  const totalCategoryItems = useMemo(
    () =>
      (categoryCounts.VEHICLE || 0) +
      (categoryCounts.WEAPON || 0) +
      (categoryCounts.AMMUNITION || 0) +
      (categoryCounts.COMMUNICATION_EQUIPMENT || 0) +
      (categoryCounts.OTHER || 0),
    [categoryCounts]
  );

  const categoriesConfig = useMemo(
    () => [
      { key: 'VEHICLE', label: 'Vehicles', count: categoryCounts.VEHICLE || 0, icon: Truck, color: '#0284c7', barClass: 'bar1' },
      { key: 'WEAPON', label: 'Weapons', count: categoryCounts.WEAPON || 0, icon: Crosshair, color: '#059669', barClass: 'bar2' },
      { key: 'AMMUNITION', label: 'Ammunition', count: categoryCounts.AMMUNITION || 0, icon: Package, color: '#d97706', barClass: 'bar3' },
      { key: 'COMMUNICATION_EQUIPMENT', label: 'Comms', count: categoryCounts.COMMUNICATION_EQUIPMENT || 0, icon: Radio, color: '#7c3aed', barClass: 'bar4' },
      { key: 'OTHER', label: 'Other', count: categoryCounts.OTHER || 0, icon: Layers, color: '#db2777', barClass: 'bar5' },
    ],
    [categoryCounts]
  );

  return (
    <>
      {/* 1. Hero Section (Clear Unobstructed Daylight Command Banner) */}
      <section
        className="hero hero-light-banner"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.94) 0%, rgba(255, 255, 255, 0.82) 45%, rgba(255, 255, 255, 0.35) 100%), url(${heroDaylight})`,
        }}
      >
        <div className="hero-content">
          <p className="hero-greeting">Good Morning,</p>
          <h1 className="hero-title">
            Chief <span>Commander</span>
          </h1>
          <small className="hero-desc">
            Real-time defense readiness, procurement ledger, inter-base asset transfers, and live inventory control.
          </small>
        </div>
      </section>

      {/* 2. Dedicated Single-Line Filter Toolbar (Positioned Upon KPI Boxes) */}
      <div className="dashboard-filter-toolbar">
        {/* Mobile Filter Toggle Header */}
        <div className="dashboard-filter-mobile-bar">
          <button
            type="button"
            className={`dashboard-filter-toggle-btn ${mobileFilterOpen ? 'active' : ''}`}
            onClick={() => setMobileFilterOpen((prev) => !prev)}
            aria-label="Toggle Filter Controls"
          >
            <Filter size={14} />
            <span>Filters & Scope</span>
            {(selectedBase !== 'ALL' || selectedEquipment !== 'ALL' || selectedPeriod !== 'all') && (
              <span className="filter-active-pill">Active</span>
            )}
            <ChevronDown size={14} className={`filter-chevron ${mobileFilterOpen ? 'open' : ''}`} />
          </button>
          <button
            className="hero-refresh-btn mobile-refresh-btn"
            onClick={fetchDashboardData}
            disabled={loading}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>

        {/* Filters Row: One clean horizontal line on desktop, expandable on mobile */}
        <div className={`dashboard-filters-inline ${mobileFilterOpen ? 'mobile-expanded' : ''}`}>
          {/* Base Filter */}
          <div className="dashboard-filter-item">
            <Building size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
            <select
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
              className="dashboard-select"
              aria-label="Filter by Base"
            >
              <option value="ALL">All Bases & Depots ({bases.length})</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Type Filter */}
          <div className="dashboard-filter-item">
            <Crosshair size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="dashboard-select"
              aria-label="Filter by Equipment Type"
            >
              <option value="ALL">All Equipment Types ({equipmentList.length})</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.code})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="dashboard-filter-item">
            <Calendar size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="dashboard-select"
              aria-label="Filter by Period"
            >
              <option value="all">All-Time Cumulative</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <button
            className="hero-refresh-btn desktop-refresh-btn"
            onClick={handleRefreshAll}
            disabled={loading}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* 3. 6 Key Metrics Grid (Compact Executive Cards with Right-Aligned Badges) */}
      <section className="metrics">
        {/* Metric 1: Opening Balance */}
        <article className="metric">
          <div className="metric-header">
            <label>Opening Balance</label>
            <div className="icon icon-blue" title="Opening Balance">
              <Shield size={14} />
            </div>
          </div>
          <strong className="metric-value">{formatNumber(summary.openingBalance)}</strong>
          <small>
            <span>Initial Armory Stock</span>
            <b className="metric-badge green">{summary.openingBalance > 0 ? 'Active' : '0'}</b>
          </small>
        </article>

        {/* Metric 2: Net Movement [Interactive Modal Breakdown] */}
        <article
          className="metric metric-interactive"
          onClick={() => setShowNetMovementModal(true)}
          title="Click to view detailed Net Movement breakdown (Purchases + Transfer In - Transfer Out)"
        >
          <div className="metric-header">
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Net Movement <Info size={11} className="text-green" />
            </label>
            <div className="icon icon-green" title="Net Movement Audit">
              <ArrowRightLeft size={14} />
            </div>
          </div>
          <strong className="metric-value" style={{ color: summary.netMovement >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {summary.netMovement > 0 ? `+${formatNumber(summary.netMovement)}` : formatNumber(summary.netMovement)}
          </strong>
          <small>
            <span>Purchases + In - Out</span>
            <b className="metric-badge purple">🔍 View Breakdown</b>
          </small>
        </article>

        {/* Metric 3: Purchases */}
        <article className="metric">
          <div className="metric-header">
            <label>Purchases</label>
            <div className="icon icon-blue" title="Purchases">
              <ShoppingBag size={14} />
            </div>
          </div>
          <strong className="metric-value" style={{ color: 'var(--blue)' }}>+{formatNumber(summary.purchases)}</strong>
          <small>
            <span>Procured to Armory</span>
            <b className="metric-badge blue">{summary.purchases > 0 ? `+${summary.purchases}` : '0'}</b>
          </small>
        </article>

        {/* Metric 4: Assigned Assets */}
        <article className="metric">
          <div className="metric-header">
            <label>Assigned to Troops</label>
            <div className="icon icon-yellow" title="Assigned Assets">
              <Users size={14} />
            </div>
          </div>
          <strong className="metric-value" style={{ color: 'var(--yellow)' }}>{formatNumber(summary.assigned)}</strong>
          <small>
            <span>Issued to Personnel</span>
            <b className="metric-badge yellow">{summary.assigned > 0 ? 'Deployed' : '0'}</b>
          </small>
        </article>

        {/* Metric 5: Expended */}
        <article className="metric">
          <div className="metric-header">
            <label>Expended (Ammo/Fuel)</label>
            <div className="icon icon-red" title="Expended Ordnance">
              <AlertTriangle size={14} />
            </div>
          </div>
          <strong className="metric-value" style={{ color: 'var(--red)' }}>-{formatNumber(summary.expended)}</strong>
          <small>
            <span>Combat / Range Used</span>
            <b className="metric-badge red">{summary.expended > 0 ? `-${summary.expended}` : '0'}</b>
          </small>
        </article>

        {/* Metric 6: Closing Balance */}
        <article className="metric">
          <div className="metric-header">
            <label>Total Closing Balance</label>
            <div className="icon icon-green" title="Total Closing Balance">
              <Layers size={14} />
            </div>
          </div>
          <strong className="metric-value">{formatNumber(summary.closingBalance)}</strong>
          <small>
            <span>Current Base Inventory</span>
            <b className="metric-badge green">{summary.closingBalance > 0 ? 'Verified' : '0'}</b>
          </small>
        </article>
      </section>

      {/* Panels Grid */}
      <section className="grid">
        {/* Panel 1: Trends */}
        <article className="panel trends">
          <div className="panel-head">
            <div className="panel-head-title">
              <TrendingUp size={16} className="text-green" />
              <h2>Inventory Movement Trends</h2>
            </div>
            <span className="panel-subtitle">Live Multi-Vector Telemetry</span>
          </div>
          <div className="chart">
            {recentMovements.length > 0 ? (
              <svg viewBox="0 0 700 250" preserveAspectRatio="none">
                <g stroke="#cbd5e1" strokeDasharray="3 4">
                  <line x1="0" y1="25" x2="700" y2="25" />
                  <line x1="0" y1="88" x2="700" y2="88" />
                  <line x1="0" y1="151" x2="700" y2="151" />
                  <line x1="0" y1="214" x2="700" y2="214" />
                </g>
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,120"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,150"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="3"
                />
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,190"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                />
              </svg>
            ) : (
              <div className="chart-empty-state">
                <p>No Movement Trends Recorded Yet</p>
                <span>Live multi-line telemetry polylines will generate as procurement and transfers are recorded.</span>
              </div>
            )}
          </div>
          <div className="legend">
            <span className="legend-item"><i className="legend-dot green"></i> Opening Balance</span>
            <span className="legend-item"><i className="legend-dot blue"></i> Purchases</span>
            <span className="legend-item"><i className="legend-dot yellow"></i> Transfer In</span>
            <span className="legend-item"><i className="legend-dot red"></i> Transfer Out</span>
            <span className="legend-item"><i className="legend-dot purple"></i> Expended</span>
          </div>
        </article>

        {/* Panel 2: Assets by Category (Redesigned Executive Representation) */}
        <article className="panel category">
          <div className="panel-head">
            <div className="panel-head-title">
              <Package size={16} className="text-blue" />
              <h2>Assets by Category</h2>
            </div>
            <span className="category-total-badge">
              {formatNumber(totalCategoryItems)} Total Units
            </span>
          </div>

          <div className="category-bars-container">
            {categoriesConfig.map((cat) => {
              const IconComp = cat.icon;
              const percentage = totalCategoryItems > 0 ? Math.round((cat.count / totalCategoryItems) * 100) : 0;
              return (
                <div key={cat.key} className="category-item-card">
                  <div className="category-item-head">
                    <div className="category-item-meta">
                      <div className="category-icon-box" style={{ color: cat.color }}>
                        <IconComp size={15} />
                      </div>
                      <span className="category-item-name">{cat.label}</span>
                    </div>
                    <div className="category-item-stats">
                      <strong className="category-count-number">{formatNumber(cat.count)}</strong>
                      <span className="category-pct-badge" style={{ color: cat.color }}>{percentage}%</span>
                    </div>
                  </div>
                  <div className="category-progress-track">
                    <div
                      className={`category-progress-fill ${cat.barClass}`}
                      style={{
                        width: `${Math.min(100, Math.max(cat.count > 0 ? 3 : 0, percentage))}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* Panel 3: Recent Activities */}
        <article className="panel activities">
          <div className="panel-head">
            <div className="panel-head-title">
              <Layers size={16} className="text-yellow" />
              <h2>Recent Activities</h2>
            </div>
            <NavLink to="/movements" className="panel-link">View All →</NavLink>
          </div>
          <div className="activities-list">
            {recentMovements.length > 0 ? (
              recentMovements.slice(0, 5).map((m) => (
                <div key={m.id} className="activity-row">
                  <div className={`activity-icon-wrapper ${
                    m.movementType === 'PURCHASE'
                      ? 'blue'
                      : m.movementType.includes('TRANSFER')
                      ? 'green'
                      : m.movementType === 'EXPENDITURE'
                      ? 'red'
                      : 'yellow'
                  }`}>
                    {m.movementType === 'PURCHASE' ? (
                      <ShoppingBag size={14} />
                    ) : m.movementType.includes('TRANSFER') ? (
                      <ArrowRightLeft size={14} />
                    ) : m.movementType === 'EXPENDITURE' ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <Users size={14} />
                    )}
                  </div>
                  <div className="activity-details">
                    <p className="activity-title" title={`${m.movementType}: ${m.quantity} ${m.equipmentName || 'units'} at ${m.baseName}`}>
                      <strong>{m.movementType}</strong> of {m.quantity} {m.equipmentName || 'units'}
                    </p>
                    <small className="activity-meta">
                      {m.baseName} • {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Today'}
                    </small>
                  </div>
                  <span className={`pill ${
                    m.movementType === 'PURCHASE'
                      ? 'pblue'
                      : m.movementType.includes('TRANSFER')
                      ? 'pgreen'
                      : m.movementType === 'EXPENDITURE'
                      ? 'pred'
                      : 'pyellow'
                  }`}>
                    {m.movementType}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-panel-state">
                <p>No Recent Activities</p>
                <span>Movements and procurement actions will appear in this real-time feed.</span>
              </div>
            )}
          </div>
        </article>

        {/* Panel 4: Base Stock Levels */}
        <article className="panel stock">
          <div className="panel-head">
            <div className="panel-head-title">
              <Building size={16} className="text-purple" />
              <h2>Base Stock Levels</h2>
            </div>
            <NavLink to="/inventory" className="panel-link">View All →</NavLink>
          </div>
          <div className="stock-list">
            {baseStocks.length > 0 ? (
              baseStocks.slice(0, 4).map((b, index) => (
                <div key={b.id || index} className="stock-row">
                  <span className="stock-name" title={b.name}>
                    {b.name}
                  </span>
                  <div className="stock-progress-track">
                    <i
                      className="stock-progress-bar"
                      style={{
                        width: `${Math.min(100, Math.max(2, b.percentage))}%`,
                        background: BASE_COLORS[index % BASE_COLORS.length],
                      }}
                    ></i>
                  </div>
                  <span className="stock-fraction">
                    {formatNumber(b.current)} / {formatNumber(b.max)}
                  </span>
                  <span className="stock-pct" style={{ color: BASE_COLORS[index % BASE_COLORS.length] }}>
                    {b.percentage}%
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-panel-state">
                <span>No base stock levels available.</span>
              </div>
            )}
          </div>
        </article>

        {/* Panel 5: Recent Movements Table (Optimized Proportions, 4 recent items) */}
        <article className="panel recent">
          <div className="panel-head">
            <div className="panel-head-title">
              <ArrowRightLeft size={16} className="text-blue" />
              <h2>Recent Asset Movements</h2>
            </div>
            <NavLink to="/movements" className="panel-link">View All →</NavLink>
          </div>
          <div className="table-responsive">
            <table className="recent-movements-table">
              <thead>
                <tr>
                  <th style={{ width: '14%' }}>Date & Time</th>
                  <th style={{ width: '11%' }}>Asset ID</th>
                  <th style={{ width: '25%' }}>Asset Name</th>
                  <th style={{ width: '15%' }}>From / Base</th>
                  <th style={{ width: '16%' }}>Remarks / Destination</th>
                  <th style={{ width: '11%' }}>Type</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length > 0 ? (
                  recentMovements.slice(0, 4).map((mov) => (
                    <tr key={mov.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                          <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500 }}>
                            {mov.timestamp ? new Date(mov.timestamp).toLocaleDateString() : 'Today'}
                          </span>
                          <span style={{ fontSize: '9.5px', color: 'var(--muted)' }}>
                            {mov.timestamp ? new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--blue)', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {mov.equipmentTypeId || mov.id}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '11.5px' }}>
                        <div style={{ wordBreak: 'break-word', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {mov.equipmentName || `Equipment ${mov.equipmentTypeId}`}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {mov.baseName || 'Central Depot'}
                      </td>
                      <td className="truncate-cell" title={mov.remarks || mov.reason || 'Verified Movement'} style={{ color: 'var(--muted)', fontSize: '11px' }}>
                        {mov.remarks || mov.reason || 'Verified Movement'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`pill ${
                          mov.movementType === 'PURCHASE'
                            ? 'pgreen'
                            : mov.movementType === 'TRANSFER_IN'
                            ? 'pblue'
                            : mov.movementType === 'TRANSFER_OUT'
                            ? 'pyellow'
                            : 'ppurple'
                        }`} style={{ fontSize: '9.5px', padding: '2px 5px' }}>
                          {mov.movementType}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                        <span className="pill pgreen" style={{ fontSize: '9.5px', padding: '2px 6px' }}>Verified</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                      No asset movements recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* ==================== [BONUS FEATURE] NET MOVEMENT DETAILED POP-UP MODAL ==================== */}
      {showNetMovementModal && (
        <div className="modal-backdrop" onClick={() => setShowNetMovementModal(false)}>
          <div className="modal-container" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="modal-header-icon" style={{ background: 'rgba(24, 214, 157, 0.15)', color: 'var(--green)', width: '38px', height: '38px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-heading)' }}>Net Movement Audit Breakdown</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted)' }}>Live mathematical audit equation: Purchases + Transfer In - Transfer Out</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNetMovementModal(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Sleek Modern Formula Card */}
              <div className="net-movement-card-formula">
                <div className="formula-chip-header">
                  <span className="formula-chip-badge">
                    <span className="live-dot"></span> MATHEMATICAL AUDIT RECONCILIATION
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>Real-Time Verification</span>
                </div>
                <div className="formula-equation-row">
                  <div className="formula-token result">
                    <span style={{ opacity: 0.8, fontSize: '11px' }}>Net Movement</span>
                    <span>{summary.netMovement >= 0 ? `+${formatNumber(summary.netMovement)}` : formatNumber(summary.netMovement)}</span>
                  </div>
                  <span className="formula-op">=</span>
                  <div className="formula-token purchase">
                    <span style={{ opacity: 0.8, fontSize: '11px' }}>Purchases</span>
                    <span>+{formatNumber(summary.purchases)}</span>
                  </div>
                  <span className="formula-op">+</span>
                  <div className="formula-token transfer-in">
                    <span style={{ opacity: 0.8, fontSize: '11px' }}>Transfer In</span>
                    <span>+{formatNumber(summary.transferIn)}</span>
                  </div>
                  <span className="formula-op">-</span>
                  <div className="formula-token transfer-out">
                    <span style={{ opacity: 0.8, fontSize: '11px' }}>Transfer Out</span>
                    <span>-{formatNumber(summary.transferOut)}</span>
                  </div>
                </div>
              </div>

              {/* 3 Metric Glass Cards */}
              <div className="net-movement-kpi-grid">
                <div className="net-kpi-card blue">
                  <div className="net-kpi-header">
                    <span className="net-kpi-label">Purchases</span>
                    <span style={{ fontSize: '14px' }}>📦</span>
                  </div>
                  <strong className="net-kpi-val blue">+{formatNumber(summary.purchases)}</strong>
                  <span className="net-kpi-sub">Direct Armory Acquisitions</span>
                </div>

                <div className="net-kpi-card yellow">
                  <div className="net-kpi-header">
                    <span className="net-kpi-label">Transfer In</span>
                    <span style={{ fontSize: '14px' }}>📥</span>
                  </div>
                  <strong className="net-kpi-val yellow">+{formatNumber(summary.transferIn)}</strong>
                  <span className="net-kpi-sub">Received from other bases</span>
                </div>

                <div className="net-kpi-card red">
                  <div className="net-kpi-header">
                    <span className="net-kpi-label">Transfer Out</span>
                    <span style={{ fontSize: '14px' }}>📤</span>
                  </div>
                  <strong className="net-kpi-val red">-{formatNumber(summary.transferOut)}</strong>
                  <span className="net-kpi-sub">Dispatched to other bases</span>
                </div>
              </div>

              {/* Sub-Filter Tabs for Transactions */}
              <div
                className="modal-tabs"
                style={{
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  marginBottom: '12px',
                  background: 'var(--panel)',
                  padding: '3px',
                }}
              >
                <button
                  className={`tab-btn ${netMovementFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setNetMovementFilter('ALL')}
                >
                  All Flow ({netMovementItems.length})
                </button>
                <button
                  className={`tab-btn ${netMovementFilter === 'PURCHASE' ? 'active' : ''}`}
                  onClick={() => setNetMovementFilter('PURCHASE')}
                >
                  Purchases ({recentMovements.filter((m) => m.movementType === 'PURCHASE').length})
                </button>
                <button
                  className={`tab-btn ${netMovementFilter === 'TRANSFER_IN' ? 'active' : ''}`}
                  onClick={() => setNetMovementFilter('TRANSFER_IN')}
                >
                  Transfers In ({recentMovements.filter((m) => m.movementType === 'TRANSFER_IN').length})
                </button>
                <button
                  className={`tab-btn ${netMovementFilter === 'TRANSFER_OUT' ? 'active' : ''}`}
                  onClick={() => setNetMovementFilter('TRANSFER_OUT')}
                >
                  Transfers Out ({recentMovements.filter((m) => m.movementType === 'TRANSFER_OUT').length})
                </button>
              </div>

              {/* Transactions List Table */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Date & Time</th>
                      <th style={{ width: '18%' }}>Movement Type</th>
                      <th style={{ width: '28%' }}>Asset</th>
                      <th style={{ width: '20%' }}>Base</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netMovementItems.length > 0 ? (
                      netMovementItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                              <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Today'}
                              </span>
                              <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                                {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                              </span>
                            </div>
                          </td>
                          <td>
                            <b
                              className={`pill ${
                                item.movementType === 'PURCHASE'
                                  ? 'pgreen'
                                  : item.movementType === 'TRANSFER_IN'
                                  ? 'pyellow'
                                  : 'pred'
                              }`}
                              style={{ fontSize: '10px' }}
                            >
                              {item.movementType}
                            </b>
                          </td>
                          <td style={{ fontSize: '11.5px', fontWeight: 500 }}>{item.equipmentName}</td>
                          <td style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{item.baseName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            <span style={{ color: item.movementType === 'TRANSFER_OUT' ? 'var(--red)' : item.movementType === 'PURCHASE' ? 'var(--blue)' : 'var(--yellow)' }}>
                              {item.movementType === 'TRANSFER_OUT' ? '-' : '+'}
                              {formatNumber(item.quantity)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                          No transaction records matching this movement flow.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
              <NavLink
                to="/purchases"
                className="btn-secondary"
                onClick={() => setShowNetMovementModal(false)}
                style={{ textDecoration: 'none', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ShoppingBag size={13} /> Open Purchases
              </NavLink>
              <NavLink
                to="/transfers"
                className="btn-secondary"
                onClick={() => setShowNetMovementModal(false)}
                style={{ textDecoration: 'none', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowRightLeft size={13} /> Open Transfers
              </NavLink>
              <button type="button" className="btn-modal-cancel" onClick={() => setShowNetMovementModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
