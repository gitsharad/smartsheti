const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function extractUserReply(text) {
  // Remove all <think>...</think> blocks (non-greedy)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // If nothing left, fallback to original
  return cleaned || text;
}

exports.askAI = async (req, res) => {
  const { message } = req.body;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    
    const prompt = `You are a helpful Marathi agricultural assistant for farmers. 
    Respond in Marathi language. Keep responses concise and practical.
    
    User question: ${message}`;
    console.log(prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();
    console.log(reply);
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: "AI service error", details: err.message });
  }
}; 