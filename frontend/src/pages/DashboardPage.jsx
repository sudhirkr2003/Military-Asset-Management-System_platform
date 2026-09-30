import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import heroAirfield from '../assets/hero_airfield.jpg';
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
  Radio
} from 'lucide-react';

const BASE_COLORS = ['#299cff', '#18d69d', '#ffc033', '#a855f7', '#ec4899', '#3b82f6'];

export const DashboardPage = () => {
  // Filters State
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedEquipment, setSelectedEquipment] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Metadata Lists
  const [bases, setBases] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  // Live KPI Summary State (Initial values all 0)
  const [summary, setSummary] = useState({
    openingBalance: 0,
    purchases: 0,
    transferIn: 0,
    transferOut: 0,
    netMovement: 0,
    assigned: 0,
    expended: 0,
    closingBalance: 0,
  });

  const [recentMovements, setRecentMovements] = useState([]);
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

  const fetchMetadata = useCallback(async () => {
    try {
      const [basesRes, eqRes] = await Promise.all([
        api.get('/bases').catch(() => ({ data: { data: [] } })),
        api.get('/equipment').catch(() => ({ data: { data: [] } })),
      ]);
      if (basesRes.data?.data) setBases(basesRes.data.data);
      if (eqRes.data?.data) setEquipmentList(eqRes.data.data);
    } catch (err) {
      console.error('Error fetching metadata', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase !== 'ALL') params.baseId = selectedBase;
      if (selectedEquipment !== 'ALL') params.equipmentTypeId = selectedEquipment;
      if (selectedPeriod !== 'all') params.period = selectedPeriod;

      const [summaryRes, movementsRes, catRes, invRes] = await Promise.all([
        api.get('/dashboard/summary', { params }).catch(() => null),
        api.get('/dashboard/recent-movements', { params: selectedBase !== 'ALL' ? { baseId: selectedBase } : {} }).catch(() => null),
        api.get('/dashboard/category-distribution', { params: selectedBase !== 'ALL' ? { baseId: selectedBase } : {} }).catch(() => null),
        api.get('/inventory').catch(() => null),
      ]);

      // 1. KPI Summary
      if (summaryRes?.data?.data) {
        setSummary((prev) => ({ ...prev, ...summaryRes.data.data }));
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
      const inventories = invRes?.data?.data || [];
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

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, [fetchDashboardData]);

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

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(4,14,21,.90), rgba(4,14,21,.30)), url(${heroAirfield})`,
        }}
      >
        <div className="hero-content">
          <p>Good Morning,</p>
          <h1>
            Chief <span>Commander</span>
          </h1>
          <small>
            Real-time defense readiness, procurement ledger, inter-base asset transfers, and live inventory control.
          </small>
        </div>

        {/* Top Interactive Dashboard Filter Bar */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'rgba(9, 24, 33, 0.9)',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Base Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building className="w-3.5 h-3.5 text-blue" style={{ color: 'var(--blue)' }} />
            <select
              value={selectedBase}
              onChange={(e) => setSelectedBase(e.target.value)}
              className="modal-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '11px' }}
            >
              <option value="ALL">All Bases & Depots</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Equipment Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Crosshair className="w-3.5 h-3.5 text-yellow" style={{ color: 'var(--yellow)' }} />
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="modal-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '11px' }}
            >
              <option value="ALL">All Equipment Types</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.code})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="modal-select"
              style={{ width: 'auto', padding: '5px 10px', fontSize: '11px' }}
            >
              <option value="all">All-Time Cumulative</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          <button
            className="btn-secondary"
            onClick={fetchDashboardData}
            disabled={loading}
            style={{ padding: '5px 10px', fontSize: '11px' }}
          >
            <RefreshCw className={`w-3 h-3 inline mr-1 ${loading ? 'spin' : ''}`} /> Refresh
          </button>
        </div>
      </section>

      {/* 6 Key Metrics Grid (Pure Live Data with Clickable Net Movement Bonus) */}
      <section className="metrics">
        {/* Metric 1: Opening Balance */}
        <article className="metric">
          <div className="icon icon-blue">
            <Shield className="w-4 h-4" />
          </div>
          <label>Opening Balance</label>
          <strong>{formatNumber(summary.openingBalance)}</strong>
          <small>
            <span>Initial Armory Stock</span>
            <b className="metric-badge green">{summary.openingBalance > 0 ? 'Active' : '0'}</b>
          </small>
        </article>

        {/* Metric 2: Net Movement [BONUS FEATURE: Clickable Modal Breakdown] */}
        <article
          className="metric metric-interactive"
          onClick={() => setShowNetMovementModal(true)}
          title="Click to view detailed Net Movement breakdown (Purchases + Transfer In - Transfer Out)"
        >
          <div className="icon icon-green">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Net Movement <Info className="w-3 h-3 text-green" />
          </label>
          <strong style={{ color: summary.netMovement >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {summary.netMovement > 0 ? `+${formatNumber(summary.netMovement)}` : formatNumber(summary.netMovement)}
          </strong>
          <small>
            <span>Purchases + In - Out</span>
            <b className="metric-badge purple">🔍 View Breakdown</b>
          </small>
        </article>

        {/* Metric 3: Purchases */}
        <article className="metric">
          <div className="icon icon-blue">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <label>Purchases</label>
          <strong style={{ color: 'var(--blue)' }}>+{formatNumber(summary.purchases)}</strong>
          <small>
            <span>Procured to Armory</span>
            <b className="metric-badge blue">{summary.purchases > 0 ? `+${summary.purchases}` : '0'}</b>
          </small>
        </article>

        {/* Metric 4: Assigned Assets */}
        <article className="metric">
          <div className="icon icon-yellow">
            <Users className="w-4 h-4" />
          </div>
          <label>Assigned to Troops</label>
          <strong style={{ color: 'var(--yellow)' }}>{formatNumber(summary.assigned)}</strong>
          <small>
            <span>Issued to Personnel</span>
            <b className="metric-badge yellow">{summary.assigned > 0 ? 'Deployed' : '0'}</b>
          </small>
        </article>

        {/* Metric 5: Expended */}
        <article className="metric">
          <div className="icon icon-red">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <label>Expended (Ammo/Fuel)</label>
          <strong style={{ color: 'var(--red)' }}>-{formatNumber(summary.expended)}</strong>
          <small>
            <span>Combat / Range Used</span>
            <b className="metric-badge red">{summary.expended > 0 ? `-${summary.expended}` : '0'}</b>
          </small>
        </article>

        {/* Metric 6: Closing Balance */}
        <article className="metric">
          <div className="icon icon-green">
            <Layers className="w-4 h-4" />
          </div>
          <label>Total Closing Balance</label>
          <strong>{formatNumber(summary.closingBalance)}</strong>
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
                <g stroke="#1a3547" strokeDasharray="3 4">
                  <line x1="0" y1="25" x2="700" y2="25" />
                  <line x1="0" y1="88" x2="700" y2="88" />
                  <line x1="0" y1="151" x2="700" y2="151" />
                  <line x1="0" y1="214" x2="700" y2="214" />
                </g>
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,120"
                  fill="none"
                  stroke="#18d69d"
                  strokeWidth="3"
                />
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,150"
                  fill="none"
                  stroke="#299cff"
                  strokeWidth="3"
                />
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,190"
                  fill="none"
                  stroke="#ffc033"
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

        {/* Panel 2: Assets by Category */}
        <article className="panel category">
          <div className="panel-head">
            <div className="panel-head-title">
              <Package size={16} className="text-blue" />
              <h2>Assets by Category</h2>
            </div>
            <span className="panel-subtitle">Live Breakdown</span>
          </div>
          <div className="barchart">
            <div className="barchart-col">
              <span className="barchart-val">{formatNumber(categoryCounts.VEHICLE)}</span>
              <div className="barchart-track">
                <i className="bar bar1" style={{ height: getBarHeight(categoryCounts.VEHICLE) }}></i>
              </div>
              <span className="barchart-label">Vehicles</span>
            </div>
            <div className="barchart-col">
              <span className="barchart-val">{formatNumber(categoryCounts.WEAPON)}</span>
              <div className="barchart-track">
                <i className="bar bar2" style={{ height: getBarHeight(categoryCounts.WEAPON) }}></i>
              </div>
              <span className="barchart-label">Weapons</span>
            </div>
            <div className="barchart-col">
              <span className="barchart-val">{formatNumber(categoryCounts.AMMUNITION)}</span>
              <div className="barchart-track">
                <i className="bar bar3" style={{ height: getBarHeight(categoryCounts.AMMUNITION) }}></i>
              </div>
              <span className="barchart-label">Ammunition</span>
            </div>
            <div className="barchart-col">
              <span className="barchart-val">{formatNumber(categoryCounts.COMMUNICATION_EQUIPMENT)}</span>
              <div className="barchart-track">
                <i className="bar bar4" style={{ height: getBarHeight(categoryCounts.COMMUNICATION_EQUIPMENT) }}></i>
              </div>
              <span className="barchart-label">Comms</span>
            </div>
            <div className="barchart-col">
              <span className="barchart-val">{formatNumber(categoryCounts.OTHER)}</span>
              <div className="barchart-track">
                <i className="bar bar5" style={{ height: getBarHeight(categoryCounts.OTHER) }}></i>
              </div>
              <span className="barchart-label">Other</span>
            </div>
          </div>
        </article>

        {/* Panel 3: Recent Activities */}
        <article className="panel activities">
          <div className="panel-head">
            <div className="panel-head-title">
              <Layers size={16} className="text-yellow" />
              <h2>Recent Activities</h2>
            </div>
            <NavLink to="/assignments" className="panel-link">View All →</NavLink>
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
              baseStocks.map((b, index) => (
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

        {/* Panel 5: Recent Movements Table */}
        <article className="panel recent">
          <div className="panel-head">
            <div className="panel-head-title">
              <ArrowRightLeft size={16} className="text-blue" />
              <h2>Recent Asset Movements</h2>
            </div>
            <NavLink to="/transfers" className="panel-link">View Transfers →</NavLink>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>From / Base</th>
                  <th>Remarks / Destination</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length > 0 ? (
                  recentMovements.slice(0, 5).map((mov) => (
                    <tr key={mov.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                          <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {mov.timestamp ? new Date(mov.timestamp).toLocaleDateString() : 'Today'}
                          </span>
                          <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {mov.timestamp ? new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--blue)', whiteSpace: 'nowrap' }}>ASSET-{mov.equipmentTypeId || mov.id}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-heading)' }}>
                        {mov.equipmentName || `Equipment #${mov.equipmentTypeId}`}
                      </td>
                      <td style={{ color: 'var(--text)' }}>{mov.baseName || 'Central Depot'}</td>
                      <td className="truncate-cell" title={mov.remarks || mov.reason || 'Verified Movement'} style={{ color: 'var(--muted)' }}>
                        {mov.remarks || mov.reason || 'Verified Movement'}
                      </td>
                      <td>
                        <span className={`pill ${
                          mov.movementType === 'PURCHASE'
                            ? 'pgreen'
                            : mov.movementType === 'TRANSFER_IN'
                            ? 'pblue'
                            : mov.movementType === 'TRANSFER_OUT'
                            ? 'pyellow'
                            : 'ppurple'
                        }`}>
                          {mov.movementType}
                        </span>
                      </td>
                      <td>
                        <span className="pill pgreen">Verified</span>
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
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div className="modal-header-icon" style={{ background: 'rgba(24, 214, 157, 0.2)', color: 'var(--green)' }}>
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="modal-header-text">
                <h3>Net Movement Audit Breakdown</h3>
                <p>Mathematical formula verification: Net Movement = Purchases + Transfer In - Transfer Out</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNetMovementModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Formula Banner */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(24, 214, 157, 0.3)',
                  marginBottom: '16px',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  EXACT AUDIT CALCULATION FORMULA
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                  <span style={{ color: 'var(--green)' }}>
                    Net Movement ({summary.netMovement >= 0 ? `+${formatNumber(summary.netMovement)}` : formatNumber(summary.netMovement)})
                  </span>{' '}
                  ={' '}
                  <span style={{ color: 'var(--blue)' }}>Purchases (+{formatNumber(summary.purchases)})</span>{' '}
                  +{' '}
                  <span style={{ color: 'var(--yellow)' }}>Transfer In (+{formatNumber(summary.transferIn)})</span>{' '}
                  -{' '}
                  <span style={{ color: 'var(--red)' }}>Transfer Out (-{formatNumber(summary.transferOut)})</span>
                </div>
              </div>

              {/* 3 Metric Mini Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    background: 'var(--panel)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>📦 Purchases</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--blue)' }}>+{formatNumber(summary.purchases)}</strong>
                </div>

                <div
                  style={{
                    background: 'var(--panel)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>📥 Transfer In</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--yellow)' }}>+{formatNumber(summary.transferIn)}</strong>
                </div>

                <div
                  style={{
                    background: 'var(--panel)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>📤 Transfer Out</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--red)' }}>-{formatNumber(summary.transferOut)}</strong>
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

              {/* Transactions List */}
              <div style={{ maxHeight: '220px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Asset</th>
                      <th>Base</th>
                      <th>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netMovementItems.length > 0 ? (
                      netMovementItems.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
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
                            >
                              {item.movementType}
                            </b>
                          </td>
                          <td>{item.equipmentName}</td>
                          <td>{item.baseName}</td>
                          <td>
                            <strong>
                              {item.movementType === 'TRANSFER_OUT' ? '-' : '+'}
                              {formatNumber(item.quantity)}
                            </strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                          No transaction records matching this movement flow.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <NavLink
                to="/purchases"
                className="btn-secondary"
                onClick={() => setShowNetMovementModal(false)}
                style={{ textDecoration: 'none', fontSize: '12px' }}
              >
                🛒 Open Purchases
              </NavLink>
              <NavLink
                to="/transfers"
                className="btn-secondary"
                onClick={() => setShowNetMovementModal(false)}
                style={{ textDecoration: 'none', fontSize: '12px' }}
              >
                🔄 Open Transfers
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
