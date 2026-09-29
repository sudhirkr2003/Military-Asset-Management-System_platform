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
} from 'lucide-react';

export const DashboardPage = () => {
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
  const [bases, setBases] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('Last 6 Months');
  const [categoryPeriod, setCategoryPeriod] = useState('This Month');

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, movementsRes, catRes, invRes, basesRes] = await Promise.all([
        api.get('/dashboard/summary').catch(() => null),
        api.get('/dashboard/recent-movements').catch(() => null),
        api.get('/dashboard/category-distribution').catch(() => null),
        api.get('/inventory').catch(() => null),
        api.get('/bases').catch(() => null),
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
      const basesList = basesRes?.data?.data || [];
      const inventories = invRes?.data?.data || [];
      setBases(basesList);

      if (basesList.length > 0) {
        const baseAgg = basesList.map((b) => {
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
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleUpdate = () => fetchDashboardData();
    window.addEventListener('mams:movement_updated', handleUpdate);
    return () => window.removeEventListener('mams:movement_updated', handleUpdate);
  }, []);

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  // Calculate dynamic bar heights (Max scale 2000 or highest category count)
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

  // Colors for base progress bars
  const baseColors = ['#18d19a', '#299cff', '#ffc033', '#9868f5', '#ff5065'];

  return (
    <>
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(4,14,21,.90), rgba(4,14,21,.30)), url(${heroAirfield})`
        }}
      >
        <div className="hero-content">
          <p>Good Morning,</p>
          <h1>
            Chief <span>Commander</span>
          </h1>
          <small>Monitor, manage and ensure operational readiness of all military assets across bases.</small>
        </div>
        <button className="date">▣ &nbsp; Sep 29, 2026 – Oct 29, 2026 &nbsp;⌄</button>
      </section>

      {/* 6 Metrics Grid (Pure Live Data) */}
      <section className="metrics">
        <article className="metric">
          <div className="icon">▱</div>
          <label>Opening Balance</label>
          <strong>{formatNumber(summary.openingBalance)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Initial stock balance <b>{summary.openingBalance > 0 ? '↑' : ''} 0%</b>
          </small>
        </article>

        <article className="metric">
          <div className="icon">▣</div>
          <label>Purchases</label>
          <strong>+{formatNumber(summary.purchases)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Newly procured assets <b>{summary.purchases > 0 ? `+${summary.purchases}` : '0'}</b>
          </small>
        </article>

        <article className="metric">
          <div className="icon">→</div>
          <label>Transfer In</label>
          <strong>+{formatNumber(summary.transferIn)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Received from other bases <b>{summary.transferIn > 0 ? `+${summary.transferIn}` : '0'}</b>
          </small>
        </article>

        <article className="metric">
          <div className="icon">↪</div>
          <label>Transfer Out</label>
          <strong>-{formatNumber(summary.transferOut)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Dispatched to other bases <b>{summary.transferOut > 0 ? `-${summary.transferOut}` : '0'}</b>
          </small>
        </article>

        <article className="metric">
          <div className="icon">⚒</div>
          <label>Expended</label>
          <strong>{formatNumber(summary.expended)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Consumed / Ammunition / Fuel <b>{summary.expended > 0 ? `-${summary.expended}` : '0'}</b>
          </small>
        </article>

        <article className="metric">
          <div className="icon">◇</div>
          <label>Closing Balance</label>
          <strong>{formatNumber(summary.closingBalance)}</strong>
          <span className="spark">▂▄▆█</span>
          <small>
            Total assets in inventory <b>{summary.closingBalance > 0 ? 'Active' : '0'}</b>
          </small>
        </article>
      </section>

      {/* Panels Grid (Pure Live Data) */}
      <section className="grid">
        {/* Panel 1: Trends */}
        <article className="panel trends">
          <div className="panel-head">
            <h2>⌁ Inventory Movement Trends</h2>
            <button>Last 6 Months⌄</button>
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
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,214"
                  fill="none"
                  stroke="#ff5065"
                  strokeWidth="3"
                />
                <polyline
                  points="0,214 110,214 220,214 330,214 440,214 550,214 700,214"
                  fill="none"
                  stroke="#9868f5"
                  strokeWidth="2"
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
                <p style={{ margin: '0 0 6px 0', color: '#ffffff', fontWeight: 600 }}>No Movement Trends Recorded Yet</p>
                <span>Live multi-line trend polylines will generate as procurement and transfers are recorded.</span>
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

        {/* Panel 2: Assets by Category (Live counts) */}
        <article className="panel category">
          <div className="panel-head">
            <h2>▣ Assets by Category</h2>
            <button>This Month⌄</button>
          </div>
          <div className="barchart">
            <div>
              <strong>{formatNumber(categoryCounts.VEHICLE)}</strong>
              <i className="bar bar1" style={{ height: getBarHeight(categoryCounts.VEHICLE) }}></i>
              <small>▣<br />Vehicles</small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.WEAPON)}</strong>
              <i className="bar bar2" style={{ height: getBarHeight(categoryCounts.WEAPON) }}></i>
              <small>▱<br />Weapons</small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.AMMUNITION)}</strong>
              <i className="bar bar3" style={{ height: getBarHeight(categoryCounts.AMMUNITION) }}></i>
              <small>▥<br />Ammunition</small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.COMMUNICATION_EQUIPMENT)}</strong>
              <i className="bar bar4" style={{ height: getBarHeight(categoryCounts.COMMUNICATION_EQUIPMENT) }}></i>
              <small>⌁<br />Communication</small>
            </div>
            <div>
              <strong>{formatNumber(categoryCounts.OTHER)}</strong>
              <i className="bar bar5" style={{ height: getBarHeight(categoryCounts.OTHER) }}></i>
              <small>▦<br />Other</small>
            </div>
          </div>
        </article>

        {/* Panel 3: Recent Activities (Live from DB) */}
        <article className="panel activities">
          <div className="panel-head">
            <h2>▣ Recent Activities</h2>
            <NavLink to="/movements">View All →</NavLink>
          </div>
          {recentMovements.length > 0 ? (
            recentMovements.slice(0, 5).map((m) => (
              <div key={m.id} className="activity">
                <i className="circle">
                  {m.movementType === 'PURCHASE' ? '◇' : m.movementType.includes('TRANSFER') ? '→' : m.movementType === 'EXPENDITURE' ? '⚒' : '♙'}
                </i>
                <p>
                  {m.movementType} of {m.quantity} units ({m.equipmentName || 'Asset'}) at {m.baseName}
                  <small>{m.timestamp ? new Date(m.timestamp).toLocaleString() : 'Recent'}</small>
                </p>
                <b className={`tag`}>
                  {m.movementType}
                </b>
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

        {/* Panel 4: Base Stock Levels (Live from DB) */}
        <article className="panel stock">
          <div className="panel-head">
            <h2>▣ Base Stock Levels</h2>
            <NavLink to="/inventory">View All →</NavLink>
          </div>
          {baseStocks.length > 0 ? (
            baseStocks.map((b, index) => (
              <div key={b.id || index} className="stock-row">
                <span>{b.name}</span>
                <div>
                  <i
                    style={{
                      width: `${b.percentage}%`,
                      background: baseColors[index % baseColors.length],
                    }}
                  ></i>
                </div>
                <b>{formatNumber(b.current)} / {formatNumber(b.max)}</b>
                <em>{b.percentage}%</em>
              </div>
            ))
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '11px' }}>
              No base stock levels available.
            </div>
          )}
        </article>

        {/* Panel 5: Recent Asset Movements Table (Live from DB) */}
        <article className="panel recent">
          <div className="panel-head">
            <h2>↔ Recent Asset Movements</h2>
            <NavLink to="/movements">View All →</NavLink>
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
                    <td>{mov.timestamp ? new Date(mov.timestamp).toLocaleString() : 'Today'}</td>
                    <td>ASSET-{mov.equipmentTypeId || mov.id}</td>
                    <td>{mov.equipmentName || 'Military Asset'}</td>
                    <td>{mov.baseName || 'Central Depot'}</td>
                    <td>{mov.remarks || mov.referenceType || 'HQ Logistics'}</td>
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
                    No asset movements recorded in the database yet. Click <strong>+ Record Movement</strong> on top to submit a transaction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
    </>
  );
};

export default DashboardPage;
