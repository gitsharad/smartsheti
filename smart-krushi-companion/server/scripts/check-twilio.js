const twilio = require('twilio');
require('dotenv').config();

async function checkTwilioConfig() {
  console.log('🔍 Checking Twilio Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER || '❌ Missing'}`);
  console.log('');
  
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('❌ Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
    return;
  }
  
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Check account info
    console.log('📊 Account Information:');
    const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    console.log(`Account Name: ${account.friendlyName}`);
    console.log(`Account Status: ${account.status}`);
    console.log('');
    
    // List phone numbers
    console.log('📱 Your Phone Numbers:');
    const phoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (phoneNumbers.length === 0) {
      console.log('❌ No phone numbers found in your account');
      console.log('💡 You need to purchase a phone number that supports SMS to India');
    } else {
      phoneNumbers.forEach((number, index) => {
        console.log(`${index + 1}. ${number.phoneNumber} (${number.friendlyName || 'No name'})`);
        console.log(`   Capabilities: SMS=${number.capabilities.SMS}, Voice=${number.capabilities.voice}`);
        console.log(`   Country: ${number.region}`);
        console.log('');
      });
    }
    
    // Check if current number supports SMS to India
    if (process.env.TWILIO_PHONE_NUMBER) {
      console.log('🔍 Checking current phone number capabilities:');
      const currentNumber = phoneNumbers.find(num => num.phoneNumber === process.env.TWILIO_PHONE_NUMBER);
      
      if (currentNumber) {
        console.log(`✅ Found number: ${currentNumber.phoneNumber}`);
        console.log(`SMS Capable: ${currentNumber.capabilities.SMS ? '✅ Yes' : '❌ No'}`);
        console.log(`Voice Capable: ${currentNumber.capabilities.voice ? '✅ Yes' : '❌ No'}`);
        console.log(`Country: ${currentNumber.region}`);
        
        if (!currentNumber.capabilities.SMS) {
          console.log('❌ This number does not support SMS');
        } else if (currentNumber.region !== 'IN') {
          console.log('⚠️  This number may not support SMS to India');
          console.log('💡 Consider purchasing an Indian phone number for better reliability');
        }
      } else {
        console.log(`❌ Phone number ${process.env.TWILIO_PHONE_NUMBER} not found in your account`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error checking Twilio configuration:');
    console.log(error.message);
  }
}

checkTwilioConfig(); 