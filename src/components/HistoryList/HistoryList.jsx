import './HistoryList.css';

const HistoryList = ({ history, onSelect }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="history-section">
      <h4 className="history-title">
        <span>🕒</span> Recent Conversions
      </h4>
      <div className="history-list">
        {history.map((item, index) => (
          <div 
            key={`${item.timestamp}-${index}`} 
            className="history-item"
            onClick={() => onSelect(item)}
          >
            <div className="history-info">
              <span className="history-coords">{item.original}</span>
              <div className="history-meta">
                <span>{item.fromFormat || 'Detected'}</span>
                <span>→</span>
                <span>{item.toFormat}</span>
                <span>• {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="history-arrow">
              →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
