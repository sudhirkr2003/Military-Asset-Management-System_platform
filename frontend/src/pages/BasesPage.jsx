import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const BasesPage = () => {
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const res = await api.get('/bases');
        if (res.data?.data) {
          setBases(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching bases', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBases();
  }, []);

  const formatNumber = (val) => {
    return Number(val || 0).toLocaleString('en-US');
  };

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>⌖ Military Bases & Installations Directory</h2>
          <small>Command posts, regional depots, forward operating bases, and sector armories.</small>
        </div>
      </div>

      <div className="catalog-grid">
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading military installations...</div>
        ) : bases.length > 0 ? (
          bases.map((b) => (
            <div key={b.id} className="catalog-card">
              <div className="catalog-icon">⌖</div>
              <h3>{b.name}</h3>
              <p>Code: {b.code} | Location: {b.location || 'Northern Command'}</p>
              <span className="tag">Armory Capacity: {formatNumber(b.capacity || 5000)} units</span>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>No military bases found.</div>
        )}
      </div>
    </section>
  );
};

export default BasesPage;
