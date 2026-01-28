import { COORDINATE_FORMATS } from '../../utils/coordinateUtils';
import './FormatSelector.css';

const FormatSelector = ({ 
  label, 
  value, 
  onChange, 
  showExample = true,
  id 
}) => {
  const selectedFormat = COORDINATE_FORMATS.find(f => f.id === value);

  return (
    <div className="format-selector">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="format-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {COORDINATE_FORMATS.map((format) => (
          <option key={format.id} value={format.id}>
            {format.name} ({format.id})
          </option>
        ))}
      </select>
      {showExample && selectedFormat && (
        <span className="format-example">
          e.g., {selectedFormat.example}
        </span>
      )}
    </div>
  );
};

export default FormatSelector;
