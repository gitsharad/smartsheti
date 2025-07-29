import React, { useState } from 'react';
import { api } from '../services/authService';

// Activity types
export const ACTIVITY_TYPES = {
  // Authentication activities
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET: 'password_reset',
  
  // Field management activities
  FIELD_CREATE: 'field_create',
  FIELD_UPDATE: 'field_update',
  FIELD_DELETE: 'field_delete',
  FIELD_VIEW: 'field_view',
  
  // Sensor data activities
  SENSOR_DATA_VIEW: 'sensor_data_view',
  SENSOR_DATA_EXPORT: 'sensor_data_export',
  
  // User management activities
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_VIEW: 'user_view',
  
  // Analytics activities
  ANALYTICS_VIEW: 'analytics_view',
  REPORT_GENERATE: 'report_generate',
  REPORT_EXPORT: 'report_export',
  
  // System activities
  SETTINGS_UPDATE: 'settings_update',
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore',
  
  // Error activities
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  
  // Navigation activities
  PAGE_VIEW: 'page_view',
  NAVIGATION: 'navigation',
  
  // Feature usage
  FEATURE_ACCESS: 'feature_access',
  FEATURE_USE: 'feature_use'
};

// Activity severity levels
export const ACTIVITY_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Activity logger class
class ActivityLogger {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    
    // Start periodic flushing
    this.startPeriodicFlush();
  }
  
  // Log an activity
  log(activity) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId(),
      userRole: this.getCurrentUserRole(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...activity
    };
    
    // Add to queue
    this.queue.push(logEntry);
    
    // Flush if queue is full
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Activity Log:', logEntry);
    }
    
    return logEntry.id;
  }
  
  // Log page view
  logPageView(page, additionalData = {}) {
    return this.log({
      type: ACTIVITY_TYPES.PAGE_VIEW,
      severity: ACTIVITY_SEVERITY.LOW,
      details: {
        page,
        ...additionalData
      }
    });
  }
  
  // Log user action
  logUserAction(action, details = {}) {
    return this.log({
      type: action,
      severity: ACTIVITY_SEVERITY.MEDIUM,
      details
    });
  }
  
  // Log error
  logError(error, context = {}) {
    return this.log({
      type: ACTIVITY_TYPES.ERROR_OCCURRED,
      severity: ACTIVITY_SEVERITY.HIGH,
      details: {
        error: error.message || error,
        stack: error.stack,
        context
      }
    });
  }
  
  // Log API call
  logApiCall(endpoint, method, status, duration, details = {}) {
    return this.log({
      type: 'api_call',
      severity: status >= 400 ? ACTIVITY_SEVERITY.MEDIUM : ACTIVITY_SEVERITY.LOW,
      details: {
        endpoint,
        method,
        status,
        duration,
        ...details
      }
    });
  }
  
  // Log feature usage
  logFeatureUsage(feature, action, details = {}) {
    return this.log({
      type: ACTIVITY_TYPES.FEATURE_USE,
      severity: ACTIVITY_SEVERITY.LOW,
      details: {
        feature,
        action,
        ...details
      }
    });
  }
  
  // Flush queue to server
  async flush() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const batch = this.queue.splice(0, this.batchSize);
      
      await api.post('/activity-logs/batch', {
        activities: batch
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Flushed ${batch.length} activity logs`);
      }
    } catch (error) {
      console.error('Failed to flush activity logs:', error);
      
      // Put items back in queue for retry
      this.queue.unshift(...this.queue.splice(0, this.batchSize));
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Start periodic flushing
  startPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Get current user ID
  getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user._id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }
  
  // Get current user role
  getCurrentUserRole() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  // Get session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }
  
  // Get activity statistics
  async getActivityStats(filters = {}) {
    try {
      const response = await api.get('/activity-logs/stats', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to get activity stats:', error);
      return null;
    }
  }
  
  // Get recent activities
  async getRecentActivities(limit = 50) {
    try {
      const response = await api.get('/activity-logs/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }
}

// Global activity logger instance
export const activityLogger = new ActivityLogger();

// React hook for activity logging
export const useActivityLogger = () => {
  const logPageView = (page, additionalData = {}) => {
    return activityLogger.logPageView(page, additionalData);
  };
  
  const logUserAction = (action, details = {}) => {
    return activityLogger.logUserAction(action, details);
  };
  
  const logError = (error, context = {}) => {
    return activityLogger.logError(error, context);
  };
  
  const logFeatureUsage = (feature, action, details = {}) => {
    return activityLogger.logFeatureUsage(feature, action, details);
  };
  
  return {
    logPageView,
    logUserAction,
    logError,
    logFeatureUsage
  };
};

// Higher-order component for automatic page view logging
export const withActivityLogging = (WrappedComponent, pageName) => {
  return function ActivityLoggedComponent(props) {
    const { logPageView } = useActivityLogger();
    
    React.useEffect(() => {
      logPageView(pageName, {
        props: Object.keys(props).filter(key => !key.startsWith('_'))
      });
    }, []);
    
    return <WrappedComponent {...props} />;
  };
};

// Activity monitoring component
export const ActivityMonitor = ({ className = '' }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  
  const loadActivities = async () => {
    try {
      setLoading(true);
      const recentActivities = await activityLogger.getRecentActivities(20);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      const activityStats = await activityLogger.getActivityStats();
      setStats(activityStats);
    } catch (error) {
      console.error('Failed to load activity stats:', error);
    }
  };
  
  React.useEffect(() => {
    loadActivities();
    loadStats();
  }, []);
  
  const getActivityIcon = (type) => {
    const icons = {
      [ACTIVITY_TYPES.LOGIN]: '🔐',
      [ACTIVITY_TYPES.LOGOUT]: '🚪',
      [ACTIVITY_TYPES.FIELD_CREATE]: '➕',
      [ACTIVITY_TYPES.FIELD_UPDATE]: '✏️',
      [ACTIVITY_TYPES.FIELD_DELETE]: '🗑️',
      [ACTIVITY_TYPES.ERROR_OCCURRED]: '❌',
      [ACTIVITY_TYPES.PAGE_VIEW]: '👁️',
      [ACTIVITY_TYPES.FEATURE_USE]: '⚡'
    };
    return icons[type] || '📝';
  };
  
  const getSeverityColor = (severity) => {
    const colors = {
      [ACTIVITY_SEVERITY.LOW]: 'text-gray-600',
      [ACTIVITY_SEVERITY.MEDIUM]: 'text-yellow-600',
      [ACTIVITY_SEVERITY.HIGH]: 'text-orange-600',
      [ACTIVITY_SEVERITY.CRITICAL]: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Activity Monitor</h3>
        <button
          onClick={loadActivities}
          disabled={loading}
          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      
      {/* Activity Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.totalActivities || 0}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.todayActivities || 0}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.activeUsers || 0}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.errors || 0}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
      )}
      
      {/* Recent Activities */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Recent Activities</h4>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {loading ? 'Loading activities...' : 'No activities found'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.type.replace(/_/g, ' ').toUpperCase()}
                        </p>
                        <span className={`text-xs font-medium ${getSeverityColor(activity.severity)}`}>
                          {activity.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.details?.message || 'No details available'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{activity.userRole}</span>
                        <span>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Auto-logging middleware for API calls
export const createApiLogger = (apiInstance) => {
  const originalRequest = apiInstance.request;
  
  apiInstance.request = async (config) => {
    const startTime = Date.now();
    
    try {
      const response = await originalRequest(config);
      const duration = Date.now() - startTime;
      
      activityLogger.logApiCall(
        config.url,
        config.method,
        response.status,
        duration,
        { success: true }
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      activityLogger.logApiCall(
        config.url,
        config.method,
        error.response?.status || 0,
        duration,
        { 
          success: false,
          error: error.message 
        }
      );
      
      throw error;
    }
  };
  
  return apiInstance;
};

// Initialize API logging
createApiLogger(api); 