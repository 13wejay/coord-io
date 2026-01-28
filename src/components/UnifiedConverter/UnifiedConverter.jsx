import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  convertCoordinate, 
  COORDINATE_FORMATS, 
  detectFormat,
  parseDD,
  dmsToDD,
  ddmToDD,
  utmToDD,
  mgrsToDD
} from '../../utils/coordinateUtils';
import { parsePastedContent } from '../../utils/fileParser';
import MapPreview from '../MapPreview/MapPreview';
import DetectionBadge from '../DetectionBadge/DetectionBadge';
import LocationCard from '../LocationCard/LocationCard';
import DataGrid from '../DataGrid/DataGrid';
import ExportButton from '../ExportButton/ExportButton';
import FormatSelector from '../FormatSelector/FormatSelector';
import './UnifiedConverter.css';

const UnifiedConverter = () => {
  // Input state
  const [input, setInput] = useState('');
  const [toFormat, setToFormat] = useState('DMS');
  const [showFormatOverride, setShowFormatOverride] = useState(false);
  const [overrideFromFormat, setOverrideFromFormat] = useState('');
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-detect format and mode
  const { detectedFormat, mode, lines } = useMemo(() => {
    if (!input.trim()) {
      return { detectedFormat: null, mode: 'single', lines: [] };
    }
    
    const trimmedInput = input.trim();
    const inputLines = trimmedInput.split('\n').filter(l => l.trim());
    const isBulk = inputLines.length > 1;
    
    // Detect format from first valid line
    const firstLine = inputLines[0]?.trim() || '';
    const detected = detectFormat(firstLine);
    
    return { 
      detectedFormat: detected, 
      mode: isBulk ? 'bulk' : 'single',
      lines: inputLines
    };
  }, [input]);

  // Parse coordinates for map preview
  const mapCoordinates = useMemo(() => {
    if (!input.trim() || !detectedFormat) return [];
    
    const format = overrideFromFormat || detectedFormat;
    const coords = [];
    
    for (const line of lines) {
      try {
        let lat, lng;
        switch (format) {
          case 'DD': {
            const parsed = parseDD(line);
            lat = parsed.lat;
            lng = parsed.lng;
            break;
          }
          case 'DMS': {
            const parsed = dmsToDD(line);
            lat = parsed.lat;
            lng = parsed.lng;
            break;
          }
          case 'DDM': {
            const parsed = ddmToDD(line);
            lat = parsed.lat;
            lng = parsed.lng;
            break;
          }
          case 'UTM': {
            const parsed = utmToDD(line);
            lat = parsed.lat;
            lng = parsed.lng;
            break;
          }
          case 'MGRS': {
            const parsed = mgrsToDD(line);
            lat = parsed.lat;
            lng = parsed.lng;
            break;
          }
          default:
            continue;
        }
        
        if (lat !== undefined && lng !== undefined && 
            !isNaN(lat) && !isNaN(lng) &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coords.push({ lat, lng, original: line });
        }
      } catch {
        // Skip invalid coordinates
      }
    }
    
    return coords;
  }, [input, detectedFormat, overrideFromFormat, lines]);

  // Handle conversion
  const handleConvert = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter coordinates to convert');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const format = overrideFromFormat || detectedFormat;
      
      if (!format) {
        throw new Error('Could not detect coordinate format. Please check your input or manually select a format.');
      }

      if (mode === 'single') {
        // Single conversion
        const converted = convertCoordinate(input.trim(), format, toFormat);
        
        // Get lat/lng for the result
        let coords = null;
        if (mapCoordinates.length > 0) {
          coords = { lat: mapCoordinates[0].lat, lng: mapCoordinates[0].lng };
        }
        
        setResults({
          type: 'single',
          result: converted,
          original: input.trim(),
          coordinates: coords
        });
      } else {
        // Bulk conversion
        const bulkResults = [];
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          try {
            const converted = convertCoordinate(trimmedLine, format, toFormat);
            
            // Get lat/lng
            let latLng = null;
            try {
              let parsed;
              switch (format) {
                case 'DD': parsed = parseDD(trimmedLine); break;
                case 'DMS': parsed = dmsToDD(trimmedLine); break;
                case 'DDM': parsed = ddmToDD(trimmedLine); break;
                case 'UTM': parsed = utmToDD(trimmedLine); break;
                case 'MGRS': parsed = mgrsToDD(trimmedLine); break;
              }
              if (parsed) latLng = { lat: parsed.lat, lng: parsed.lng };
            } catch {}
            
            bulkResults.push({
              original: trimmedLine,
              converted,
              success: true,
              latLng
            });
          } catch (err) {
            bulkResults.push({
              original: trimmedLine,
              converted: null,
              success: false,
              error: err.message
            });
          }
        }
        
        setResults({
          type: 'bulk',
          results: bulkResults
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [input, detectedFormat, overrideFromFormat, toFormat, mode, lines, mapCoordinates]);

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setInput(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Clear everything
  const handleClear = () => {
    setInput('');
    setResults(null);
    setError(null);
    setShowFormatOverride(false);
    setOverrideFromFormat('');
  };

  // Handle Enter key for single mode
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'single') {
      e.preventDefault();
      handleConvert();
    }
  };

  const activeFormat = overrideFromFormat || detectedFormat;

  return (
    <div className="unified-converter">
      {/* Control Panel - Left Side */}
      <div className="control-panel glass-card">
        <div className="panel-header">
          <h2 className="panel-title">
            <span className="panel-icon">🎯</span>
            Coordinate Converter
          </h2>
          <span className={`mode-badge ${mode}`}>
            {mode === 'single' ? '📍 Single' : '📋 Bulk'}
          </span>
        </div>

        {/* Smart Input */}
        <div 
          className={`smart-input-container ${isDragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <textarea
            className="smart-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"Paste coordinates here (DD, DMS, UTM, MGRS) or drag & drop a file...\n\nExamples:\n38.897, -77.036\n38° 53' 49\" N, 77° 2' 11\" W\n18S 323394 4307395"}
            rows={mode === 'bulk' ? 8 : 4}
          />
          
          {isDragOver && (
            <div className="drop-overlay">
              <span className="drop-icon">📂</span>
              <span>Drop file here</span>
            </div>
          )}
          
          {input && (
            <button 
              className="clear-input-btn"
              onClick={handleClear}
              title="Clear input"
            >
              ✕
            </button>
          )}
        </div>

        {/* Detection Badge */}
        <div className="detection-row">
          {detectedFormat && (
            <DetectionBadge format={activeFormat} />
          )}
          
          <button 
            className="override-toggle"
            onClick={() => setShowFormatOverride(!showFormatOverride)}
          >
            {showFormatOverride ? 'Hide options' : 'Change format'}
          </button>
        </div>

        {/* Format Override (hidden by default) */}
        {showFormatOverride && (
          <div className="format-override animate-fadeIn">
            <FormatSelector
              label="From Format"
              value={overrideFromFormat || detectedFormat || 'DD'}
              onChange={setOverrideFromFormat}
              id="from-format"
            />
          </div>
        )}

        {/* To Format Selector */}
        <div className="output-format">
          <FormatSelector
            label="Convert To"
            value={toFormat}
            onChange={setToFormat}
            id="to-format"
          />
        </div>

        {/* Convert Button */}
        <button
          className="btn btn-primary convert-btn"
          onClick={handleConvert}
          disabled={!input.trim() || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Converting...
            </>
          ) : (
            <>
              Convert {mode === 'bulk' ? `${lines.length} Coordinates` : 'Coordinate'}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="error-message animate-fadeIn">
            <span>⚠️</span>
            {error}
          </div>
        )}
      </div>

      {/* Results Panel - Middle Section (Scrollable) */}
      <div className="results-panel">
        <div className="results-panel-header">
          <h3>
            <span>📊</span>
            Conversion Results
          </h3>
          {results?.type === 'bulk' && (
            <ExportButton results={results.results} toFormat={toFormat} />
          )}
        </div>
        <div className="results-panel-content">
          {!results ? (
            <div className="results-panel-empty">
              <div className="results-panel-empty-icon">📋</div>
              <div className="results-panel-empty-text">
                Converted coordinates will appear here
              </div>
            </div>
          ) : results.type === 'single' ? (
            <LocationCard
              result={results.result}
              toFormat={toFormat}
              originalInput={results.original}
              coordinates={results.coordinates}
            />
          ) : (
            <DataGrid
              results={results.results}
              fromFormat={activeFormat}
              toFormat={toFormat}
            />
          )}
        </div>
      </div>

      {/* Map Preview - Right Side */}
      <div className="map-panel glass-card">
        <MapPreview 
          coordinates={mapCoordinates}
          fromFormat={activeFormat}
          toFormat={toFormat}
        />
      </div>
    </div>
  );
};

export default UnifiedConverter;
