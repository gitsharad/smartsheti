// Centralized error handling utility
export const handleApiError = (error, defaultMessage = 'Something went wrong. Please try again.') => {
  console.error('API Error:', error);
  
  // Network errors
  if (!error.response) {
    return {
      message: 'Network error. Please check your internet connection.',
      type: 'network'
    };
  }
  
  const { status, data } = error.response;
  
  // HTTP status code based errors
  switch (status) {
    case 400:
      return {
        message: data?.message?.english || data?.error || 'Invalid request. Please check your input.',
        type: 'validation'
      };
    
    case 401:
      return {
        message: 'Session expired. Please log in again.',
        type: 'auth'
      };
    
    case 403:
      return {
        message: data?.message?.english || 'You do not have permission to perform this action.',
        type: 'permission'
      };
    
    case 404:
      return {
        message: data?.message?.english || 'The requested resource was not found.',
        type: 'notFound'
      };
    
    case 409:
      return {
        message: data?.message?.english || 'This resource already exists.',
        type: 'conflict'
      };
    
    case 422:
      return {
        message: data?.message?.english || 'Validation failed. Please check your input.',
        type: 'validation'
      };
    
    case 429:
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        type: 'rateLimit'
      };
    
    case 500:
      return {
        message: 'Server error. Please try again later.',
        type: 'server'
      };
    
    case 502:
    case 503:
    case 504:
      return {
        message: 'Service temporarily unavailable. Please try again later.',
        type: 'server'
      };
    
    default:
      return {
        message: data?.message?.english || defaultMessage,
        type: 'unknown'
      };
  }
};

// Field-specific error messages
export const getFieldError = (fieldName, error) => {
  const fieldErrors = {
    name: 'Field name is required and must be between 2-50 characters.',
    fieldId: 'Field ID is required and must be unique.',
    location: 'Please provide valid location coordinates.',
    soilInfo: 'Please provide valid soil information.',
    currentCrop: 'Please provide valid crop information.',
    sensors: 'Please provide valid sensor configuration.',
    irrigation: 'Please provide valid irrigation settings.'
  };
  
  return fieldErrors[fieldName] || error;
};

// Validation error formatter
export const formatValidationErrors = (errors) => {
  if (typeof errors === 'string') {
    return errors;
  }
  
  if (Array.isArray(errors)) {
    return errors.join(', ');
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).join(', ');
  }
  
  return 'Validation failed. Please check your input.';
};

// User-friendly success messages
export const getSuccessMessage = (action, resource = 'item') => {
  const messages = {
    create: `${resource} created successfully!`,
    update: `${resource} updated successfully!`,
    delete: `${resource} deleted successfully!`,
    save: `${resource} saved successfully!`,
    upload: 'File uploaded successfully!',
    download: 'Download started successfully!',
    export: 'Export completed successfully!',
    import: 'Import completed successfully!',
    markAsRead: 'Marked as read successfully!',
    assign: 'Assignment completed successfully!',
    unassign: 'Unassignment completed successfully!'
  };
  
  return messages[action] || 'Operation completed successfully!';
};

// Loading state messages
export const getLoadingMessage = (action, resource = 'data') => {
  const messages = {
    load: `Loading ${resource}...`,
    save: `Saving ${resource}...`,
    create: `Creating ${resource}...`,
    update: `Updating ${resource}...`,
    delete: `Deleting ${resource}...`,
    upload: 'Uploading file...',
    download: 'Preparing download...',
    export: 'Generating export...',
    import: 'Processing import...',
    analyze: 'Analyzing data...',
    generate: 'Generating report...',
    fetch: `Fetching ${resource}...`,
    search: 'Searching...',
    filter: 'Applying filters...'
  };
  
  return messages[action] || 'Loading...';
}; 