import { useState } from 'react';
import './LocationCard.css';
import { MapPin, Check, Copy, Map, Share2 } from 'lucide-react';

const LocationCard = ({ 
  result, 
  toFormat, 
  coordinates 
}) => {
  const [copied, setCopied] = useState(false);
  
  if (!result) return null;

  const formatNames = {
    DD: 'Decimal Degrees',
    DMS: 'Degrees Minutes Seconds',
    DDM: 'Degrees Decimal Minutes',
    UTM: 'UTM',
    MGRS: 'MGRS',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = result;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Coordinate',
          text: `${result}`,
          url: coordinates ? 
            `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : 
            undefined,
        });
      } catch {
        // User cancelled or share failed
        console.log('Share cancelled');
      }
    } else {
      // Fallback to copying a shareable link
      handleCopy();
    }
  };

  return (
    <div className="location-card glass-card">
      <div className="location-card-header">
        <span className="location-card-icon"><MapPin size={18} /></span>
        <span className="location-card-format">
          {formatNames[toFormat] || toFormat}
        </span>
      </div>
      
      <div className="location-card-result">
        {result}
      </div>
      
      <div className="location-card-actions">
        <button 
          className={`action-btn ${copied ? 'success' : ''}`}
          onClick={handleCopy}
        >
          {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
        </button>
        
        {coordinates && (
          <button 
            className="action-btn"
            onClick={handleOpenGoogleMaps}
          >
            <Map size={16} /> Google Maps
          </button>
        )}
        
        <button 
          className="action-btn"
          onClick={handleShare}
        >
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
};

export default LocationCard;
