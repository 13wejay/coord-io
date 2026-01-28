import { COORDINATE_FORMATS } from '../../utils/coordinateUtils';
import UiDropdown from '../UiDropdown/UiDropdown';
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
      <UiDropdown
        label={label}
        id={id}
        value={value}
        onChange={onChange}
        options={COORDINATE_FORMATS.map(f => ({
          value: f.id,
          label: `${f.name} (${f.id})`
        }))}
      />
      {showExample && selectedFormat && (
        <span className="format-example">
          e.g., {selectedFormat.example}
        </span>
      )}
    </div>
  );
};

export default FormatSelector;
