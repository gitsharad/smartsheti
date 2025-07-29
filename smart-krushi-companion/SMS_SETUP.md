# SMS Setup for Smart Krishi OTP

## Overview
The Smart Krishi app now supports real SMS delivery for OTP authentication using Twilio.

## 🔧 Setup Requirements

### 1. Twilio Account Setup
1. **Create Twilio Account**: Sign up at [twilio.com](https://www.twilio.com)
2. **Get Account SID**: Found in your Twilio Console
3. **Get Auth Token**: Found in your Twilio Console
4. **Get Phone Number**: Purchase a Twilio phone number for sending SMS

### 2. Environment Variables
Add these to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number

# Optional: Default alert number
ALERT_MOBILE_NUMBER=+919999999999
```

### 3. Dependencies
Twilio is already installed in `package.json`:
```json
"twilio": "^4.22.0"
```

## 🚀 Features Implemented

### 1. Real SMS Delivery
- **OTP Generation**: 6-digit random OTP
- **SMS Sending**: Uses Twilio to send actual SMS
- **Error Handling**: Fallback to console logging if SMS fails
- **Rate Limiting**: Protected by standard rate limiter

### 2. API Endpoints

#### OTP Request
```http
POST /api/v1/auth/mobile-otp-request
Content-Type: application/json

{
  "phoneNumber": "+919999999999"
}
```

#### OTP Verification
```http
POST /api/v1/auth/mobile-otp-verify
Content-Type: application/json

{
  "phoneNumber": "+919999999999",
  "otp": "123456"
}
```

#### Test SMS (Debug)
```http
POST /api/v1/auth/test-sms
Content-Type: application/json

{
  "phoneNumber": "+919999999999",
  "message": "Test message from Smart Krishi"
}
```

## 🧪 Testing

### 1. Test SMS Endpoint
Use the test endpoint to verify SMS functionality:

```bash
curl -X POST http://localhost:5000/api/v1/auth/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919999999999",
    "message": "Test SMS from Smart Krishi"
  }'
```

### 2. OTP Testing
1. **Request OTP**: Use mobile app or API
2. **Check SMS**: Look for SMS on your phone
3. **Verify OTP**: Enter OTP in mobile app
4. **Check Logs**: Server logs show SMS status

### 3. Error Scenarios
- **Invalid Phone**: Returns 404 for unregistered numbers
- **SMS Failure**: Logs error and falls back to console
- **Invalid OTP**: Returns 401 for wrong OTP
- **Expired OTP**: Returns 401 after 5 minutes

## 📱 Mobile App Integration

### Updated LoginScreen.tsx
- **Phone Input**: Enter registered phone number
- **Send OTP**: Tap to request SMS
- **OTP Input**: Enter 6-digit OTP from SMS
- **Verify OTP**: Complete login process

### Error Handling
- **Network Errors**: Shows appropriate error messages
- **SMS Failures**: Logs errors for debugging
- **User Feedback**: Loading states and alerts

## 🔒 Security Features

### OTP Security
- **6-digit Random**: Cryptographically secure generation
- **5-minute Expiry**: Automatic timeout
- **Single Use**: Deleted after verification
- **Rate Limiting**: Prevents abuse

### SMS Security
- **Twilio Verification**: Trusted SMS provider
- **Error Logging**: Detailed error tracking
- **Fallback**: Console logging if SMS fails

## 🛠️ Troubleshooting

### Common Issues

#### 1. SMS Not Sending
- **Check Twilio Credentials**: Verify SID and Auth Token
- **Check Phone Number**: Ensure Twilio number is active
- **Check Balance**: Ensure Twilio account has credits
- **Check Logs**: Look for SMS error messages

#### 2. OTP Not Received
- **Check Phone Number**: Ensure correct format (+91XXXXXXXXXX)
- **Check User Registration**: Phone must be registered
- **Check SMS Delivery**: Some carriers may block SMS
- **Check Logs**: Verify OTP generation

#### 3. API Errors
- **Check Environment Variables**: All Twilio vars required
- **Check Network**: Ensure server can reach Twilio
- **Check Rate Limits**: Too many requests
- **Check Logs**: Detailed error information

### Debug Commands

#### Test SMS Functionality
```bash
# Test SMS sending
curl -X POST http://localhost:5000/api/v1/auth/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919999999999"}'
```

#### Check Server Logs
```bash
# View real-time logs
tail -f logs/combined.log
```

## 📋 Production Checklist

### Before Going Live
1. ✅ **Twilio Account**: Active with credits
2. ✅ **Environment Variables**: All Twilio vars set
3. ✅ **Phone Numbers**: Registered users have valid numbers
4. ✅ **Error Handling**: SMS failures handled gracefully
5. ✅ **Rate Limiting**: Prevents abuse
6. ✅ **Logging**: Comprehensive error tracking
7. ✅ **Testing**: SMS functionality verified

### Monitoring
- **SMS Delivery Rates**: Track successful deliveries
- **Error Rates**: Monitor SMS failures
- **User Feedback**: Track OTP success rates
- **Cost Monitoring**: Track Twilio usage

## ✅ Status
**SMS OTP functionality is fully implemented and ready for testing!**

The system now sends real SMS messages with OTP codes, with proper error handling and fallback mechanisms. 