import React from 'react';
import { Construction } from 'lucide-react';

export const PersonnelPage = () => {
  const personnelList = [
    { id: 1, name: 'Chief Commander Admin', rank: 'General', serviceNo: 'HQ-001', base: 'Central HQ', role: 'HQ SUPREME ADMIN' },
    { id: 2, name: 'Col. Vikram Singh', rank: 'Colonel', serviceNo: 'IC-48912', base: 'Base Alpha', role: 'BASE COMMANDER' },
    { id: 3, name: 'Major Rahul Kumar', rank: 'Major', serviceNo: 'IC-56201', base: 'Base Alpha', role: 'LOGISTICS OFFICER' },
    { id: 4, name: 'Capt. Ananya Sharma', rank: 'Captain', serviceNo: 'IC-67104', base: 'Base Bravo', role: 'ARMORY CUSTODIAN' },
  ];

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>♙ Military Personnel & Officers</h2>
          <small>Officers, troop deployments, and service weapon issuance registry.</small>
        </div>
      </div>

      {/* In-Development Status Banner */}
      <div className="modal-alert success" style={{ marginBottom: '1rem', background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fde68a' }}>
        <Construction className="w-5 h-5 mr-2 inline flex-shrink-0" />
        <div>
          <strong>Module In Development:</strong> We are currently working on full Personnel CRUD & biometric assignment integration for this endpoint.
        </div>
      </div>

      <div className="catalog-grid">
        {personnelList.map((p) => (
          <div key={p.id} className="catalog-card">
            <div className="catalog-icon">♙</div>
            <h3>{p.name}</h3>
            <p>Rank: {p.rank} | Service ID: {p.serviceNo}</p>
            <p style={{ fontSize: '0.725rem', color: 'var(--muted)', margin: 0 }}>Assigned Base: {p.base}</p>
            <span className="tag" style={{ marginTop: '0.5rem' }}>{p.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PersonnelPage;
