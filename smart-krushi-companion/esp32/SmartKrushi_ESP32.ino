#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "http://your-server-ip:5000/api/sensor-data";

// Sensor pins
const int moisturePin = 34;  // Analog pin for soil moisture sensor
const int tempPin = 35;      // Analog pin for temperature sensor

// Device info
const String deviceId = "esp32_001";
const String fieldId = "plot1";
const String location = "Farm A";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Read sensor data
  int moistureRaw = analogRead(moisturePin);
  int tempRaw = analogRead(tempPin);
  
  // Convert to actual values (adjust based on your sensors)
  float moisture = map(moistureRaw, 0, 4095, 0, 100);  // 0-100%
  float temperature = (tempRaw * 3.3 / 4095.0) * 100;  // Convert to Celsius
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["fieldId"] = fieldId;
  doc["moisture"] = moisture;
  doc["temperature"] = temperature;
  doc["timestamp"] = getCurrentTimestamp();
  doc["deviceId"] = deviceId;
  doc["location"] = location;
  
  // Send data to server
  sendDataToServer(doc);
  
  // Wait 5 minutes before next reading
  delay(300000);  // 5 minutes
}

String getCurrentTimestamp() {
  // You can use NTP to get real time, or use millis() for relative time
  unsigned long currentTime = millis();
  return String(currentTime);
}

void sendDataToServer(JsonDocument& doc) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }
    
    http.end();
  }
} 