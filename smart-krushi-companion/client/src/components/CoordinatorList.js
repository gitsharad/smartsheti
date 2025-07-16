import React, { useState, useEffect } from 'react';
import { FiUser, FiEdit2, FiTrash2, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { api } from '../services/authService';

const CoordinatorList = () => {
  const [coordinators, setCoordinators] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchCoordinators();
  }, []);

  const fetchCoordinators = () => {
    setLoading(true);
    api.get('/admin/coordinators')
      .then(res => setCoordinators(res.data.coordinators || res.data))
      .catch(() => setCoordinators([]))
      .finally(() => setLoading(false));
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/admin/coordinator/${id}/deactivate`);
      setCoordinators(prev => prev.map(c => c.id === id || c._id === id ? { ...c, status: 'Inactive' } : c));
    } catch (err) {
      alert('Failed to deactivate coordinator');
    }
  };

  const handleEdit = (coordinator) => {
    setEditData({ ...coordinator });
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
      await api.put(`/admin/coordinator/${_id}`, { name, email, phoneNumber, status });
      setCoordinators(prev => prev.map(c => (c._id === _id ? { ...c, name, email, phoneNumber, status } : c)));
      setEditModal(false);
      setEditData(null);
    } catch (err) {
      alert('Failed to update coordinator');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filtered = coordinators.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || c.phoneNumber || '').includes(search)
  );

  // Calculate paginated coordinators
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedCoordinators = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to first page on search/filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, coordinators]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search coordinators..."
            value={search}
            onChange={handleSearch}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <Link to="/add-coordinator" className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <FiPlus className="mr-1" /> Add Coordinator
        </Link>
      </div>
      {loading ? (
        <div className="text-center text-green-800">Loading coordinators...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Phone</th>
                <th className="py-2 px-4">Farmers</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCoordinators.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No coordinators found.</td></tr>
              ) : (
                paginatedCoordinators.map(coordinator => (
                  <tr key={coordinator.id || coordinator._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 flex items-center space-x-2">
                      <FiUser className="text-blue-500" />
                      <span>{coordinator.name}</span>
                    </td>
                    <td className="py-2 px-4">{coordinator.email}</td>
                    <td className="py-2 px-4">{coordinator.phone || coordinator.phoneNumber}</td>
                    <td className="py-2 px-4">{coordinator.farmerCount || 0}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${coordinator.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>{coordinator.status || 'Active'}</span>
                    </td>
                    <td className="py-2 px-4 space-x-2">
                      <button className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs" onClick={() => handleEdit(coordinator)}>
                        <FiEdit2 className="mr-1" /> Edit
                      </button>
                      {(coordinator.status === 'Active' || !coordinator.status) && (
                        <button
                          className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs"
                          onClick={() => handleDeactivate(coordinator.id || coordinator._id)}
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

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setEditModal(false)}>
              <FiX size={20} />
            </button>
            <h3 className="text-xl font-semibold text-green-900 mb-4">Edit Coordinator</h3>
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

export default CoordinatorList; 