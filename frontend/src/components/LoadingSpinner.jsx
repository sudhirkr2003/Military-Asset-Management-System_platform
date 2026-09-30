import React from 'react';
import { Shield } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Fetching secure defense records...', size = 'normal', fullPage = false }) => {
  const content = (
    <div className={`mams-loading-container ${size}`}>
      <div className="mams-spinner-wrapper">
        <div className="mams-spinner-ring outer"></div>
        <div className="mams-spinner-ring inner"></div>
        <div className="mams-spinner-core">
          <Shield size={size === 'small' ? 12 : 16} className="mams-spinner-icon" />
        </div>
      </div>
      {label && <p className="mams-spinner-label">{label}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="mams-loading-overlay">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
