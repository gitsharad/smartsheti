import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiUser, FiChevronDown } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';

const AlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // alertId for which action is loading

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertsRes, coordRes] = await Promise.all([
        apiRoutes.getAdminAlerts(),
        apiRoutes.getAdminCoordinators()
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setCoordinators(coordRes.data.coordinators || []);
    } catch (err) {
      setError('Failed to load alerts or coordinators');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    setActionLoading(id);
    try {
      await apiRoutes.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'Acknowledged' } : a));
    } catch {
      alert('Failed to acknowledge alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssign = async (id, coordinatorId) => {
    setActionLoading(id);
    try {
      await apiRoutes.assignAlert(id, coordinatorId);
      const assignedCoordinator = coordinators.find(c => c._id === coordinatorId);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'Assigned', assignedTo: assignedCoordinator?.name || '' } : a));
    } catch {
      alert('Failed to assign alert');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = alerts.filter(a => filter === 'All' || a.severity === filter);

  // Calculate paginated alerts
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedAlerts = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Reset to first page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, alerts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiChevronDown className="text-gray-500" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="All">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-green-800">Loading alerts...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Message</th>
                <th className="py-2 px-4">Farmer</th>
                <th className="py-2 px-4">Severity</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No alerts found.</td></tr>
              ) : (
                paginatedAlerts.map(alert => (
                  <tr key={alert._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 flex items-center space-x-2">
                      <FiAlertTriangle className="text-orange-500" />
                      <span>{alert.type}</span>
                    </td>
                    <td className="py-2 px-4">{alert.message}</td>
                    <td className="py-2 px-4 flex items-center space-x-2">
                      <FiUser className="text-green-500" />
                      <span>{alert.farmer}</span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${alert.severity === 'High' ? 'bg-red-100 text-red-800' : alert.severity === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{alert.severity}</span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${alert.status === 'Acknowledged' ? 'bg-green-100 text-green-800' : alert.status === 'Assigned' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>{alert.status}</span>
                      {alert.assignedTo && <span className="ml-2 text-xs text-blue-700">({alert.assignedTo})</span>}
                    </td>
                    <td className="py-2 px-4 space-x-2">
                      {alert.status !== 'Acknowledged' && (
                        <button
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs disabled:opacity-50"
                          onClick={() => handleAcknowledge(alert._id)}
                          disabled={actionLoading === alert._id}
                        >
                          <FiCheckCircle className="mr-1" /> {actionLoading === alert._id ? '...' : 'Acknowledge'}
                        </button>
                      )}
                      {alert.status !== 'Assigned' && alert.status !== 'Acknowledged' && (
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          defaultValue=""
                          onChange={e => e.target.value && handleAssign(alert._id, e.target.value)}
                          disabled={actionLoading === alert._id}
                        >
                          <option value="" disabled>Assign to...</option>
                          {coordinators.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
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
              className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
    </div>
  );
};

export default AlertList; 