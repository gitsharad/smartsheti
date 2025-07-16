import React, { useEffect, useState } from 'react';
import { api } from '../services/authService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [19.7515, 75.7139]; // Maharashtra center as fallback
const DEFAULT_ZOOM = 7;

const MAP_TILES = {
  map: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

const FieldMap = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('map'); // 'map' or 'satellite'

  useEffect(() => {
    setLoading(true);
    api.get('/admin/fields')
      .then(res => setFields(res.data.fields || res.data))
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  }, []);

  // Robust filtering for fields with valid coordinates (top-level lat/lng)
  const fieldsWithCoords = fields.filter(f =>
    typeof f.lat === 'number' && typeof f.lng === 'number' && !isNaN(f.lat) && !isNaN(f.lng)
  );

  // Robust map center selection
  const mapCenter = fieldsWithCoords.length > 0
    ? [fieldsWithCoords[0].lat, fieldsWithCoords[0].lng]
    : DEFAULT_CENTER;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="mb-4 flex justify-end">
        <button
          className={`px-3 py-1 rounded-l ${view === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setView('map')}
        >
          Map
        </button>
        <button
          className={`px-3 py-1 rounded-r ${view === 'satellite' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setView('satellite')}
        >
          Satellite
        </button>
      </div>
      <div className="h-80 w-full rounded overflow-hidden">
        {fieldsWithCoords.length > 0 ? (
          <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution={MAP_TILES[view].attribution}
              url={MAP_TILES[view].url}
            />
            {fieldsWithCoords.map(field => (
              <Marker key={field._id} position={[field.lat, field.lng]}>
                <Popup>
                  <div>
                    <div className="font-semibold">{field.name}</div>
                    <div className="text-sm text-gray-700">{field.crop}</div>
                    <div className="text-xs text-gray-500">Farmer: {field.farmerName}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-green-200 text-green-800 font-bold text-lg">
            No field locations available.
          </div>
        )}
      </div>
      <div>
        <h4 className="font-semibold text-green-900 mb-2">Fields List</h4>
        {loading ? (
          <div className="text-center text-green-800">Loading fields...</div>
        ) : (
          <ul>
            {fields.length === 0 ? (
              <li className="text-gray-500">No fields found.</li>
            ) : (
              fields.map(field => (
                <li key={field._id} className="mb-2 p-2 bg-white rounded shadow flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-900">{field.name}</span> — <span className="text-gray-600">{field.crop}</span>
                    <span className="ml-2 text-xs text-gray-500">Farmer: {field.farmerName}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${field.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{field.status}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FieldMap; 