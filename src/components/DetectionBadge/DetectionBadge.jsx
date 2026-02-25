import './DetectionBadge.css';
import { Check } from 'lucide-react';

const DetectionBadge = ({ format, confidence = 'high' }) => {
  if (!format) return null;
  
  const formatNames = {
    DD: 'Decimal Degrees',
    DMS: 'Degrees Minutes Seconds',
    DDM: 'Degrees Decimal Minutes',
    UTM: 'UTM',
    MGRS: 'MGRS',
  };

  return (
    <div className={`detection-badge ${confidence}`}>
      <span className="detection-badge-icon"><Check size={14} /></span>
      <span className="detection-badge-text">
        Detected: <strong>{formatNames[format] || format}</strong>
      </span>
    </div>
  );
};

export default DetectionBadge;
