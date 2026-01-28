import UnifiedConverter from './components/UnifiedConverter/UnifiedConverter';
import Header from './components/Header/Header';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <UnifiedConverter />
      </main>

      <footer className="footer">
        <p>
          Coord.io — Spatial Intelligence Coordinate Converter
        </p>
        <p>
          Supports DD, DMS, DDM, UTM, and MGRS coordinate formats
        </p>
      </footer>
    </div>
  );
}

export default App;
