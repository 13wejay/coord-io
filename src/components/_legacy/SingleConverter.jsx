import { useState, useCallback } from 'react';
import { convertCoordinate, COORDINATE_FORMATS } from '../../utils/coordinateUtils';
import FormatSelector from '../FormatSelector/FormatSelector';
import './SingleConverter.css';

const SingleConverter = () => {
  const [input, setInput] = useState('');
  const [fromFormat, setFromFormat] = useState('DD');
  const [toFormat, setToFormat] = useState('DMS');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError('Please enter a coordinate to convert');
      setResult(null);
      return;
    }

    try {
      const converted = convertCoordinate(input.trim(), fromFormat, toFormat);
      setResult(converted);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  }, [input, fromFormat, toFormat]);

  const handleSwap = () => {
    setFromFormat(toFormat);
    setToFormat(fromFormat);
    if (result) {
      setInput(result);
      setResult(null);
    }
  };

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = result;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConvert();
    }
  };

  const selectedFromFormat = COORDINATE_FORMATS.find(f => f.id === fromFormat);

  return (
    <div className="single-converter">
      <div className="converter-card glass-card glow-border">
        <h2 className="converter-title">
          <span className="converter-title-icon">🎯</span>
          Single Coordinate Conversion
        </h2>

        <div className="converter-form">
          <div className="format-selectors">
            <FormatSelector
              label="From Format"
              value={fromFormat}
              onChange={setFromFormat}
              id="from-format"
            />
            
            <button
              className="swap-button"
              onClick={handleSwap}
              title="Swap formats"
              aria-label="Swap source and target formats"
            >
              ⇄
            </button>
            
            <FormatSelector
              label="To Format"
              value={toFormat}
              onChange={setToFormat}
              id="to-format"
            />
          </div>

          <div className="input-group">
            <label className="label" htmlFor="coordinate-input">
              Enter Coordinate
            </label>
            <div className="input-wrapper">
              <input
                id="coordinate-input"
                type="text"
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFromFormat?.example || 'Enter coordinate...'}
              />
              {input && (
                <button
                  className="clear-button"
                  onClick={handleClear}
                  title="Clear input"
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary convert-button"
            onClick={handleConvert}
          >
            Convert Coordinate
          </button>

          {error && (
            <div className="error-message">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="result-label">
                <span>✓</span>
                Converted to {COORDINATE_FORMATS.find(f => f.id === toFormat)?.name}
              </div>
              <div className="result-value">{result}</div>
              <div className="result-actions">
                <button
                  className={`copy-button ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleConverter;
