const { logger } = require('./logger');

class InsightGenerator {
  constructor() {
    this.thresholds = {
      moisture: {
        critical: 30,
        low: 50,
        high: 80
      },
      temperature: {
        cold: 15,
        hot: 32,
        extreme: 38
      },
      humidity: {
        low: 30,
        high: 80
      },
      nitrogen: {
        low: 140,
        optimal: 200
      }
    };
  }

  generateInsights(sensorData, weatherData) {
    const insights = {
      immediateActions: [],
      scheduledActions: [],
      recommendations: [],
      riskAlerts: []
    };

    try {
      this._analyzeMoisture(insights, sensorData);
      this._analyzeWeather(insights, weatherData);
      this._analyzeNPK(insights, sensorData);
      this._generateSeasonalAdvice(insights);
      this._analyzePestRisks(insights, sensorData, weatherData);
      
      logger.info('Generated insights successfully');
      return insights;
    } catch (error) {
      logger.error('Error generating insights:', error);
      throw new Error('Failed to generate insights');
    }
  }

  _analyzeMoisture(insights, sensorData) {
    if (!sensorData?.moisture) return;

    if (sensorData.moisture < this.thresholds.moisture.critical) {
      insights.immediateActions.push({
        title: 'तात्काळ पाणी द्या',
        description: 'मातीची आर्द्रता खूप कमी आहे. तात्काळ पाणी द्या.',
        priority: 'high',
        timing: 'आजच'
      });
    } else if (sensorData.moisture < this.thresholds.moisture.low) {
      insights.scheduledActions.push({
        title: 'पाणी द्या',
        description: 'मातीची आर्द्रता कमी आहे. २-३ दिवसात पाणी द्या.',
        priority: 'medium',
        timing: '२-३ दिवसात'
      });
    } else if (sensorData.moisture > this.thresholds.moisture.high) {
      insights.riskAlerts.push({
        title: 'जास्त पाणी',
        description: 'मातीत जास्त पाणी आहे. पाणी देणे थांबवा.',
        priority: 'medium'
      });
    }
  }

  _analyzeWeather(insights, weatherData) {
    if (!weatherData) return;

    // Temperature analysis
    if (weatherData.temperature > this.thresholds.temperature.extreme) {
      insights.riskAlerts.push({
        title: 'अत्यंत उच्च तापमान धोका',
        description: 'तापमान धोकादायक पातळीवर आहे. पिकांचे संरक्षण करा.',
        priority: 'high'
      });
    } else if (weatherData.temperature > this.thresholds.temperature.hot) {
      insights.riskAlerts.push({
        title: 'उच्च तापमान इशारा',
        description: 'तापमान ३२°C पेक्षा जास्त आहे. पिकांना तणाव येऊ शकतो.',
        priority: 'medium'
      });
    }

    // Rain prediction
    if (weatherData.rainChance > 70) {
      insights.immediateActions.push({
        title: 'पाऊस येण्याची शक्यता',
        description: 'पाऊस येण्याची शक्यता आहे. पाणी देताना काळजी घ्या.',
        priority: 'medium',
        timing: 'आज-उद्या'
      });
    }

    // Humidity analysis
    if (weatherData.humidity > this.thresholds.humidity.high) {
      insights.riskAlerts.push({
        title: 'उच्च आर्द्रता इशारा',
        description: 'आर्द्रता खूप जास्त आहे. फंगल रोगांचा धोका.',
        priority: 'medium'
      });
    }
  }

  _analyzeNPK(insights, sensorData) {
    if (!sensorData?.nitrogen) return;

    if (sensorData.nitrogen < this.thresholds.nitrogen.low) {
      insights.scheduledActions.push({
        title: 'नायट्रोजन खते वापरा',
        description: 'मातीत नायट्रोजन कमी आहे. युरिया खते वापरा.',
        priority: 'medium',
        timing: 'पुढील आठवड्यात'
      });
    }

    // Add more NPK analysis as needed
  }

  _generateSeasonalAdvice(insights) {
    const month = new Date().getMonth();
    
    // Monsoon season (June to September)
    if (month >= 5 && month <= 8) {
      insights.recommendations.push({
        title: 'मान्सून हंगाम',
        description: 'मान्सून हंगाम आहे. पाणी व्यवस्थापन लक्षात ठेवा.',
        priority: 'medium'
      });
    }
    // Winter season (November to February)
    else if (month >= 10 || month <= 1) {
      insights.recommendations.push({
        title: 'हिवाळी हंगाम',
        description: 'हिवाळी पिकांसाठी योग्य काळजी घ्या.',
        priority: 'medium'
      });
    }
  }

  _analyzePestRisks(insights, sensorData, weatherData) {
    if (!weatherData || !sensorData) return;

    const highRiskConditions = 
      weatherData.temperature > 28 && 
      weatherData.humidity > 70 && 
      sensorData.moisture > 60;

    if (highRiskConditions) {
      insights.recommendations.push({
        title: 'कीड नियंत्रण',
        description: 'कीड वाढण्यास अनुकूल परिस्थिती. नियमित तपासणी करा.',
        priority: 'high'
      });
    }
  }
}

module.exports = InsightGenerator; 