import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SensorChart = ({ data }) => {
  // Prepare chart data from sensor data array
  const labels = data && data.length > 0 ? data.map(d => new Date(d.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })) : [];
  const moistureData = data && data.length > 0 ? data.map(d => d.moisture) : [];
  const tempData = data && data.length > 0 ? data.map(d => d.temperature) : [];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'ओलावा (%)',
        data: moistureData,
        borderColor: 'rgb(34,197,94)',
        backgroundColor: 'rgba(34,197,94,0.2)',
        yAxisID: 'y',
      },
      {
        label: 'तापमान (°C)',
        data: tempData,
        borderColor: 'rgb(59,130,246)',
        backgroundColor: 'rgba(59,130,246,0.2)',
        yAxisID: 'y1',
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'शेवटच्या २४ तासांचा डेटा' },
    },
    scales: {
      y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'ओलावा (%)' } },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'तापमान (°C)' } },
    },
  };
  return (
    <div className="bg-white rounded shadow p-4">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default SensorChart; 