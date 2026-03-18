const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host:   'smtp.resend.com',
  port:   465,
  secure: true,
  auth: {
    user: 'resend',
    pass: process.env.re_JL9aGdf5_ckbqdGHcrPfnkdUADJ3iKt3d,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('[Mailer] SMTP connection failed:', error.message);
  } else {
    console.log('[Mailer] SMTP connection ready');
  }
});

async function sendOTPEmail(toEmail, username, otpCode) {
  const mailOptions = {
    from:    'BakeSync <onboarding@resend.dev>',
    to:      toEmail,
    subject: 'Your BakeSync Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">BakeSync Email Verification</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>Use the code below to verify your email address
           and activate your BakeSync account.</p>
        <div style="
          background: #F3F4F6;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          margin: 24px 0;
        ">
          <p style="margin: 0; color: #6B7280; font-size: 14px;">
            Your verification code
          </p>
          <p style="
            font-size: 40px;
            font-weight: bold;
            color: #7C3AED;
            letter-spacing: 8px;
            margin: 8px 0;
          ">${otpCode}</p>
          <p style="margin: 0; color: #6B7280; font-size: 12px;">
            This code expires in 10 minutes.
          </p>
        </div>
        <p style="color: #6B7280; font-size: 13px;">
          If you did not request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #E5E7EB;" />
        <p style="color: #9CA3AF; font-size: 12px;">
          BakeSync — Bakery Management System
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Mailer] OTP sent to ${toEmail} for user ${username}`);
}

module.exports = { sendOTPEmail };