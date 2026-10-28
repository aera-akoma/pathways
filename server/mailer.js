import nodemailer from 'nodemailer';

// Configure SMTP transport if environment variables are set
const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || ''
  } : null
};

let transporter = null;
if (smtpConfig.host && smtpConfig.auth?.user) {
  try {
    transporter = nodemailer.createTransport(smtpConfig);
    console.log(`[MAILER] SMTP transport initialized with host ${smtpConfig.host}`);
  } catch (err) {
    console.warn('[MAILER] Failed to create SMTP transporter:', err.message);
  }
}

/**
 * Send an OTP verification email
 * @param {Object} options
 * @param {string} options.to Email address
 * @param {string} options.name Recipient name
 * @param {string} options.otp 6-digit OTP
 * @param {string} options.purpose 'registration' | 'admin-login' | 'reset-password'
 * @returns {Promise<{ success: boolean, devMode: boolean, message: string }>}
 */
export async function sendOtpEmail({ to, name = 'User', otp, purpose = 'verification' }) {
  const titles = {
    'registration': 'Student Account Registration Verification',
    'admin-login': 'Admin Two-Factor Authentication (2FA) Code',
    'reset-password': 'Password Reset Verification'
  };

  const subject = titles[purpose] || 'Your Podar Pathways Verification Code';
  const actionText = purpose === 'admin-login'
    ? 'signing into the Podar Pathways Admin Console'
    : purpose === 'registration'
      ? 'creating your student account on Podar Pathways'
      : 'verifying your identity';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #102a43 0%, #173e5b 60%, #0e6d6d 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Podar Pathways</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #a8e3cf; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Career Operating System</p>
      </div>
      <div style="padding: 32px 28px; color: #1e293b;">
        <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Hello ${name || 'there'},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
          You requested a one-time verification code for ${actionText}. Use the security code below to proceed:
        </p>
        <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0d9488; font-family: monospace;">${otp}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">This code expires in 10 minutes</p>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          If you did not initiate this request, please disregard this email. Never share this code with anyone.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
        © ${new Date().getFullYear()} Podar Pathways • Secure Authentication System
      </div>
    </div>
  `;

  // Always log clearly to server console for development and audit
  console.log(`\n==================================================`);
  console.log(`[EMAIL OTP DISPATCH]`);
  console.log(`  To:      ${to}`);
  console.log(`  Purpose: ${purpose}`);
  console.log(`  Code:    ${otp}`);
  console.log(`  Time:    ${new Date().toLocaleTimeString()}`);
  console.log(`==================================================\n`);

  if (transporter) {
    try {
      const from = process.env.EMAIL_FROM || `"Podar Pathways" <${smtpConfig.auth?.user || 'noreply@podarpathways.edu'}>`;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        text: `Hello ${name || 'there'},\n\nYour Podar Pathways verification code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.`
      });
      return { success: true, devMode: false, message: `Verification code sent to ${to}` };
    } catch (err) {
      console.warn(`[MAILER] SMTP send failed: ${err.message}. Falling back to console dispatch.`);
      return { success: true, devMode: true, message: `Demo mode: Code is ${otp}` };
    }
  }

  // If no SMTP configured, we are in local development mode
  return { success: true, devMode: true, message: `Development mode: Code is ${otp}` };
}
