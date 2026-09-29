import React from 'react';
import { Construction } from 'lucide-react';

export const ReportsPage = () => {
  const reports = [
    {
      title: 'Monthly Defense Asset Movement Audit',
      desc: 'Complete ledger compilation of purchases, base transfers, and personnel assignments.',
      frequency: 'Monthly',
      status: 'Ready for Export',
    },
    {
      title: 'Ammunition & Fuel Expenditure Analytics',
      desc: 'Operational consumption metrics across live firing ranges and sector deployments.',
      frequency: 'Quarterly',
      status: 'Ready for Export',
    },
    {
      title: 'Base Armory Capacity & Threshold Alert',
      desc: 'Inspection of storage saturation and requisition recommendations.',
      frequency: 'Real-Time',
      status: 'Ready for Export',
    },
  ];

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>▥ Intelligence & Logistical Reports</h2>
          <small>Automated audit trails, procurement records, and ammunition expenditure summaries.</small>
        </div>
      </div>

      {/* In-Development Status Banner */}
      <div className="modal-alert success" style={{ marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fde68a' }}>
        <Construction className="w-5 h-5 mr-2 inline flex-shrink-0" />
        <div>
          <strong>Module In Development:</strong> PDF/CSV Export generation and automated scheduled email reporting endpoints are being connected.
        </div>
      </div>

      <div className="catalog-grid">
        {reports.map((r, i) => (
          <div key={i} className="catalog-card">
            <div className="catalog-icon">▥</div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <span className="tag">{r.frequency} • {r.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReportsPage;
