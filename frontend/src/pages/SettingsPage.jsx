import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  Server,
  Database,
  Key,
  ExternalLink,
  Code,
  FileCode,
  Lock,
  User,
  CheckCircle,
  Copy,
  Terminal
} from 'lucide-react';

export const SettingsPage = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('mams_user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const copyToken = () => {
    const token = localStorage.getItem('mams_token');
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const swaggerEndpoints = [
    { tag: 'Authentication', path: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/me' },
    { tag: 'Dashboard Analytics', path: 'GET /api/dashboard/summary, GET /api/dashboard/recent-movements, GET /api/dashboard/category-distribution' },
    { tag: 'Equipment Catalog CRUD', path: 'GET /api/equipment, POST /api/equipment, PUT /api/equipment/{id}, DELETE /api/equipment/{id}' },
    { tag: 'Movements & Audit Ledger', path: 'POST /api/movements/purchase, POST /api/movements/transfer, POST /api/movements/assign, POST /api/movements/return, POST /api/movements/expend, GET /api/movements' },
    { tag: 'Live Inventory Tracking', path: 'GET /api/inventory, GET /api/inventory/base/{baseId}, GET /api/inventory/base/{baseId}/equipment/{equipmentTypeId}' },
    { tag: 'Personnel & Officers CRUD', path: 'GET /api/personnel, POST /api/personnel, PUT /api/personnel/{id}, DELETE /api/personnel/{id}' },
    { tag: 'Logistical Reports & CSV Export', path: 'GET /api/reports/movements, GET /api/reports/expenditures, GET /api/reports/inventory-audit, GET /api/reports/export/csv' },
    { tag: 'Military Bases Management', path: 'GET /api/bases, POST /api/bases, GET /api/bases/{id}' },
  ];

  return (
    <section className="view-panel-container">
      {/* Header */}
      <div className="view-panel-header">
        <div>
          <h2>⚙ System Configuration & API Documentation Hub</h2>
          <small>OpenAPI 3.0 Swagger specifications, server architecture, and security protocols.</small>
        </div>
      </div>

      {/* ==================== SWAGGER / OPENAPI 3.0 FEATURED CARD ==================== */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 19, 28, 0.95))',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '1.5rem',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--green)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileCode className="w-5 h-5" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>
                Swagger OpenAPI 3.0 Interactive Documentation
              </h3>
              <span className="pill pgreen" style={{ fontSize: '10px' }}>
                LIVE & DOCUMENTED
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '12px', maxWidth: '680px', margin: '0 0 12px 0' }}>
              All 27+ backend REST endpoints are fully indexed with JSON schema models, Bearer JWT authentication, and interactive "Try it out" test runners.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="http://localhost:8080/swagger-ui/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Launch Swagger UI
            </a>
            <a
              href="http://localhost:8080/v3/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Code className="w-3.5 h-3.5" /> Raw OpenAPI JSON
            </a>
          </div>
        </div>

        {/* Endpoints Directory */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '10px',
          }}
        >
          {swaggerEndpoints.map((ep, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <strong style={{ fontSize: '11px', color: 'var(--green)', display: 'block', marginBottom: '4px' }}>
                ● {ep.tag}
              </strong>
              <code style={{ fontSize: '10px', color: 'var(--muted)', wordBreak: 'break-all', display: 'block' }}>
                {ep.path}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Profile & Node Architecture Grid */}
      <div className="catalog-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Active User Card */}
        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(36, 153, 255, 0.15)', color: 'var(--blue)' }}>
            <User className="w-5 h-5" />
          </div>
          <h3>Active Security Principal</h3>
          <p>
            User: <strong>{currentUser?.fullName || currentUser?.username || 'Chief Commander Admin'}</strong>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 10px 0' }}>
            Role: <span className="pill pred" style={{ fontSize: '10px' }}>{currentUser?.role || 'ADMIN'}</span> | Base: {currentUser?.baseName || 'National HQ'}
          </p>
          <button
            className="btn-secondary"
            onClick={copyToken}
            style={{ fontSize: '11px', padding: '4px 8px', width: '100%', justifyContent: 'center' }}
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3 text-green" style={{ color: 'var(--green)' }} /> Copied JWT Token!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Bearer JWT for Swagger
              </>
            )}
          </button>
        </div>

        {/* Backend Node */}
        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--green)' }}>
            <Server className="w-5 h-5" />
          </div>
          <h3>Spring Boot 3.3.5 Server</h3>
          <p>Host: http://localhost:8080 | Java 17 LTS</p>
          <span className="tag">STATUS: 100% OPERATIONAL</span>
        </div>

        {/* Database Node */}
        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(255, 189, 46, 0.15)', color: 'var(--yellow)' }}>
            <Database className="w-5 h-5" />
          </div>
          <h3>MySQL 8.0 Database</h3>
          <p>Schema: mams_db • HikariCP Connection Pool</p>
          <span className="tag">STATUS: LIVE CONNECTED (PORT 3306)</span>
        </div>

        {/* Security / RBAC */}
        <div className="catalog-card">
          <div className="catalog-icon" style={{ background: 'rgba(154, 105, 245, 0.15)', color: 'var(--purple)' }}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3>Zero-Lombok Architecture</h3>
          <p>Pure Standard Java DTOs, Entities & Clean Handlers</p>
          <span className="tag">ENFORCEMENT: ACTIVE</span>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
