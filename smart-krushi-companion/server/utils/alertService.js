const twilio = require('twilio');
//require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const from = process.env.TWILIO_PHONE_NUMBER;
const to = process.env.ALERT_MOBILE_NUMBER; // e.g., '+919999999999'

async function sendSMSAlert(message) {
  return client.messages.create({
    body: message,
    from,
    to
  });
}

async function sendWhatsAppAlert(message) {
  return client.messages.create({
    body: message,
    from: 'whatsapp:' + from,
    to: 'whatsapp:' + to
  });
}

module.exports = { sendSMSAlert, sendWhatsAppAlert }; 