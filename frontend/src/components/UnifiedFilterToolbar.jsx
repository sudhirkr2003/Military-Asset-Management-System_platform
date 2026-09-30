import React, { useState } from 'react';
import { Filter, ChevronDown, RefreshCw, Search, Calendar } from 'lucide-react';

export const UnifiedFilterToolbar = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  dateRange,
  onRefresh,
  loading = false,
  refreshLabel = 'Refresh',
  hasActiveFilters = false,
  onReset,
  extraActions,
  infoBadge,
  style,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="filter-toolbar" style={style}>
      {/* 1. Search Bar (Part of single line on desktop/tablet, top full-width on mobile) */}
      {onSearchChange !== undefined && (
        <div className="filter-search-wrap">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-search-input"
          />
          {searchValue && (
            <button
              type="button"
              className="filter-search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* 2. Mobile Action Bar (Toggle Button + Refresh, visible only <= 768px) */}
      <div className="filter-mobile-bar">
        <button
          type="button"
          className={`filter-toggle-btn ${mobileOpen ? 'active' : ''}`}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle Filter Controls"
        >
          <Filter size={14} />
          <span>Filters & Scope</span>
          {hasActiveFilters && <span className="filter-active-pill">Active</span>}
          <ChevronDown size={14} className={`filter-chevron ${mobileOpen ? 'open' : ''}`} />
        </button>

        {onRefresh && (
          <button
            type="button"
            className="hero-refresh-btn filter-mobile-refresh"
            onClick={onRefresh}
            disabled={loading}
            title={refreshLabel}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        )}
      </div>

      {/* 3. Filter Items (Desktop single line alongside search, Mobile 2 compact lines inside drawer) */}
      <div className={`filter-items-wrapper ${mobileOpen ? 'mobile-expanded' : ''}`}>
        {/* Dynamic Selects (Side-by-side on mobile line 1, inline on desktop) */}
        {filters.length > 0 && (
          <div className="filter-selects-row">
            {filters.map((f) => {
              const IconComp = f.icon;
              return (
                <div key={f.id || f.ariaLabel} className="filter-item-group">
                  {IconComp && (
                    <IconComp
                      size={14}
                      style={{ color: f.iconColor || 'var(--blue)', flexShrink: 0 }}
                    />
                  )}
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="filter-select"
                    aria-label={f.ariaLabel || 'Filter'}
                  >
                    {f.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        {/* Date Range (Mobile line 2, inline on desktop) */}
        {dateRange && (
          <div className="filter-date-wrap">
            <div className="filter-date-field">
              <Calendar size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <input
                type="date"
                value={dateRange.startDate || ''}
                onChange={(e) => dateRange.onStartDateChange(e.target.value)}
                className="filter-date-input"
                title={dateRange.startTitle || 'Start Date'}
              />
            </div>
            <span className="filter-date-sep">to</span>
            <div className="filter-date-field">
              <Calendar size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <input
                type="date"
                value={dateRange.endDate || ''}
                onChange={(e) => dateRange.onEndDateChange(e.target.value)}
                className="filter-date-input"
                title={dateRange.endTitle || 'End Date'}
              />
            </div>
          </div>
        )}

        {/* Extra info badge if any */}
        {infoBadge && (
          <span className="filter-info-badge">
            {infoBadge}
          </span>
        )}

        {extraActions}

        {/* Reset button (if filters are active) */}
        {hasActiveFilters && onReset && (
          <button
            type="button"
            className="filter-reset-btn"
            onClick={onReset}
            title="Clear all filters"
          >
            ✕ Reset
          </button>
        )}

        {/* Desktop Refresh button (always aligned to right on desktop/tablet) */}
        {onRefresh && (
          <button
            type="button"
            className="hero-refresh-btn filter-refresh-btn desktop-only"
            onClick={onRefresh}
            disabled={loading}
            title={refreshLabel}
          >
            <RefreshCw size={13} className={`inline mr-1 ${loading ? 'spin' : ''}`} />
            <span>{refreshLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default UnifiedFilterToolbar;
