import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const AssetsPage = () => {
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await api.get('/equipment');
        if (res.data?.data) {
          setEquipmentTypes(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching equipment catalog', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  const categories = ['ALL', 'WEAPON', 'VEHICLE', 'AMMUNITION', 'COMMUNICATION_EQUIPMENT', 'OTHER'];

  const filteredAssets = equipmentTypes.filter(
    (eq) => selectedCategory === 'ALL' || eq.category === selectedCategory
  );

  return (
    <section className="view-panel-container">
      <div className="view-panel-header">
        <div>
          <h2>◇ Military Assets & Equipment Catalog</h2>
          <small>Standard issue firearms, combat vehicles, ammunition calibers, and secure communication systems.</small>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="modal-tabs" style={{ borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '1rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="catalog-grid">
        {loading ? (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>Loading defense assets catalog...</div>
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map((eq) => (
            <div key={eq.id} className="catalog-card">
              <div className="catalog-icon">◇</div>
              <h3>{eq.name}</h3>
              <p>Model: {eq.code || `EQ-${eq.id}`} | Unit: {eq.unitOfMeasure || 'Units'}</p>
              <span className="tag">{eq.category || 'DEFENSE ASSET'}</span>
            </div>
          ))
        ) : (
          <div style={{ color: 'var(--muted)', padding: '20px' }}>No equipment found in this category.</div>
        )}
      </div>
    </section>
  );
};

export default AssetsPage;
