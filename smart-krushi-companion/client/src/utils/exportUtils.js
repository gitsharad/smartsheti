import { useState } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

// CSV Export
export const exportToCSV = (data, filename = 'export.csv', headers = null) => {
  try {
    // Convert data to CSV format
    let csvContent = '';
    
    // Add headers
    if (headers) {
      csvContent += headers.join(',') + '\n';
    } else if (data.length > 0) {
      csvContent += Object.keys(data[0]).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
      const values = Object.values(row).map(value => {
        // Handle special characters and commas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
    
    return { success: true, message: 'CSV exported successfully!' };
  } catch (error) {
    console.error('CSV export error:', error);
    return { success: false, message: 'Failed to export CSV' };
  }
};

// Excel Export
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1', headers = null) => {
  try {
    // Prepare worksheet data
    let worksheetData = [];
    
    // Add headers
    if (headers) {
      worksheetData.push(headers);
    } else if (data.length > 0) {
      worksheetData.push(Object.keys(data[0]));
    }
    
    // Add data rows
    data.forEach(row => {
      worksheetData.push(Object.values(row));
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    return { success: true, message: 'Excel file exported successfully!' };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, message: 'Failed to export Excel file' };
  }
};

// PDF Export using jsPDF
export const exportToPDF = async (data, filename = 'export.pdf', options = {}) => {
  try {
    // Dynamic import for jsPDF to reduce bundle size
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Add title
    if (options.title) {
      doc.setFontSize(16);
      doc.text(options.title, 14, 20);
      doc.setFontSize(12);
    }
    
    // Add timestamp
    if (options.includeTimestamp) {
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.setFontSize(12);
    }
    
    // Prepare table data
    const headers = options.headers || (data.length > 0 ? Object.keys(data[0]) : []);
    const rows = data.map(row => Object.values(row));
    
    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: options.startY || 40,
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [34, 197, 94], // Green color
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    
    // Add footer
    if (options.footer) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(options.footer, 14, doc.internal.pageSize.height - 10);
      }
    }
    
    // Save file
    doc.save(filename);
    
    return { success: true, message: 'PDF exported successfully!' };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, message: 'Failed to export PDF' };
  }
};

