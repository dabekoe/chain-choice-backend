const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS  // your email password or app password
  }
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;