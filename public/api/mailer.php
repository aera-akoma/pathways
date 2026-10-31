<?php
/**
 * Podar Pathways - Secure Institutional Email Dispatcher
 * Sender: noreply@podarpathways.com
 * Supports: Native cPanel mail() and Direct Socket SMTP
 * Visual Theme: Deep Academic Navy (#0b192c), College Teal (#0d9488), Academic Gold (#d97706, #f59e0b)
 */

require_once __DIR__ . '/config.php';

class Mailer {

    /**
     * Dispatch OTP Verification Email to user
     */
    public static function sendOtp(string $to, string $name, string $otp, string $purpose = 'registration'): array {
        $subjectTitles = [
            'registration'   => "Podar Pathways - Student Verification Code: {$otp}",
            'admin-login'    => "Podar Pathways Admin - 2FA Security Code: {$otp}",
            'reset-password' => "Podar Pathways - Password Reset Code: {$otp}"
        ];

        $pillTitles = [
            'registration'   => 'STUDENT ACCOUNT VERIFICATION',
            'admin-login'    => 'ADMIN TWO-FACTOR AUTH (2FA)',
            'reset-password' => 'PASSWORD RESET VERIFICATION'
        ];

        $headlines = [
            'registration'   => 'Verify Your Student Account',
            'admin-login'    => 'Admin Portal 2FA Verification',
            'reset-password' => 'Reset Your Account Password'
        ];

        $descriptions = [
            'registration'   => 'Thank you for registering on <strong>Podar Pathways</strong>. Please use the 6-digit security code below to complete your student profile verification:',
            'admin-login'    => 'A login attempt was made for the <strong>Podar Pathways Administrative Console</strong>. Please enter the security verification code below to authorize your session:',
            'reset-password' => 'We received a request to reset the password for your <strong>Podar Pathways</strong> student account. Use the one-time verification code below to set a new password:'
        ];

        $subject     = $subjectTitles[$purpose] ?? "Podar Pathways - Security Verification Code: {$otp}";
        $pillTitle   = $pillTitles[$purpose] ?? 'SECURITY VERIFICATION';
        $headline    = $headlines[$purpose] ?? 'Identity Verification Code';
        $description = $descriptions[$purpose] ?? 'Please use the one-time verification code below to proceed with your request:';
        $safeName    = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $year        = date('Y');

        $contentHtml = <<<HTML
        <div style="margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Hello <strong>{$safeName}</strong>,
          </p>
          <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
            {$description}
          </p>

          <!-- OTP CODE DISPLAY BOX -->
          <div style="background: linear-gradient(180deg, #f0fdfa 0%, #e6fffa 100%); border: 2px dashed #0d9488; border-radius: 14px; padding: 26px 20px; text-align: center; margin-bottom: 24px; box-shadow: inset 0 2px 4px rgba(13, 148, 136, 0.04);">
            <div style="font-size: 11.5px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
              ONE-TIME VERIFICATION CODE
            </div>
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #0f766e; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; padding-left: 12px; text-shadow: 0 1px 2px rgba(15, 118, 110, 0.15);">
              {$otp}
            </div>
            <div style="display: inline-block; margin-top: 12px; background-color: #ffffff; border: 1px solid #99f6e4; border-radius: 20px; padding: 4px 14px; font-size: 12px; color: #0f766e; font-weight: 600;">
              ⏳ Valid for 10 minutes
            </div>
          </div>

          <!-- SECURITY REMINDER BOX -->
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px; margin-bottom: 20px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align: top; width: 22px; font-size: 16px;">🔒</td>
                <td style="vertical-align: top; padding-left: 8px;">
                  <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5; font-weight: 500;">
                    <strong>Security Notice:</strong> Never share this verification code with anyone. Podar Pathways faculty or administrators will <strong>never</strong> ask for your OTP or password.
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12.5px; color: #64748b; line-height: 1.5; margin: 0;">
            If you did not initiate this action on Podar Pathways, you can safely ignore this email or notify the IT placement cell immediately.
          </p>
        </div>
HTML;

        $textBody = "Podar Pathways - Institutional Career Operating System\n"
                  . "====================================================\n\n"
                  . "Hello {$safeName},\n\n"
                  . "Your one-time security verification code is: {$otp}\n\n"
                  . "This code expires in 10 minutes.\n"
                  . "SECURITY REMINDER: Never share this OTP with anyone, including college staff.\n\n"
                  . "Sheth L.U.J. & Sir M.V. College of Arts, Science & Commerce\n"
                  . "Career Development & Placement Cell\n"
                  . "© {$year} Podar Pathways (noreply@podarpathways.com)";

        self::logAudit($to, "OTP: {$otp} ({$purpose})");

        $htmlBody = self::renderMasterTemplate([
            'title'     => $subject,
            'pill'      => $pillTitle,
            'pillColor' => '#0d9488',
            'headline'  => $headline,
            'content'   => $contentHtml,
            'recipient' => $to
        ]);

        // On Windows or local dev without active SMTP server, skip slow blocking mail socket timeouts
        $isWindows = (DIRECTORY_SEPARATOR === '\\');
        if ($isWindows && !USE_SMTP) {
            return [
                'success' => true,
                'message' => "OTP logged to audit log for local development: {$otp}"
            ];
        }

        return self::sendEmail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Dispatch Certificate Denied / Revision Notification Email
     */
    public static function sendCertificateDeniedEmail(string $to, string $name, string $programTitle, string $remarks): array {
        $safeName    = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $safeProgram = htmlspecialchars($programTitle ?: 'Course Certificate', ENT_QUOTES, 'UTF-8');
        $safeRemarks = htmlspecialchars($remarks ?: 'Certificate credential could not be verified against course issuer standards. Please re-upload a clear, authentic certificate.', ENT_QUOTES, 'UTF-8');
        $subject     = "Podar Pathways - Certificate Submission Update: {$safeProgram}";
        $year        = date('Y');
        $portalUrl   = self::getBaseUrl() . '/#certificates';

        $contentHtml = <<<HTML
        <div style="margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Hello <strong>{$safeName}</strong>,
          </p>
          <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            Your recent certificate submission for <strong>{$safeProgram}</strong> has been reviewed by the college academic verification committee and requires revision before it can be validated.
          </p>

          <!-- FEEDBACK CARD -->
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
            <div style="font-size: 11.5px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
              ADMINISTRATIVE REVIEW FEEDBACK:
            </div>
            <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.55; font-style: italic;">
              &ldquo;{$safeRemarks}&rdquo;
            </p>
          </div>

          <!-- RESUBMISSION GUIDELINES -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 10px 0; font-size: 13.5px; color: #1e293b; font-weight: 700;">Steps to Re-verify Your Credential:</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.6;">
              <li style="margin-bottom: 6px;">Ensure the uploaded image/PDF clearly displays your full student name and completion date.</li>
              <li style="margin-bottom: 6px;">Provide the direct Credential ID or verification link issued by Coursera, Udemy, NPTEL, or the certifying body.</li>
              <li>Re-upload the document directly from your <strong>Certificates</strong> portal.</li>
            </ul>
          </div>

          <!-- ACTION BUTTON -->
          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="{$portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);">
              Review &amp; Re-upload Certificate &rarr;
            </a>
          </div>
        </div>
HTML;

        $textBody = "Podar Pathways - Certificate Verification Desk\n"
                  . "===============================================\n\n"
                  . "Hello {$safeName},\n\n"
                  . "Your certificate submission for \"{$safeProgram}\" was not approved and requires revision.\n\n"
                  . "Review Feedback: {$safeRemarks}\n\n"
                  . "Please visit your Podar Pathways portal to upload an authentic copy with verifiable credential ID:\n"
                  . "{$portalUrl}\n\n"
                  . "© {$year} Podar Pathways";

        self::logAudit($to, "CERT_DENIED: {$safeProgram}");

        $htmlBody = self::renderMasterTemplate([
            'title'     => $subject,
            'pill'      => 'CERTIFICATE REVISION NEEDED',
            'pillColor' => '#dc2626',
            'headline'  => 'Certificate Submission Update',
            'content'   => $contentHtml,
            'recipient' => $to
        ]);

        return self::sendEmail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Dispatch Certificate Approved Celebration Email
     */
    public static function sendCertificateApprovedEmail(string $to, string $name, string $programTitle, string $credentialId = ''): array {
        $safeName    = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $safeProgram = htmlspecialchars($programTitle ?: 'Course Certificate', ENT_QUOTES, 'UTF-8');
        $safeCredId  = htmlspecialchars($credentialId ?: 'PP-CERT-' . strtoupper(substr(md5($programTitle . time()), 0, 8)), ENT_QUOTES, 'UTF-8');
        $subject     = "🎉 Congratulations! Certificate Verified - {$safeProgram}";
        $year        = date('Y');
        $portalUrl   = self::getBaseUrl() . '/#certificates';

        $contentHtml = <<<HTML
        <div style="margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Hello <strong>{$safeName}</strong>,
          </p>
          <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
            Great news! Your certificate submission for <strong>{$safeProgram}</strong> has been officially reviewed and <strong style="color: #0d9488;">verified</strong> by the Podar Pathways Academic Verification Committee.
          </p>

          <!-- ACHIEVEMENT BADGE CARD -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #a7f3d0; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 15px -3px rgba(13, 148, 136, 0.08);">
            <div style="font-size: 40px; margin-bottom: 8px;">🎓</div>
            <div style="font-size: 12px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px;">
              OFFICIALLY VERIFIED CREDENTIAL
            </div>
            <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 800; color: #064e3b;">
              {$safeProgram}
            </h3>
            <div style="display: inline-block; background-color: #ffffff; border: 1px solid #6ee7b7; border-radius: 20px; padding: 5px 16px; font-size: 12.5px; color: #065f46; font-weight: 700; margin-bottom: 12px;">
              Credential ID: <span style="font-family: monospace;">{$safeCredId}</span>
            </div>
            <div style="margin-top: 8px; font-size: 13.5px; color: #047857; font-weight: 600;">
              ✨ <strong>+12 P-CARE Score</strong> awarded to your student profile!
            </div>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            This credential is now permanently validated on your institutional portfolio and visible to campus recruiters during upcoming placement drives.
          </p>

          <!-- ACTION BUTTON -->
          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="{$portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);">
              View in Your Certificate Portfolio &rarr;
            </a>
          </div>
        </div>
HTML;

        $textBody = "Podar Pathways - Certificate Verification Desk\n"
                  . "===============================================\n\n"
                  . "Congratulations {$safeName}!\n\n"
                  . "Your certificate for \"{$safeProgram}\" has been verified!\n"
                  . "Credential ID: {$safeCredId}\n"
                  . "Reward: +12 P-CARE Score added to your student profile.\n\n"
                  . "View your credential: {$portalUrl}\n\n"
                  . "© {$year} Podar Pathways";

        self::logAudit($to, "CERT_APPROVED: {$safeProgram}");

        $htmlBody = self::renderMasterTemplate([
            'title'     => $subject,
            'pill'      => 'CREDENTIAL VERIFIED & REWARDED',
            'pillColor' => '#059669',
            'headline'  => 'Certificate Verified Successfully!',
            'content'   => $contentHtml,
            'recipient' => $to
        ]);

        return self::sendEmail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Dispatch Welcome Onboarding Email to newly registered student
     */
    public static function sendWelcomeEmail(string $to, string $name, string $course = '', string $semester = ''): array {
        $safeName   = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $safeCourse = htmlspecialchars($course ?: 'Bachelor of Science (I.T.)', ENT_QUOTES, 'UTF-8');
        $safeSem    = htmlspecialchars($semester ?: 'Semester 4', ENT_QUOTES, 'UTF-8');
        $subject    = "Welcome to Podar Pathways, {$safeName}! 🎓";
        $year       = date('Y');
        $portalUrl  = self::getBaseUrl() . '/#auth';

        $contentHtml = <<<HTML
        <div style="margin-bottom: 24px;">
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
            Hello <strong>{$safeName}</strong>,
          </p>
          <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
            Welcome to <strong>Podar Pathways</strong> — the official Career Operating System and Placement Platform of <strong>Sheth L.U.J. &amp; Sir M.V. College of Arts, Science &amp; Commerce</strong>. Your student account has been successfully verified!
          </p>

          <!-- ENROLLMENT SUMMARY CARD -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Student Name:</td>
                <td style="padding: 6px 0; font-size: 13.5px; color: #0f172a; font-weight: 700; text-align: right;">{$safeName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Degree Program:</td>
                <td style="padding: 6px 0; font-size: 13.5px; color: #0f172a; font-weight: 700; text-align: right;">{$safeCourse}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Current Semester:</td>
                <td style="padding: 6px 0; font-size: 13.5px; color: #0d9488; font-weight: 700; text-align: right;">{$safeSem}</td>
              </tr>
            </table>
          </div>

          <!-- HIGHLIGHT TILES -->
          <div style="margin-bottom: 24px;">
            <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #1e293b; font-weight: 700;">What You Can Do Next:</h4>
            
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
              <span style="font-size: 18px; margin-right: 8px; vertical-align: middle;">📊</span>
              <strong style="font-size: 13.5px; color: #0f172a;">Track Your P-CARE Score</strong>
              <p style="margin: 4px 0 0 28px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
                Build an industry-recognized career readiness score evaluated by college faculty.
              </p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px;">
              <span style="font-size: 18px; margin-right: 8px; vertical-align: middle;">📜</span>
              <strong style="font-size: 13.5px; color: #0f172a;">Upload &amp; Verify Certificates</strong>
              <p style="margin: 4px 0 0 28px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
                Submit NPTEL, Coursera, and course credentials to earn verified badges.
              </p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
              <span style="font-size: 18px; margin-right: 8px; vertical-align: middle;">🚀</span>
              <strong style="font-size: 13.5px; color: #0f172a;">Showcase Student Projects</strong>
              <p style="margin: 4px 0 0 28px; font-size: 12.5px; color: #64748b; line-height: 1.5;">
                Publish GitHub repos, live demos, and case studies to catch the eyes of recruiting companies.
              </p>
            </div>
          </div>

          <!-- ACTION BUTTON -->
          <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="{$portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #0b192c 0%, #1e3e62 100%); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(11, 25, 44, 0.3);">
              Access Your Student Portal &rarr;
            </a>
          </div>
        </div>
HTML;

        $textBody = "Welcome to Podar Pathways, {$safeName}!\n"
                  . "========================================\n\n"
                  . "Your student account for {$safeCourse} ({$safeSem}) has been successfully activated.\n\n"
                  . "Log in to your student dashboard to track your P-CARE score, showcase projects, and upload verified credentials:\n"
                  . "{$portalUrl}\n\n"
                  . "Sheth L.U.J. & Sir M.V. College of Arts, Science & Commerce\n"
                  . "© {$year} Podar Pathways";

        self::logAudit($to, "WELCOME_EMAIL: {$safeName}");

        $htmlBody = self::renderMasterTemplate([
            'title'     => $subject,
            'pill'      => 'STUDENT ONBOARDING',
            'pillColor' => '#1e3e62',
            'headline'  => 'Welcome to Podar Pathways!',
            'content'   => $contentHtml,
            'recipient' => $to
        ]);

        return self::sendEmail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Master Responsive HTML Template with Podar Pathways Logo & Institutional Theme
     */
    private static function renderMasterTemplate(array $params): string {
        $title     = htmlspecialchars($params['title'] ?? 'Podar Pathways Notification', ENT_QUOTES, 'UTF-8');
        $pill      = htmlspecialchars($params['pill'] ?? 'OFFICIAL NOTIFICATION', ENT_QUOTES, 'UTF-8');
        $pillColor = $params['pillColor'] ?? '#0d9488';
        $headline  = htmlspecialchars($params['headline'] ?? 'Podar Pathways Notification', ENT_QUOTES, 'UTF-8');
        $content   = $params['content'] ?? '';
        $recipient = htmlspecialchars($params['recipient'] ?? '', ENT_QUOTES, 'UTF-8');
        $year      = date('Y');

        $baseUrl = self::getBaseUrl();
        $remoteLogoUrl = rtrim($baseUrl, '/') . '/pathways-logo-email.jpeg';

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{$title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, h1, h2, h3, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">

  <!-- TOP BACKGROUND WRAPPER -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">

        <!-- MAIN CONTAINER CARD (Max 580px) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);">
          
          <!-- BRAND HEADER: Institutional Deep Navy with Teal Gradient -->
          <tr>
            <td style="background: #0b192c; background: linear-gradient(135deg, #0b192c 0%, #1e3e62 55%, #0d9488 100%); padding: 32px 24px 28px 24px; text-align: center; color: #ffffff;">
              
              <!-- LOGO EMBLEM CONTAINER -->
              <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" style="width: 64px; height: 64px; border-radius: 50%; background-color: #ffffff; padding: 2px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);">
                    <!-- Dual-source logo: CID fallback to remote URL -->
                    <img src="cid:pathways_logo" onerror="this.onerror=null;this.src='{$remoteLogoUrl}';" alt="Podar Pathways Logo" width="60" height="60" style="display: block; width: 60px; height: 60px; border-radius: 50%; object-fit: contain; border: 0;" />
                  </td>
                </tr>
              </table>

              <!-- INSTITUTION TITLE -->
              <h1 style="margin: 0; font-size: 23px; font-weight: 800; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase;">
                PODAR PATHWAYS
              </h1>
              
              <!-- COLLEGE SUBTITLE -->
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #99f6e4; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">
                Career Operating System &bull; Placement Cell
              </p>
              <p style="margin: 3px 0 0 0; font-size: 10px; color: #cbd5e1; letter-spacing: 0.5px; opacity: 0.9;">
                Sheth L.U.J. &amp; Sir M.V. College of Arts, Science &amp; Commerce
              </p>
            </td>
          </tr>

          <!-- GOLDEN ACCENT RIBBON -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #14b8a6 100%); line-height: 4px; font-size: 0;">&nbsp;</td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding: 34px 30px 24px 30px; background-color: #ffffff;">
              
              <!-- CATEGORY PILL -->
              <div style="margin-bottom: 14px;">
                <span style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 3px solid {$pillColor}; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; color: {$pillColor}; letter-spacing: 1px; text-transform: uppercase;">
                  {$pill}
                </span>
              </div>

              <!-- HEADLINE -->
              <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 18px 0; letter-spacing: -0.3px;">
                {$headline}
              </h2>

              <!-- INJECTED BODY -->
              {$content}

            </td>
          </tr>

          <!-- INSTITUTIONAL FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #334155; font-size: 12.5px;">
                Sheth L.U.J. &amp; Sir M.V. College of Arts, Science &amp; Commerce
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11.5px; color: #64748b;">
                Career Development &amp; Placement Cell &bull; Dr. Sarvepalli Radhakrishnan Marg, Andheri (E), Mumbai 400069
              </p>
              
              <div style="height: 1px; background-color: #e2e8f0; width: 60%; margin: 12px auto;"></div>

              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8;">
                Sent automatically by the Podar Pathways Security Engine to <strong style="color: #64748b;">{$recipient}</strong>.<br>
                For placement queries, please visit the college campus or contact <a href="mailto:noreply@podarpathways.com" style="color: #0d9488; text-decoration: none; font-weight: 600;">noreply@podarpathways.com</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; {$year} Podar Pathways. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
HTML;
    }

    /**
     * Dispatch email via SMTP or Native cPanel mail with embedded inline logo CID
     */
    public static function sendEmail(string $to, string $subject, string $htmlBody, string $textBody): array {
        // On Windows or local dev without active SMTP server, skip slow blocking mail socket timeouts
        $isWindows = (DIRECTORY_SEPARATOR === '\\');
        if ($isWindows && !USE_SMTP) {
            return [
                'success' => true,
                'message' => "Email rendered and simulated for local development (To: {$to})"
            ];
        }
        if (USE_SMTP) {
            return self::sendViaSmtp($to, $subject, $htmlBody, $textBody);
        }
        return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Send via native PHP mail() with RFC multipart/related inline CID
     */
    private static function sendViaNativeMail(string $to, string $subject, string $htmlBody, string $textBody): array {
        $fromEmail = MAIL_FROM_EMAIL;
        $fromName  = MAIL_FROM_NAME;
        $replyTo   = MAIL_REPLY_TO;

        $logoData = self::getLogoData();
        $hasLogo  = !empty($logoData['base64']);

        $relatedBoundary = '==Related_Boundary_x' . md5(time() . 'rel') . 'x';
        $altBoundary     = '==Alt_Boundary_x' . md5(time() . 'alt') . 'x';

        $headers  = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: {$replyTo}\r\n";
        $headers .= "Return-Path: {$fromEmail}\r\n";
        $headers .= "X-Mailer: PodarPathways-Engine/2.0\r\n";
        $headers .= "MIME-Version: 1.0\r\n";

        if ($hasLogo) {
            $headers .= "Content-Type: multipart/related; boundary=\"{$relatedBoundary}\"\r\n";

            $message  = "--{$relatedBoundary}\r\n";
            $message .= "Content-Type: multipart/alternative; boundary=\"{$altBoundary}\"\r\n\r\n";

            $message .= "--{$altBoundary}\r\n";
            $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $message .= $textBody . "\r\n\r\n";

            $message .= "--{$altBoundary}\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $message .= $htmlBody . "\r\n\r\n";
            $message .= "--{$altBoundary}--\r\n\r\n";

            // Attach inline logo CID
            $message .= "--{$relatedBoundary}\r\n";
            $message .= "Content-Type: image/jpeg; name=\"pathways-logo-email.jpeg\"\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "Content-ID: <pathways_logo>\r\n";
            $message .= "Content-Disposition: inline; filename=\"pathways-logo-email.jpeg\"\r\n\r\n";
            $message .= chunk_split($logoData['base64']) . "\r\n";
            $message .= "--{$relatedBoundary}--";
        } else {
            $headers .= "Content-Type: multipart/alternative; boundary=\"{$altBoundary}\"\r\n";

            $message  = "--{$altBoundary}\r\n";
            $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $message .= $textBody . "\r\n\r\n";

            $message .= "--{$altBoundary}\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $message .= $htmlBody . "\r\n\r\n";
            $message .= "--{$altBoundary}--";
        }

        $additionalParams = "-f{$fromEmail}";

        $sent = @mail($to, $subject, $message, $headers, $additionalParams);
        if ($sent) {
            return ['success' => true, 'message' => "Email delivered to {$to}."];
        }

        $sentRetry = @mail($to, $subject, $message, $headers);
        if ($sentRetry) {
            return ['success' => true, 'message' => "Email delivered to {$to}."];
        }

        return [
            'success' => false,
            'message' => "Unable to send email. Check mail server configuration."
        ];
    }

    /**
     * Send via direct SMTP socket with multipart/related inline CID
     */
    private static function sendViaSmtp(string $to, string $subject, string $htmlBody, string $textBody): array {
        $host = SMTP_HOST;
        $port = SMTP_PORT;
        $timeout = 10;

        $socketAddress = (SMTP_SECURE === 'ssl' ? 'ssl://' : '') . $host;
        $socket = @fsockopen($socketAddress, $port, $errno, $errstr, $timeout);

        if (!$socket) {
            error_log("[SMTP ERROR] Could not connect to {$host}:{$port} - {$errstr} ({$errno})");
            return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
        }

        $read = function() use ($socket) {
            $data = '';
            while ($str = fgets($socket, 515)) {
                $data .= $str;
                if (substr($str, 3, 1) === ' ') break;
            }
            return $data;
        };

        $write = function(string $cmd) use ($socket) {
            fputs($socket, $cmd . "\r\n");
        };

        $read();

        $write("EHLO " . (gethostname() ?: 'localhost'));
        $read();

        if (SMTP_SECURE === 'tls') {
            $write("STARTTLS");
            $read();
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $write("EHLO " . (gethostname() ?: 'localhost'));
            $read();
        }

        if (!empty(SMTP_USER) && !empty(SMTP_PASS)) {
            $write("AUTH LOGIN");
            $read();
            $write(base64_encode(SMTP_USER));
            $read();
            $write(base64_encode(SMTP_PASS));
            $authRes = $read();
            if (strpos($authRes, '235') === false) {
                fclose($socket);
                error_log("[SMTP ERROR] Authentication failed: {$authRes}");
                return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
            }
        }

        $write("MAIL FROM: <" . MAIL_FROM_EMAIL . ">");
        $read();
        $write("RCPT TO: <{$to}>");
        $read();
        $write("DATA");
        $read();

        $fromEmail = MAIL_FROM_EMAIL;
        $fromName  = MAIL_FROM_NAME;

        $logoData = self::getLogoData();
        $hasLogo  = !empty($logoData['base64']);

        $relatedBoundary = '==Related_Boundary_x' . md5(time() . 'rel') . 'x';
        $altBoundary     = '==Alt_Boundary_x' . md5(time() . 'alt') . 'x';

        $data  = "From: {$fromName} <{$fromEmail}>\r\n";
        $data .= "To: <{$to}>\r\n";
        $data .= "Subject: {$subject}\r\n";
        $data .= "MIME-Version: 1.0\r\n";

        if ($hasLogo) {
            $data .= "Content-Type: multipart/related; boundary=\"{$relatedBoundary}\"\r\n\r\n";

            $data .= "--{$relatedBoundary}\r\n";
            $data .= "Content-Type: multipart/alternative; boundary=\"{$altBoundary}\"\r\n\r\n";

            $data .= "--{$altBoundary}\r\n";
            $data .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $data .= $textBody . "\r\n\r\n";

            $data .= "--{$altBoundary}\r\n";
            $data .= "Content-Type: text/html; charset=UTF-8\r\n";
            $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $data .= $htmlBody . "\r\n\r\n";
            $data .= "--{$altBoundary}--\r\n\r\n";

            $data .= "--{$relatedBoundary}\r\n";
            $data .= "Content-Type: image/jpeg; name=\"pathways-logo-email.jpeg\"\r\n";
            $data .= "Content-Transfer-Encoding: base64\r\n";
            $data .= "Content-ID: <pathways_logo>\r\n";
            $data .= "Content-Disposition: inline; filename=\"pathways-logo-email.jpeg\"\r\n\r\n";
            $data .= chunk_split($logoData['base64']) . "\r\n";
            $data .= "--{$relatedBoundary}--\r\n.";
        } else {
            $data .= "Content-Type: multipart/alternative; boundary=\"{$altBoundary}\"\r\n\r\n";

            $data .= "--{$altBoundary}\r\n";
            $data .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $data .= $textBody . "\r\n\r\n";

            $data .= "--{$altBoundary}\r\n";
            $data .= "Content-Type: text/html; charset=UTF-8\r\n";
            $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $data .= $htmlBody . "\r\n\r\n";
            $data .= "--{$altBoundary}--\r\n.";
        }

        $write($data);
        $res = $read();

        $write("QUIT");
        fclose($socket);

        if (strpos($res, '250') !== false) {
            return ['success' => true, 'message' => "Email sent to {$to}."];
        }

        return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Resolve Base Application URL dynamically
     */
    public static function getBaseUrl(): string {
        if ($envUrl = getenv('APP_URL')) {
            return rtrim($envUrl, '/');
        }
        $isHttps  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
        $protocol = $isHttps ? 'https://' : 'http://';
        $host     = $_SERVER['HTTP_HOST'] ?? 'localhost:5000';
        return $protocol . $host;
    }

    /**
     * Read and Base64 encode the Podar Pathways logo for CID attachment
     */
    private static function getLogoData(): array {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }

        $candidates = [
            dirname(__DIR__) . '/pathways-logo-email.jpeg',
            dirname(__DIR__, 2) . '/public/pathways-logo-email.jpeg',
            dirname(__DIR__) . '/pathways-logo.jpeg',
            dirname(__DIR__, 2) . '/public/pathways-logo.jpeg'
        ];

        foreach ($candidates as $filePath) {
            if (file_exists($filePath) && is_readable($filePath)) {
                $raw = @file_get_contents($filePath);
                if (!empty($raw)) {
                    $cached = [
                        'cid'    => 'pathways_logo',
                        'path'   => $filePath,
                        'base64' => base64_encode($raw)
                    ];
                    return $cached;
                }
            }
        }

        $cached = ['cid' => 'pathways_logo', 'path' => '', 'base64' => ''];
        return $cached;
    }

    /**
     * Audit log for debugging
     */
    private static function logAudit(string $to, string $details): void {
        try {
            $logDir = dirname(OTP_LOG_FILE);
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0755, true);
            }
            $timestamp = date('Y-m-d H:i:s');
            $line = sprintf("[%s] TO: %s | %s | SENDER: %s\n", $timestamp, $to, $details, MAIL_FROM_EMAIL);
            @file_put_contents(OTP_LOG_FILE, $line, FILE_APPEND | LOCK_EX);
        } catch (\Throwable $e) {}
    }
}
