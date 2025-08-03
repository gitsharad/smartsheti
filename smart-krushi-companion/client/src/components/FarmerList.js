import React, { useState, useEffect } from 'react';
import { FiUser, FiEdit2, FiTrash2, FiPlus, FiSearch, FiDownload, FiUpload, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../services/authService';
import authService from '../services/authService';

const FarmerList = () => {
  const [farmers, setFarmers] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Get current user role
  const currentUser = authService.getCurrentUser();
  const isCoordinator = currentUser?.role === 'coordinator';

  useEffect(() => {
    fetchFarmers();
    // Only fetch coordinators if user is admin (for assignment dropdown)
    if (!isCoordinator) {
      fetchCoordinators();
    }
  }, []);

  const fetchFarmers = () => {
    setLoading(true);
    // Use different endpoints based on user role
    const endpoint = isCoordinator ? '/coordinator/managed-farmers' : '/admin/farmers';
    
    api.get(endpoint)
      .then(res => {
        // Handle different response formats
        const farmersData = res.data.farmers || res.data || [];
        setFarmers(farmersData);
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoading(false));
  };

  const fetchCoordinators = () => {
    api.get('/admin/coordinators')
      .then(res => setCoordinators(res.data.coordinators || res.data))
      .catch(() => setCoordinators([]));
  };

  const handleAssignCoordinator = async (farmerId, coordinatorId) => {
    try {
      await api.patch(`/admin/farmer/${farmerId}/assign-coordinator`, { coordinatorId });
      setFarmers(prev => prev.map(f => f._id === farmerId ? { ...f, coordinator: coordinatorId } : f));
    } catch (err) {
      alert('Failed to assign coordinator');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/admin/farmer/${id}/deactivate`);
      setFarmers(prev => prev.map(f => f._id === id ? { ...f, status: 'Inactive' } : f));
    } catch (err) {
      alert('Failed to deactivate farmer');
    }
  };

  const handleEdit = (farmer) => {
    setEditData({ ...farmer });
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { _id, name, email, phoneNumber, status } = editData;
      await api.put(`/admin/farmer/${_id}`, { name, email, phoneNumber, status });
      setFarmers(prev => prev.map(f => (f._id === _id ? { ...f, name, email, phoneNumber, status } : f)));
      setEditModal(false);
      setEditData(null);
    } catch (err) {
      alert('Failed to update farmer');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/farmers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'farmers.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export farmers');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/admin/farmers/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchFarmers();
      alert('Farmers imported successfully');
    } catch (err) {
      alert('Failed to import farmers');
    }
  };

  const filtered = farmers.filter(f =>
    (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.phone || f.phoneNumber || '').includes(search) ||
    (!isCoordinator && (f.coordinatorName || '').toLowerCase().includes(search.toLowerCase()))
  );

  // Calculate paginated farmers
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedFarmers = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to first page on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, farmers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search farmers..."
            value={search}
            onChange={handleSearch}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".csv"
            onChange={handleImport}
          />
          {!isCoordinator && (
            <>
              <button onClick={handleImportClick} className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                <FiUpload className="mr-1" /> Import
              </button>
              <button onClick={handleExport} className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                <FiDownload className="mr-1" /> Export
              </button>
            </>
          )}
          <Link to="/add-farmer" className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            <FiPlus className="mr-1" /> Add Farmer
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-green-800">Loading farmers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Phone</th>
                {!isCoordinator && <th className="py-2 px-4">Coordinator</th>}
                <th className="py-2 px-4">Fields</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFarmers.length === 0 ? (
                <tr><td colSpan={isCoordinator ? 6 : 7} className="text-center py-4 text-gray-500">No farmers found.</td></tr>
              ) : (
                paginatedFarmers.map(farmer => (
                  <tr key={farmer._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 flex items-center space-x-2">
                      <FiUser className="text-green-500" />
                      <span>{farmer.name}</span>
                    </td>
                    <td className="py-2 px-4">{farmer.email}</td>
                    <td className="py-2 px-4">{farmer.phone || farmer.phoneNumber}</td>
                    {!isCoordinator && (
                      <td className="py-2 px-4">
                        <select
                          value={farmer.coordinator || ''}
                          onChange={e => handleAssignCoordinator(farmer._id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {coordinators.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="py-2 px-4">{farmer.fieldCount || farmer.fields || farmer.ownedFields?.length || 0}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${farmer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{farmer.status || 'Active'}</span>
                    </td>
                    <td className="py-2 px-4 space-x-2">
                      <button className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs" onClick={() => handleEdit(farmer)}>
                        <FiEdit2 className="mr-1" /> Edit
                      </button>
                      {!isCoordinator && (farmer.status === 'Active' || !farmer.status) && (
                        <button
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs"
                          onClick={() => handleDeactivate(farmer._id)}
                        >
                          <FiTrash2 className="mr-1" /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > rowsPerPage && (
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
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setEditModal(false)}>
              <FiX size={20} />
            </button>
            <h3 className="text-xl font-semibold text-green-900 mb-4">Edit Farmer</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" name="name" value={editData.name || ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" value={editData.email || ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input type="text" name="phoneNumber" value={editData.phoneNumber || ''} onChange={handleEditChange} className="w-full border rounded px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" value={editData.status || 'Active'} onChange={handleEditChange} className="w-full border rounded px-3 py-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button type="button" className="mr-2 px-4 py-2 bg-gray-200 rounded" onClick={() => setEditModal(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerList; 