require('dotenv').config();

console.log('API Key loaded:', process.env.RESEND_API_KEY ? 'YES' : 'NO — KEY IS MISSING');

const { sendOTPEmail } = require('./src/utils/mailer');

sendOTPEmail('2221611@ub.edu.ph', 'test_user', '482910')
  .then(() => {
    console.log('Email sent successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });