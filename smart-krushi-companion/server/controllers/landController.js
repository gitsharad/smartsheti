const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Crop database with Marathi information - Expanded with more crops
const cropDatabase = {
  // Cereals
  'rice': {
    name: 'भात',
    season: 'खरीप',
    minPh: 5.5,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 8,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'wheat': {
    name: 'गहू',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 140,
    maxN: 200,
    minP: 10,
    maxP: 20,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'jowar': {
    name: 'ज्वारी',
    season: 'खरीप/रब्बी',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'bajra': {
    name: 'बाजरी',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 8.5,
    minN: 60,
    maxN: 120,
    minP: 6,
    maxP: 15,
    minK: 50,
    maxK: 120,
    suitability: 0
  },
  'maize': {
    name: 'मका',
    season: 'खरीप/रब्बी',
    minPh: 5.5,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'ragi': {
    name: 'नाचणी',
    season: 'खरीप',
    minPh: 5.5,
    maxPh: 8.0,
    minN: 60,
    maxN: 120,
    minP: 6,
    maxP: 15,
    minK: 50,
    maxK: 120,
    suitability: 0
  },

  // Pulses
  'toor': {
    name: 'तूर डाळ',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'moong': {
    name: 'मूग',
    season: 'खरीप/रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'urad': {
    name: 'उडीद',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'chana': {
    name: 'हरभरा',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'masoor': {
    name: 'मसूर',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'matki': {
    name: 'मटकी',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },

  // Oilseeds
  'groundnut': {
    name: 'शेंगदाणे',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'soybean': {
    name: 'सोयाबीन',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 20,
    maxN: 60,
    minP: 8,
    maxP: 20,
    minK: 40,
    maxK: 100,
    suitability: 0
  },
  'sunflower': {
    name: 'सूर्यफूल',
    season: 'खरीप/रब्बी',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 60,
    maxN: 120,
    minP: 8,
    maxP: 20,
    minK: 50,
    maxK: 120,
    suitability: 0
  },
  'sesame': {
    name: 'तीळ',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 40,
    maxN: 80,
    minP: 6,
    maxP: 15,
    minK: 30,
    maxK: 80,
    suitability: 0
  },
  'castor': {
    name: 'एरंड',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 40,
    maxN: 80,
    minP: 6,
    maxP: 15,
    minK: 30,
    maxK: 80,
    suitability: 0
  },

  // Cash Crops
  'cotton': {
    name: 'कापूस',
    season: 'खरीप',
    minPh: 5.5,
    maxPh: 8.5,
    minN: 100,
    maxN: 180,
    minP: 8,
    maxP: 25,
    minK: 80,
    maxK: 180,
    suitability: 0
  },
  'sugarcane': {
    name: 'ऊस',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 150,
    maxN: 250,
    minP: 12,
    maxP: 30,
    minK: 120,
    maxK: 250,
    suitability: 0
  },
  'tobacco': {
    name: 'तंबाखू',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },

  // Vegetables
  'tomato': {
    name: 'टोमॅटो',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.0,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'onion': {
    name: 'कांदा',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'potato': {
    name: 'बटाटा',
    season: 'रब्बी',
    minPh: 5.5,
    maxPh: 7.0,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'brinjal': {
    name: 'वांगे',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 180,
    minP: 8,
    maxP: 20,
    minK: 80,
    maxK: 180,
    suitability: 0
  },
  'cucumber': {
    name: 'काकडी',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'cauliflower': {
    name: 'फुलकोबी',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'cabbage': {
    name: 'कोबी',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'carrot': {
    name: 'गाजर',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'radish': {
    name: 'मुळा',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 60,
    maxN: 120,
    minP: 6,
    maxP: 15,
    minK: 50,
    maxK: 120,
    suitability: 0
  },
  'spinach': {
    name: 'पालक',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },

  // Fruits
  'mango': {
    name: 'आंबा',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'banana': {
    name: 'केळे',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 150,
    maxN: 250,
    minP: 12,
    maxP: 30,
    minK: 120,
    maxK: 250,
    suitability: 0
  },
  'orange': {
    name: 'संत्रे',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'papaya': {
    name: 'पपई',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'guava': {
    name: 'पेरू',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'pomegranate': {
    name: 'डाळिंब',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'grapes': {
    name: 'द्राक्षे',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 120,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 100,
    maxK: 200,
    suitability: 0
  },
  'coconut': {
    name: 'नारळ',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 200,
    minP: 10,
    maxP: 25,
    minK: 80,
    maxK: 200,
    suitability: 0
  },
  'cashew': {
    name: 'काजू',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },

  // Spices
  'chilli': {
    name: 'मिरची',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'turmeric': {
    name: 'हळद',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 180,
    minP: 8,
    maxP: 20,
    minK: 80,
    maxK: 180,
    suitability: 0
  },
  'ginger': {
    name: 'आले',
    season: 'खरीप',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 100,
    maxN: 180,
    minP: 8,
    maxP: 20,
    minK: 80,
    maxK: 180,
    suitability: 0
  },
  'coriander': {
    name: 'कोथिंबीर',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 60,
    maxN: 120,
    minP: 6,
    maxP: 15,
    minK: 50,
    maxK: 120,
    suitability: 0
  },
  'cumin': {
    name: 'जिरे',
    season: 'रब्बी',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 40,
    maxN: 80,
    minP: 6,
    maxP: 15,
    minK: 30,
    maxK: 80,
    suitability: 0
  },

  // Medicinal Plants
  'tulsi': {
    name: 'तुळस',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 7.5,
    minN: 60,
    maxN: 120,
    minP: 6,
    maxP: 15,
    minK: 50,
    maxK: 120,
    suitability: 0
  },
  'neem': {
    name: 'कडुनिंब',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 80,
    maxN: 150,
    minP: 8,
    maxP: 20,
    minK: 60,
    maxK: 150,
    suitability: 0
  },
  'aloe': {
    name: 'कोरफड',
    season: 'वर्षभर',
    minPh: 6.0,
    maxPh: 8.0,
    minN: 40,
    maxN: 80,
    minP: 6,
    maxP: 15,
    minK: 30,
    maxK: 80,
    suitability: 0
  }
};

// AI-powered soil analysis
const analyzeSoilWithAI = async (soilData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `
    Analyze this soil data and provide intelligent recommendations for Indian agriculture, specifically considering the location provided:
    
    Soil Parameters:
    - pH: ${soilData.ph} (optimal range: 6.0-7.5)
    - Nitrogen (N): ${soilData.nitrogen} kg/ha (optimal: 140-200)
    - Phosphorus (P): ${soilData.phosphorus} kg/ha (optimal: 10-20)
    - Potassium (K): ${soilData.potassium} kg/ha (optimal: 100-200)
    - Organic Matter: ${soilData.organicMatter || 'Not provided'}% (optimal: 2.0-5.0)
    - Location: ${soilData.location || 'Not provided'}
    
    Consider location-specific crops for Maharashtra and surrounding regions:
    - Pune/Nashik: Sugarcane, Grapes, Pomegranate, Tomato, Onion
    - Nagpur/Amravati: Cotton, Soybean, Orange, Banana, Sugarcane
    - Kolhapur/Sangli: Sugarcane, Grapes, Pomegranate, Banana, Coconut
    - Ratnagiri/Sindhudurg: Mango, Coconut, Cashew, Banana, Papaya
    - Coastal regions: Mango, Coconut, Cashew, Banana, Papaya
    - Vidarbha region: Cotton, Soybean, Orange, Banana, Sugarcane
    
    Available crops include: Rice, Wheat, Jowar, Bajra, Maize, Ragi, Pulses (Toor, Moong, Urad, Chana, Masoor, Matki), Oilseeds (Groundnut, Soybean, Sunflower, Sesame, Castor), Cash crops (Cotton, Sugarcane, Tobacco), Vegetables (Tomato, Onion, Potato, Brinjal, Cucumber, Cauliflower, Cabbage, Carrot, Radish, Spinach), Fruits (Mango, Banana, Orange, Papaya, Guava, Pomegranate, Grapes, Coconut, Cashew), Spices (Chilli, Turmeric, Ginger, Coriander, Cumin), and Medicinal plants (Tulsi, Neem, Aloe).
    
    Provide analysis in JSON format:
    {
      "soilHealthScore": 75,
      "soilType": "description in Marathi",
      "improvementTips": [
        "specific improvement tip in Marathi",
        "location-specific recommendation"
      ],
      "fertilizerRecommendations": [
        "specific fertilizer recommendation in Marathi"
      ],
      "riskFactors": [
        "potential risk factor in Marathi"
      ]
    }
    
    Focus on Indian agricultural context, provide recommendations in Marathi, and consider the specific location for crop suitability.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback to algorithmic analysis
      return await generateFallbackAnalysis(soilData);
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return await generateFallbackAnalysis(soilData);
  }
};

// Fallback algorithmic analysis
const generateFallbackAnalysis = async (soilData) => {
  const ph = parseFloat(soilData.ph);
  const n = parseFloat(soilData.nitrogen);
  const p = parseFloat(soilData.phosphorus);
  const k = parseFloat(soilData.potassium);
  
  let soilHealthScore = 0;
  let soilType = '';
  const improvementTips = [];
  const fertilizerRecommendations = [];
  const riskFactors = [];
  
  // pH analysis
  if (ph >= 6.0 && ph <= 7.5) {
    soilHealthScore += 25;
    soilType = 'उत्कृष्ट pH स्तर';
  } else if (ph >= 5.5 && ph <= 8.0) {
    soilHealthScore += 15;
    soilType = 'सामान्य pH स्तर';
    if (ph < 6.0) {
      improvementTips.push('माती अम्लीय आहे. चुना वापरा pH वाढवण्यासाठी.');
    } else {
      improvementTips.push('माती क्षारीय आहे. जिप्सम वापरा pH कमी करण्यासाठी.');
    }
  } else {
    soilHealthScore += 5;
    soilType = 'खराब pH स्तर';
    riskFactors.push('pH स्तर खूप खराब आहे. त्वरित सुधारणा आवश्यक.');
  }
  
  // NPK analysis
  if (n >= 140 && n <= 200) {
    soilHealthScore += 25;
  } else if (n >= 100 && n <= 250) {
    soilHealthScore += 15;
    if (n < 140) {
      fertilizerRecommendations.push('नायट्रोजन कमी आहे. युरिया खते वापरा.');
    }
  } else {
    soilHealthScore += 5;
    riskFactors.push('नायट्रोजन स्तर खूप कमी आहे.');
  }
  
  if (p >= 10 && p <= 20) {
    soilHealthScore += 25;
  } else if (p >= 5 && p <= 30) {
    soilHealthScore += 15;
    if (p < 10) {
      fertilizerRecommendations.push('फॉस्फरस कमी आहे. DAP खते वापरा.');
    }
  } else {
    soilHealthScore += 5;
    riskFactors.push('फॉस्फरस स्तर खूप कमी आहे.');
  }
  
  if (k >= 100 && k <= 200) {
    soilHealthScore += 25;
  } else if (k >= 50 && k <= 300) {
    soilHealthScore += 15;
    if (k < 100) {
      fertilizerRecommendations.push('पोटॅशियम कमी आहे. MOP खते वापरा.');
    }
  } else {
    soilHealthScore += 5;
    riskFactors.push('पोटॅशियम स्तर खूप कमी आहे.');
  }
  
  // Try AI crop recommendations first, then fallback to mock
  let cropRecommendations = await getAICropRecommendations(soilData);
  if (!cropRecommendations || cropRecommendations.length === 0) {
    cropRecommendations = getMockCropRecommendations(soilData);
  }
  
  return {
    soilHealthScore: Math.min(100, soilHealthScore),
    soilType,
    cropRecommendations,
    improvementTips,
    fertilizerRecommendations,
    riskFactors
  };
};

// Mock NDVI data with AI enhancement
const getNDVIData = async (location) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `
    Based on the location "${location}", provide realistic NDVI (Normalized Difference Vegetation Index) data.
    NDVI ranges from -1 to 1, where:
    - 0.6-1.0: Dense vegetation (excellent)
    - 0.3-0.6: Moderate vegetation (good)
    - 0.1-0.3: Sparse vegetation (poor)
    - 0.0-0.1: Very sparse vegetation (very poor)
    
    Respond in JSON format:
    {
      "current": 0.65,
      "average": 0.58,
      "status": "चांगले",
      "trend": "वाढत आहे",
      "recommendations": ["specific recommendation"]
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback data
      return {
        current: (Math.random() * 0.3 + 0.4).toFixed(2),
        average: (Math.random() * 0.2 + 0.5).toFixed(2),
        status: Math.random() > 0.5 ? 'चांगले' : 'सुधारणे आवश्यक',
        trend: Math.random() > 0.5 ? 'वाढत आहे' : 'कमी होत आहे',
        recommendations: ['नियमित पाणी द्या', 'खते वापरा']
      };
    }
  } catch (error) {
    console.error('NDVI AI error:', error);
    return {
      current: (Math.random() * 0.3 + 0.4).toFixed(2),
      average: (Math.random() * 0.2 + 0.5).toFixed(2),
      status: Math.random() > 0.5 ? 'चांगले' : 'सुधारणे आवश्यक',
      trend: 'स्थिर',
      recommendations: ['नियमित तपासणी करा']
    };
  }
};

// Calculate crop suitability with location-based filtering
const calculateCropSuitability = (soilData) => {
  const crops = { ...cropDatabase };
  
  // Location-based crop preferences (Maharashtra and surrounding regions)
  const locationPreferences = {
    'pune': ['sugarcane', 'grapes', 'pomegranate', 'tomato', 'onion', 'cotton', 'soybean'],
    'nashik': ['grapes', 'onion', 'tomato', 'pomegranate', 'sugarcane', 'cotton'],
    'nagpur': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane', 'chilli'],
    'aurangabad': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'kolhapur': ['sugarcane', 'grapes', 'pomegranate', 'banana', 'coconut'],
    'amravati': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'solapur': ['cotton', 'sugarcane', 'grapes', 'pomegranate', 'onion'],
    'sangli': ['grapes', 'sugarcane', 'pomegranate', 'banana', 'coconut'],
    'latur': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'beed': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'ahmednagar': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'satara': ['grapes', 'sugarcane', 'pomegranate', 'banana', 'coconut'],
    'ratnagiri': ['mango', 'coconut', 'cashew', 'banana', 'papaya'],
    'sindhudurg': ['mango', 'coconut', 'cashew', 'banana', 'papaya'],
    'gadchiroli': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'chandrapur': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'wardha': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'yavatmal': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'buldhana': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'akola': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'washim': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'hingoli': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'nanded': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'parbhani': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'jalna': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'dhule': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'nandurbar': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'jalgaon': ['cotton', 'sugarcane', 'onion', 'tomato', 'grapes'],
    'bhandara': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'gondia': ['cotton', 'soybean', 'orange', 'banana', 'sugarcane'],
    'thane': ['mango', 'coconut', 'cashew', 'banana', 'papaya'],
    'mumbai': ['mango', 'coconut', 'cashew', 'banana', 'papaya'],
    'raigad': ['mango', 'coconut', 'cashew', 'banana', 'papaya'],
    'palghar': ['mango', 'coconut', 'cashew', 'banana', 'papaya']
  };
  
  Object.keys(crops).forEach(cropKey => {
    const crop = crops[cropKey];
    let suitability = 0;
    
    // pH suitability
    const ph = parseFloat(soilData.ph);
    if (ph >= crop.minPh && ph <= crop.maxPh) {
      suitability += 25;
    } else if (ph >= crop.minPh - 0.5 && ph <= crop.maxPh + 0.5) {
      suitability += 15;
    } else {
      suitability += 5;
    }
    
    // Nitrogen suitability
    const n = parseFloat(soilData.nitrogen);
    if (n >= crop.minN && n <= crop.maxN) {
      suitability += 25;
    } else if (n >= crop.minN * 0.7 && n <= crop.maxN * 1.3) {
      suitability += 15;
    } else {
      suitability += 5;
    }
    
    // Phosphorus suitability
    const p = parseFloat(soilData.phosphorus);
    if (p >= crop.minP && p <= crop.maxP) {
      suitability += 25;
    } else if (p >= crop.minP * 0.7 && p <= crop.maxP * 1.3) {
      suitability += 15;
    } else {
      suitability += 5;
    }
    
    // Potassium suitability
    const k = parseFloat(soilData.potassium);
    if (k >= crop.minK && k <= crop.maxK) {
      suitability += 25;
    } else if (k >= crop.minK * 0.7 && k <= crop.maxK * 1.3) {
      suitability += 15;
    } else {
      suitability += 5;
    }
    
    // Location-based bonus (if location is provided)
    if (soilData.location) {
      const location = soilData.location.toLowerCase();
      for (const [city, preferredCrops] of Object.entries(locationPreferences)) {
        if (location.includes(city)) {
          if (preferredCrops.includes(cropKey)) {
            suitability += 10; // Bonus for location-appropriate crops
          }
          break;
        }
      }
    }
    
    crop.suitability = Math.min(100, suitability);
  });
  
  return Object.entries(crops)
    .map(([key, crop]) => ({ key, ...crop }))
    .sort((a, b) => b.suitability - a.suitability)
    .slice(0, 10); // Return top 10 crops instead of 5
};

// AI-powered crop recommendations with location analysis
const getAICropRecommendations = async (soilData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Get location analysis first
    let locationAnalysis = null;
    if (soilData.location) {
      locationAnalysis = await getAILocationAnalysis(soilData.location);
      if (!locationAnalysis) {
        locationAnalysis = getMockLocationAnalysis(soilData.location);
      }
    }
    
    const prompt = `
    Based on the following soil data and location analysis, recommend the top 10 most suitable crops for Indian agriculture, specifically for Maharashtra and surrounding regions:

    Soil Parameters:
    - pH: ${soilData.ph} (optimal range: 6.0-7.5)
    - Nitrogen (N): ${soilData.nitrogen} kg/ha (optimal: 140-200)
    - Phosphorus (P): ${soilData.phosphorus} kg/ha (optimal: 10-20)
    - Potassium (K): ${soilData.potassium} kg/ha (optimal: 100-200)
    - Organic Matter: ${soilData.organicMatter || 'Not provided'}% (optimal: 2.0-5.0)
    - Location: ${soilData.location || 'Not provided'}

    ${locationAnalysis ? `
    Location Analysis:
    - Region: ${locationAnalysis.region}
    - Climate: ${locationAnalysis.climate}
    - Soil Type: ${locationAnalysis.soilType}
    - Market Advantages: ${locationAnalysis.marketAdvantages?.join(', ')}
    - Challenges: ${locationAnalysis.challenges?.join(', ')}
    - Recommendations: ${locationAnalysis.recommendations?.join(', ')}
    ` : ''}

    Available crop categories:
    1. Cereals: Rice (भात), Wheat (गहू), Jowar (ज्वारी), Bajra (बाजरी), Maize (मका), Ragi (नाचणी)
    2. Pulses: Toor (तूर), Moong (मूग), Urad (उडीद), Chana (हरभरा), Masoor (मसूर), Matki (मटकी)
    3. Oilseeds: Groundnut (शेंगदाणे), Soybean (सोयाबीन), Sunflower (सूर्यफूल), Sesame (तीळ), Castor (एरंड)
    4. Cash Crops: Cotton (कापूस), Sugarcane (ऊस), Tobacco (तंबाखू)
    5. Vegetables: Tomato (टोमॅटो), Onion (कांदा), Potato (बटाटा), Brinjal (वांगे), Cucumber (काकडी), Cauliflower (फुलकोबी), Cabbage (कोबी), Carrot (गाजर), Radish (मुळा), Spinach (पालक)
    6. Fruits: Mango (आंबा), Banana (केळे), Orange (संत्रे), Papaya (पपई), Guava (पेरू), Pomegranate (डाळिंब), Grapes (द्राक्षे), Coconut (नारळ), Cashew (काजू)
    7. Spices: Chilli (मिरची), Turmeric (हळद), Ginger (आले), Coriander (कोथिंबीर), Cumin (जिरे)
    8. Medicinal: Tulsi (तुळस), Neem (कडुनिंब), Aloe (कोरफड)

    Consider:
    - Soil pH compatibility with crop requirements
    - NPK levels and crop nutrient needs
    - Location-specific suitability (climate, soil type, market access)
    - Market demand and profitability potential
    - Seasonal timing (खरीप, रब्बी, वर्षभर)
    - Traditional farming practices in the region
    - Infrastructure and processing facilities available
    - Economic factors (labor, input costs, market prices)

    Respond in JSON format with exactly 10 crops:
    {
      "cropRecommendations": [
        {
          "name": "crop_name_in_marathi",
          "suitability": 85,
          "season": "खरीप/रब्बी/वर्षभर",
          "reason": "detailed reason for recommendation in Marathi",
          "category": "cereal/pulse/oilseed/cash_crop/vegetable/fruit/spice/medicinal",
          "marketPotential": "high/medium/low",
          "investmentRequired": "high/medium/low"
        }
      ]
    }

    Focus on practical, profitable crops that are well-suited for the specific soil conditions and location. Provide realistic suitability scores (60-95 range) and consider both traditional and modern farming opportunities.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiResponse = JSON.parse(jsonMatch[0]);
      return aiResponse.cropRecommendations || [];
    } else {
      console.log('AI response format not recognized, using fallback');
      return null;
    }
  } catch (error) {
    console.error('AI crop recommendation error:', error);
    return null;
  }
};

// Mock crop recommendations with location analysis
const getMockCropRecommendations = (soilData) => {
  const ph = parseFloat(soilData.ph);
  const n = parseFloat(soilData.nitrogen);
  const p = parseFloat(soilData.phosphorus);
  const k = parseFloat(soilData.potassium);
  
  // Get location analysis
  let locationAnalysis = null;
  if (soilData.location) {
    locationAnalysis = getMockLocationAnalysis(soilData.location);
  }
  
  // Mock recommendations based on soil conditions and location
  let recommendations = [];
  
  // Add location-specific crops first (higher priority)
  if (locationAnalysis && locationAnalysis.preferredCrops) {
    locationAnalysis.preferredCrops.forEach(crop => {
      let suitability = 80 + (crop.priority * 2); // Base 80 + priority bonus
      
      // Adjust based on soil conditions
      if (ph >= 6.0 && ph <= 7.5) suitability += 5;
      if (n >= 140 && n <= 200) suitability += 3;
      if (p >= 10 && p <= 20) suitability += 3;
      if (k >= 100 && k <= 200) suitability += 3;
      
      recommendations.push({
        name: crop.marathiName,
        suitability: Math.min(95, suitability),
        season: crop.season,
        reason: crop.reason,
        category: crop.category,
        marketPotential: crop.priority <= 3 ? 'high' : crop.priority <= 5 ? 'medium' : 'low',
        investmentRequired: crop.category === 'cash_crop' || crop.category === 'fruit' ? 'high' : 'medium'
      });
    });
  }
  
  // Add soil condition-based crops
  if (ph >= 6.0 && ph <= 7.5) {
    if (n >= 140 && n <= 200) {
      recommendations.push(
        { name: 'भात', suitability: 88, season: 'खरीप', reason: 'pH आणि नायट्रोजन स्तर उत्कृष्ट आहेत', category: 'cereal', marketPotential: 'medium', investmentRequired: 'medium' },
        { name: 'गहू', suitability: 85, season: 'रब्बी', reason: 'माती गहू पिकासाठी योग्य आहे', category: 'cereal', marketPotential: 'medium', investmentRequired: 'medium' }
      );
    }
    if (p >= 10 && p <= 20) {
      recommendations.push(
        { name: 'टोमॅटो', suitability: 82, season: 'वर्षभर', reason: 'फॉस्फरस स्तर चांगला आहे', category: 'vegetable', marketPotential: 'high', investmentRequired: 'medium' },
        { name: 'कांदा', suitability: 80, season: 'रब्बी', reason: 'माती कांदा पिकासाठी योग्य आहे', category: 'vegetable', marketPotential: 'high', investmentRequired: 'medium' }
      );
    }
  }
  
  if (k >= 100 && k <= 200) {
    recommendations.push(
      { name: 'ऊस', suitability: 85, season: 'वर्षभर', reason: 'पोटॅशियम स्तर उत्कृष्ट आहे', category: 'cash_crop', marketPotential: 'medium', investmentRequired: 'high' },
      { name: 'केळे', suitability: 83, season: 'वर्षभर', reason: 'केळे पिकासाठी योग्य माती', category: 'fruit', marketPotential: 'high', investmentRequired: 'high' }
    );
  }
  
  // Add some default recommendations if not enough
  if (recommendations.length < 10) {
    const defaults = [
      { name: 'मका', suitability: 75, season: 'खरीप/रब्बी', reason: 'सर्वसाधारण मातीसाठी योग्य', category: 'cereal', marketPotential: 'medium', investmentRequired: 'low' },
      { name: 'मूग', suitability: 72, season: 'खरीप/रब्बी', reason: 'डाळी पिकासाठी योग्य', category: 'pulse', marketPotential: 'medium', investmentRequired: 'low' },
      { name: 'सोयाबीन', suitability: 70, season: 'खरीप', reason: 'तेलबिया पिकासाठी योग्य', category: 'oilseed', marketPotential: 'high', investmentRequired: 'medium' },
      { name: 'मिरची', suitability: 68, season: 'खरीप', reason: 'मसाला पिकासाठी योग्य', category: 'spice', marketPotential: 'high', investmentRequired: 'medium' },
      { name: 'तुळस', suitability: 65, season: 'वर्षभर', reason: 'औषधी वनस्पतीसाठी योग्य', category: 'medicinal', marketPotential: 'medium', investmentRequired: 'low' }
    ];
    
    recommendations = recommendations.concat(defaults);
  }
  
  // Sort by suitability and return top 10
  return recommendations
    .sort((a, b) => b.suitability - a.suitability)
    .slice(0, 10);
};

// Generate comprehensive land health report
const generateReport = async (req, res) => {
  try {
    const { ph, nitrogen, phosphorus, potassium, organicMatter, location, ndvi } = req.body;
    
    if (!ph || !nitrogen || !phosphorus || !potassium) {
      return res.status(400).json({ error: 'सर्व माती पॅरामीटर्स आवश्यक आहेत' });
    }

    const soilData = { ph, nitrogen, phosphorus, potassium, organicMatter, location };
    
    // Get AI crop recommendations with fallback
    let cropRecommendations = await getAICropRecommendations(soilData);
    if (!cropRecommendations) {
      cropRecommendations = getMockCropRecommendations(soilData);
    }
    
    // Get location analysis
    let locationAnalysis = null;
    if (location) {
      locationAnalysis = await getAILocationAnalysis(location);
      if (!locationAnalysis) {
        locationAnalysis = getMockLocationAnalysis(location);
      }
    }
    
    // Generate soil health analysis (AI-based with fallback)
    let soilAnalysis = await analyzeSoilWithAI(soilData);
    if (!soilAnalysis) {
      soilAnalysis = analyzeSoilHealth(soilData);
    }
    
    // Create comprehensive report
    const report = {
      title: 'माती आरोग्य आणि पीक योजना अहवाल',
      date: new Date().toLocaleDateString('mr-IN'),
      location: location || 'निर्दिष्ट नाही',
      
      // Location Analysis Section
      locationAnalysis: locationAnalysis ? {
        region: locationAnalysis.region,
        climate: locationAnalysis.climate,
        soilType: locationAnalysis.soilType,
        marketAdvantages: locationAnalysis.marketAdvantages || [],
        challenges: locationAnalysis.challenges || [],
        recommendations: locationAnalysis.recommendations || []
      } : null,
      
      // Soil Analysis Section
      soilAnalysis: {
        ph: {
          value: ph,
          status: soilAnalysis.phStatus || soilAnalysis.soilType || '',
          recommendation: soilAnalysis.phRecommendation || (soilAnalysis.improvementTips ? soilAnalysis.improvementTips[0] : '')
        },
        nitrogen: {
          value: nitrogen,
          status: soilAnalysis.nitrogenStatus || '',
          recommendation: soilAnalysis.nitrogenRecommendation || (soilAnalysis.fertilizerRecommendations ? soilAnalysis.fertilizerRecommendations[0] : '')
        },
        phosphorus: {
          value: phosphorus,
          status: soilAnalysis.phosphorusStatus || '',
          recommendation: soilAnalysis.phosphorusRecommendation || ''
        },
        potassium: {
          value: potassium,
          status: soilAnalysis.potassiumStatus || '',
          recommendation: soilAnalysis.potassiumRecommendation || ''
        },
        organicMatter: organicMatter ? {
          value: organicMatter,
          status: soilAnalysis.organicMatterStatus || '',
          recommendation: soilAnalysis.organicMatterRecommendation || ''
        } : null,
        overallHealth: soilAnalysis.overallHealth || '',
        overallScore: soilAnalysis.overallScore || soilAnalysis.soilHealthScore || 0,
        improvementTips: soilAnalysis.improvementTips || [],
        fertilizerRecommendations: soilAnalysis.fertilizerRecommendations || [],
        riskFactors: soilAnalysis.riskFactors || []
      },
      
      // Crop Recommendations Section
      cropRecommendations: cropRecommendations.map((crop, index) => ({
        rank: index + 1,
        name: crop.name,
        suitability: crop.suitability,
        season: crop.season,
        reason: crop.reason,
        category: crop.category,
        marketPotential: crop.marketPotential || 'medium',
        investmentRequired: crop.investmentRequired || 'medium'
      })),
      
      // Additional Recommendations
      additionalRecommendations: [
        'माती चाचणी वर्षातून दोनदा करा',
        'जैविक खते वापरा',
        'पाणी संधारण करा',
        'पीक फेरफार करा',
        'समाकालिक पीक लावा'
      ],
      ndvi: Array.isArray(ndvi) ? ndvi : undefined // Add NDVI to report if provided
    };

    // Generate report text for download
    const reportText = generateReportText(report);
    
    res.json({
      success: true,
      report,
      reportText
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ error: 'अहवाल तयार करताना त्रुटी आली' });
  }
};

const downloadPDF = async (req, res) => {
  try {
    const report = req.body;
    const fontPath = path.join(__dirname, '../utils/fonts/NotoSerifDevanagari-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      console.error('Marathi font file not found at:', fontPath);
      return res.status(500).json({ error: 'Marathi font file missing on server.' });
    }
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=land-health-report.pdf');
    res.noCompression = true; // Disable compression for PDF

    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
    });

    doc.pipe(res);

    doc.registerFont('marathi', fontPath);
    doc.font('marathi');

    // Helper function to detect Devanagari script
    function isDevanagari(text) {
      return /[\u0900-\u097F]/.test(text);
    }

    // Example content (replace with your report logic)
    doc.font('marathi').fontSize(22).text('स्मार्ट कृषी साथीदार अहवाल', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(12).text('----------------------------------------------', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('marathi').fontSize(12).text('दिनांक: ', { continued: true });
    if (isDevanagari(report.date || '')) {
      doc.font('marathi').text(`${report.date || ''}    `, { continued: true });
    } else {
      doc.font('Helvetica').text(`${report.date || ''}    `, { continued: true });
    }
    doc.font('marathi').text('स्थान: ', { continued: true });
    if (isDevanagari(report.location || '')) {
      doc.font('marathi').text(`${report.location || ''}`, { align: 'center' });
    } else {
      doc.font('Helvetica').text(`${report.location || ''}`, { align: 'center' });
    }
    doc.moveDown(1);

    // NDVI Summary Section
    if (report.ndvi && Array.isArray(report.ndvi) && report.ndvi.length > 0) {
      doc.font('marathi').fontSize(16).text('NDVI उपग्रह निरीक्षण', { underline: true });
      doc.moveDown(0.5);
      const last3 = report.ndvi.slice(-3);
      last3.forEach(ndviPoint => {
        const dateStr = new Date(ndviPoint.date).toLocaleDateString('mr-IN');
        doc.font('marathi').fontSize(12).text('• दिनांक: ', { continued: true });
        doc.font('Helvetica').text(`${dateStr}   NDVI: ${ndviPoint.ndvi}`);
      });
      const avg = (report.ndvi.reduce((sum, p) => sum + (p.ndvi || 0), 0) / report.ndvi.length).toFixed(2);
      doc.font('marathi').fontSize(12).text('सरासरी NDVI (३० दिवस): ', { continued: true });
      doc.font('Helvetica').text(`${avg}`);
      doc.moveDown(1);
    }

    // Location Analysis
    if (report.locationAnalysis) {
      doc.font('marathi').fontSize(16).text('स्थान विश्लेषण', { underline: true });
      doc.moveDown(0.5);
      doc.font('marathi').fontSize(12).text('• प्रदेश: ', { continued: true });
      if (isDevanagari(report.locationAnalysis.region || '')) {
        doc.font('marathi').text(`${report.locationAnalysis.region || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.locationAnalysis.region || ''}`);
      }
      doc.font('marathi').text('• हवामान: ', { continued: true });
      if (isDevanagari(report.locationAnalysis.climate || '')) {
        doc.font('marathi').text(`${report.locationAnalysis.climate || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.locationAnalysis.climate || ''}`);
      }
      doc.font('marathi').text('• माती प्रकार: ', { continued: true });
      if (isDevanagari(report.locationAnalysis.soilType || '')) {
        doc.font('marathi').text(`${report.locationAnalysis.soilType || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.locationAnalysis.soilType || ''}`);
      }
      doc.moveDown(0.5);
      if (report.locationAnalysis.marketAdvantages && report.locationAnalysis.marketAdvantages.length > 0) {
        doc.font('marathi').text('बाजार फायदे:');
        report.locationAnalysis.marketAdvantages.forEach(adv => {
          if (isDevanagari(adv)) {
            doc.font('marathi').text(`   - ${adv}`);
          } else {
            doc.font('Helvetica').text(`   - ${adv}`);
          }
        });
      }
      if (report.locationAnalysis.challenges && report.locationAnalysis.challenges.length > 0) {
        doc.font('marathi').text('आव्हाने:');
        report.locationAnalysis.challenges.forEach(ch => {
          if (isDevanagari(ch)) {
            doc.font('marathi').text(`   - ${ch}`);
          } else {
            doc.font('Helvetica').text(`   - ${ch}`);
          }
        });
      }
      if (report.locationAnalysis.recommendations && report.locationAnalysis.recommendations.length > 0) {
        doc.font('marathi').text('स्थान-विशिष्ट सूचना:');
        report.locationAnalysis.recommendations.forEach(rec => {
          if (isDevanagari(rec)) {
            doc.font('marathi').text(`   - ${rec}`);
          } else {
            doc.font('Helvetica').text(`   - ${rec}`);
          }
        });
      }
      doc.moveDown(1);
    }

    // Soil Analysis
    if (report.soilAnalysis) {
      doc.font('marathi').fontSize(16).text('माती आरोग्य विश्लेषण', { underline: true });
      doc.moveDown(0.5);
      doc.font('marathi').fontSize(12).text('• एकूण आरोग्य स्कोअर: ', { continued: true });
      doc.font('Helvetica').text(`${report.soilAnalysis.overallScore || ''}/100`);
      doc.font('marathi').text('• एकूण आरोग्य स्थिती: ', { continued: true });
      if (isDevanagari(report.soilAnalysis.overallHealth || '')) {
        doc.font('marathi').text(`${report.soilAnalysis.overallHealth || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.soilAnalysis.overallHealth || ''}`);
      }
      doc.moveDown(0.5);
      doc.font('marathi').text('• pH मूल्य: ', { continued: true });
      doc.font('Helvetica').text(`${report.soilAnalysis.ph?.value || ''} (${report.soilAnalysis.ph?.status || ''})`);
      doc.font('marathi').text('   → सूचना: ', { continued: true });
      if (isDevanagari(report.soilAnalysis.ph?.recommendation || '')) {
        doc.font('marathi').text(`${report.soilAnalysis.ph?.recommendation || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.soilAnalysis.ph?.recommendation || ''}`);
      }
      doc.font('marathi').text('• नायट्रोजन: ', { continued: true });
      doc.font('Helvetica').text(`${report.soilAnalysis.nitrogen?.value || ''} kg/ha (${report.soilAnalysis.nitrogen?.status || ''})`);
      doc.font('marathi').text('   → सूचना: ', { continued: true });
      if (isDevanagari(report.soilAnalysis.nitrogen?.recommendation || '')) {
        doc.font('marathi').text(`${report.soilAnalysis.nitrogen?.recommendation || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.soilAnalysis.nitrogen?.recommendation || ''}`);
      }
      doc.font('marathi').text('• फॉस्फरस: ', { continued: true });
      doc.font('Helvetica').text(`${report.soilAnalysis.phosphorus?.value || ''} kg/ha (${report.soilAnalysis.phosphorus?.status || ''})`);
      doc.font('marathi').text('   → सूचना: ', { continued: true });
      if (isDevanagari(report.soilAnalysis.phosphorus?.recommendation || '')) {
        doc.font('marathi').text(`${report.soilAnalysis.phosphorus?.recommendation || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.soilAnalysis.phosphorus?.recommendation || ''}`);
      }
      doc.font('marathi').text('• पोटॅशियम: ', { continued: true });
      doc.font('Helvetica').text(`${report.soilAnalysis.potassium?.value || ''} kg/ha (${report.soilAnalysis.potassium?.status || ''})`);
      doc.font('marathi').text('   → सूचना: ', { continued: true });
      if (isDevanagari(report.soilAnalysis.potassium?.recommendation || '')) {
        doc.font('marathi').text(`${report.soilAnalysis.potassium?.recommendation || ''}`);
      } else {
        doc.font('Helvetica').text(`${report.soilAnalysis.potassium?.recommendation || ''}`);
      }
      if (report.soilAnalysis.organicMatter) {
        doc.font('marathi').text('• जैविक पदार्थ: ', { continued: true });
        doc.font('Helvetica').text(`${report.soilAnalysis.organicMatter.value || ''}% (${report.soilAnalysis.organicMatter.status || ''})`);
        doc.font('marathi').text('   → सूचना: ', { continued: true });
        if (isDevanagari(report.soilAnalysis.organicMatter.recommendation || '')) {
          doc.font('marathi').text(`${report.soilAnalysis.organicMatter.recommendation || ''}`);
        } else {
          doc.font('Helvetica').text(`${report.soilAnalysis.organicMatter.recommendation || ''}`);
        }
      }
      doc.moveDown(1);
    }

    // Crop Recommendations
    if (report.cropRecommendations && report.cropRecommendations.length > 0) {
      doc.font('marathi').fontSize(16).text('पीक शिफारसी (क्रमानुसार)', { underline: true });
      doc.moveDown(0.5);
      report.cropRecommendations.forEach((crop, index) => {
        doc.font('Helvetica').fontSize(13).text(`${index + 1}. ${crop.name}`, { continued: true });
        doc.font('marathi').fontSize(12).text('   • योग्यता: ', { continued: true });
        doc.font('Helvetica').text(`${crop.suitability}%`, { continued: true });
        doc.font('marathi').text('   • हंगाम: ', { continued: true });
        if (isDevanagari(crop.season || '')) {
          doc.font('marathi').text(`${crop.season}`, { continued: true });
        } else {
          doc.font('Helvetica').text(`${crop.season}`, { continued: true });
        }
        doc.font('marathi').text('   • श्रेणी: ', { continued: true });
        if (isDevanagari(crop.category || '')) {
          doc.font('marathi').text(`${crop.category}`);
        } else {
          doc.font('Helvetica').text(`${crop.category}`);
        }
        doc.font('marathi').text('   • बाजार संधी: ', { continued: true });
        if (isDevanagari(crop.marketPotential || '')) {
          doc.font('marathi').text(`${crop.marketPotential}`, { continued: true });
        } else {
          doc.font('Helvetica').text(`${crop.marketPotential}`, { continued: true });
        }
        doc.font('marathi').text('   • गुंतवणूक: ', { continued: true });
        if (isDevanagari(crop.investmentRequired || '')) {
          doc.font('marathi').text(`${crop.investmentRequired}`);
        } else {
          doc.font('Helvetica').text(`${crop.investmentRequired}`);
        }
        doc.font('marathi').text('   • कारण: ', { continued: true });
        if (isDevanagari(crop.reason || '')) {
          doc.font('marathi').text(`${crop.reason}`);
        } else {
          doc.font('Helvetica').text(`${crop.reason}`);
        }
        doc.moveDown(0.5);
      });
      doc.moveDown(1);
    }

    // Additional Recommendations
    if (report.additionalRecommendations && report.additionalRecommendations.length > 0) {
      doc.font('marathi').fontSize(16).text('अतिरिक्त सूचना', { underline: true });
      doc.moveDown(0.5);
      report.additionalRecommendations.forEach(rec => {
        doc.font('marathi').fontSize(12).text('• ', { continued: true });
        if (isDevanagari(rec)) {
          doc.font('marathi').text(`${rec}`);
        } else {
          doc.font('Helvetica').text(`${rec}`);
        }
      });
      doc.moveDown(1);
    }

    // Footer
    doc.font('Helvetica').fontSize(12).text('----------------------------------------------', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('marathi').fontSize(12).text('हा अहवाल Smart Krushi Companion द्वारे तयार केला आहे', { align: 'center' });
    doc.moveDown(1);
    doc.font('Helvetica').fontSize(12).text('अधिक माहितीसाठी तज्ज्ञांचा सल्ला घ्या', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Report generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
};

// AI-powered location analysis for crop preferences
const getAILocationAnalysis = async (location) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `
"${location}" या ठिकाणाचे विश्लेषण करा आणि महाराष्ट्र व आजूबाजूच्या भागांसाठी स्थान-विशिष्ट पीक प्राधान्यक्रम सांगा.

खालील सर्व माहिती फक्त शुद्ध मराठीत द्या. इंग्रजी शब्द किंवा वाक्य अजिबात वापरू नका. उत्तर इंग्रजीत आले, तर ते चुकीचे समजा.

उदाहरण:
{
  "region": "पश्चिम महाराष्ट्र",
  "climate": "उष्ण आणि कोरडे हवामान",
  "soilType": "काळी माती",
  "marketAdvantages": [
    "मुंबई आणि पुणे बाजारपेठ जवळ",
    "कृषी प्रक्रिया उद्योग"
  ],
  "challenges": [
    "अनियमित पाऊस",
    "पाण्याची टंचाई"
  ],
  "recommendations": [
    "पाणीसाठवण आणि सिंचन तंत्रज्ञान वापरा",
    "पीक विविधता वाढवा"
  ]
}

खालील JSON फॉरमॅटमध्ये (सर्व माहिती फक्त मराठीत द्या):
{
  "region": "प्रदेशाचे नाव",
  "climate": "हवामान वर्णन",
  "soilType": "माती प्रकार",
  "marketAdvantages": ["बाजारपेठ फायदे १", "बाजारपेठ फायदे २"],
  "challenges": ["आव्हान १", "आव्हान २"],
  "recommendations": ["ठिकाणासाठी विशिष्ट शिफारस"]
}

**सर्व JSON फील्ड आणि त्यातील सर्व माहिती शुद्ध मराठीतच द्या. इंग्रजी शब्द किंवा वाक्य अजिबात वापरू नका.**
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const aiResponse = JSON.parse(jsonMatch[0]);
      return aiResponse;
    } else {
      console.log('AI location analysis format not recognized, using fallback');
      return null;
    }
  } catch (error) {
    console.error('AI location analysis error:', error);
    return null;
  }
};

// Mock location analysis for fallback
const getMockLocationAnalysis = (location) => {
  const locationLower = location.toLowerCase();
  
  // Mock analysis based on location patterns
  if (locationLower.includes('pune') || locationLower.includes('nashik')) {
    return {
      region: 'Western Maharashtra',
      climate: 'Semi-arid with moderate rainfall',
      soilType: 'Black soil and red soil',
      preferredCrops: [
        { crop: 'grapes', marathiName: 'द्राक्षे', reason: 'पुणे/नाशिक प्रदेशासाठी योग्य, उच्च बाजार मूल्य', season: 'वर्षभर', category: 'fruit', priority: 1 },
        { crop: 'pomegranate', marathiName: 'डाळिंब', reason: 'योग्य हवामान आणि माती, निर्यातीची संधी', season: 'वर्षभर', category: 'fruit', priority: 2 },
        { crop: 'sugarcane', marathiName: 'ऊस', reason: 'सरकारी समर्थन आणि प्रक्रिया युनिट्स', season: 'वर्षभर', category: 'cash_crop', priority: 3 },
        { crop: 'tomato', marathiName: 'टोमॅटो', reason: 'वर्षभर पीक, स्थिर मागणी', season: 'वर्षभर', category: 'vegetable', priority: 4 },
        { crop: 'onion', marathiName: 'कांदा', reason: 'महाराष्ट्रातील प्रमुख पीक', season: 'रब्बी', category: 'vegetable', priority: 5 }
      ],
      marketAdvantages: ['मुंबई बाजाराचे जवळ', 'निर्यातीच्या सुविधा', 'प्रक्रिया युनिट्स'],
      challenges: ['पाण्याची कमतरता', 'जमीन मूल्य वाढ'],
      recommendations: ['ड्रिप सिंचन वापरा', 'उच्च मूल्य पिके लावा']
    };
  } else if (locationLower.includes('nagpur') || locationLower.includes('amravati') || locationLower.includes('akola') || locationLower.includes('wardha')) {
    return {
      region: 'Vidarbha',
      climate: 'Tropical with moderate rainfall',
      soilType: 'Black cotton soil',
      preferredCrops: [
        { crop: 'cotton', marathiName: 'कापूस', reason: 'विदर्भ प्रदेशासाठी योग्य, परंपरागत पीक', season: 'खरीप', category: 'cash_crop', priority: 1 },
        { crop: 'soybean', marathiName: 'सोयाबीन', reason: 'तेलबिया पिकासाठी योग्य माती', season: 'खरीप', category: 'oilseed', priority: 2 },
        { crop: 'orange', marathiName: 'संत्रे', reason: 'नागपूर संत्रे प्रसिद्ध आहे', season: 'वर्षभर', category: 'fruit', priority: 3 },
        { crop: 'banana', marathiName: 'केळे', reason: 'वर्षभर उत्पादन, स्थिर मागणी', season: 'वर्षभर', category: 'fruit', priority: 4 },
        { crop: 'sugarcane', marathiName: 'ऊस', reason: 'सरकारी समर्थन आणि प्रक्रिया युनिट्स', season: 'वर्षभर', category: 'cash_crop', priority: 5 }
      ],
      marketAdvantages: ['कापूस मंडी', 'संत्रे प्रक्रिया युनिट्स', 'रेल्वे संपर्क'],
      challenges: ['कापूस किडी समस्या', 'पाण्याची कमतरता'],
      recommendations: ['IPM पद्धत वापरा', 'जलसंधारण करा']
    };
  } else if (locationLower.includes('kolhapur') || locationLower.includes('sangli') || locationLower.includes('satara')) {
    return {
      region: 'Southern Maharashtra',
      climate: 'Tropical monsoon with good rainfall',
      soilType: 'Laterite soil',
      preferredCrops: [
        { crop: 'sugarcane', marathiName: 'ऊस', reason: 'कोल्हापूर ऊस प्रसिद्ध आहे', season: 'वर्षभर', category: 'cash_crop', priority: 1 },
        { crop: 'grapes', marathiName: 'द्राक्षे', reason: 'योग्य हवामान आणि माती', season: 'वर्षभर', category: 'fruit', priority: 2 },
        { crop: 'pomegranate', marathiName: 'डाळिंब', reason: 'निर्यातीच्या संधी', season: 'वर्षभर', category: 'fruit', priority: 3 },
        { crop: 'banana', marathiName: 'केळे', reason: 'वर्षभर उत्पादन', season: 'वर्षभर', category: 'fruit', priority: 4 },
        { crop: 'coconut', marathiName: 'नारळ', reason: 'कोकण प्रदेशासाठी योग्य', season: 'वर्षभर', category: 'fruit', priority: 5 }
      ],
      marketAdvantages: ['ऊस प्रक्रिया युनिट्स', 'निर्यातीच्या सुविधा', 'पाण्याची सोय'],
      challenges: ['ऊस मूल्य कमी', 'श्रम किंमत वाढ'],
      recommendations: ['विविधीकरण करा', 'प्रक्रिया युनिट्स वापरा']
    };
  } else if (locationLower.includes('ratnagiri') || locationLower.includes('sindhudurg') || locationLower.includes('thane') || locationLower.includes('mumbai') || locationLower.includes('raigad') || locationLower.includes('palghar')) {
    return {
      region: 'Konkan Coast',
      climate: 'Tropical coastal with high rainfall',
      soilType: 'Laterite soil and sandy loam',
      preferredCrops: [
        { crop: 'mango', marathiName: 'आंबा', reason: 'कोकण आंबा प्रसिद्ध आहे', season: 'वर्षभर', category: 'fruit', priority: 1 },
        { crop: 'coconut', marathiName: 'नारळ', reason: 'कोकण प्रदेशासाठी योग्य', season: 'वर्षभर', category: 'fruit', priority: 2 },
        { crop: 'cashew', marathiName: 'काजू', reason: 'निर्यातीच्या संधी', season: 'वर्षभर', category: 'fruit', priority: 3 },
        { crop: 'banana', marathiName: 'केळे', reason: 'वर्षभर उत्पादन', season: 'वर्षभर', category: 'fruit', priority: 4 },
        { crop: 'papaya', marathiName: 'पपई', reason: 'योग्य हवामान', season: 'वर्षभर', category: 'fruit', priority: 5 }
      ],
      marketAdvantages: ['मुंबई बाजार', 'निर्यातीच्या सुविधा', 'पर्यटन उद्योग'],
      challenges: ['मोठे पाऊस', 'जमीन क्षरण'],
      recommendations: ['टेरेस फार्मिंग करा', 'ऑर्गनिक पद्धत वापरा']
    };
  } else {
    // Default analysis for other locations
    return {
      region: 'Maharashtra',
      climate: 'Tropical with moderate rainfall',
      soilType: 'Mixed soil types',
      preferredCrops: [
        { crop: 'wheat', marathiName: 'गहू', reason: 'सर्वसाधारण मातीसाठी योग्य', season: 'रब्बी', category: 'cereal', priority: 1 },
        { crop: 'rice', marathiName: 'भात', reason: 'पाण्याच्या सोयीच्या भागात योग्य', season: 'खरीप', category: 'cereal', priority: 2 },
        { crop: 'tomato', marathiName: 'टोमॅटो', reason: 'वर्षभर पीक', season: 'वर्षभर', category: 'vegetable', priority: 3 },
        { crop: 'onion', marathiName: 'कांदा', reason: 'स्थिर मागणी', season: 'रब्बी', category: 'vegetable', priority: 4 },
        { crop: 'pulses', marathiName: 'डाळी', reason: 'पोषण आणि माती सुधारणा', season: 'खरीप/रब्बी', category: 'pulse', priority: 5 }
      ],
      marketAdvantages: ['स्थानिक बाजार', 'सरकारी समर्थन'],
      challenges: ['पाण्याची कमतरता', 'जमीन क्षरण'],
      recommendations: ['जलसंधारण करा', 'विविधीकरण करा']
    };
  }
};

// Generate report text for download
const generateReportText = (report) => {
  let text = '';
  
  // Header
  text += `${report.title}\n`;
  text += `Date: ${report.date}\n`;
  text += `Location: ${report.location}\n`;
  text += '='.repeat(50) + '\n\n';
  
  // Location Analysis Section
  if (report.locationAnalysis) {
    text += 'Location Analysis:\n';
    text += '-'.repeat(30) + '\n';
    text += `Region: ${report.locationAnalysis.region}\n`;
    text += `Climate: ${report.locationAnalysis.climate}\n`;
    text += `Soil Type: ${report.locationAnalysis.soilType}\n\n`;
    
    if (report.locationAnalysis.marketAdvantages.length > 0) {
      text += 'Market Advantages:\n';
      report.locationAnalysis.marketAdvantages.forEach(advantage => {
        text += `• ${advantage}\n`;
      });
      text += '\n';
    }
    
    if (report.locationAnalysis.challenges.length > 0) {
      text += 'Challenges:\n';
      report.locationAnalysis.challenges.forEach(challenge => {
        text += `• ${challenge}\n`;
      });
      text += '\n';
    }
    
    if (report.locationAnalysis.recommendations.length > 0) {
      text += 'Recommendations:\n';
      report.locationAnalysis.recommendations.forEach(rec => {
        text += `• ${rec}\n`;
      });
      text += '\n';
    }
  }
  
  // Soil Analysis Section
  text += 'Soil Health Analysis:\n';
  text += '-'.repeat(30) + '\n';
  text += `Overall Health Score: ${report.soilAnalysis.overallScore}/100\n`;
  text += `Overall Health: ${report.soilAnalysis.overallHealth}\n\n`;
  
  text += `pH Value: ${report.soilAnalysis.ph.value} (${report.soilAnalysis.ph.status})\n`;
  text += `Recommendation: ${report.soilAnalysis.ph.recommendation}\n\n`;
  
  text += `Nitrogen: ${report.soilAnalysis.nitrogen.value} kg/ha (${report.soilAnalysis.nitrogen.status})\n`;
  text += `Recommendation: ${report.soilAnalysis.nitrogen.recommendation}\n\n`;
  
  text += `Phosphorus: ${report.soilAnalysis.phosphorus.value} kg/ha (${report.soilAnalysis.phosphorus.status})\n`;
  text += `Recommendation: ${report.soilAnalysis.phosphorus.recommendation}\n\n`;
  
  text += `Potassium: ${report.soilAnalysis.potassium.value} kg/ha (${report.soilAnalysis.potassium.status})\n`;
  text += `Recommendation: ${report.soilAnalysis.potassium.recommendation}\n\n`;
  
  if (report.soilAnalysis.organicMatter) {
    text += `Organic Matter: ${report.soilAnalysis.organicMatter.value}% (${report.soilAnalysis.organicMatter.status})\n`;
    text += `Recommendation: ${report.soilAnalysis.organicMatter.recommendation}\n\n`;
  }
  
  // Crop Recommendations Section
  text += 'Crop Recommendations:\n';
  text += '-'.repeat(40) + '\n';
  
  report.cropRecommendations.forEach((crop, index) => {
    text += `${index + 1}. ${crop.name}\n`;
    text += `    Suitability: ${crop.suitability}%\n`;
    text += `    Season: ${crop.season}\n`;
    text += `    Category: ${crop.category}\n`;
    text += `    Market Potential: ${crop.marketPotential}\n`;
    text += `    Investment Required: ${crop.investmentRequired}\n`;
    text += `    Reason: ${crop.reason}\n\n`;
  });
  
  // Additional Recommendations
  text += 'Additional Recommendations:\n';
  text += '-'.repeat(25) + '\n';
  report.additionalRecommendations.forEach(rec => {
    text += `• ${rec}\n`;
  });
  
  text += '\n' + '='.repeat(50) + '\n';
  text += 'This report was generated by Smart Krushi Companion\n';
  text += 'For more information, consult an expert.\n';
  
  return text;
};

// Soil health analysis (simple rule-based)
function analyzeSoilHealth(soilData) {
  const ph = parseFloat(soilData.ph);
  const n = parseFloat(soilData.nitrogen);
  const p = parseFloat(soilData.phosphorus);
  const k = parseFloat(soilData.potassium);
  const organicMatter = soilData.organicMatter ? parseFloat(soilData.organicMatter) : null;

  // pH
  let phStatus = '', phRecommendation = '';
  if (ph >= 6.0 && ph <= 7.5) {
    phStatus = 'उत्कृष्ट';
    phRecommendation = 'pH योग्य आहे.';
  } else if (ph >= 5.5 && ph <= 8.0) {
    phStatus = 'सामान्य';
    phRecommendation = ph < 6.0 ? 'माती अम्लीय आहे. चुना वापरा.' : 'माती क्षारीय आहे. जिप्सम वापरा.';
  } else {
    phStatus = 'खराब';
    phRecommendation = 'pH स्तर सुधारण्यासाठी त्वरित उपाययोजना करा.';
  }

  // Nitrogen
  let nitrogenStatus = '', nitrogenRecommendation = '';
  if (n >= 140 && n <= 200) {
    nitrogenStatus = 'उत्कृष्ट';
    nitrogenRecommendation = 'नायट्रोजन योग्य आहे.';
  } else if (n >= 100 && n <= 250) {
    nitrogenStatus = 'सामान्य';
    nitrogenRecommendation = n < 140 ? 'नायट्रोजन कमी आहे. युरिया वापरा.' : 'नायट्रोजन जास्त आहे. प्रमाणात खते वापरा.';
  } else {
    nitrogenStatus = 'खराब';
    nitrogenRecommendation = 'नायट्रोजन स्तर सुधारण्यासाठी उपाययोजना करा.';
  }

  // Phosphorus
  let phosphorusStatus = '', phosphorusRecommendation = '';
  if (p >= 10 && p <= 20) {
    phosphorusStatus = 'उत्कृष्ट';
    phosphorusRecommendation = 'फॉस्फरस योग्य आहे.';
  } else if (p >= 5 && p <= 30) {
    phosphorusStatus = 'सामान्य';
    phosphorusRecommendation = p < 10 ? 'फॉस्फरस कमी आहे. DAP वापरा.' : 'फॉस्फरस जास्त आहे. प्रमाणात खते वापरा.';
  } else {
    phosphorusStatus = 'खराब';
    phosphorusRecommendation = 'फॉस्फरस स्तर सुधारण्यासाठी उपाययोजना करा.';
  }

  // Potassium
  let potassiumStatus = '', potassiumRecommendation = '';
  if (k >= 100 && k <= 200) {
    potassiumStatus = 'उत्कृष्ट';
    potassiumRecommendation = 'पोटॅशियम योग्य आहे.';
  } else if (k >= 50 && k <= 300) {
    potassiumStatus = 'सामान्य';
    potassiumRecommendation = k < 100 ? 'पोटॅशियम कमी आहे. MOP वापरा.' : 'पोटॅशियम जास्त आहे. प्रमाणात खते वापरा.';
  } else {
    potassiumStatus = 'खराब';
    potassiumRecommendation = 'पोटॅशियम स्तर सुधारण्यासाठी उपाययोजना करा.';
  }

  // Organic Matter
  let organicMatterStatus = '', organicMatterRecommendation = '';
  if (organicMatter !== null) {
    if (organicMatter >= 2.0 && organicMatter <= 5.0) {
      organicMatterStatus = 'उत्कृष्ट';
      organicMatterRecommendation = 'जैविक पदार्थ योग्य आहे.';
    } else if (organicMatter >= 1.0 && organicMatter < 2.0) {
      organicMatterStatus = 'सामान्य';
      organicMatterRecommendation = 'जैविक पदार्थ वाढवण्यासाठी कंपोस्ट वापरा.';
    } else {
      organicMatterStatus = 'खराब';
      organicMatterRecommendation = 'जैविक पदार्थ वाढवण्यासाठी कंपोस्ट/शेणखत वापरा.';
    }
  }

  // Overall health
  let score = 0;
  score += (ph >= 6.0 && ph <= 7.5) ? 25 : (ph >= 5.5 && ph <= 8.0) ? 15 : 5;
  score += (n >= 140 && n <= 200) ? 25 : (n >= 100 && n <= 250) ? 15 : 5;
  score += (p >= 10 && p <= 20) ? 25 : (p >= 5 && p <= 30) ? 15 : 5;
  score += (k >= 100 && k <= 200) ? 25 : (k >= 50 && k <= 300) ? 15 : 5;
  if (organicMatter !== null) {
    score += (organicMatter >= 2.0 && organicMatter <= 5.0) ? 10 : (organicMatter >= 1.0 && organicMatter < 2.0) ? 5 : 0;
  }
  let overallHealth = score >= 80 ? 'उत्कृष्ट' : score >= 60 ? 'चांगले' : 'सुधारणे आवश्यक';

  return {
    phStatus,
    phRecommendation,
    nitrogenStatus,
    nitrogenRecommendation,
    phosphorusStatus,
    phosphorusRecommendation,
    potassiumStatus,
    potassiumRecommendation,
    organicMatterStatus,
    organicMatterRecommendation,
    overallHealth,
    overallScore: Math.min(100, score)
  };
}

module.exports = {
  generateReport,
  downloadPDF
}; 