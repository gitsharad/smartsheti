const intents = require('./intents.json');

function getChatbotReply(message, lastSensorData) {
  message = message.trim();
  for (const intent of intents) {
    if (intent.patterns.some(p => message.includes(p))) {
      if (intent.tag === 'moisture_advice') {
        if (lastSensorData && lastSensorData.moisture < 25) {
          return 'हो, जमिनीतील ओलावा कमी आहे.';
        } else {
          return 'नाही, जमिनीतील ओलावा पुरेसा आहे.';
        }
      }
      return intent.responses[0];
    }
  }
  return 'माफ करा, मला समजले नाही.';
}

module.exports = { getChatbotReply }; 