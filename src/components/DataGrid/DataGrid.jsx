import { useMemo } from 'react';
import './DataGrid.css';
import { CheckCircle2, XCircle } from 'lucide-react';

const DataGrid = ({ 
  results, 
  fromFormat, 
  toFormat,
  onRowClick 
}) => {
  const stats = useMemo(() => {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    return { total, successful, failed };
  }, [results]);

  if (!results || results.length === 0) return null;

  return (
    <div className="data-grid-container">
      <div className="data-grid-header">
        <div className="data-grid-stats">
          <span className="stat">
            <span className="stat-value">{stats.total}</span> total
          </span>
          <span className="stat success">
            <span className="stat-icon"><CheckCircle2 size={16} /></span>
            <span className="stat-value">{stats.successful}</span> valid
          </span>
          {stats.failed > 0 && (
            <span className="stat error">
              <span className="stat-icon"><XCircle size={16} /></span>
              <span className="stat-value">{stats.failed}</span> errors
            </span>
          )}
        </div>
      </div>

      <div className="data-grid-scroll">
        <table className="data-grid">
          <thead>
            <tr>
              <th className="col-status">Status</th>
              <th className="col-row">#</th>
              <th className="col-original">Original ({fromFormat})</th>
              <th className="col-converted">Converted ({toFormat})</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr 
                key={index}
                className={`data-row ${row.success ? 'valid' : 'error'}`}
                onClick={() => onRowClick?.(row, index)}
              >
                <td className="col-status">
                  <span 
                    className={`status-indicator ${row.success ? 'success' : 'error'}`}
                    title={row.error || 'Valid'}
                  >
                    {row.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </span>
                </td>
                <td className="col-row">{index + 1}</td>
                <td className="col-original">
                  <code>{row.original}</code>
                </td>
                <td className="col-converted">
                  {row.success ? (
                    <code className="converted-value">{row.converted}</code>
                  ) : (
                    <span className="error-message" title={row.error}>
                      {row.error || 'Invalid format'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
