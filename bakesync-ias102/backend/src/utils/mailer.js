const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(toEmail, username, otpCode) {
  try {
    const { data, error } = await resend.emails.send({
      from:    'BakeSync <onboarding@resend.dev>',
      to:      toEmail,
      subject: 'Your BakeSync Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #7C3AED;">BakeSync Email Verification</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Use the code below to verify your email address.</p>
          <div style="background:#F3F4F6;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <p style="margin:0;color:#6B7280;font-size:14px;">Your verification code</p>
            <p style="font-size:40px;font-weight:bold;color:#7C3AED;letter-spacing:8px;margin:8px 0;">${otpCode}</p>
            <p style="margin:0;color:#6B7280;font-size:12px;">Expires in 10 minutes.</p>
          </div>
          <p style="color:#9CA3AF;font-size:12px;">BakeSync — Bakery Management System</p>
        </div>
      `,
    });

    if (error) throw new Error(error.message);

    console.log('[Mailer] OTP sent to ' + toEmail + ' — ID: ' + data.id);

  } catch (err) {
    console.error('[Mailer] Failed:', err.message);
    throw err;
  }
}

module.exports = { sendOTPEmail };