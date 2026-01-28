import { useState, useRef, useCallback } from 'react';
import { convertCoordinate } from '../../utils/coordinateUtils';
import { parseCSV, parseExcel, parsePastedContent, detectCoordinateColumn } from '../../utils/fileParser';
import FormatSelector from '../FormatSelector/FormatSelector';
import ResultsTable from './ResultsTable';
import './BulkConverter.css';

const BulkConverter = () => {
  const [fromFormat, setFromFormat] = useState('DD');
  const [toFormat, setToFormat] = useState('DMS');
  const [inputMethod, setInputMethod] = useState('paste'); // 'paste' or 'file'
  const [pasteContent, setPasteContent] = useState('');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResults(null);

    try {
      let data;
      if (fileName.endsWith('.csv')) {
        const text = await selectedFile.text();
        data = parseCSV(text);
      } else {
        data = await parseExcel(selectedFile);
      }

      if (data.length === 0) {
        setError('The file appears to be empty');
        return;
      }

      setParsedData(data);
      
      // Auto-detect coordinate column
      const detectedColumn = detectCoordinateColumn(data);
      if (detectedColumn) {
        setSelectedColumn(detectedColumn);
      } else {
        // Default to first column
        const columns = Object.keys(data[0]).filter(k => !k.startsWith('_'));
        setSelectedColumn(columns[0] || '');
      }
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setParsedData(null);
    setSelectedColumn('');
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleConvert = useCallback(async () => {
    setError(null);
    setResults(null);
    setIsProcessing(true);
    setProgress(0);

    try {
      let coordinatesToConvert = [];

      if (inputMethod === 'paste') {
        if (!pasteContent.trim()) {
          throw new Error('Please paste some coordinates first');
        }

        const parsed = parsePastedContent(pasteContent);
        
        // Check if parsed data has columns or is simple list
        if (parsed.length > 0 && parsed[0].coordinate) {
          coordinatesToConvert = parsed.map(row => row.coordinate);
        } else if (parsed.length > 0) {
          // Find the coordinate column
          const coordColumn = detectCoordinateColumn(parsed);
          if (coordColumn) {
            coordinatesToConvert = parsed.map(row => row[coordColumn]);
          } else {
            // Try to use first column
            const firstCol = Object.keys(parsed[0]).find(k => !k.startsWith('_'));
            coordinatesToConvert = parsed.map(row => row[firstCol]);
          }
        }
      } else {
        if (!parsedData || parsedData.length === 0) {
          throw new Error('Please upload a file first');
        }
        if (!selectedColumn) {
          throw new Error('Please select the column containing coordinates');
        }

        coordinatesToConvert = parsedData.map(row => row[selectedColumn]);
      }

      // Filter out empty values
      coordinatesToConvert = coordinatesToConvert.filter(c => c && c.toString().trim());

      if (coordinatesToConvert.length === 0) {
        throw new Error('No valid coordinates found');
      }

      // Process conversions
      const conversionResults = [];
      const total = coordinatesToConvert.length;

      for (let i = 0; i < total; i++) {
        const original = coordinatesToConvert[i].toString().trim();
        
        try {
          const converted = convertCoordinate(original, fromFormat, toFormat);
          conversionResults.push({
            original,
            converted,
            success: true
          });
        } catch (err) {
          conversionResults.push({
            original,
            converted: null,
            success: false,
            error: err.message
          });
        }

        // Update progress
        setProgress(Math.round(((i + 1) / total) * 100));

        // Small delay for UI responsiveness with large datasets
        if (i % 100 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setResults(conversionResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [inputMethod, pasteContent, parsedData, selectedColumn, fromFormat, toFormat]);

  const getColumnOptions = () => {
    if (!parsedData || parsedData.length === 0) return [];
    return Object.keys(parsedData[0]).filter(k => !k.startsWith('_'));
  };

  return (
    <div className="bulk-converter">
      <div className="converter-card glass-card glow-border">
        <h2 className="converter-title">
          <span className="converter-title-icon">📋</span>
          Bulk Coordinate Conversion
        </h2>

        <div className="bulk-form">
          {/* Format Selectors */}
          <div className="bulk-format-row">
            <FormatSelector
              label="From Format"
              value={fromFormat}
              onChange={setFromFormat}
              id="bulk-from-format"
            />
            <FormatSelector
              label="To Format"
              value={toFormat}
              onChange={setToFormat}
              id="bulk-to-format"
            />
          </div>

          {/* Input Method Tabs */}
          <div className="input-method-tabs">
            <button
              className={`method-tab ${inputMethod === 'paste' ? 'active' : ''}`}
              onClick={() => setInputMethod('paste')}
            >
              <span>📝</span>
              Paste Data
            </button>
            <button
              className={`method-tab ${inputMethod === 'file' ? 'active' : ''}`}
              onClick={() => setInputMethod('file')}
            >
              <span>📁</span>
              Upload File
            </button>
          </div>

          {/* Paste Input */}
          {inputMethod === 'paste' && (
            <div className="paste-area-container">
              <label className="label">Paste Coordinates</label>
              <textarea
                className="input paste-area"
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={`Paste coordinates here, one per line or from Excel/CSV...\n\nExample:\n38.897957, -77.036560\n40.748817, -73.985428\n34.052235, -118.243683`}
              />
              <div className="paste-hint">
                <span>💡</span>
                Paste directly from Excel, CSV, or enter one coordinate per line
              </div>
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <>
              {!file ? (
                <div
                  className={`file-drop-zone ${isDragOver ? 'dragover' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInputChange}
                  />
                  <div className="drop-zone-content">
                    <div className="drop-zone-icon">📂</div>
                    <div className="drop-zone-text">
                      <strong>Click to upload</strong> or drag and drop
                    </div>
                    <div className="drop-zone-hint">
                      CSV or Excel files (.csv, .xlsx, .xls)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="file-info">
                  <div className="file-info-icon">📄</div>
                  <div className="file-info-details">
                    <div className="file-info-name">{file.name}</div>
                    <div className="file-info-size">
                      {formatFileSize(file.size)}
                      {parsedData && ` • ${parsedData.length} rows`}
                    </div>
                  </div>
                  <button className="file-remove-button" onClick={removeFile}>
                    ✕
                  </button>
                </div>
              )}

              {/* Column Selector */}
              {parsedData && parsedData.length > 0 && (
                <div className="column-selector">
                  <div className="column-select-row">
                    <span className="column-select-label">Coordinate Column:</span>
                    <select
                      className="input column-select"
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                    >
                      {getColumnOptions().map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bulk-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {/* Convert Button */}
          <button
            className="btn btn-primary bulk-convert-button"
            onClick={handleConvert}
            disabled={isProcessing}
          >
            {isProcessing ? 'Converting...' : 'Convert All Coordinates'}
          </button>

          {/* Progress */}
          {isProcessing && (
            <div className="progress-container">
              <div className="progress-bar-wrapper">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="progress-text">
                Processing... {progress}%
              </div>
            </div>
          )}

          {/* Results Table */}
          {results && (
            <ResultsTable
              results={results}
              fromFormat={fromFormat}
              toFormat={toFormat}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkConverter;
