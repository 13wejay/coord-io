import { useState, useRef, useEffect } from 'react';
import './UiDropdown.css';

const UiDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option',
  id 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="ui-dropdown" ref={dropdownRef}>
      {label && (
        <label className="label" htmlFor={id} onClick={toggleDropdown}>
          {label}
        </label>
      )}
      
      <div 
        className={`ui-dropdown-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={toggleDropdown}
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
      >
        <span className="selected-text">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <svg 
          className="ui-dropdown-arrow" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="ui-dropdown-menu">
          {options.map((option) => (
            <div
              key={option.value}
              className={`ui-dropdown-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="option-check">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UiDropdown;
