import { useState } from 'react';
import { api } from '../services/authService';
import { handleApiError, getSuccessMessage } from '../services/errorHandler';

// Bulk operations utility for field management
export const bulkOperations = {
  // Bulk delete fields
  deleteFields: async (fieldIds) => {
    try {
      const response = await api.post('/admin/fields/bulk-delete', {
        fieldIds
      });
      
      return {
        success: true,
        message: `Successfully deleted ${fieldIds.length} field(s)`,
        data: response.data
      };
    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to delete fields');
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo
      };
    }
  },
  
  // Bulk update field status
  updateFieldStatus: async (fieldIds, status) => {
    try {
      const response = await api.put('/admin/fields/bulk-update-status', {
        fieldIds,
        status
      });
      
      return {
        success: true,
        message: `Successfully updated status for ${fieldIds.length} field(s)`,
        data: response.data
      };
    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to update field status');
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo
      };
    }
  },
  
  // Bulk assign fields to farmers
  assignFieldsToFarmer: async (fieldIds, farmerId) => {
    try {
      const response = await api.put('/admin/fields/bulk-assign', {
        fieldIds,
        farmerId
      });
      
      return {
        success: true,
        message: `Successfully assigned ${fieldIds.length} field(s) to farmer`,
        data: response.data
      };
    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to assign fields');
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo
      };
    }
  },
  
  // Bulk export fields
  exportFields: async (fieldIds, format = 'csv') => {
    try {
      const response = await api.post('/admin/fields/bulk-export', {
        fieldIds,
        format
      });
      
      return {
        success: true,
        message: `Successfully exported ${fieldIds.length} field(s)`,
        data: response.data
      };
    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to export fields');
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo
      };
    }
  },
  
  // Bulk sensor data export
  exportSensorData: async (fieldIds, dateRange, format = 'csv') => {
    try {
      const response = await api.post('/admin/sensor-data/bulk-export', {
        fieldIds,
        dateRange,
        format
      });
      
      return {
        success: true,
        message: `Successfully exported sensor data for ${fieldIds.length} field(s)`,
        data: response.data
      };
    } catch (error) {
      const errorInfo = handleApiError(error, 'Failed to export sensor data');
      return {
        success: false,
        message: errorInfo.message,
        error: errorInfo
      };
    }
  }
};

// React hook for bulk operations
export const useBulkOperations = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationStatus, setOperationStatus] = useState(null);
  
  // Select/deselect individual item
  const toggleItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  // Select/deselect all items
  const toggleSelectAll = (allItemIds) => {
    if (isSelectAll) {
      setSelectedItems([]);
      setIsSelectAll(false);
    } else {
      setSelectedItems(allItemIds);
      setIsSelectAll(true);
    }
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
    setIsSelectAll(false);
  };
  
  // Perform bulk operation
  const performBulkOperation = async (operation, ...args) => {
    if (selectedItems.length === 0) {
      setOperationStatus({
        success: false,
        message: 'Please select at least one item'
      });
      return;
    }
    
    try {
      setOperationInProgress(true);
      setOperationStatus(null);
      
      const result = await operation(selectedItems, ...args);
      setOperationStatus(result);
      
      if (result.success) {
        // Clear selection after successful operation
        clearSelection();
        // Auto-hide success message after 3 seconds
        setTimeout(() => setOperationStatus(null), 3000);
      }
      
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        message: 'Operation failed unexpectedly',
        error
      };
      setOperationStatus(errorResult);
      return errorResult;
    } finally {
      setOperationInProgress(false);
    }
  };
  
  return {
    selectedItems,
    isSelectAll,
    operationInProgress,
    operationStatus,
    toggleItem,
    toggleSelectAll,
    clearSelection,
    performBulkOperation,
    selectedCount: selectedItems.length
  };
};

// Bulk operations components
export const BulkOperationsBar = ({ 
  selectedCount, 
  onClearSelection, 
  onBulkDelete, 
  onBulkUpdateStatus,
  onBulkAssign,
  onBulkExport,
  className = '' 
}) => {
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showAssignOptions, setShowAssignOptions] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  if (selectedCount === 0) return null;
  
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-green-800 font-medium">
            {selectedCount} item(s) selected
          </span>
          
          <button
            onClick={onClearSelection}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Bulk Delete */}
          <button
            onClick={onBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            Delete Selected
          </button>
          
          {/* Bulk Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusOptions(!showStatusOptions)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Update Status
            </button>
            
            {showStatusOptions && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {['Active', 'Inactive', 'Maintenance'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        onBulkUpdateStatus(status);
                        setShowStatusOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Bulk Assign */}
          <div className="relative">
            <button
              onClick={() => setShowAssignOptions(!showAssignOptions)}
              className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
            >
              Assign
            </button>
            
            {showAssignOptions && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Search farmers..."
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {/* Farmer list would be populated here */}
                    <div className="text-sm text-gray-500">Loading farmers...</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bulk Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Export
            </button>
            
            {showExportOptions && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {['CSV', 'Excel', 'PDF'].map(format => (
                    <button
                      key={format}
                      onClick={() => {
                        onBulkExport(format.toLowerCase());
                        setShowExportOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Operation Status */}
      {operationStatus && (
        <div className={`mt-3 p-2 rounded text-sm ${
          operationStatus.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {operationStatus.message}
        </div>
      )}
    </div>
  );
};

// Checkbox component for bulk selection
export const BulkCheckbox = ({ 
  itemId, 
  isSelected, 
  onToggle, 
  disabled = false,
  className = '' 
}) => {
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => onToggle(itemId)}
      disabled={disabled}
      className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded ${className}`}
    />
  );
};

// Select all checkbox
export const SelectAllCheckbox = ({ 
  isSelected, 
  onToggle, 
  disabled = false,
  className = '' 
}) => {
  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={onToggle}
      disabled={disabled}
      className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded ${className}`}
    />
  );
};

// Confirmation dialog for bulk operations
export const BulkOperationConfirm = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'warning', 'info'
}) => {
  if (!isOpen) return null;
  
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };
  
  const styles = getTypeStyles();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${styles.bg} ${styles.border} border rounded-lg p-6 max-w-md mx-4`}>
        <h3 className={`text-lg font-medium ${styles.text} mb-2`}>
          {title}
        </h3>
        <p className={`${styles.text} mb-4`}>
          {message}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-md ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}; 