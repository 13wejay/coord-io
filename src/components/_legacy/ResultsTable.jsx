import { useState } from 'react';
import { exportToCSV, downloadFile } from '../../utils/fileParser';
import './ResultsTable.css';

const ResultsTable = ({ results, fromFormat, toFormat }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!results || results.length === 0) {
    return (
      <div className="results-table-container">
        <div className="results-empty">
          <div className="results-empty-icon">📊</div>
          <p>No results to display</p>
        </div>
      </div>
    );
  }

  const successCount = results.filter(r => r.success).length;
  const errorCount = results.filter(r => !r.success).length;

  const handleCopyRow = async (value, index) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  };

  const handleCopyAll = async () => {
    const successResults = results
      .filter(r => r.success)
      .map(r => r.converted)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(successResults);
      alert('All converted coordinates copied to clipboard!');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = successResults;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('All converted coordinates copied to clipboard!');
    }
  };

  const handleExportCSV = () => {
    const exportData = results.map((r, i) => ({
      'Row': i + 1,
      'Original': r.original,
      'Converted': r.success ? r.converted : '',
      'Status': r.success ? 'Success' : 'Error',
      'Error': r.error || ''
    }));

    const csv = exportToCSV(exportData, ['Row', 'Original', 'Converted', 'Status', 'Error']);
    downloadFile(csv, `coordinates_${fromFormat}_to_${toFormat}.csv`);
  };

  return (
    <div className="results-table-container">
      <div className="results-header">
        <div className="results-count">
          <span className="results-count-number">{results.length}</span> coordinates processed
          {successCount > 0 && (
            <span className="badge badge-success">✓ {successCount} success</span>
          )}
          {errorCount > 0 && (
            <span className="badge badge-error">✕ {errorCount} errors</span>
          )}
        </div>
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={handleCopyAll}>
            📋 Copy All
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="results-table-wrapper">
        <div className="results-table-scroll">
          <table className="results-table">
            <thead>
              <tr>
                <th className="row-number">#</th>
                <th>Original ({fromFormat})</th>
                <th>Converted ({toFormat})</th>
                <th className="status-cell">Status</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={index} className={!row.success ? 'error-row' : ''}>
                  <td className="row-number">{index + 1}</td>
                  <td className="original-coord" title={row.original}>
                    {row.original}
                  </td>
                  <td className="converted-coord" title={row.converted}>
                    {row.success ? row.converted : (
                      <span className="error-message-cell">{row.error}</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${row.success ? 'success' : 'error'}`}>
                      {row.success ? '✓' : '✕'}
                    </span>
                  </td>
                  <td>
                    {row.success && (
                      <button
                        className={`row-copy-button ${copiedIndex === index ? 'copied' : ''}`}
                        onClick={() => handleCopyRow(row.converted, index)}
                        title="Copy"
                      >
                        {copiedIndex === index ? '✓' : '📋'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
