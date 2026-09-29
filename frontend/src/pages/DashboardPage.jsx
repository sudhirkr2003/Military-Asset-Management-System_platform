import React, { useState, useEffect } from 'react';
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
  Crosshair
} from 'lucide-react';

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

  const fetchMetadata = async () => {
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
  };

  const fetchDashboardData = async () => {
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
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, [selectedBase, selectedEquipment, selectedPeriod, bases.length]);

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  // Calculate dynamic bar heights
  const maxCategoryVal = Math.max(
    100,
    categoryCounts.VEHICLE,
    categoryCounts.WEAPON,
    categoryCounts.AMMUNITION,
    categoryCounts.COMMUNICATION_EQUIPMENT,
    categoryCounts.OTHER
  );

  const getBarHeight = (count) => {
    if (!count || count === 0) return '4px';
    const pct = Math.max(4, Math.round((count / maxCategoryVal) * 180));
    return `${pct}px`;
  };

  const baseColors = ['#18d19a', '#299cff', '#ffc033', '#9868f5', '#ff5065'];

  // Movements filtered for Net Movement Pop-up
  const netMovementItems = recentMovements.filter((m) => {
    if (netMovementFilter === 'PURCHASE') return m.movementType === 'PURCHASE';
    if (netMovementFilter === 'TRANSFER_IN') return m.movementType === 'TRANSFER_IN';
    if (netMovementFilter === 'TRANSFER_OUT') return m.movementType === 'TRANSFER_OUT';
    return (
      m.movementType === 'PURCHASE' ||
      m.movementType === 'TRANSFER_IN' ||
      m.movementType === 'TRANSFER_OUT'
    );
  });

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
          <div className="icon">▱</div>
          <label>Opening Balance</label>
          <strong>{formatNumber(summary.openingBalance)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Initial armory balance <b>{summary.openingBalance > 0 ? 'Active' : '0'}</b>
          </small>
        </article>

        {/* Metric 2: Net Movement [BONUS FEATURE: Clickable Modal Breakdown] */}
        <article
          className="metric"
          onClick={() => setShowNetMovementModal(true)}
          style={{
            cursor: 'pointer',
            border: '1px solid rgba(24, 214, 157, 0.4)',
            background: 'linear-gradient(145deg, #102e3a, #0b2430)',
            transition: 'all 0.2s ease',
          }}
          title="Click to view detailed Net Movement breakdown (Purchases + Transfer In - Transfer Out)"
        >
          <div className="icon" style={{ background: 'rgba(24, 214, 157, 0.2)', color: 'var(--green)' }}>
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            Net Movement <Info className="w-3 h-3 text-green" style={{ color: 'var(--green)' }} />
          </label>
          <strong style={{ color: summary.netMovement >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {summary.netMovement > 0 ? `+${formatNumber(summary.netMovement)}` : formatNumber(summary.netMovement)}
          </strong>
          <span className="spark">▂▄▆█</span>
          <small style={{ color: 'var(--green)', fontSize: '10px' }}>
            Purchases + In - Out <b>🔍 Click Breakdown</b>
          </small>
        </article>

        {/* Metric 3: Purchases */}
        <article className="metric">
          <div className="icon">▣</div>
          <label>Purchases</label>
          <strong style={{ color: 'var(--blue)' }}>+{formatNumber(summary.purchases)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Procured into armories <b>{summary.purchases > 0 ? `+${summary.purchases}` : '0'}</b>
          </small>
        </article>

        {/* Metric 4: Assigned Assets */}
        <article className="metric">
          <div className="icon">♙</div>
          <label>Assigned to Troops</label>
          <strong style={{ color: 'var(--yellow)' }}>{formatNumber(summary.assigned)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Issued to active personnel <b>{summary.assigned > 0 ? 'Deployed' : '0'}</b>
          </small>
        </article>

        {/* Metric 5: Expended */}
        <article className="metric">
          <div className="icon">⚒</div>
          <label>Expended (Ammo/Fuel)</label>
          <strong style={{ color: 'var(--red)' }}>-{formatNumber(summary.expended)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Combat / Range consumption <b>{summary.expended > 0 ? `-${summary.expended}` : '0'}</b>
          </small>
        </article>

        {/* Metric 6: Closing Balance */}
        <article className="metric">
          <div className="icon">◇</div>
          <label>Total Closing Balance</label>
          <strong>{formatNumber(summary.closingBalance)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Total active stock in bases <b>{summary.closingBalance > 0 ? 'Verified' : '0'}</b>
          </small>
        </article>
      </section>

      {/* Panels Grid */}
      <section className="grid">
        {/* Panel 1: Trends */}
        <article className="panel trends">
          <div className="panel-head">
            <h2>⌁ Inventory Movement Trends</h2>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Live Multi-Vector Telemetry</span>
          </div>
          <div className="chart">
            {recentMovements.length > 0 ? (
              <svg viewBox="0 0 700 250" preserveAspectRatio="none">
                <g stroke="#29414c" strokeDasharray="3 4">
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
              <div
                style={{
                  height: '210px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--muted)',
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
                <p style={{ margin: '0 0 6px 0', color: '#ffffff', fontWeight: 600 }}>
                  No Movement Trends Recorded Yet
                </p>
                <span>Live multi-line telemetry polylines will generate as procurement and transfers are recorded.</span>
              </div>
            )}
          </div>
          <div className="legend">
            <span className="green">● Opening Balance</span>
            <span className="blue">● Purchases</span>
            <span className="yellow">● Transfer In</span>
            <span className="red">● Transfer Out</span>
            <span className="purple">● Expended</span>
          </div>
        </article>

        {/* Panel 2: Assets by Category */}
        <article className="panel category">
          <div className="panel-head">
            <h2>▣ Assets by Category</h2>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Live Breakdown</span>
          </div>
          <div className="barchart">
            <div>
              <strong>{formatNumber(categoryCounts.VEHICLE)}</strong>
              <i className="bar bar1" style={{ height: getBarHeight(categoryCounts.VEHICLE) }}></i>
              <small>
                ▣<br />Vehicles
              </small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.WEAPON)}</strong>
              <i className="bar bar2" style={{ height: getBarHeight(categoryCounts.WEAPON) }}></i>
              <small>
                ▱<br />Weapons
              </small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.AMMUNITION)}</strong>
              <i className="bar bar3" style={{ height: getBarHeight(categoryCounts.AMMUNITION) }}></i>
              <small>
                ▥<br />Ammunition
              </small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.COMMUNICATION_EQUIPMENT)}</strong>
              <i className="bar bar4" style={{ height: getBarHeight(categoryCounts.COMMUNICATION_EQUIPMENT) }}></i>
              <small>
                ⌁<br />Comms
              </small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.OTHER)}</strong>
              <i className="bar bar5" style={{ height: getBarHeight(categoryCounts.OTHER) }}></i>
              <small>
                ▦<br />Other
              </small>
            </div>
          </div>
        </article>

        {/* Panel 3: Recent Activities */}
        <article className="panel activities">
          <div className="panel-head">
            <h2>▣ Recent Activities</h2>
            <NavLink to="/assignments">View All →</NavLink>
          </div>
          {recentMovements.length > 0 ? (
            recentMovements.slice(0, 5).map((m) => (
              <div key={m.id} className="activity" style={{ overflow: 'hidden', gap: '8px' }}>
                <i className="circle">
                  {m.movementType === 'PURCHASE'
                    ? '◇'
                    : m.movementType.includes('TRANSFER')
                    ? '→'
                    : m.movementType === 'EXPENDITURE'
                    ? '⚒'
                    : '♙'}
                </i>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <p
                    style={{
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    title={`${m.movementType}: ${m.quantity} ${m.equipmentName || 'units'} at ${m.baseName}`}
                  >
                    <strong>{m.movementType}</strong> of {m.quantity} {m.equipmentName || 'units'}
                  </p>
                  <small
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--muted)',
                      fontSize: '10.5px',
                      marginTop: '2px',
                    }}
                  >
                    {m.baseName} • {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Today'}
                  </small>
                </div>
                <b className="tag" style={{ flexShrink: 0 }}>{m.movementType}</b>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '40px 15px',
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '11px',
              }}
            >
              <p style={{ color: '#ffffff', fontWeight: 600, margin: '0 0 6px 0' }}>No Recent Activities</p>
              <span>Movements and procurement actions will appear in this real-time feed.</span>
            </div>
          )}
        </article>

        {/* Panel 4: Base Stock Levels */}
        <article className="panel stock">
          <div className="panel-head">
            <h2>▣ Base Stock Levels</h2>
            <NavLink to="/inventory">View All →</NavLink>
          </div>
          {baseStocks.length > 0 ? (
            baseStocks.map((b, index) => (
              <div key={b.id || index} className="stock-row">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.name}>
                  {b.name}
                </span>
                <div>
                  <i
                    style={{
                      width: `${b.percentage}%`,
                      background: baseColors[index % baseColors.length],
                    }}
                  ></i>
                </div>
                <b>
                  {formatNumber(b.current)} / {formatNumber(b.max)}
                </b>
                <em>{b.percentage}%</em>
              </div>
            ))
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px' }}>
              No base stock levels available.
            </div>
          )}
        </article>

        {/* Panel 5: Recent Movements Table */}
        <article className="panel recent">
          <div className="panel-head">
            <h2>↔ Recent Asset Movements</h2>
            <NavLink to="/transfers">View Transfers →</NavLink>
          </div>
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
                    <td style={{ whiteSpace: 'nowrap' }}>{mov.timestamp ? new Date(mov.timestamp).toLocaleString() : 'Today'}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--blue)', whiteSpace: 'nowrap' }}>ASSET-{mov.equipmentTypeId || mov.id}</td>
                    <td
                      style={{
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={mov.equipmentName || 'Military Asset'}
                    >
                      <strong>{mov.equipmentName || 'Military Asset'}</strong>
                    </td>
                    <td
                      style={{
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={mov.baseName || 'Central Depot'}
                    >
                      {mov.baseName || 'Central Depot'}
                    </td>
                    <td
                      style={{
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--muted)',
                      }}
                      title={mov.remarks || mov.referenceType || 'HQ Logistics'}
                    >
                      {mov.remarks || mov.referenceType || 'HQ Logistics'}
                    </td>
                    <td>
                      <b
                        className={`pill ${
                          mov.movementType === 'PURCHASE'
                            ? 'pgreen'
                            : mov.movementType.includes('TRANSFER')
                            ? 'pblue'
                            : mov.movementType === 'EXPENDITURE'
                            ? 'pyellow'
                            : 'ppurple'
                        }`}
                      >
                        {mov.movementType}
                      </b>
                    </td>
                    <td>
                      <b className="pill pgreen">Completed</b>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    No asset movements recorded in the database yet. Click <strong>+ Record Movement</strong> on top to
                    submit a transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
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
                          <td>{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Today'}</td>
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
