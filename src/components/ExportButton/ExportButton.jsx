import { useState, useRef, useEffect } from 'react';
import './ExportButton.css';

const ExportButton = ({ results, toFormat }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!results || results.length === 0) return null;

  const successfulResults = results.filter(r => r.success);

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportCSV = () => {
    const headers = ['Original', 'Converted', 'Status'];
    const rows = results.map(r => [
      `"${r.original}"`,
      `"${r.converted || ''}"`,
      r.success ? 'Valid' : 'Error'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csv, `coordinates_${toFormat}.csv`, 'text/csv');
  };

  const exportJSON = () => {
    const data = results.map(r => ({
      original: r.original,
      converted: r.converted,
      success: r.success,
      error: r.error || null
    }));
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, `coordinates_${toFormat}.json`, 'application/json');
  };

  const exportKML = () => {
    // For KML, we need lat/lng coordinates
    // We'll include the original and converted in the description
    const placemarks = successfulResults.map((r, i) => {
      // Try to extract lat/lng from DD format or use placeholder
      let lat = 0, lng = 0;
      if (r.latLng) {
        lat = r.latLng.lat;
        lng = r.latLng.lng;
      }
      
      return `
    <Placemark>
      <name>Point ${i + 1}</name>
      <description><![CDATA[
        Original: ${r.original}<br/>
        Converted: ${r.converted}
      ]]></description>
      <Point>
        <coordinates>${lng},${lat},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('');

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Converted Coordinates</name>
    <description>Exported from CoordConvert</description>
    ${placemarks}
  </Document>
</kml>`;

    downloadFile(kml, `coordinates_${toFormat}.kml`, 'application/vnd.google-earth.kml+xml');
  };

  return (
    <div className="export-button-container" ref={dropdownRef}>
      <button 
        className="btn btn-secondary export-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>📥</span>
        Export
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="export-dropdown glass-card">
          <button className="export-option" onClick={exportCSV}>
            <span className="export-icon">📄</span>
            <div className="export-details">
              <span className="export-format">CSV</span>
              <span className="export-desc">Excel compatible</span>
            </div>
          </button>
          <button className="export-option" onClick={exportJSON}>
            <span className="export-icon">📋</span>
            <div className="export-details">
              <span className="export-format">JSON</span>
              <span className="export-desc">Developer friendly</span>
            </div>
          </button>
          <button className="export-option" onClick={exportKML}>
            <span className="export-icon">🌍</span>
            <div className="export-details">
              <span className="export-format">KML</span>
              <span className="export-desc">Google Earth</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
