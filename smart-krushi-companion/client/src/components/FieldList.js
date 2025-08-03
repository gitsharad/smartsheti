import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/authService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [19.7515, 75.7139]; // Maharashtra
const DEFAULT_ZOOM = 7;

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} draggable={true} eventHandlers={{ dragend: (e) => {
    const marker = e.target;
    const { lat, lng } = marker.getLatLng();
    setPosition([lat, lng]);
  }}} /> : null;
}

// Helper to robustly extract [lat, lng] from field.location
function getFieldLatLng(field) {
    console.log(field)
  if (field.lat) {
    if (typeof field.lat === 'number' && typeof field.lng === 'number') {
      return [field.lat, field.lng];
    }
   
  }
  /*else if (Array.isArray(field.location.coordinates) &&
  field.location.coordinates.length === 2 &&
  typeof field.location.coordinates[0] === 'number' &&
  typeof field.location.coordinates[1] === 'number') {
return [field.location.coordinates[0], field.location.coordinates[1]]; 
}*/
  return null;
}

const FieldList = ({ role = 'admin' }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Calculate paginated fields
  const totalPages = Math.ceil(fields.length / rowsPerPage);
  const paginatedFields = fields.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to first page on fields change
  useEffect(() => {
    setCurrentPage(1);
  }, [fields]);

  useEffect(() => {
    fetchFields();
  }, [role]);

  const fetchFields = () => {
    setLoading(true);
    
    // Use different endpoints based on role
    const endpoint = role === 'coordinator' ? '/coordinator/field-overview' : '/admin/fields';
    
    api.get(endpoint)
      .then(res => {
        // Handle different response formats
        const fieldsData = res.data.fields || res.data || [];
        setFields(fieldsData);
      })
      .catch(() => setFields([]))
      .finally(() => setLoading(false));
  };

  const openLocationModal = (field) => {
    setSelectedField(field);
    const latlng = getFieldLatLng(field);
    setMarkerPos(latlng ? latlng : DEFAULT_CENTER);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedField(null);
    setMarkerPos(null);
    setError('');
  };

  const saveLocation = async () => {
    if (!markerPos || !selectedField) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/fields/${selectedField._id}/location`, {
        lat: markerPos[0],
        lng: markerPos[1],
      });
      fetchFields();
      closeModal();
    } catch (e) {
      setError('Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      {/* Add Field Button - Only for Admin/Coordinator */}
      {(() => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userRole = user?.role;
        return (userRole === 'admin' || userRole === 'coordinator');
      })() && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => navigate('/add-field')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Field
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center text-green-800">Loading fields...</div>
      ) : (
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4">Field Name</th>
              <th className="py-2 px-4">Farmer</th>
              <th className="py-2 px-4">Crop</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Last Sensor Update</th>
              <th className="py-2 px-4">Location</th>
            </tr>
          </thead>
          <tbody>
            {paginatedFields.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-gray-500">No fields found.</td></tr>
            ) : (
              paginatedFields.map(field => (
                <tr key={field._id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium text-gray-900">{field.name}</td>
                  <td className="py-2 px-4">{field.farmerName}</td>
                  <td className="py-2 px-4">{field.crop}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${field.status === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{field.status}</span>
                  </td>
                  <td className="py-2 px-4 text-xs text-gray-500">{field.lastSensorUpdate ? new Date(field.lastSensorUpdate).toLocaleString() : '--'}</td>
                  <td className="py-2 px-4">
                    {getFieldLatLng(field) ? (
                      <span className="text-green-600 mr-2" title="Location set">&#x2714;</span>
                    ) : (
                      <span className="text-red-500 mr-2" title="Location missing">&#x26A0;</span>
                    )}
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => openLocationModal(field)}
                    >
                      {getFieldLatLng(field) ? 'Edit Location' : 'Set Location'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {/* Pagination Controls */}
      {fields.length > rowsPerPage && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {/* Modal for location picker */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <h3 className="font-bold mb-2">Set Field Location</h3>
            <div className="h-64 w-full mb-4 rounded overflow-hidden">
              <MapContainer center={markerPos} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={markerPos} setPosition={setMarkerPos} />
              </MapContainer>
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={saveLocation} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldList; 