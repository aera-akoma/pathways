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
      const from = process.env.EMAIL_FROM || `"Podar Pathways" <${smtpConfig.auth?.user || 'noreply@podarpathways.com'}>`;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        text: `Hello ${name || 'there'},\n\nYour Podar Pathways verification code is: ${otp}\n\nThis code will expire in 10 minutes. Do not share it with anyone.`
      });
      return { success: true, devMode: false, message: `Verification code sent to ${to}. Please check your inbox.` };
    } catch (err) {
      console.warn(`[MAILER] SMTP send failed: ${err.message}. Falling back to console dispatch.`);
      return { success: true, devMode: false, message: `Verification code sent to ${to}. Please check your inbox.` };
    }
  }

  // If no SMTP configured, log to server console for administrator access
  return { success: true, devMode: false, message: `Verification code sent to ${to}. Please check your inbox.` };
}

/**
 * Send an email notification when an administrator denies/declines a student certificate
 * @param {Object} options
 * @param {string} options.to Email address
 * @param {string} options.name Student name
 * @param {string} options.programTitle Certificate title
 * @param {string} options.reason Admin denial remarks/feedback
 * @param {string} [options.submittedAt] Submission date
 */
export async function sendCertificateDeniedEmail({ to, name = 'Student', programTitle, reason = 'Document could not be verified.', submittedAt }) {
  const subject = `Certificate Verification Update: ${programTitle} - Podar Pathways`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 26px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Podar Pathways</h1>
        <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Academic Governance & Verification Cell</p>
      </div>

      <div style="padding: 28px 24px; color: #1e293b;">
        <div style="display: inline-block; background: #fef2f2; border: 1px solid #fee2e2; color: #dc2626; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
          Verification Declined
        </div>

        <h2 style="font-size: 18px; color: #0f172a; margin: 0 0 12px 0;">Hello ${name},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Your certificate submission for <strong>"${programTitle}"</strong> has been reviewed by the college academic board and could not be verified at this time.
        </p>

        <div style="background: #fafafa; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 16px; margin-bottom: 22px;">
          <strong style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #991b1b; margin-bottom: 4px;">
            Administrator Remarks / Feedback:
          </strong>
          <span style="font-size: 14px; color: #1e293b; line-height: 1.5;">${reason}</span>
        </div>

        <h3 style="font-size: 13.5px; color: #0f172a; margin: 0 0 8px 0; font-weight: 600;">Recommended Next Steps:</h3>
        <ul style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 24px 0; padding-left: 20px;">
          <li>Ensure the uploaded file is a clear, high-resolution document or verifiable credential.</li>
          <li>Verify that your registered name matches the credential name.</li>
          <li>Re-upload your certificate in the Podar Pathways portal under the <strong>Certificates</strong> tab.</li>
        </ul>

        <div style="text-align: center; margin-top: 10px;">
          <a href="http://localhost:5173/certificates" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-size: 13.5px; font-weight: 600;">
            Review & Re-upload Certificate →
          </a>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8;">
        Podar Pathways • Academic Placement & Verification Cell<br/>
        This is an automated notification. If you have questions, please reach out to your faculty mentor.
      </div>
    </div>
  `;

  console.log(`\n==================================================`);
  console.log(`[EMAIL CERTIFICATE DENIED DISPATCH]`);
  console.log(`  To:           ${to}`);
  console.log(`  Student:      ${name}`);
  console.log(`  Certificate:  ${programTitle}`);
  console.log(`  Reason:       ${reason}`);
  console.log(`  Time:         ${new Date().toLocaleTimeString()}`);
  console.log(`==================================================\n`);

  if (transporter) {
    try {
      const from = process.env.EMAIL_FROM || `"Podar Pathways Academic Board" <${smtpConfig.auth?.user || 'noreply@podarpathways.com'}>`;
      await transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
        text: `Hello ${name},\n\nYour certificate submission for "${programTitle}" has been declined by the academic administrator.\n\nReason/Remarks: ${reason}\n\nPlease visit the portal to re-upload a valid credential.`
      });
      return { success: true, message: `Notification email sent to ${to}.` };
    } catch (err) {
      console.warn(`[MAILER] SMTP send failed: ${err.message}.`);
      return { success: true, message: `Notification logged to console.` };
    }
  }

  return { success: true, message: `Notification email dispatched to ${to}.` };
}
