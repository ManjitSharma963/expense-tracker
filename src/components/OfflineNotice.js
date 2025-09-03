import React from 'react';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const OfflineNotice = ({ isOnline = true }) => {
  if (isOnline) return null;

  return (
    <div className="offline-notice">
      <div className="offline-content">
        <FiWifiOff className="offline-icon" />
        <span className="offline-text">
          Backend server is not available. Some features may not work properly.
        </span>
      </div>
    </div>
  );
};

export default OfflineNotice; 