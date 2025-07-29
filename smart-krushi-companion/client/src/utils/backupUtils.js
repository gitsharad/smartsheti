import { useState } from 'react';
import { saveAs } from 'file-saver';

// Data backup and recovery utility
export const createBackup = async (data, metadata = {}) => {
  try {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      metadata: {
        app: 'Smart Krishi Companion',
        user: metadata.user || 'Unknown',
        description: metadata.description || 'Data backup',
        ...metadata
      },
      data: data
    };
    
    const backupString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupString], { type: 'application/json' });
    
    const filename = `smart_krishi_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    saveAs(blob, filename);
    
    return {
      success: true,
      message: 'Backup created successfully!',
      filename,
      size: blob.size
    };
  } catch (error) {
    console.error('Backup creation error:', error);
    return {
      success: false,
      message: 'Failed to create backup',
      error
    };
  }
};

// Restore data from backup
export const restoreBackup = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const backupData = JSON.parse(event.target.result);
          
          // Validate backup structure
          if (!backupData.version || !backupData.timestamp || !backupData.data) {
            throw new Error('Invalid backup file format');
          }
          
          // Check version compatibility
          if (!isVersionCompatible(backupData.version)) {
            throw new Error('Backup version is not compatible with current app version');
          }
          
          resolve({
            success: true,
            message: 'Backup restored successfully!',
            data: backupData.data,
            metadata: backupData.metadata
          });
        } catch (error) {
          reject({
            success: false,
            message: 'Failed to parse backup file',
            error: error.message
          });
        }
      };
      
      reader.onerror = () => {
        reject({
          success: false,
          message: 'Failed to read backup file',
          error: 'File read error'
        });
      };
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Backup restoration error:', error);
    return {
      success: false,
      message: 'Failed to restore backup',
      error
    };
  }
};

// Check version compatibility
const isVersionCompatible = (backupVersion) => {
  const currentVersion = '1.0.0';
  const [backupMajor, backupMinor] = backupVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
  
  // Allow same major version and same or lower minor version
  return backupMajor === currentMajor && backupMinor <= currentMinor;
};

// Local storage backup
export const localBackup = {
  // Save to localStorage
  save: (key, data) => {
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        data: data
      };
      localStorage.setItem(key, JSON.stringify(backupData));
      return { success: true, message: 'Data saved locally' };
    } catch (error) {
      console.error('Local backup save error:', error);
      return { success: false, message: 'Failed to save locally', error };
    }
  },
  
  // Load from localStorage
  load: (key) => {
    try {
      const backupString = localStorage.getItem(key);
      if (!backupString) {
        return { success: false, message: 'No local backup found' };
      }
      
      const backupData = JSON.parse(backupString);
      return { success: true, data: backupData.data, timestamp: backupData.timestamp };
    } catch (error) {
      console.error('Local backup load error:', error);
      return { success: false, message: 'Failed to load local backup', error };
    }
  },
  
  // Remove from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return { success: true, message: 'Local backup removed' };
    } catch (error) {
      console.error('Local backup remove error:', error);
      return { success: false, message: 'Failed to remove local backup', error };
    }
  }
};

// Backup components for React
export const BackupManager = ({ 
  onBackup, 
  onRestore, 
  className = '' 
}) => {
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  
  const handleBackup = async () => {
    try {
      setBackupInProgress(true);
      setBackupStatus(null);
      
      const result = await onBackup();
      setBackupStatus(result);
      
      if (result.success) {
        setTimeout(() => setBackupStatus(null), 3000);
      }
    } catch (error) {
      setBackupStatus({ success: false, message: 'Backup failed' });
    } finally {
      setBackupInProgress(false);
    }
  };
  
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setRestoreInProgress(true);
      setBackupStatus(null);
      
      const result = await restoreBackup(file);
      setBackupStatus(result);
      
      if (result.success) {
        await onRestore(result.data);
        setTimeout(() => setBackupStatus(null), 3000);
      }
    } catch (error) {
      setBackupStatus({ success: false, message: 'Restore failed' });
    } finally {
      setRestoreInProgress(false);
      event.target.value = '';
    }
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">Data Backup</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Create Backup</h4>
          <button
            onClick={handleBackup}
            disabled={backupInProgress}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {backupInProgress ? 'Creating Backup...' : 'Create Backup'}
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Restore Backup</h4>
          <label className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-center block">
            {restoreInProgress ? 'Restoring...' : 'Choose Backup File'}
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
              disabled={restoreInProgress}
            />
          </label>
        </div>
      </div>
      
      {backupStatus && (
        <div className={`p-3 rounded-md text-sm ${
          backupStatus.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {backupStatus.message}
        </div>
      )}
    </div>
  );
}; 