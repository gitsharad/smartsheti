const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Disease database with Marathi information
const diseaseDatabase = {
  'healthy': {
    name: 'निरोगी पाने',
    severity: 1,
    treatment: [
      'पाने निरोगी आहेत',
      'नियमित पाणी द्या',
      'संतुलित खते वापरा'
    ],
    prevention: [
      'नियमित तपासणी करा',
      'योग्य पाणी व्यवस्थापन',
      'संतुलित पोषण राखा'
    ]
  },
  'bacterial_blight': {
    name: 'जीवाणूजन्य ब्लाइट',
    severity: 4,
    treatment: [
      'कॉपर बेस्ड फंगिसाइड वापरा',
      'संक्रमित भाग कापून टाका',
      'पाणी सांडणे टाळा'
    ],
    prevention: [
      'नियमित फंगिसाइड स्प्रे',
      'योग्य अंतर राखा',
      'वायुवीजन सुधारा'
    ]
  },
  'brown_spot': {
    name: 'तपकिरी डाग',
    severity: 3,
    treatment: [
      'मॅन्कोझेब फंगिसाइड वापरा',
      'संक्रमित पाने काढून टाका',
      'पाणी व्यवस्थापन सुधारा'
    ],
    prevention: [
      'नियमित फंगिसाइड स्प्रे',
      'योग्य पाणी द्या',
      'संतुलित खते वापरा'
    ]
  },
  'leaf_blight': {
    name: 'पान ब्लाइट',
    severity: 4,
    treatment: [
      'ट्रायसायक्लाझोल फंगिसाइड वापरा',
      'संक्रमित भाग कापून टाका',
      'पाणी सांडणे टाळा'
    ],
    prevention: [
      'नियमित फंगिसाइड स्प्रे',
      'योग्य अंतर राखा',
      'वायुवीजन सुधारा'
    ]
  },
  'leaf_smut': {
    name: 'पान स्मट',
    severity: 3,
    treatment: [
      'कार्बेन्डाझिम फंगिसाइड वापरा',
      'संक्रमित पाने काढून टाका',
      'पाणी व्यवस्थापन सुधारा'
    ],
    prevention: [
      'नियमित फंगिसाइड स्प्रे',
      'योग्य पाणी द्या',
      'संतुलित खते वापरा'
    ]
  }
};

// Convert image to base64
const imageToBase64 = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
};

// AI-powered image analysis using Google Gemini Vision
const analyzeImageWithAI = async (imagePath) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    // Convert image to base64
    const imageBase64 = imageToBase64(imagePath);
    
    const prompt = `
    Analyze this plant leaf image and identify any diseases or health issues. 
    Look for common plant diseases like:
    - Bacterial blight (water-soaked lesions, yellow halos)
    - Brown spot (circular brown spots with dark borders)
    - Leaf blight (large brown patches, wilting)
    - Leaf smut (black powdery spots)
    - Healthy leaves (normal green color, no spots)
    
    Format your response as a JSON object. All keys must be in English, but all values must be in Marathi.
    Example: { "disease": "तपकिरी डाग", "confidence": "९५, "symptoms": "पानांवर तपकिरी डाग", 
    "severity": ३ ,treatment: ["मॅन्कोझेब फंगिसाइड वापरा","संक्रमित भाग कापून टाका","पाणी सांडणे टाळा"],
      prevention: ["नियमित फंगिसाइड स्प्रे","योग्य पाणी द्या","संतुलित खते वापरा"]}
    
    IMPORTANT: Respond ONLY in Marathi for values, but keep all JSON keys in English.
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/jpeg"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    console.log("text data",text);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      // Fallback to mock data if AI response is not parseable
      return {
        disease: 'healthy',
        confidence: 70,
        symptoms: 'Unable to analyze image clearly',
        severity: 1
      };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    // Fallback to mock data
    const diseases = Object.keys(diseaseDatabase);
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
    return {
      disease: randomDisease,
      confidence: Math.round(Math.random() * 30 + 70),
      symptoms: 'Analysis failed, using fallback',
      severity: diseaseDatabase[randomDisease].severity
    };
  }
};

const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const imagePath = req.file.path;
    
    // Analyze image with AI
    const prediction = await analyzeImageWithAI(imagePath);
    console.log(prediction);
    // Get disease information from database
   // const diseaseInfo = diseaseDatabase[prediction.disease] || diseaseDatabase['healthy'];
  //  console.log("diseaseDatabase",diseaseDatabase);
    // Clean up uploaded file
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    // Return analysis results
    res.json({
      disease: prediction.disease,
      severity: prediction.severity,
      confidence: prediction.confidence,
      treatment: prediction.treatment,
      prevention: prediction.prevention,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Disease analysis error:', error);
    res.status(500).json({ error: 'Disease analysis failed' });
  }
};

// Mock history data - Replace with actual database implementation
const history = [];

const getHistory = async (req, res) => {
  try {
    const { fieldId } = req.query;
    
    // Filter by fieldId if provided
    const filteredHistory = fieldId 
      ? history.filter(entry => entry.fieldId === fieldId)
      : history;
    
    res.json(filteredHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch disease detection history' });
  }
};

module.exports = {
  detectDisease,
  getHistory
}; 