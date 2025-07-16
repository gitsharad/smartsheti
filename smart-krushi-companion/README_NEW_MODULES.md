# Smart Krushi Companion - New Modules

## 🌿 Disease Detector Module

### Features
- **Image Upload**: Drag & drop or click to upload leaf images
- **AI Analysis**: TensorFlow Lite model for disease detection
- **Marathi Results**: Disease name, severity, and treatment in Marathi
- **Treatment Tips**: Detailed treatment and prevention recommendations

### API Endpoints
- `POST /api/disease/analyze` - Analyze uploaded image

### Setup
1. Install TensorFlow.js: `npm install @tensorflow/tfjs-node`
2. Create `uploads/` directory in server
3. Add disease model file (optional - currently using mock data)

### Usage
1. Navigate to `/disease-detector`
2. Upload leaf image
3. Get instant analysis with treatment recommendations

---

## 🚜 Farm Decision Support System (FDSS)

### Features
- **Real-time Insights**: Based on sensor data and weather
- **Actionable Recommendations**: Immediate and scheduled actions
- **Risk Alerts**: Weather and condition-based warnings
- **Multi-field Support**: Switch between different plots

### API Endpoints
- `GET /api/fdss/advice?fieldId=...` - Get farm advice
- `GET /api/weather/current?fieldId=...` - Get weather data

### Insights Generated
- **Immediate Actions**: Critical actions needed now
- **Scheduled Actions**: Planned actions for future
- **Recommendations**: General farming tips
- **Risk Alerts**: Weather and disease warnings

### Usage
1. Navigate to `/fdss`
2. Select field/plot
3. View real-time insights and recommendations

---

## 🌱 Land Health Report & Crop Planner

### Features
- **Soil Analysis**: Input pH, NPK, organic matter
- **NDVI Data**: Vegetation health indicators
- **Crop Recommendations**: Suitable crops with suitability scores
- **PDF Export**: Download comprehensive land health report

### API Endpoints
- `POST /api/land/report` - Generate land health report
- `POST /api/land/download-pdf` - Download PDF report

### Soil Parameters
- **pH**: 0-14 scale (optimal: 6.0-7.5)
- **Nitrogen (N)**: kg/ha (optimal: 140-200)
- **Phosphorus (P)**: kg/ha (optimal: 10-20)
- **Potassium (K)**: kg/ha (optimal: 100-200)
- **Organic Matter**: % (optimal: 2.0-5.0)

### Supported Crops
- भात (Rice) - खरीप season
- गहू (Wheat) - रब्बी season
- कापूस (Cotton) - खरीप season
- ऊस (Sugarcane) - वर्षभर
- डाळी (Pulses) - रब्बी/खरीप
- भाजीपाला (Vegetables) - वर्षभर

### Usage
1. Navigate to `/land-report`
2. Enter soil data
3. Generate comprehensive report
4. Download PDF for offline use

---

## 🛠️ Installation & Setup

### Backend Dependencies
```bash
cd smart-krushi-companion/server
npm install @tensorflow/tfjs-node multer pdfkit
```

### Frontend Dependencies
```bash
cd smart-krushi-companion/client
npm install react-router-dom react-icons
```

### Environment Setup
1. Create `uploads/` directory in server
2. Ensure MongoDB is running
3. Start server: `npm run dev`
4. Start client: `npm start`

---

## 🎨 UI Features

### Modern Design
- **Gradient Backgrounds**: Beautiful color schemes
- **Card-based Layout**: Clean, organized interface
- **Responsive Design**: Works on all devices
- **Interactive Elements**: Hover effects and animations

### Navigation
- **Dashboard Cards**: Easy access to all modules
- **Breadcrumb Navigation**: Clear page hierarchy
- **Icon Integration**: Visual indicators for all features

### Data Visualization
- **Charts**: Real-time sensor data graphs
- **Progress Indicators**: Soil health scores
- **Status Cards**: Weather and condition summaries

---

## 🔧 Technical Implementation

### Disease Detection
- **TensorFlow.js**: Client-side model inference
- **Image Processing**: Automatic resizing and validation
- **Disease Database**: Comprehensive Marathi information

### FDSS Engine
- **Sensor Integration**: Real-time data analysis
- **Weather API**: External weather data integration
- **Decision Logic**: Rule-based recommendation system

### Land Health Analysis
- **Soil Chemistry**: NPK and pH analysis
- **Crop Matching**: Algorithm-based suitability scoring
- **PDF Generation**: Server-side report creation

---

## 🌐 API Documentation

### Disease Detection
```javascript
POST /api/disease/analyze
Content-Type: multipart/form-data
Body: { image: File }

Response: {
  diseaseName: "रोग नाव",
  severity: 1-5,
  confidence: 70-100,
  treatment: ["उपचार १", "उपचार २"],
  prevention: ["प्रतिबंध १", "प्रतिबंध २"]
}
```

### FDSS Advice
```javascript
GET /api/fdss/advice?fieldId=plot1

Response: {
  immediateActions: [{ title, description, priority, timing }],
  scheduledActions: [{ title, description, priority, scheduledDate }],
  recommendations: [{ title, description, benefit }],
  riskAlerts: [{ title, description, mitigation }]
}
```

### Land Health Report
```javascript
POST /api/land/report
Content-Type: application/json
Body: { ph, nitrogen, phosphorus, potassium, organicMatter, location }

Response: {
  soilData: {...},
  ndviData: { current, average, status },
  cropRecommendations: [{ name, season, suitability }],
  improvementTips: ["टिप १", "टिप २"]
}
```

---

## 🚀 Future Enhancements

### Planned Features
- **Real TensorFlow Model**: Replace mock disease detection
- **Sentinel API Integration**: Real NDVI data
- **Weather API**: OpenWeatherMap integration
- **Multi-language Support**: English and other languages
- **Mobile App**: React Native version

### Advanced Analytics
- **Machine Learning**: Predictive crop recommendations
- **Historical Analysis**: Long-term trend analysis
- **Yield Prediction**: AI-based yield forecasting
- **Market Integration**: Price and demand analysis

---

## 📞 Support

For technical support or feature requests, please contact the development team.

**Smart Krushi Companion** - Empowering farmers with intelligent solutions! 🌾 