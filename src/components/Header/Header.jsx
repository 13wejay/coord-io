import icon from '../../assets/icon.svg';
import './Header.css';
import { Github } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-inner">
        <a href="/" className="header-brand">
          <img src={icon} alt="Coord.io Logo" className="header-logo-img" />
          <div className="header-brand-text">
            <h1 className="header-title">Coord.io</h1>
          </div>
        </a>

        <div className="header-actions">
          <a 
            href="https://github.com/13wejay/coord-io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="header-icon-btn"
            title="View Source on GitHub"
            aria-label="View source on GitHub"
          >
            <Github size={20} strokeWidth={2} />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