// Field-specific export functions
export const exportFieldData = {
  // Export fields list
  fields: (fields, format = 'csv') => {
    const headers = ['Field ID', 'Name', 'Location', 'Area (acres)', 'Current Crop', 'Status', 'Owner'];
    const data = fields.map(field => [
      field.fieldId,
      field.name,
      field.location?.address || 'N/A',
      field.area || 'N/A',
      field.currentCrop || 'N/A',
      field.status || 'Active',
      field.owner?.name || 'N/A'
    ]);
    
    const filename = `fields_export_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        return exportToCSV(data, `${filename}.csv`, headers);
      case 'excel':
        return exportToExcel(data, `${filename}.xlsx`, 'Fields', headers);
      case 'pdf':
        return exportToPDF(data, `${filename}.pdf`, {
          title: 'Fields Report',
          headers,
          includeTimestamp: true,
          footer: 'Smart Krishi Companion - Fields Report'
        });
      default:
        return exportToCSV(data, `${filename}.csv`, headers);
    }
  },
  
  // Export sensor data
  sensorData: (sensorData, format = 'csv') => {
    const headers = ['Field ID', 'Timestamp', 'Moisture (%)', 'Temperature (°C)', 'Device ID', 'Location'];
    const data = sensorData.map(reading => [
      reading.fieldId,
      new Date(reading.timestamp).toLocaleString(),
      reading.moisture,
      reading.temperature,
      reading.deviceId || 'N/A',
      reading.location || 'N/A'
    ]);
    
    const filename = `sensor_data_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        return exportToCSV(data, `${filename}.csv`, headers);
      case 'excel':
        return exportToExcel(data, `${filename}.xlsx`, 'Sensor Data', headers);
      case 'pdf':
        return exportToPDF(data, `${filename}.pdf`, {
          title: 'Sensor Data Report',
          headers,
          includeTimestamp: true,
          footer: 'Smart Krishi Companion - Sensor Data Report'
        });
      default:
        return exportToCSV(data, `${filename}.csv`, headers);
    }
  },
  
  // Export analytics
  analytics: (analytics, format = 'csv') => {
    const headers = ['Metric', 'Current Value', 'Previous Value', 'Change (%)', 'Status'];
    const data = Object.entries(analytics).map(([key, value]) => [
      key,
      value.current || 'N/A',
      value.previous || 'N/A',
      value.change ? `${value.change}%` : 'N/A',
      value.status || 'Normal'
    ]);
    
    const filename = `analytics_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        return exportToCSV(data, `${filename}.csv`, headers);
      case 'excel':
        return exportToExcel(data, `${filename}.xlsx`, 'Analytics', headers);
      case 'pdf':
        return exportToPDF(data, `${filename}.pdf`, {
          title: 'Analytics Report',
          headers,
          includeTimestamp: true,
          footer: 'Smart Krishi Companion - Analytics Report'
        });
      default:
        return exportToCSV(data, `${filename}.csv`, headers);
    }
  },
  
  // Export alerts
  alerts: (alerts, format = 'csv') => {
    const headers = ['Type', 'Severity', 'Message', 'Field ID', 'Timestamp', 'Status'];
    const data = alerts.map(alert => [
      alert.type,
      alert.severity,
      alert.message?.english || alert.message,
      alert.fieldId || 'N/A',
      new Date(alert.timestamp).toLocaleString(),
      alert.status || 'Active'
    ]);
    
    const filename = `alerts_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        return exportToCSV(data, `${filename}.csv`, headers);
      case 'excel':
        return exportToExcel(data, `${filename}.xlsx`, 'Alerts', headers);
      case 'pdf':
        return exportToPDF(data, `${filename}.pdf`, {
          title: 'Alerts Report',
          headers,
          includeTimestamp: true,
          footer: 'Smart Krishi Companion - Alerts Report'
        });
      default:
        return exportToCSV(data, `${filename}.csv`, headers);
    }
  },
  
  // Export users
  users: (users, format = 'csv') => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created Date'];
    const data = users.map(user => [
      user.name,
      user.email,
      user.phone || 'N/A',
      user.role,
      user.status || 'Active',
      new Date(user.createdAt).toLocaleDateString()
    ]);
    
    const filename = `users_${new Date().toISOString().split('T')[0]}`;
    
    switch (format) {
      case 'csv':
        return exportToCSV(data, `${filename}.csv`, headers);
      case 'excel':
        return exportToExcel(data, `${filename}.xlsx`, 'Users', headers);
      case 'pdf':
        return exportToPDF(data, `${filename}.pdf`, {
          title: 'Users Report',
          headers,
          includeTimestamp: true,
          footer: 'Smart Krishi Companion - Users Report'
        });
      default:
        return exportToCSV(data, `${filename}.csv`, headers);
    }
  }
};

// Export component for React
export const ExportButton = ({ 
  data, 
  exportFunction, 
  format = 'csv', 
  filename, 
  className = '',
  disabled = false,
  children = 'Export' 
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  
  const handleExport = async () => {
    try {
      setExporting(true);
      setExportStatus(null);
      
      const result = await exportFunction(data, format, filename);
      setExportStatus(result);
      
      if (result.success) {
        // Show success message
        setTimeout(() => setExportStatus(null), 3000);
      }
    } catch (error) {
      setExportStatus({ success: false, message: 'Export failed' });
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={disabled || exporting}
        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {exporting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Exporting...
          </div>
        ) : (
          children
        )}
      </button>
      
      {exportStatus && (
        <div className={`absolute top-full mt-2 px-3 py-2 rounded-lg text-sm ${
          exportStatus.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {exportStatus.message}
        </div>
      )}
    </div>
  );
};

// Export format selector component
export const ExportFormatSelector = ({ 
  selectedFormat, 
  onFormatChange, 
  className = '' 
}) => {
  const formats = [
    { value: 'csv', label: 'CSV', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'pdf', label: 'PDF', icon: '📋' }
  ];
  
  return (
    <div className={`flex space-x-2 ${className}`}>
      {formats.map(format => (
        <button
          key={format.value}
          onClick={() => onFormatChange(format.value)}
          className={`px-3 py-2 rounded-lg border transition-colors ${
            selectedFormat === format.value
              ? 'bg-green-100 border-green-300 text-green-800'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="mr-1">{format.icon}</span>
          {format.label}
        </button>
      ))}
    </div>
  );
}; 