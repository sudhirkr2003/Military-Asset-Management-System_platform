import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { apiCache } from '../services/api';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Filter,
  Calendar,
  Layers,
  Flame,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowRightLeft
} from 'lucide-react';
import UnifiedFilterToolbar from '../components/UnifiedFilterToolbar';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('movements'); // 'movements' | 'expenditures' | 'inventory'
  const [bases, setBases] = useState(() => {
    return apiCache.get('get:bases')?.data?.data || [];
  });
  const [loading, setLoading] = useState(false);

  // Filter States
  const [selectedBase, setSelectedBase] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Report Data States
  const [movementReports, setMovementReports] = useState([]);
  const [expenditureReports, setExpenditureReports] = useState([]);
  const [inventoryReports, setInventoryReports] = useState([]);

  const fetchBases = useCallback(async (isManual = false) => {
    try {
      const config = isManual ? { forceRefresh: true } : {};
      const res = await api.get('/bases', config);
      if (res.data?.data) {
        setBases(res.data.data);
      }
    } catch (err) {
      console.error('Error loading bases for reports', err);
    }
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const fetchReportData = useCallback(async (isManual = false) => {
    if (isManual) {
      setLoading(true);
    }
    try {
      const config = isManual ? { forceRefresh: true } : {};
      if (activeTab === 'movements') {
        const params = {};
        if (selectedBase !== 'ALL') params.baseId = selectedBase;
        if (selectedType !== 'ALL') params.movementType = selectedType;
        if (startDate) params.startDate = `${startDate}T00:00:00`;
        if (endDate) params.endDate = `${endDate}T23:59:59`;

        const res = await api.get('/reports/movements', { ...config, params });
        if (res.data?.data) {
          setMovementReports(res.data.data);
        }
      } else if (activeTab === 'expenditures') {
        const params = {};
        if (selectedBase !== 'ALL') params.baseId = selectedBase;
        if (startDate) params.startDate = `${startDate}T00:00:00`;
        if (endDate) params.endDate = `${endDate}T23:59:59`;

        const res = await api.get('/reports/expenditures', { ...config, params });
        if (res.data?.data) {
          setExpenditureReports(res.data.data);
        }
      } else if (activeTab === 'inventory') {
        const params = {};
        if (selectedBase !== 'ALL') params.baseId = selectedBase;

        const res = await api.get('/reports/inventory-audit', { ...config, params });
        if (res.data?.data) {
          setInventoryReports(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching report', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBase, selectedType, startDate, endDate]);

  useEffect(() => {
    fetchReportData();

    const handleUpdate = () => {
      fetchBases(true);
      fetchReportData(true);
    };
    window.addEventListener('mams:movement_updated', handleUpdate);
    window.addEventListener('mams:data_updated', handleUpdate);
    return () => {
      window.removeEventListener('mams:movement_updated', handleUpdate);
      window.removeEventListener('mams:data_updated', handleUpdate);
    };
  }, [fetchReportData, fetchBases]);


  const handleExportCsv = async () => {
    try {
      const params = { type: activeTab };
      if (selectedBase !== 'ALL') params.baseId = selectedBase;
      if (selectedType !== 'ALL' && activeTab === 'movements') params.movementType = selectedType;
      if (startDate) params.startDate = `${startDate}T00:00:00`;
      if (endDate) params.endDate = `${endDate}T23:59:59`;

      const response = await api.get('/reports/export/csv', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `mams_${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('CSV Export Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  // Metrics calculation for current report
  const totalQuantity = movementReports.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const totalPurchases = movementReports
    .filter((r) => r.movementType === 'PURCHASE')
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const totalTransfers = movementReports
    .filter((r) => r.movementType?.includes('TRANSFER'))
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const totalExpended = movementReports
    .filter((r) => r.movementType === 'EXPENDITURE')
    .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

  return (
    <section className="view-panel-container">
      {/* Top Header */}
      <div className="view-panel-header">
        <div>
          <h2>▥ Intelligence, Logistical & Audit Reports</h2>
          <small>
            Real-time audit trails, expenditure analysis, base armory capacity compliance, and data exports.
          </small>
        </div>
        <div className="view-panel-actions">
          <button className="btn-secondary" onClick={handlePrint} title="Print or Save PDF">
            <Printer className="w-3.5 h-3.5 inline mr-1" /> <span className="btn-text">Print / Save PDF</span>
          </button>
          <button className="btn-primary" onClick={handleExportCsv} title="Export CSV File">
            <Download className="w-3.5 h-3.5 inline mr-1" /> <span className="btn-text">Export CSV File</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="report-switcher-tabs">
        <button
          className={`report-tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <FileText size={16} className="report-tab-icon" />
          <span>Movement & Procurement Audit</span>
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'expenditures' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenditures')}
        >
          <Flame size={16} className="report-tab-icon" />
          <span>Ammunition & Fuel Expenditure</span>
        </button>
        <button
          className={`report-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <Building size={16} className="report-tab-icon" />
          <span>Base Armory Inventory Audit</span>
        </button>
      </div>

      {/* Filter Controls */}
      {/* Unified Filter & Scope Toolbar */}
      <UnifiedFilterToolbar
        style={{ marginBottom: '1.25rem' }}
        filters={[
          {
            id: 'base',
            icon: Building,
            iconColor: 'var(--blue)',
            value: selectedBase,
            onChange: setSelectedBase,
            ariaLabel: 'Filter by Base',
            options: [
              { value: 'ALL', label: `All Bases & Depots (${bases.length})` },
              ...bases.map((b) => ({ value: b.id, label: b.name }))
            ]
          },
          ...(activeTab === 'movements'
            ? [
                {
                  id: 'movementType',
                  icon: ArrowRightLeft,
                  iconColor: 'var(--yellow)',
                  value: selectedType,
                  onChange: setSelectedType,
                  ariaLabel: 'Filter by Movement Type',
                  options: [
                    { value: 'ALL', label: 'All Movement Types' },
                    { value: 'PURCHASE', label: 'Purchases Only' },
                    { value: 'TRANSFER_OUT', label: 'Transfer Out Only' },
                    { value: 'TRANSFER_IN', label: 'Transfer In Only' },
                    { value: 'ASSIGNMENT', label: 'Personnel Assignments' },
                    { value: 'RETURN', label: 'Returns' },
                    { value: 'EXPENDITURE', label: 'Expenditures Only' }
                  ]
                }
              ]
            : [])
        ]}
        dateRange={
          activeTab !== 'inventory'
            ? {
                startDate,
                onStartDateChange: setStartDate,
                endDate,
                onEndDateChange: setEndDate,
                startTitle: 'From Date',
                endTitle: 'To Date'
              }
            : undefined
        }
        onRefresh={() => fetchReportData(true)}
        loading={loading}
        refreshLabel="Update Report"
        hasActiveFilters={
          selectedBase !== 'ALL' ||
          selectedType !== 'ALL' ||
          Boolean(startDate) ||
          Boolean(endDate)
        }
        onReset={() => {
          setSelectedBase('ALL');
          setSelectedType('ALL');
          setStartDate('');
          setEndDate('');
        }}
      />

      {/* Summary KPI Cards */}
      {activeTab === 'movements' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--panel)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Total Audit Transactions</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--blue)' }}>{movementReports.length}</strong>
          </div>
          <div
            style={{
              background: 'var(--panel)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Procured Assets</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--green)' }}>+{formatNumber(totalPurchases)}</strong>
          </div>
          <div
            style={{
              background: 'var(--panel)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Transferred Assets</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--yellow)' }}>{formatNumber(totalTransfers)}</strong>
          </div>
          <div
            style={{
              background: 'var(--panel)',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block' }}>Expended / Consumed</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--red)' }}>-{formatNumber(totalExpended)}</strong>
          </div>
        </div>
      )}

      {/* ==================== TAB 1: MOVEMENTS AUDIT ==================== */}
      {activeTab === 'movements' && (
        <div className="view-table-card">
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date & Time</th>
                <th>Base Installation</th>
                <th>Equipment / Asset</th>
                <th>Category</th>
                <th>Movement Type</th>
                <th>Units / Qty</th>
                <th>Operational Reference</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Compiling military movement audit...
                  </td>
                </tr>
              ) : movementReports.length > 0 ? (
                movementReports.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--blue)' }}>{m.id}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Today'}
                        </span>
                        <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{m.baseName}</strong>
                    </td>
                    <td>{m.equipmentName}</td>
                    <td>{m.equipmentCategory || 'EQUIPMENT'}</td>
                    <td>
                      <b
                        className={`pill ${
                          m.movementType === 'PURCHASE'
                            ? 'pgreen'
                            : m.movementType?.includes('TRANSFER')
                            ? 'pblue'
                            : m.movementType === 'EXPENDITURE'
                            ? 'pyellow'
                            : 'ppurple'
                        }`}
                      >
                        {m.movementType}
                      </b>
                    </td>
                    <td>
                      <strong>{formatNumber(m.quantity)}</strong>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '11px' }}>
                      {m.remarks || m.referenceType || '-'}
                    </td>
                    <td>{m.createdBy || 'ADMIN'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    No audit records match the selected date range and base criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== TAB 2: EXPENDITURE ANALYTICS ==================== */}
      {activeTab === 'expenditures' && (
        <div className="view-table-card">
          <table>
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date & Time</th>
                <th>Base / Sector</th>
                <th>Asset Expended</th>
                <th>Category</th>
                <th>Quantity Consumed</th>
                <th>Operational Remarks</th>
                <th>Authorizing Officer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Analyzing operational expenditures...
                  </td>
                </tr>
              ) : expenditureReports.length > 0 ? (
                expenditureReports.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--yellow)' }}>{e.id}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', lineHeight: 1.15 }}>
                        <span style={{ fontSize: '11px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          {e.timestamp ? new Date(e.timestamp).toLocaleDateString() : 'Today'}
                        </span>
                        <span style={{ fontSize: '9.5px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <strong>{e.baseName}</strong>
                    </td>
                    <td>{e.equipmentName}</td>
                    <td>{e.equipmentCategory || 'AMMUNITION'}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 400 }}>-{formatNumber(e.quantity)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '11px' }}>{e.remarks || 'Combat / Training Mission'}</td>
                    <td>{e.createdBy || 'ADMIN'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    No operational expenditure logs found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ==================== TAB 3: BASE ARMORY INVENTORY AUDIT ==================== */}
      {activeTab === 'inventory' && (
        <div className="view-table-card">
          <table>
            <thead>
              <tr>
                <th>Base Installation</th>
                <th>Equipment / Asset</th>
                <th>Category</th>
                <th>Opening Balance</th>
                <th>Available (Armory)</th>
                <th>Assigned (Troops)</th>
                <th>Expended</th>
                <th>Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                    Auditing base armory inventory...
                  </td>
                </tr>
              ) : inventoryReports.length > 0 ? (
                inventoryReports.map((inv) => (
                  <tr key={inv.id || `${inv.baseId}-${inv.equipmentTypeId}`}>
                    <td>
                      <strong>{inv.baseName}</strong>
                    </td>
                    <td>{inv.equipmentName}</td>
                    <td>{inv.equipmentCategory || 'EQUIPMENT'}</td>
                    <td>{formatNumber(inv.openingBalance)}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 400 }}>
                      {formatNumber(inv.availableQuantity)}
                    </td>
                    <td style={{ color: 'var(--yellow)', fontWeight: 400 }}>
                      {formatNumber(inv.assignedQuantity)}
                    </td>
                    <td style={{ color: 'var(--red)' }}>{formatNumber(inv.expendedQuantity)}</td>
                    <td>
                      <strong>{formatNumber(inv.closingBalance)}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    No inventory records found for the selected base.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ReportsPage;
