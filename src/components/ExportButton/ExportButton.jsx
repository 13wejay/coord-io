import { useState, useRef, useEffect } from 'react';
import './ExportButton.css';
import { Download, ChevronDown, FileText, FileJson, Globe } from 'lucide-react';

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
    // Add BOM for Excel to recognize UTF-8
    const blob = new Blob(['\uFEFF' + content], { type: `${type};charset=utf-8;` });
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
    // Define headers based on output format
    let convertedHeaders = ['Converted'];
    switch (toFormat) {
      case 'DD':
      case 'DMS':
      case 'DDM':
        convertedHeaders = ['Converted Lat', 'Converted Lng'];
        break;
      case 'UTM':
        convertedHeaders = ['Zone/Hemisphere', 'Easting', 'Northing'];
        break;
      case 'MGRS':
        convertedHeaders = ['Grid Zone', 'Easting', 'Northing'];
        break;
    }

    const headers = ['Original Input', 'Latitude', 'Longitude', ...convertedHeaders, 'Status'];
    
    // Helper to escape CSV fields
    const escapeCsv = (field) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const rows = results.map(r => {
      // Split converted result by tab if it exists
      const convertedParts = r.converted ? r.converted.split('\t') : [];
      
      // Pad with empty strings if parts are missing compared to headers
      while (convertedParts.length < convertedHeaders.length) {
        convertedParts.push('');
      }

      return [
        escapeCsv(r.original),
        r.latLng ? r.latLng.lat : '',
        r.latLng ? r.latLng.lng : '',
        ...convertedParts.map(escapeCsv),
        r.success ? 'Valid' : 'Error'
      ];
    });
    
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
        <Download size={18} />
        Export
        <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="export-dropdown glass-card">
          <button className="export-option" onClick={exportCSV}>
            <span className="export-icon"><FileText size={18} /></span>
            <div className="export-details">
              <span className="export-format">CSV</span>
              <span className="export-desc">Excel compatible</span>
            </div>
          </button>
          <button className="export-option" onClick={exportJSON}>
            <span className="export-icon"><FileJson size={18} /></span>
            <div className="export-details">
              <span className="export-format">JSON</span>
              <span className="export-desc">Developer friendly</span>
            </div>
          </button>
          <button className="export-option" onClick={exportKML}>
            <span className="export-icon"><Globe size={18} /></span>
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
