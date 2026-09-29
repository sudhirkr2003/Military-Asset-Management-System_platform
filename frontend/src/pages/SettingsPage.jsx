import React from 'react';
import { ShieldCheck, Server, Database, Key } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>⚙ System Configuration & Node Health</h2>
          <small>Network connectivity, security protocols, and operational database status.</small>
        </div>
      </div>

      <div className="catalog-grid">
        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green)' }}>
            <Server className="w-5 h-5" />
          </div>
          <h3>Spring Boot Backend Node</h3>
          <p>Host: http://localhost:8080 | Protocol: REST / JSON</p>
          <span className="tag">STATUS: ONLINE & RESPONSIVE</span>
        </div>

        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(36, 153, 255, 0.15)', color: 'var(--blue)' }}>
            <Database className="w-5 h-5" />
          </div>
          <h3>Database Engine</h3>
          <p>MySQL 8.0 • Engine: InnoDB • Schema: mams_db</p>
          <span className="tag">STATUS: CONNECTED (LOCAL:3306)</span>
        </div>

        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(154, 105, 245, 0.15)', color: 'var(--purple)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3>Security & Encryption</h3>
          <p>JWT JJWT 0.12.6 • Algorithm: HS256 • Role RBAC: Active</p>
          <span className="tag">ENCRYPTION: OPERATIONAL</span>
        </div>

        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(255, 189, 46, 0.15)', color: 'var(--yellow)' }}>
            <Key className="w-5 h-5" />
          </div>
          <h3>API Documentation Endpoint</h3>
          <p>Swagger OpenAPI 3.0 UI Endpoint: /swagger-ui/index.html</p>
          <span className="tag">SPECIFICATION: OPENAPI 3</span>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
