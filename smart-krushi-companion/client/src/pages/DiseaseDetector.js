import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUpload, FiImage, FiAlertTriangle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import apiRoutes from '../services/apiRoutes';

const DiseaseDetector = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage(file);
      setResult(null);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const analyzeDisease = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await apiRoutes.analyzeDisease(formData);
      setResult(response.data);
    } catch (error) {
      console.error('Error analyzing disease:', error);
      setResult({ error: 'Analysis failed. Please try again.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
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
            🌿 पिकांच्या रोगांची ओळख
          </h1>
          <p className="text-gray-600 text-lg">
            पानांचे फोटो अपलोड करा आणि रोगांची ओळख करा
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiImage className="mr-2" />
              फोटो अपलोड करा
            </h2>

            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedImage ? (
                <div className="space-y-4">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected"
                    className="max-w-full h-64 object-cover rounded-lg mx-auto"
                  />
                  <p className="text-green-600 font-medium">{selectedImage.name}</p>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    दुसरा फोटो निवडा
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <FiUpload className="mx-auto text-4xl text-gray-400" />
                  <p className="text-gray-600">
                    फोटो ड्रॅग करा किंवा क्लिक करून निवडा
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors"
                  >
                    <FiUpload className="mr-2" />
                    फोटो निवडा
                  </label>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {selectedImage && (
              <button
                onClick={analyzeDisease}
                disabled={isAnalyzing}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    विश्लेषण करत आहे...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" />
                    रोग ओळखा
                  </>
                )}
              </button>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiAlertTriangle className="mr-2" />
              निकाल
            </h2>

            {result ? (
              result.error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium">{result.error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Disease Info */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-l-4 border-red-400">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {result.disease}
                    </h3>
                    <div className="flex items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">गंभीरता:</span>
                      <div className="ml-2 flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded-full ${
                              i < Number(result.severity) ? 'bg-red-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{result.confidence}% आत्मविश्वास</p>
                  </div>

                  {/* Treatment */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-l-4 border-green-400">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      उपचार सूचना
                    </h4>
                    <div className="space-y-2 text-gray-700">
                      {Array.isArray(result.treatment) && result.treatment.map((tip, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prevention */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-l-4 border-blue-400">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      प्रतिबंधात्मक उपाय
                    </h4>
                    <div className="space-y-2 text-gray-700">
                      {Array.isArray(result.prevention) && result.prevention.map((tip, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiImage className="mx-auto text-4xl mb-4" />
                <p>फोटो अपलोड करा आणि रोग ओळखण्यासाठी क्लिक करा</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetector; 