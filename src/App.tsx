import { useState } from 'react';
import { Search, Layers, Loader2, Flame } from 'lucide-react';
import OSViewrMap from './components/Map';
import './index.css';

export type Location = { lng: number; lat: number };

const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="url(#paint0_linear)" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#paint1_linear)" strokeWidth="1.5" transform="rotate(45 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#paint1_linear)" strokeWidth="1.5" transform="rotate(-45 12 12)" />
    <circle cx="12" cy="12" r="2" fill="#60A5FA" />
    <defs>
      <linearGradient id="paint0_linear" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60A5FA" />
        <stop offset="1" stopColor="#A855F7" />
      </linearGradient>
      <linearGradient id="paint1_linear" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.6" />
      </linearGradient>
    </defs>
  </svg>
);

function App() {
  const [activeLayer, setActiveLayer] = useState('dark');
  const [flightsEnabled, setFlightsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [flightErrorMsg, setFlightErrorMsg] = useState<string | null>(null);
  const [flightLastUpdate, setFlightLastUpdate] = useState<Date | null>(null);
  const [satellitesEnabled, setSatellitesEnabled] = useState(false);
  const [earthquakesEnabled, setEarthquakesEnabled] = useState(false);
  const [wildfiresEnabled, setWildfiresEnabled] = useState(false);

  // Details State
  const [selectedSatellite, setSelectedSatellite] = useState<{ name: string, height: number } | null>(null);
  const [selectedEarthquake, setSelectedEarthquake] = useState<any | null>(null);
  const [selectedWildfire, setSelectedWildfire] = useState<any | null>(null);

  // Helper clear function
  const clearSelectionPanels = () => {
    setSelectedSatellite(null);
    setSelectedEarthquake(null);
    setSelectedWildfire(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg('');

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        setTargetLocation({
          lng: parseFloat(data[0].lon),
          lat: parseFloat(data[0].lat)
        });
        setSearchQuery('');
      } else {
        setErrorMsg('Location not found');
      }
    } catch (err) {
      setErrorMsg('Error searching for location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetMap = () => {
    setTargetLocation({ lng: -74.0060, lat: 40.7128 });
    setSearchQuery('');
  };

  return (
    <div className="app-container">
      <OSViewrMap
        activeLayer={activeLayer as "dark" | "satellite"}
        targetLocation={targetLocation}
        flightsEnabled={flightsEnabled}
        onFlightError={setFlightErrorMsg}
        onFlightDataRefresh={setFlightLastUpdate}
        satellitesEnabled={satellitesEnabled}
        onSatelliteClick={(sat) => {
          if (sat) clearSelectionPanels();
          setSelectedSatellite(sat);
        }}
        earthquakesEnabled={earthquakesEnabled}
        onEarthquakeClick={(eq) => {
          if (eq) clearSelectionPanels();
          setSelectedEarthquake(eq);
        }}
        wildfiresEnabled={wildfiresEnabled}
        onWildfireClick={(wf) => {
          if (wf) clearSelectionPanels();
          setSelectedWildfire(wf);
        }}
      />

      <div className="ui-layer">
        <header
          className="header logo-panel glass-panel cursor-pointer hover:scale-105 transition-transform duration-300"
          onClick={handleResetMap}
          title="Reset View"
        >
          <div className="logo-icon-wrapper">
            <LogoIcon />
          </div>
        </header>

        <form
          onSubmit={handleSearch}
          className="search-container glass-panel"
        >
          {isSearching ? <Loader2 className="search-icon animate-spin" /> : <Search className="search-icon" />}
          <input
            type="text"
            className="search-input"
            placeholder="Search globe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSearching}
          />
        </form>

        {errorMsg && (
          <div style={{ position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', color: '#ef4444', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        <div className="layer-controls glass-panel">
          <button
            className={`layer-btn ${satellitesEnabled ? 'active' : ''}`}
            onClick={() => setSatellitesEnabled(!satellitesEnabled)}
            style={{ marginRight: '12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M11,4.5V2L8,5L11,8V5.5C14.04,5.5 16.5,7.96 16.5,11H19C19,6.58 15.42,3 11,3V4.5M13,19.5V22L16,19L13,16V18.5C9.96,18.5 7.5,16.04 7.5,13H5C5,17.42 8.58,21 13,21V19.5M21,11A2,2 0 0,0 19,9H17V6A2,2 0 0,0 15,4H12V6H15V13L17,15V18.17L19,20.17V17L21,15V11M19,16L17.5,14.5V11H19V16M3,13A2,2 0 0,0 5,15H7V18A2,2 0 0,0 9,20H12V18H9V11L7,9V5.83L5,3.83V7L3,9V13M5,8L6.5,9.5V13H5V8Z" />
            </svg>
            Live Satellites
          </button>
          <button
            className={`layer-btn ${flightsEnabled ? 'active' : ''}`}
            onClick={() => setFlightsEnabled(!flightsEnabled)}
            style={{ marginRight: '12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
            </svg>
            Live Flights
          </button>
          <button
            className={`layer-btn ${earthquakesEnabled ? 'active' : ''}`}
            onClick={() => setEarthquakesEnabled(!earthquakesEnabled)}
            style={{ marginRight: '12px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M11 20H8.31C8.25 19.16 8.5 18.25 9.17 17.5L12 14.5L14.83 17.5C15.5 18.25 15.75 19.16 15.69 20H13V22H11V20M12 2A4 4 0 0 1 16 6C16 7.6 15 9.42 13.5 11.1L12 12.75L10.5 11.1C9 9.42 8 7.6 8 6A4 4 0 0 1 12 2M12 4A2 2 0 0 0 10 6C10 7.07 10.74 8.44 12 9.87C13.26 8.44 14 7.07 14 6A2 2 0 0 0 12 4M21 16V14C21 12.35 19.95 10.96 18.47 10.37C19.1 9.21 19.46 8.08 19.64 7C20.69 8.08 22 10.71 22 14V16H21M3 16V14C3 10.71 4.31 8.08 5.36 7C5.54 8.08 5.9 9.21 6.53 10.37C5.05 10.96 4 12.35 4 14V16H3Z" />
            </svg>
            Live Earthquakes
          </button>
          <button
            className={`layer-btn ${wildfiresEnabled ? 'active' : ''}`}
            onClick={() => setWildfiresEnabled(!wildfiresEnabled)}
            style={{ marginRight: '12px' }}
          >
            <Flame size={16} style={{ marginRight: '6px' }} />
            NASA Wildfires
          </button>
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', marginRight: '12px' }} />
          <button
            className={`layer-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
            onClick={() => setActiveLayer('satellite')}
          >
            <Layers size={16} /> Satellite
          </button>
          <button
            className={`layer-btn ${activeLayer === 'dark' ? 'active' : ''}`}
            onClick={() => setActiveLayer('dark')}
          >
            <Layers size={16} /> Dark Matter
          </button>
        </div>
      </div>

      {flightErrorMsg && flightsEnabled && (
        <div style={{ position: 'absolute', zIndex: 10, bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239, 68, 68, 0.2)', backdropFilter: 'blur(8px)', color: '#fca5a5', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)', pointerEvents: 'none' }}>
          {flightErrorMsg}
        </div>
      )}

      {flightsEnabled && flightLastUpdate && !flightErrorMsg && (
        <div style={{ position: 'absolute', zIndex: 10, bottom: '80px', right: '24px', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', color: '#9ca3af', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)', pointerEvents: 'none' }}>
          Live Flights globally updated at {flightLastUpdate.toLocaleTimeString()}
        </div>
      )}

      {selectedSatellite && satellitesEnabled && (
        <div className="glass-panel" style={{ position: 'absolute', top: '24px', right: '24px', padding: '16px 20px', minWidth: '220px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#60A5FA' }}>
                <path d="M11,4.5V2L8,5L11,8V5.5C14.04,5.5 16.5,7.96 16.5,11H19C19,6.58 15.42,3 11,3V4.5M13,19.5V22L16,19L13,16V18.5C9.96,18.5 7.5,16.04 7.5,13H5C5,17.42 8.58,21 13,21V19.5M21,11A2,2 0 0,0 19,9H17V6A2,2 0 0,0 15,4H12V6H15V13L17,15V18.17L19,20.17V17L21,15V11M19,16L17.5,14.5V11H19V16M3,13A2,2 0 0,0 5,15H7V18A2,2 0 0,0 9,20H12V18H9V11L7,9V5.83L5,3.83V7L3,9V13M5,8L6.5,9.5V13H5V8Z" />
              </svg>
              {selectedSatellite.name}
            </h3>
            <button
              onClick={() => setSelectedSatellite(null)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Altitude</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e5e7eb', fontFamily: 'monospace' }}>
                {Math.round(selectedSatellite.height).toLocaleString()} km
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Status</span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 4px #10b981' }}></span>
                Active Orbit
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedEarthquake && earthquakesEnabled && (
        <div className="glass-panel" style={{ position: 'absolute', top: '24px', right: '24px', padding: '16px 20px', minWidth: '240px', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: selectedEarthquake.properties.mag >= 5 ? '#ef4444' : '#f97316' }}>
                {selectedEarthquake.properties.mag != null ? selectedEarthquake.properties.mag.toFixed(1) : '?'} Mag
              </span>
            </h3>
            <button
              onClick={() => setSelectedEarthquake(null)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#e5e7eb', lineHeight: '1.4', marginBottom: '8px' }}>
              {selectedEarthquake.properties.place}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Time</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {new Date(selectedEarthquake.properties.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Depth</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {selectedEarthquake.geometry?.coordinates?.[2] != null ? selectedEarthquake.geometry.coordinates[2].toFixed(1) + ' km' : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedWildfire && wildfiresEnabled && (
        <div className="glass-panel" style={{ position: 'absolute', top: '24px', right: '24px', padding: '16px 20px', minWidth: '240px', animation: 'fadeIn 0.3s ease-out', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} style={{ color: selectedWildfire.properties.bright_ti4 >= 330 ? '#ef4444' : '#f97316' }} />
              <span style={{ color: selectedWildfire.properties.bright_ti4 >= 330 ? '#ef4444' : '#f97316' }}>
                {selectedWildfire.properties.bright_ti4 != null ? selectedWildfire.properties.bright_ti4.toFixed(1) + 'K' : '?'}
              </span>
            </h3>
            <button
              onClick={() => setSelectedWildfire(null)}
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '0.9rem', color: '#e5e7eb', lineHeight: '1.4', marginBottom: '8px' }}>
              NASA Thermal Anomaly
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Confidence</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'capitalize' }}>
                {selectedWildfire.properties.confidence || 'Nominal'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Confidence</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'capitalize' }}>
                {selectedWildfire.properties.confidence || 'Nominal'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af', marginRight: '16px' }}>Detection Time</span>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'right' }}>
                {selectedWildfire.properties.acq_date} {selectedWildfire.properties.acq_time ? selectedWildfire.properties.acq_time.match(/.{1,2}/g)?.join(':') + ' UTC' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="status-indicator glass-panel" style={{ padding: '6px 12px', borderRadius: '20px' }}>
        <div className="status-dot"></div>
        Connected
      </div>
    </div>
  );
}

export default App;
