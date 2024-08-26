const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  // הגדרות SMTP
});

exports.sendEmail = async (to, subject, text) => {
  await transporter.sendMail({
    from: 'system@example.com',
    to,
    subject,
    text
  });
};