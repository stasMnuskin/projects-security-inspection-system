const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD 
  }
});

exports.sendFaultNotification = async (fault) => {
  const mailOptions = {
    from: 'stas.mnuskin@gmail.com',
    to: process.env.EMAIL_USER, 
    subject: `New Fault Reported: ${fault.siteName}`,
    text: `
      A new fault has been reported:
      Site: ${fault.siteName}
      Description: ${fault.description}
      Severity: ${fault.severity}
      Reported Time: ${fault.reportedTime}
      
      Please check the dashboard for more details.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};