import { api } from './authService';

const trustService = {
  // Get trust dashboard data
  getTrustDashboard: async () => {
    try {
      const response = await api.get('/trust/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching trust dashboard:', error);
      throw error;
    }
  },

  // Get data transparency report
  getTransparencyReport: async () => {
    try {
      const response = await api.get('/trust/transparency/report');
      return response.data;
    } catch (error) {
      console.error('Error fetching transparency report:', error);
      throw error;
    }
  },

  // Get AI transparency report
  getAITransparencyReport: async (fieldId = null) => {
    try {
      const params = fieldId ? { fieldId } : {};
      const response = await api.get('/trust/ai-transparency/report', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching AI transparency report:', error);
      throw error;
    }
  },

  // Get specific AI decision explanation
  getDecisionExplanation: async (decisionId) => {
    try {
      const response = await api.get(`/trust/ai-transparency/decision/${decisionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching decision explanation:', error);
      throw error;
    }
  },

  // Get data portability information
  getDataPortability: async () => {
    try {
      const response = await api.get('/trust/data-portability');
      return response.data;
    } catch (error) {
      console.error('Error fetching data portability:', error);
      throw error;
    }
  },

  // Create data access request
  createDataAccessRequest: async (type, description) => {
    try {
      const response = await api.post('/trust/data-access-request', {
        type,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error creating data access request:', error);
      throw error;
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacySettings) => {
    try {
      const response = await api.put('/trust/privacy-settings', {
        privacySettings
      });
      return response.data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  // Get certification status
  getCertifications: async () => {
    try {
      const response = await api.get('/trust/certifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching certifications:', error);
      throw error;
    }
  },

  // Get security score
  getSecurityScore: async () => {
    try {
      const response = await api.get('/trust/security-score');
      return response.data;
    } catch (error) {
      console.error('Error fetching security score:', error);
      throw error;
    }
  },

  // Get bias report (admin/coordinator only)
  getBiasReport: async () => {
    try {
      const response = await api.get('/trust/bias-report');
      return response.data;
    } catch (error) {
      console.error('Error fetching bias report:', error);
      throw error;
    }
  },

  // Record AI decision (for internal use)
  recordAIDecision: async (fieldId, decisionData) => {
    try {
      const response = await api.post('/trust/record-ai-decision', {
        fieldId,
        decisionData
      });
      return response.data;
    } catch (error) {
      console.error('Error recording AI decision:', error);
      throw error;
    }
  },

  // Update user trust rating
  updateTrustRating: async (trustData) => {
    try {
      const response = await api.post('/trust/update-trust-rating', {
        trustData
      });
      return response.data;
    } catch (error) {
      console.error('Error updating trust rating:', error);
      throw error;
    }
  },

  // Export user data (data portability)
  exportUserData: async () => {
    try {
      const response = await api.get('/trust/data-portability', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },

  // Request data deletion
  requestDataDeletion: async (reason = '') => {
    try {
      const response = await api.post('/trust/data-access-request', {
        type: 'deletion',
        description: reason || 'User requested data deletion'
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  },

  // Get user rights information
  getUserRights: async () => {
    try {
      const [transparencyReport, dataPortability] = await Promise.all([
        this.getTransparencyReport(),
        this.getDataPortability()
      ]);
      
      return {
        transparency: transparencyReport.data,
        portability: dataPortability.data,
        rights: {
          access: true,
          portability: true,
          correction: true,
          deletion: true,
          objection: true
        }
      };
    } catch (error) {
      console.error('Error fetching user rights:', error);
      throw error;
    }
  },

  // Submit user feedback for AI decisions
  submitAIFeedback: async (decisionId, feedback) => {
    try {
      const response = await api.post('/trust/ai-feedback', {
        decisionId,
        feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting AI feedback:', error);
      throw error;
    }
  },

  // Get trust metrics for display
  getTrustMetrics: async () => {
    try {
      const [dashboard, certifications, securityScore] = await Promise.all([
        this.getTrustDashboard(),
        this.getCertifications(),
        this.getSecurityScore()
      ]);
      
      return {
        dashboard: dashboard.data,
        certifications: certifications.data,
        securityScore: securityScore.data.securityScore
      };
    } catch (error) {
      console.error('Error fetching trust metrics:', error);
      throw error;
    }
  }
};

export default trustService; 