import './HistoryList.css';
import { Clock, ArrowRight } from 'lucide-react';
const HistoryList = ({ history, onSelect }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="history-section">
      <h4 className="history-title">
        <span><Clock size={16} /></span> Recent Conversions
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
                <span className="history-arrow-inline"><ArrowRight size={12} /></span>
                <span>{item.toFormat}</span>
                <span>• {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <div className="history-arrow">
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
