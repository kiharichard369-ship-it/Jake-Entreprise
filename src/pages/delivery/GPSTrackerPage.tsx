// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, WifiOff, RefreshCw, Clock, Truck, Navigation } from 'lucide-react';

// Simulated GPS coordinates around Nakuru, Kenya
const mockLocations = [
  { lat: -0.3031, lng: 36.0800, time: '11:05 AM', address: 'Nakuru CBD — Kenyatta Ave' },
  { lat: -0.3100, lng: 36.0900, time: '10:48 AM', address: 'Section 58 Estate' },
  { lat: -0.2950, lng: 36.0700, time: '10:20 AM', address: 'Milimani — Drop 1' },
  { lat: -0.3200, lng: 36.0600, time: '09:55 AM', address: 'Pipeline Area' },
  { lat: -0.2800, lng: 36.0850, time: '09:00 AM', address: 'Depot — Start of Day' },
];

export default function GPSTrackerPage() {
  const [connected, setConnected] = useState(true);
  const [lastSync, setLastSync] = useState('11:05 AM');
  const [syncing, setSyncing] = useState(false);
  const [currentLocation] = useState(mockLocations[0]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSync(new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 hero-delivery rounded-xl flex items-center justify-center">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>GPS Tracker</h1>
            <p className="text-gray-500 text-sm">Water Delivery · Real-time vehicle location</p>
          </div>
        </div>
        <button onClick={handleSync} className="btn bg-green-600 text-white hover:bg-green-700 gap-2">
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Status bar */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center gap-3">
          {connected ? (
            <Wifi size={20} className="text-green-600" />
          ) : (
            <WifiOff size={20} className="text-red-600" />
          )}
          <div>
            <p className={`font-bold text-sm ${connected ? 'text-green-800' : 'text-red-800'}`}>
              GPS {connected ? 'Connected' : 'Disconnected'}
            </p>
            <p className={`text-xs ${connected ? 'text-green-600' : 'text-red-600'}`}>
              Last sync: {lastSync} · Auto-sync every 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setConnected(!connected)} className={`btn text-xs py-1.5 px-3 ${connected ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
            {connected ? 'Connected ✓' : 'Reconnect'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Map placeholder */}
        <div className="md:col-span-2 card overflow-hidden">
          <div className="relative h-96 bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
            {/* Decorative map-like background */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-gray-400" />
                ))}
              </div>
            </div>

            {/* Simulated roads */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#374151" strokeWidth="3" />
              <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#374151" strokeWidth="2" />
              <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#374151" strokeWidth="2" />
              <line x1="0" y1="25%" x2="100%" y2="75%" stroke="#374151" strokeWidth="1.5" />
            </svg>

            {/* Trip path dots */}
            {mockLocations.slice(1).map((loc, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-md"
                style={{
                  left: `${20 + i * 18}%`,
                  top: `${30 + (i % 2) * 25}%`,
                }}
              />
            ))}

            {/* Current location pin */}
            <div className="absolute" style={{ left: '62%', top: '42%' }}>
              <div className="relative">
                <div className="w-6 h-6 bg-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center animate-pulse">
                  <Truck size={12} className="text-white" />
                </div>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                  Driver Brian
                </div>
              </div>
            </div>

            {/* Map overlay info */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
              <p className="font-bold text-xs text-gray-900 flex items-center gap-1">
                <Navigation size={12} className="text-blue-600" /> Current Position
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{currentLocation.address}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </p>
            </div>

            <div className="absolute top-4 right-4 bg-blue-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
              📍 LIVE
            </div>

            {/* Note about real integration */}
            <div className="absolute top-4 left-4 bg-amber-50/90 border border-amber-200 text-amber-800 text-[10px] font-medium px-3 py-1.5 rounded-lg">
              ⚙️ Awaiting GPS API config · Plug-in adapter ready
            </div>
          </div>
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              The map uses a pluggable GPS adapter pattern. Connect your tracker device ID under{' '}
              <span className="font-semibold text-blue-600">Super Admin → Payment Config → GPS Settings</span> to enable real-time tracking.
            </p>
          </div>
        </div>

        {/* Location history */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm">📍 Location Trail — Today</h3>
            <p className="text-xs text-gray-400 mt-0.5">Trip history for current active trip</p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100" />
            <div className="divide-y divide-gray-50">
              {mockLocations.map((loc, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm ${
                    i === 0 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    {i === 0 ? <Truck size={12} className="text-white" /> : <MapPin size={10} className="text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${i === 0 ? 'text-blue-700' : 'text-gray-700'}`}>{loc.address}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{loc.time}</p>
                    <p className="text-[10px] text-gray-300">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
                  </div>
                  {i === 0 && <span className="badge badge-active text-[10px]">NOW</span>}
                </div>
              ))}
            </div>
          </div>

          {/* GPS Config note */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 mb-1">GPS Device Config</p>
            <p className="text-xs text-gray-500">Tracker ID: <span className="font-mono text-gray-400">GPS-KE-001</span></p>
            <p className="text-xs text-gray-500 mt-0.5">API: <span className="text-amber-600 font-semibold">Pending client confirmation</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
