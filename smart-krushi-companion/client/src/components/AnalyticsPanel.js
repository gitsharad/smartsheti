import React, { useState, useEffect, useRef } from 'react';
import { FiBarChart2, FiDownload, FiCalendar } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import apiRoutes from '../services/apiRoutes';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const COLORS = [
  '#2563eb', '#059669', '#f59e42', '#e11d48', '#a21caf', '#0e7490', '#facc15', '#f472b6', '#10b981', '#f43f5e'
];

const AnalyticsPanel = () => {
  const [dateRange, setDateRange] = useState('last6months');
  const [fieldHealth, setFieldHealth] = useState([]);
  const [yieldTrends, setYieldTrends] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]); // multi-select
  const [chartType, setChartType] = useState('line');
  const [showPoints, setShowPoints] = useState(true);
  const [smoothLines, setSmoothLines] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingYield, setLoadingYield] = useState(true);
  const [errorHealth, setErrorHealth] = useState(null);
  const [errorYield, setErrorYield] = useState(null);
  const chartRef = useRef();

  useEffect(() => {
    fetchFieldHealth();
    fetchYieldTrends(selectedCrops);
    // eslint-disable-next-line
  }, [selectedCrops]);

  const fetchFieldHealth = async () => {
    setLoadingHealth(true);
    setErrorHealth(null);
    try {
      const res = await apiRoutes.getFieldAnalyticsOverview();
      const byStatus = res.data.analytics?.byStatus || {};
      const healthSummary = [
        { status: 'Healthy', count: byStatus.active || 0 },
        { status: 'Needs Attention', count: (byStatus.maintenance || 0) + (byStatus.inactive || 0) },
        { status: 'Critical', count: byStatus.harvested || 0 }
      ];
      setFieldHealth(healthSummary);
    } catch (err) {
      setErrorHealth('Failed to load field health summary');
      setFieldHealth([]);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchYieldTrends = async (cropsArr) => {
    setLoadingYield(true);
    setErrorYield(null);
    try {
      let query = '';
      if (cropsArr && cropsArr.length > 0) {
        query = `?crops=${encodeURIComponent(cropsArr.join(','))}`;
      }
      const res = await apiRoutes.getYieldTrends(query);
      setYieldTrends(res.data.yieldTrends || []);
      setCrops(res.data.crops || []);
    } catch (err) {
      setErrorYield('Failed to load yield trends');
      setYieldTrends([]);
      setCrops([]);
    } finally {
      setLoadingYield(false);
    }
  };

  const handleDownloadImage = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yield-trends-chart.png';
      link.click();
    }
  };

  const handleDownloadCSV = () => {
    if (!yieldTrends.length) return;
    let csv = 'Month,Year';
    yieldTrends.forEach(ds => { csv += `,${ds.crop}`; });
    csv += '\n';
    const months = yieldTrends[0]?.data?.map((d, i) => ({ month: d.month, year: d.year, idx: i })) || [];
    months.forEach(({ month, year, idx }) => {
      let row = `${month},${year}`;
      yieldTrends.forEach(ds => {
        row += `,${ds.data[idx]?.averageYield ?? ''}`;
      });
      csv += row + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yield-trends.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Chart.js data config for multi-crop
  const chartData = {
    labels: yieldTrends[0]?.data?.map(item => `${item.month} ${item.year}`) || [],
    datasets: yieldTrends.map((ds, i) => ({
      label: ds.crop,
      data: ds.data.map(item => item.averageYield),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: chartType === 'bar' ? COLORS[i % COLORS.length] + '80' : COLORS[i % COLORS.length] + '33',
      fill: chartType === 'line',
      tension: smoothLines ? 0.3 : 0,
      pointRadius: showPoints ? 3 : 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    })),
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Quintal' } },
      x: { title: { display: true, text: 'Month' } },
    },
  };

  // Multi-select handler
  const handleCropChange = (e) => {
    const options = Array.from(e.target.options);
    const selected = options.filter(o => o.selected).map(o => o.value);
    setSelectedCrops(selected);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FiCalendar className="text-gray-500" />
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="last6months">Last 6 Months</option>
            <option value="last12months">Last 12 Months</option>
            <option value="thisyear">This Year</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleDownloadImage} className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-xs">Export Image</button>
          <button onClick={handleDownloadCSV} className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-xs">Export CSV</button>
        </div>
      </div>
      {/* Yield Trends section now real and interactive */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center mb-2 space-x-4">
          <h4 className="font-semibold text-green-900 flex items-center">
            <FiBarChart2 className="mr-2" /> Yield Trends (Avg. per month, quintal)
          </h4>
          <select
            multiple
            value={selectedCrops}
            onChange={handleCropChange}
            className="border rounded px-2 py-1 text-sm min-w-[120px]"
            style={{ minWidth: 120, height: 32 + 20 * Math.min(4, crops.length) }}
          >
            <option value="">All Crops</option>
            {crops.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
          <button
            className={`ml-2 px-2 py-1 rounded text-xs border ${chartType === 'line' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
          <button
            className={`px-2 py-1 rounded text-xs border ${chartType === 'bar' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => setChartType('bar')}
          >
            Bar
          </button>
          <label className="ml-4 text-xs flex items-center">
            <input type="checkbox" checked={showPoints} onChange={e => setShowPoints(e.target.checked)} className="mr-1" /> Show Points
          </label>
          <label className="ml-2 text-xs flex items-center">
            <input type="checkbox" checked={smoothLines} onChange={e => setSmoothLines(e.target.checked)} className="mr-1" /> Smooth Lines
          </label>
        </div>
        {loadingYield ? (
          <div className="text-center text-green-800">Loading yield trends...</div>
        ) : errorYield ? (
          <div className="text-center text-red-600">{errorYield}</div>
        ) : (
          <div className="w-full max-w-2xl mx-auto">
            {chartType === 'line' ? (
              <Line ref={chartRef} data={chartData} options={chartOptions} height={220} />
            ) : (
              <Bar ref={chartRef} data={chartData} options={chartOptions} height={220} />
            )}
          </div>
        )}
      </div>
      <div>
        <h4 className="font-semibold text-green-900 mb-2">Field Health Summary</h4>
        {loadingHealth ? (
          <div className="text-center text-green-800">Loading field health summary...</div>
        ) : errorHealth ? (
          <div className="text-center text-red-600">{errorHealth}</div>
        ) : (
          <div className="flex space-x-4">
            {fieldHealth.map((item, idx) => (
              <div key={idx} className={`flex flex-col items-center px-4 py-2 rounded-xl ${item.status === 'Healthy' ? 'bg-green-100 text-green-800' : item.status === 'Needs Attention' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                <span className="font-bold text-lg">{item.count}</span>
                <span className="text-xs">{item.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel; 