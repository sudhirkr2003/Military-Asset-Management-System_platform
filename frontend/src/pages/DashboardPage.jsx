import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import heroAirfield from '../assets/hero_airfield.jpg';
import { LogOut } from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Dashboard Data State
  const [summary, setSummary] = useState({
    openingBalance: 4040,
    purchases: 2120,
    transferIn: 25,
    transferOut: 25,
    expended: 260,
    closingBalance: 5900,
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (res.data) {
          setSummary((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch (err) {
        // Keeps default state smoothly
      }
    };
    fetchSummary();
  }, []);

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  return (
    <div className="app">
      {/* 1. SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">◇</div>
          <div>
            <strong>MAMS</strong>
            <small>Military Asset<br />Management System</small>
          </div>
        </div>
        <nav>
          <a
            className={activeNav === 'Dashboard' ? 'active' : ''}
            href="#dashboard"
            onClick={(e) => { e.preventDefault(); setActiveNav('Dashboard'); }}
          >
            <span>⌂</span>Dashboard
          </a>
          <a
            className={activeNav === 'Assets' ? 'active' : ''}
            href="#assets"
            onClick={(e) => { e.preventDefault(); setActiveNav('Assets'); }}
          >
            <span>◇</span>Assets <b>›</b>
          </a>
          <a
            className={activeNav === 'Inventory' ? 'active' : ''}
            href="#inventory"
            onClick={(e) => { e.preventDefault(); setActiveNav('Inventory'); }}
          >
            <span>▱</span>Inventory <b>›</b>
          </a>
          <a
            className={activeNav === 'Movements' ? 'active' : ''}
            href="#movements"
            onClick={(e) => { e.preventDefault(); setActiveNav('Movements'); }}
          >
            <span>↔</span>Movements <b>›</b>
          </a>
          <a
            className={activeNav === 'Personnel' ? 'active' : ''}
            href="#personnel"
            onClick={(e) => { e.preventDefault(); setActiveNav('Personnel'); }}
          >
            <span>♙</span>Personnel <b>›</b>
          </a>
          <a
            className={activeNav === 'Bases' ? 'active' : ''}
            href="#bases"
            onClick={(e) => { e.preventDefault(); setActiveNav('Bases'); }}
          >
            <span>⌖</span>Bases <b>›</b>
          </a>
          <a
            className={activeNav === 'Reports' ? 'active' : ''}
            href="#reports"
            onClick={(e) => { e.preventDefault(); setActiveNav('Reports'); }}
          >
            <span>▥</span>Reports <b>›</b>
          </a>
          <a
            className={activeNav === 'Settings' ? 'active' : ''}
            href="#settings"
            onClick={(e) => { e.preventDefault(); setActiveNav('Settings'); }}
          >
            <span>⚙</span>Settings <b>›</b>
          </a>
        </nav>
        <div className="quote">
          <i></i>Strength<br />Through<br />Accountability
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="search">
            ⌕{' '}
            <input
              type="text"
              placeholder="Search assets, personnel, bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
            <kbd>Ctrl + K</kbd>
          </div>
          <div className="profile">
            <div className="bell">
              ♧<i>3</i>
            </div>
            <div className="avatar">CC</div>
            <div>
              <strong>{user?.fullName || 'Chief Commander'}</strong>
              <small>{user?.role === 'ADMIN' ? 'HQ Supreme Admin' : user?.role || 'HQ Supreme Admin'}</small>
            </div>
            <button onClick={logout} title="Logout" className="logout-action-btn">
              <LogOut className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </header>

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

        {/* 6 Metrics Grid */}
        <section className="metrics">
          <article className="metric">
            <div className="icon">▱</div>
            <label>Opening Balance</label>
            <strong>{formatNumber(summary.openingBalance)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Initial stock balance <b>↑ 5%</b>
            </small>
          </article>

          <article className="metric">
            <div className="icon">▣</div>
            <label>Purchases</label>
            <strong>+{formatNumber(summary.purchases)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Newly procured assets <b>↑ 12%</b>
            </small>
          </article>

          <article className="metric">
            <div className="icon">→</div>
            <label>Transfer In</label>
            <strong>+{formatNumber(summary.transferIn)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Received from other bases <b>↑ 8%</b>
            </small>
          </article>

          <article className="metric">
            <div className="icon">↪</div>
            <label>Transfer Out</label>
            <strong>-{formatNumber(summary.transferOut)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Dispatched to other bases <b>↓ 6%</b>
            </small>
          </article>

          <article className="metric">
            <div className="icon">⚒</div>
            <label>Expended</label>
            <strong>{formatNumber(summary.expended)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Consumed / Ammunition / Fuel <b>↓ 4%</b>
            </small>
          </article>

          <article className="metric">
            <div className="icon">◇</div>
            <label>Closing Balance</label>
            <strong>{formatNumber(summary.closingBalance)}</strong>
            <span className="spark">▂▄▆█</span>
            <small>
              Total assets in inventory <b>↑ 10%</b>
            </small>
          </article>
        </section>

        {/* Panels Grid */}
        <section className="grid">
          {/* Panel 1: Trends */}
          <article className="panel trends">
            <div className="panel-head">
              <h2>⌁ Inventory Movement Trends</h2>
              <button>Last 6 Months⌄</button>
            </div>
            <div className="chart">
              <svg viewBox="0 0 700 250" preserveAspectRatio="none">
                <g stroke="#29414c" strokeDasharray="3 4">
                  <line x1="0" y1="25" x2="700" y2="25" />
                  <line x1="0" y1="88" x2="700" y2="88" />
                  <line x1="0" y1="151" x2="700" y2="151" />
                  <line x1="0" y1="214" x2="700" y2="214" />
                </g>
                <polyline
                  points="0,185 110,75 220,118 330,132 440,83 550,112 700,38"
                  fill="none"
                  stroke="#18d69d"
                  strokeWidth="3"
                />
                <polyline
                  points="0,220 110,165 220,190 330,188 440,150 550,178 700,108"
                  fill="none"
                  stroke="#299cff"
                  strokeWidth="3"
                />
                <polyline
                  points="0,238 110,211 220,225 330,220 440,204 550,220 700,204"
                  fill="none"
                  stroke="#ffc033"
                  strokeWidth="3"
                />
                <polyline
                  points="0,246 110,231 220,241 330,237 440,228 550,239 700,230"
                  fill="none"
                  stroke="#ff5065"
                  strokeWidth="3"
                />
                <polyline
                  points="0,249 110,241 220,246 330,243 440,236 550,245 700,238"
                  fill="none"
                  stroke="#9868f5"
                  strokeWidth="2"
                />
              </svg>
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
              <button>This Month⌄</button>
            </div>
            <div className="barchart">
              <div>
                <strong>1,420</strong>
                <i className="bar bar1"></i>
                <small>▣<br />Vehicles</small>
              </div>
              <div>
                <strong>980</strong>
                <i className="bar bar2"></i>
                <small>▱<br />Weapons</small>
              </div>
              <div>
                <strong>760</strong>
                <i className="bar bar3"></i>
                <small>▥<br />Ammunition</small>
              </div>
              <div>
                <strong>540</strong>
                <i className="bar bar4"></i>
                <small>⌁<br />Communication</small>
              </div>
              <div>
                <strong>320</strong>
                <i className="bar bar5"></i>
                <small>▦<br />Other</small>
              </div>
            </div>
          </article>

          {/* Panel 3: Recent Activities */}
          <article className="panel activities">
            <div className="panel-head">
              <h2>▣ Recent Activities</h2>
              <a href="#activities">View All →</a>
            </div>
            <div className="activity">
              <i className="circle">◇</i>
              <p>
                New asset batch added (200 units - 5.56mm Ammunition)
                <small>29 Sep 2026, 08:30 AM</small>
              </p>
              <b className="tag">Inventory</b>
            </div>
            <div className="activity">
              <i className="circle">→</i>
              <p>
                Asset VHC-2026-0142 dispatched to Base Charlie
                <small>29 Sep 2026, 09:15 AM</small>
              </p>
              <b className="tag">Transfer</b>
            </div>
            <div className="activity">
              <i className="circle">⚒</i>
              <p>
                Maintenance request approved (Asset: APC-2026-0031)
                <small>28 Sep 2026, 04:20 PM</small>
              </p>
              <b className="tag">Maintenance</b>
            </div>
            <div className="activity">
              <i className="circle">♙</i>
              <p>
                Personnel assigned to Base Delta
                <small>28 Sep 2026, 11:05 AM</small>
              </p>
              <b className="tag">Assignment</b>
            </div>
            <div className="activity">
              <i className="circle">!</i>
              <p>
                Asset WPN-2026-0087 marked unserviceable
                <small>27 Sep 2026, 03:40 PM</small>
              </p>
              <b className="tag">Alert</b>
            </div>
          </article>

          {/* Panel 4: Base Stock Levels */}
          <article className="panel stock">
            <div className="panel-head">
              <h2>▣ Base Stock Levels</h2>
              <a href="#bases">View All →</a>
            </div>
            <div className="stock-row">
              <span>Base Alpha</span>
              <div>
                <i style={{ width: '86%' }}></i>
              </div>
              <b>4,320 / 5,000</b>
              <em>86%</em>
            </div>
            <div className="stock-row">
              <span>Base Bravo</span>
              <div>
                <i style={{ width: '65%' }}></i>
              </div>
              <b>3,250 / 5,000</b>
              <em>65%</em>
            </div>
            <div className="stock-row">
              <span>Base Charlie</span>
              <div>
                <i style={{ width: '58%' }}></i>
              </div>
              <b>2,890 / 5,000</b>
              <em>58%</em>
            </div>
            <div className="stock-row">
              <span>Base Delta</span>
              <div>
                <i style={{ width: '42%' }}></i>
              </div>
              <b>2,100 / 5,000</b>
              <em>42%</em>
            </div>
            <div className="stock-row">
              <span>Central Depot</span>
              <div>
                <i style={{ width: '31%' }}></i>
              </div>
              <b>1,540 / 5,000</b>
              <em>31%</em>
            </div>
          </article>

          {/* Panel 5: Recent Asset Movements Table */}
          <article className="panel recent">
            <div className="panel-head">
              <h2>↔ Recent Asset Movements</h2>
              <a href="#movements">View All →</a>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Asset ID</th>
                  <th>Asset Name</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>29 Sep 2026, 09:15</td>
                  <td>VHC-2026-0142</td>
                  <td>Tata LPTA Truck</td>
                  <td>Base Alpha</td>
                  <td>Base Charlie</td>
                  <td>
                    <b className="pill pblue">Transfer</b>
                  </td>
                  <td>
                    <b className="pill pblue">In Transit</b>
                  </td>
                </tr>
                <tr>
                  <td>29 Sep 2026, 08:40</td>
                  <td>WPN-2026-0087</td>
                  <td>INSAS Rifle</td>
                  <td>Base Bravo</td>
                  <td>Base Alpha</td>
                  <td>
                    <b className="pill pblue">Transfer</b>
                  </td>
                  <td>
                    <b className="pill pgreen">Completed</b>
                  </td>
                </tr>
                <tr>
                  <td>28 Sep 2026, 17:30</td>
                  <td>AMM-2026-0211</td>
                  <td>5.56mm Ammunition</td>
                  <td>Central Depot</td>
                  <td>Base Bravo</td>
                  <td>
                    <b className="pill pyellow">Issue</b>
                  </td>
                  <td>
                    <b className="pill pgreen">Completed</b>
                  </td>
                </tr>
                <tr>
                  <td>28 Sep 2026, 14:10</td>
                  <td>COM-2026-0064</td>
                  <td>Tactical Radio Set</td>
                  <td>Base Charlie</td>
                  <td>Base Delta</td>
                  <td>
                    <b className="pill pblue">Transfer</b>
                  </td>
                  <td>
                    <b className="pill pblue">In Transit</b>
                  </td>
                </tr>
                <tr>
                  <td>27 Sep 2026, 11:20</td>
                  <td>VHC-2026-0138</td>
                  <td>Armoured Personnel Carrier</td>
                  <td>Base Alpha</td>
                  <td>Maintenance</td>
                  <td>
                    <b className="pill ppurple">Maintenance</b>
                  </td>
                  <td>
                    <b className="pill pyellow">Under Maintenance</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </article>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
