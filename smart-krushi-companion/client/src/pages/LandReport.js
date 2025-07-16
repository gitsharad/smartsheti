import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiDownload, FiFeather, FiMap, FiBarChart, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import apiRoutes from '../services/apiRoutes';
import { api } from '../services/authService';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LandReport = () => {
  const [soilData, setSoilData] = useState({
    ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organicMatter: '',
    location: ''
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ndviData, setNdviData] = useState(null);
  const [ndvi, setNdvi] = useState([]);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [prevLat, setPrevLat] = useState('');
  const [prevLon, setPrevLon] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSoilData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchNDVI = async () => {
    if (!lat || !lon) {
      alert('कृपया अक्षांश आणि रेखांश भरा');
      return;
    }
    try {
      let currentFieldId = fieldId;
      // Only register if coordinates changed or no fieldId
      if (!fieldId || prevLat !== lat || prevLon !== lon) {
        const regRes = await apiRoutes.registerField({ lat: parseFloat(lat), lon: parseFloat(lon), radius: 500, name: 'My Farm' });
        const regData = await regRes.json();
        if (!regData.fieldId) throw new Error('Field registration failed');
        setFieldId(regData.fieldId);
        setPrevLat(lat);
        setPrevLon(lon);
        currentFieldId = regData.fieldId;
      }
      // Fetch NDVI
      const ndviRes = await api.get(`/ndvi/timeseries?fieldId=${currentFieldId}`);
      const ndviJson = await ndviRes.json();
      setNdvi(ndviJson.ndvi || []);
      alert('NDVI डेटा मिळाला!');
    } catch (err) {
      alert('NDVI मिळवताना त्रुटी: ' + err.message);
    }
  };

  const generateReport = async () => {
    if (!soilData.ph || !soilData.nitrogen || !soilData.phosphorus || !soilData.potassium) {
      alert('कृपया सर्व मूलभूत माहिती भरा');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/land/report', { ...soilData, ndvi });
      const data = response.data;
      if (data.success) {
        setReport(data.report);
      } else {
        alert('अहवाल तयार करताना त्रुटी आली');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('अहवाल तयार करताना त्रुटी आली');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!report) return;
    
    try {
      const response = await api.post('/land/download-pdf', report, {
        responseType: 'blob'
      });
      
      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'land-health-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getSoilHealthScore = (data) => {
    if (!data) return 0;
    let score = 0;
    
    // pH scoring (optimal range 6.0-7.5)
    const ph = parseFloat(data.ph);
    if (ph >= 6.0 && ph <= 7.5) score += 25;
    else if (ph >= 5.5 && ph <= 8.0) score += 15;
    else score += 5;
    
    // NPK scoring
    const n = parseFloat(data.nitrogen);
    const p = parseFloat(data.phosphorus);
    const k = parseFloat(data.potassium);
    
    if (n >= 140 && n <= 200) score += 25;
    else if (n >= 100 && n <= 250) score += 15;
    else score += 5;
    
    if (p >= 10 && p <= 20) score += 25;
    else if (p >= 5 && p <= 30) score += 15;
    else score += 5;
    
    if (k >= 100 && k <= 200) score += 25;
    else if (k >= 50 && k <= 300) score += 15;
    else score += 5;
    
    return Math.min(100, score);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link
            to="/"
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mr-4"
          >
            <FiArrowLeft className="mr-2" />
            डॅशबोर्डकडे परत जा
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌱 जमीन आरोग्य अहवाल
          </h1>
          <p className="text-gray-600 text-lg">
            मातीची माहिती आणि पीक योजना
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Soil Data Input */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <FiFileText className="mr-2" />
              मातीची माहिती
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  pH मूल्य (6.0 - 8.0)
                </label>
                <input
                  type="number"
                  name="ph"
                  value={soilData.ph}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  max="14"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="6.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  नायट्रोजन (N) - kg/ha
                </label>
                <input
                  type="number"
                  name="nitrogen"
                  value={soilData.nitrogen}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  फॉस्फरस (P) - kg/ha
                </label>
                <input
                  type="number"
                  name="phosphorus"
                  value={soilData.phosphorus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पोटॅशियम (K) - kg/ha
                </label>
                <input
                  type="number"
                  name="potassium"
                  value={soilData.potassium}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="180"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  सेंद्रिय पदार्थ (%)
                </label>
                <input
                  type="number"
                  name="organicMatter"
                  value={soilData.organicMatter}
                  onChange={handleInputChange}
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  स्थान (शहर/गाव)
                </label>
                <input
                  type="text"
                  name="location"
                  value={soilData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="पुणे, महाराष्ट्र"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">अक्षांश (Latitude)</label>
                <input type="number" value={lat} onChange={e => setLat(e.target.value)} step="0.0001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="18.5204" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">रेखांश (Longitude)</label>
                <input type="number" value={lon} onChange={e => setLon(e.target.value)} step="0.0001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="73.8567" />
              </div>

              <button type="button" onClick={fetchNDVI} className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mb-2">NDVI मिळवा</button>

              <button
                onClick={generateReport}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    अहवाल तयार करत आहे...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" />
                    अहवाल तयार करा
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Display */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <FiBarChart className="mr-2" />
              अहवाल आणि शिफारसी
            </h2>

            {report ? (
              <div className="space-y-6">
                {/* Location Analysis */}
                {report.locationAnalysis && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <FiMap className="mr-2" />
                      स्थान विश्लेषण
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">प्रदेश</p>
                        <p className="font-medium text-gray-800">{report.locationAnalysis.region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">हवामान</p>
                        <p className="font-medium text-gray-800">{report.locationAnalysis.climate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">माती प्रकार</p>
                        <p className="font-medium text-gray-800">{report.locationAnalysis.soilType}</p>
                      </div>
                    </div>
                    
                    {report.locationAnalysis.marketAdvantages && report.locationAnalysis.marketAdvantages.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">बाजार फायदे:</p>
                        <div className="space-y-1">
                          {report.locationAnalysis.marketAdvantages.map((advantage, index) => (
                            <div key={index} className="flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              <span className="text-sm text-gray-700">{advantage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {report.locationAnalysis.recommendations && report.locationAnalysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">स्थान-विशिष्ट सूचना:</p>
                        <div className="space-y-1">
                          {report.locationAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start">
                              <span className="text-blue-600 mr-2">•</span>
                              <span className="text-sm text-gray-700">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Soil Health Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">माती आरोग्य स्कोअर</h3>
                  <div className="flex items-center justify-between">
                    <div className={`px-4 py-2 rounded-lg ${getScoreColor(report.soilAnalysis.overallScore)}`}>
                      <span className="text-2xl font-bold">{report.soilAnalysis.overallScore}/100</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">श्रेणी</p>
                      <p className="font-medium">{report.soilAnalysis.overallHealth}</p>
                    </div>
                  </div>
                </div>

                {/* Soil Parameters */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">माती पॅरामीटर्स</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">pH मूल्य</p>
                        <p className="text-sm text-gray-600">{report.soilAnalysis.ph.value}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">स्थिती</p>
                        <p className="font-medium text-gray-800">{report.soilAnalysis.ph.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">नायट्रोजन (N)</p>
                        <p className="text-sm text-gray-600">{report.soilAnalysis.nitrogen.value} kg/ha</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">स्थिती</p>
                        <p className="font-medium text-gray-800">{report.soilAnalysis.nitrogen.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">फॉस्फरस (P)</p>
                        <p className="text-sm text-gray-600">{report.soilAnalysis.phosphorus.value} kg/ha</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">स्थिती</p>
                        <p className="font-medium text-gray-800">{report.soilAnalysis.phosphorus.status}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">पोटॅशियम (K)</p>
                        <p className="text-sm text-gray-600">{report.soilAnalysis.potassium.value} kg/ha</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">स्थिती</p>
                        <p className="font-medium text-gray-800">{report.soilAnalysis.potassium.status}</p>
                      </div>
                    </div>
                    
                    {report.soilAnalysis.organicMatter && (
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">जैविक पदार्थ</p>
                          <p className="text-sm text-gray-600">{report.soilAnalysis.organicMatter.value}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">स्थिती</p>
                          <p className="font-medium text-gray-800">{report.soilAnalysis.organicMatter.status}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Crop Recommendations */}
                {report.cropRecommendations && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                      <FiFeather className="mr-2" />
                      पीक शिफारसी (AI-आधारित)
                    </h3>
                    <div className="space-y-3">
                      {report.cropRecommendations.map((crop, index) => (
                        <div key={index} className="bg-white rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                                #{index + 1}
                              </span>
                              <h4 className="font-semibold text-gray-800">{crop.name}</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">{crop.suitability}%</p>
                              <p className="text-xs text-gray-500">योग्यता</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">हंगाम</p>
                              <p className="font-medium">{crop.season}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">श्रेणी</p>
                              <p className="font-medium">{crop.category}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">बाजार संधी</p>
                              <p className="font-medium capitalize">{crop.marketPotential}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">गुंतवणूक</p>
                              <p className="font-medium capitalize">{crop.investmentRequired}</p>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <p className="text-sm text-gray-700">{crop.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Recommendations */}
                {report.additionalRecommendations && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">अतिरिक्त सूचना</h3>
                    <div className="space-y-2">
                      {report.additionalRecommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-purple-600 mr-2">•</span>
                          <span className="text-gray-700">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NDVI Summary */}
                {report && report.ndvi && report.ndvi.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🛰️ NDVI उपग्रह निरीक्षण</h3>
                    <div className="space-y-2">
                      {report.ndvi.slice(-3).map((ndviPoint, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-gray-700">{new Date(ndviPoint.date).toLocaleDateString('mr-IN')}</span>
                          <span className="font-medium text-green-700">NDVI: {ndviPoint.ndvi}</span>
                        </div>
                      ))}
                      <div className="mt-2 font-medium">सरासरी NDVI (३० दिवस): {(
                        report.ndvi.reduce((sum, p) => sum + (p.ndvi || 0), 0) / report.ndvi.length
                      ).toFixed(2)}</div>
                    </div>
                    {/* NDVI Trend Chart */}
                    <div className="mt-6">
                      <Line
                        data={{
                          labels: report.ndvi.map(p => new Date(p.date).toLocaleDateString('mr-IN')),
                          datasets: [
                            {
                              label: 'NDVI',
                              data: report.ndvi.map(p => p.ndvi),
                              borderColor: '#059669',
                              backgroundColor: 'rgba(16,185,129,0.2)',
                              tension: 0.3,
                              pointRadius: 3,
                              fill: true
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                            title: { display: true, text: 'NDVI ट्रेंड (३० दिवस)', font: { size: 16 } }
                          },
                          scales: {
                            y: {
                              min: 0,
                              max: 1,
                              title: { display: true, text: 'NDVI' }
                            },
                            x: {
                              title: { display: true, text: 'दिनांक' }
                            }
                          }
                        }}
                        height={220}
                      />
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={downloadPDF}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FiDownload className="mr-2" />
                  अहवाल डाउनलोड करा
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiFileText className="mx-auto text-4xl mb-4" />
                <p>मातीची माहिती भरा आणि अहवाल तयार करा</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandReport; 