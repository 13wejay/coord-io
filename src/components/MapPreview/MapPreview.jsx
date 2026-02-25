import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import { Globe } from 'lucide-react';

// Fix for default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom teal marker icon
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #6366f1, #14b8a6);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(99, 102, 241, 0.5);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Component to handle map view updates
const MapController = ({ coordinates, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      if (coordinates.length === 1) {
        // Single coordinate - fly to it
        map.flyTo([coordinates[0].lat, coordinates[0].lng], zoom || 14, {
          duration: 1.5,
        });
      } else {
        // Multiple coordinates - fit bounds
        const bounds = L.latLngBounds(
          coordinates.map(c => [c.lat, c.lng])
        );
        map.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 1.5,
          maxZoom: 12,
        });
      }
    }
  }, [coordinates, zoom, map]);
  
  return null;
};

const MapPreview = ({ coordinates = [] }) => {
  const mapRef = useRef(null);
  const customIcon = useMemo(() => createCustomIcon(), []);
  
  // Filter valid coordinates
  const validCoords = useMemo(() => {
    return coordinates.filter(c => 
      c && 
      typeof c.lat === 'number' && 
      typeof c.lng === 'number' &&
      !isNaN(c.lat) && 
      !isNaN(c.lng) &&
      c.lat >= -90 && c.lat <= 90 &&
      c.lng >= -180 && c.lng <= 180
    );
  }, [coordinates]);

  // Default center (world view)
  const defaultCenter = [20, 0];
  const defaultZoom = 2;

  return (
    <div className="map-preview">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        className="map-container"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Dark CartoDB tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Map controller for animations */}
        <MapController coordinates={validCoords} />
        
        {/* Markers */}
        {validCoords.map((coord, index) => (
          <Marker 
            key={`${coord.lat}-${coord.lng}-${index}`}
            position={[coord.lat, coord.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="popup-content">
                <div className="popup-label">
                  {validCoords.length > 1 ? `Point ${index + 1}` : 'Location'}
                </div>
                <div className="popup-coord">
                  {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                </div>
                {coord.converted && (
                  <>
                    <div className="popup-label" style={{ marginTop: '8px' }}>Converted</div>
                    <div className="popup-coord">{coord.converted}</div>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay when no coordinates */}
      {validCoords.length === 0 && (
        <div className="map-overlay">
          <div className="map-overlay-icon"><Globe size={48} strokeWidth={1} /></div>
          <div className="map-overlay-text">
            Enter coordinates to see them on the map
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPreview;
