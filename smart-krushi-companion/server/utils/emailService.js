const nodemailer = require('nodemailer');
const { logger } = require('./logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email templates
const templates = {
  passwordReset: {
    english: {
      subject: 'Password Reset Request - Smart Krushi Companion',
      html: (data) => `
        <h1>Hello ${data.name},</h1>
        <p>You have requested to reset your password for your Smart Krushi Companion account.</p>
        <p>Please click the link below to reset your password. This link will expire in 1 hour.</p>
        <a href="${data.resetURL}" style="
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 4px;
        ">Reset Password</a>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Smart Krushi Companion Team</p>
      `
    },
    marathi: {
      subject: 'पासवर्ड रीसेट विनंती - स्मार्ट कृषी कंपॅनियन',
      html: (data) => `
        <h1>नमस्कार ${data.name},</h1>
        <p>आपण आपल्या स्मार्ट कृषी कंपॅनियन खात्यासाठी पासवर्ड रीसेट करण्याची विनंती केली आहे.</p>
        <p>कृपया आपला पासवर्ड रीसेट करण्यासाठी खालील लिंकवर क्लिक करा. ही लिंक 1 तासात कालबाह्य होईल.</p>
        <a href="${data.resetURL}" style="
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 15px 32px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 4px;
        ">पासवर्ड रीसेट करा</a>
        <p>जर आपण ही पासवर्ड रीसेट विनंती केली नसेल, तर कृपया या ईमेलकडे दुर्लक्ष करा.</p>
        <p>शुभेच्छांसह,<br>स्मार्ट कृषी कंपॅनियन टीम</p>
      `
    }
  }
};

// Send email function
const sendEmail = async ({ email, subject, template, data }) => {
  try {
    const templateData = templates[template][data.language];
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: templateData.subject,
      html: templateData.html(data)
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent:', info.messageId);
    
    return info;
  } catch (error) {
    logger.error('Email send error:', error);
    error.user = data.user;
    throw error;
  }
};

module.exports = {
  sendEmail
}; 