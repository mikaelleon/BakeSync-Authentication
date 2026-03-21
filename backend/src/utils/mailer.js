const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOTPEmail(toEmail, username, otpCode) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'BakeSync <onboarding@resend.dev>',
            to: toEmail,
            subject: 'Your BakeSync Verification Code',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BakeSync Verification</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f3f0eb;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 48px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="520" cellpadding="0" cellspacing="0" style="
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e7e5e0;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        ">

          <!-- Top accent bar -->
          <tr>
            <td style="
              background: linear-gradient(90deg, #a16832 0%, #5c4d3c 100%);
              height: 4px;
              font-size: 0;
              line-height: 0;
            ">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center;">

              <!-- Logo mark -->
              <div style="
                display: inline-block;
                background: rgba(161, 104, 50, 0.1);
                border-radius: 50%;
                width: 64px;
                height: 64px;
                line-height: 64px;
                text-align: center;
                font-size: 28px;
                margin-bottom: 16px;
              ">🥐</div>

              <h1 style="
                margin: 0 0 4px 0;
                font-size: 24px;
                font-weight: 700;
                color: #3d3529;
                letter-spacing: -0.3px;
              ">BakeSync</h1>

              <p style="
                margin: 0;
                font-size: 14px;
                color: #78716c;
              ">Verify your email address</p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: #e7e5e0;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">

              <p style="
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #3d3529;
              ">Hello, <span style="color: #a16832;">${username}</span></p>

              <p style="
                margin: 0 0 28px 0;
                font-size: 14px;
                line-height: 1.6;
                color: #78716c;
              ">
                You are registering for a BakeSync account.
                Use the verification code below to confirm your
                email address and activate your account.
              </p>

              <!-- OTP Box -->
              <div style="
                background: #f3f0eb;
                border: 1px solid #e7e5e0;
                border-radius: 12px;
                padding: 28px 24px;
                text-align: center;
                margin-bottom: 28px;
              ">
                <p style="
                  margin: 0 0 12px 0;
                  font-size: 11px;
                  font-weight: 600;
                  color: #78716c;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                ">Your Verification Code</p>

                <!-- OTP Digits -->
                <div style="margin-bottom: 16px;">
                  ${otpCode.split('').map(digit => `
                    <span style="
                      display: inline-block;
                      width: 44px;
                      height: 54px;
                      line-height: 54px;
                      margin: 0 3px;
                      background: #ffffff;
                      border: 2px solid #a16832;
                      border-radius: 10px;
                      font-size: 28px;
                      font-weight: 700;
                      color: #a16832;
                      text-align: center;
                    ">${digit}</span>
                  `).join('')}
                </div>

                <!-- Expiry badge -->
                <div style="
                  display: inline-block;
                  background: rgba(217, 119, 6, 0.1);
                  border: 1px solid #d97706;
                  border-radius: 20px;
                  padding: 6px 14px;
                ">
                  <span style="
                    font-size: 12px;
                    color: #d97706;
                    font-weight: 500;
                  ">Expires in 10 minutes</span>
                </div>
              </div>

              <!-- Info note -->
              <div style="
                background: #faf8f5;
                border-left: 3px solid #a16832;
                border-radius: 0 8px 8px 0;
                padding: 12px 16px;
                margin-bottom: 28px;
              ">
                <p style="
                  margin: 0;
                  font-size: 13px;
                  color: #5c4d3c;
                  line-height: 1.5;
                ">
                  <strong>Security Notice:</strong> If you did not request this code, you can safely
                  ignore this email. Your account will not be created
                  without verification.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 36px 40px;">
              <div style="height: 1px; background: #e7e5e0; margin-bottom: 24px;"></div>
              <p style="
                margin: 0;
                font-size: 12px;
                color: #78716c;
                text-align: center;
                line-height: 1.6;
              ">
                This email was sent by
                <span style="color: #a16832; font-weight: 600;">BakeSync</span>
                &nbsp;·&nbsp;
                Bakery Management System
                <br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

          <!-- Bottom accent bar -->
          <tr>
            <td style="
              background: linear-gradient(90deg, #5c4d3c 0%, #a16832 100%);
              height: 4px;
              font-size: 0;
              line-height: 0;
            ">&nbsp;</td>
          </tr>

        </table>
        <!-- End Card -->

      </td>
    </tr>
  </table>

</body>
</html>
`,
        });

        if (error) throw new Error(error.message);

        console.log(`[Mailer] OTP sent to ${toEmail} for ${username}`);

    } catch (err) {
        console.error('[Mailer] Failed to send email:', err && err.message ? err.message : err);
        throw err;
    }
}

async function sendAccountDeletionOTPEmail(toEmail, username, otpCode) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'BakeSync <onboarding@resend.dev>',
            to: toEmail,
            subject: 'BakeSync Account Deletion Code',
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>BakeSync Account Deletion</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f3f0eb;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 48px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e7e5e0;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        ">
          <tr>
            <td style="
              background: linear-gradient(90deg, #b91c1c 0%, #5c4d3c 100%);
              height: 4px;
              font-size: 0;
              line-height: 0;
            ">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding: 36px 40px 24px 40px; text-align: center;">
              <div style="
                display: inline-block;
                background: rgba(185, 28, 28, 0.08);
                border-radius: 50%;
                width: 64px;
                height: 64px;
                line-height: 64px;
                text-align: center;
                font-size: 28px;
                margin-bottom: 16px;
              ">🗑️</div>

              <h1 style="
                margin: 0 0 4px 0;
                font-size: 22px;
                font-weight: 700;
                color: #3d3529;
                letter-spacing: -0.3px;
              ">Confirm account deletion</h1>

              <p style="
                margin: 0;
                font-size: 14px;
                color: #78716c;
              ">Use the code below to delete your BakeSync account.</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: #e7e5e0;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #3d3529;
              ">Hello, <span style="color: #a16832;">${username}</span></p>

              <p style="
                margin: 0 0 20px 0;
                font-size: 14px;
                line-height: 1.6;
                color: #78716c;
              ">
                You (or someone using your email) requested to delete your BakeSync account.
                If this was you, enter the code below to confirm. This code expires in 10 minutes.
              </p>

              <div style="
                background: #f3f0eb;
                border: 1px solid #e7e5e0;
                border-radius: 12px;
                padding: 28px 24px;
                text-align: center;
                margin-bottom: 20px;
              ">
                <p style="
                  margin: 0 0 12px 0;
                  font-size: 11px;
                  font-weight: 600;
                  color: #78716c;
                  letter-spacing: 2px;
                  text-transform: uppercase;
                ">Deletion Code</p>

                <div style="margin-bottom: 12px;">
                  ${otpCode.split('').map(digit => `
                    <span style="
                      display: inline-block;
                      width: 44px;
                      height: 54px;
                      line-height: 54px;
                      margin: 0 3px;
                      background: #ffffff;
                      border: 2px solid #b91c1c;
                      border-radius: 10px;
                      font-size: 28px;
                      font-weight: 700;
                      color: #b91c1c;
                      text-align: center;
                    ">${digit}</span>
                  `).join('')}
                </div>

                <div style="
                  display: inline-block;
                  background: rgba(217, 119, 6, 0.1);
                  border: 1px solid #d97706;
                  border-radius: 20px;
                  padding: 6px 14px;
                ">
                  <span style="
                    font-size: 12px;
                    color: #d97706;
                    font-weight: 500;
                  ">Expires in 10 minutes</span>
                </div>
              </div>

              <div style="
                background: rgba(185, 28, 28, 0.08);
                border-left: 3px solid #b91c1c;
                border-radius: 0 8px 8px 0;
                padding: 12px 16px;
                margin-bottom: 28px;
              ">
                <p style="
                  margin: 0;
                  font-size: 13px;
                  color: #5c4d3c;
                  line-height: 1.5;
                ">
                  <strong>Didn’t request this?</strong> Ignore this email. Your account won’t be deleted without this code.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 36px 40px;">
              <div style="height: 1px; background: #e7e5e0; margin-bottom: 24px;"></div>
              <p style="
                margin: 0;
                font-size: 12px;
                color: #78716c;
                text-align: center;
                line-height: 1.6;
              ">
                This email was sent by
                <span style="color: #a16832; font-weight: 600;">BakeSync</span>
                &nbsp;·&nbsp; Bakery Management System
                <br/>Please do not reply to this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="
              background: linear-gradient(90deg, #5c4d3c 0%, #b91c1c 100%);
              height: 4px;
              font-size: 0;
              line-height: 0;
            ">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
        });

        if (error) throw new Error(error.message);

        console.log(`[Mailer] Deletion OTP sent to ${toEmail} for ${username}`);
    } catch (err) {
        console.error('[Mailer] Failed to send email:', err && err.message ? err.message : err);
        throw err;
    }
}

module.exports = { sendOTPEmail, sendAccountDeletionOTPEmail };