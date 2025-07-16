const crypto = require('crypto');

// Generate a secure random string of 32 bytes and convert to base64
const apiKey = crypto.randomBytes(32).toString('base64');

console.log('Generated API Key:');
console.log('------------------');
console.log(apiKey);
console.log('\nAdd this to your .env file as:');
console.log('API_KEY=' + apiKey); 