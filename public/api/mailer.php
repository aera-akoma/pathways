<?php
/**
 * Podar Pathways - Secure Email Dispatcher
 * Sender: noreply@podarpathways.com
 * Supports: Native cPanel mail() and SMTP Socket
 */

require_once __DIR__ . '/config.php';

class Mailer {

    /**
     * Dispatch OTP Email to user
     */
    public static function sendOtp(string $to, string $name, string $otp, string $purpose = 'registration'): array {
        $subjectTitles = [
            'registration'   => 'Student Account Registration Verification',
            'admin-login'    => 'Admin Two-Factor Authentication (2FA) Code',
            'reset-password' => 'Password Reset Verification Code'
        ];

        $actionTexts = [
            'registration'   => 'creating your student account on Podar Pathways',
            'admin-login'    => 'signing into the Podar Pathways Admin Console',
            'reset-password' => 'resetting your student account password'
        ];

        $subject = $subjectTitles[$purpose] ?? 'Your Podar Pathways Security Code';
        $actionText = $actionTexts[$purpose] ?? 'verifying your identity';
        $safeName = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $year = date('Y');

        $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #102a43 0%, #173e5b 55%, #0e6d6d 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Podar Pathways</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #a8e3cf; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Career Operating System</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Hello {$safeName},</h2>
              <p style="font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                You requested a one-time verification code for <strong>{$actionText}</strong>. Please use the security code below to proceed:
              </p>
              <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 9px; color: #0d9488; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;">
                  {$otp}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 12.5px; color: #64748b; font-weight: 500;">
                  This code expires in <strong>10 minutes</strong>
                </p>
              </div>
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 14px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12.5px; color: #92400e; line-height: 1.5;">
                  <strong>Security Reminder:</strong> Never share this OTP with anyone, including college staff. Podar Pathways will never ask you for your code.
                </p>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
                If you did not initiate this request, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              &copy; {$year} Podar Pathways &bull; Sent from <a href="mailto:noreply@podarpathways.com" style="color: #64748b; text-decoration: none;">noreply@podarpathways.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

        $textBody = "Hello {$safeName},\n\n"
                  . "Your Podar Pathways verification code for {$actionText} is: {$otp}\n\n"
                  . "This code expires in 10 minutes.\n"
                  . "Never share this code with anyone.\n\n"
                  . "© {$year} Podar Pathways (noreply@podarpathways.com)";

        self::logAudit($to, "OTP: {$otp} ({$purpose})");

        // On Windows or local dev without active SMTP server, skip slow blocking mail socket timeouts
        $isWindows = (DIRECTORY_SEPARATOR === '\\');
        if ($isWindows && !USE_SMTP) {
            return [
                'success' => true,
                'message' => "OTP logged to audit log for local development: {$otp}"
            ];
        }

        if (USE_SMTP) {
            return self::sendViaSmtp($to, $subject, $htmlBody, $textBody);
        }
        return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Dispatch Certificate Denied / Revision Notification Email
     */
    public static function sendCertificateDeniedEmail(string $to, string $name, string $programTitle, string $remarks): array {
        $subject = 'Important: Update on Your Certificate Submission - Podar Pathways';
        $safeName = htmlspecialchars($name ?: 'Student', ENT_QUOTES, 'UTF-8');
        $safeProgram = htmlspecialchars($programTitle ?: 'Course Certificate', ENT_QUOTES, 'UTF-8');
        $safeRemarks = htmlspecialchars($remarks ?: 'Certificate credential could not be verified against course issuer standards. Please re-upload a clear, authentic certificate.', ENT_QUOTES, 'UTF-8');
        $year = date('Y');

        $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #b91c1c 100%); padding: 30px 28px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">Podar Pathways</h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #fecaca; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700;">Certificate Verification Desk</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 28px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Hello {$safeName},</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 18px;">
                Your recent certificate submission for <strong>{$safeProgram}</strong> has been reviewed by the college academic verification committee and was <strong style="color: #b91c1c;">not approved</strong>.
              </p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 22px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #991b1b; letter-spacing: 0.5px;">Reason / Administrator Feedback:</p>
                <p style="margin: 0; font-size: 13.5px; color: #7f1d1d; line-height: 1.5;">{$safeRemarks}</p>
              </div>
              <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                You can review your certificate, make necessary adjustments, and submit a clear PDF/image with verifiable credential ID through your <strong>Certificates</strong> tab on Podar Pathways.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
              &copy; {$year} Podar Pathways &bull; Career &amp; Placement Cell
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

        $textBody = "Hello {$safeName},\n\nYour certificate submission for {$safeProgram} was not approved.\n\nReason: {$safeRemarks}\n\nPlease re-upload an authentic certificate through the Certificates tab on Podar Pathways.\n\n© {$year} Podar Pathways";

        self::logAudit($to, "CERT_DENIED: {$safeProgram}");

        if (USE_SMTP) {
            return self::sendViaSmtp($to, $subject, $htmlBody, $textBody);
        }
        return self::sendViaNativeMail($to, $subject, $htmlBody, $textBody);
    }

    /**
     * Send via native PHP mail() with RFC-compliant headers
     */
    private static function sendViaNativeMail(string $to, string $subject, string $htmlBody, string $textBody): array {
        $fromEmail = MAIL_FROM_EMAIL;
        $fromName  = MAIL_FROM_NAME;
        $replyTo   = MAIL_REPLY_TO;
        $boundary  = '==Multipart_Boundary_x' . md5(time()) . 'x';

        $headers  = "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: {$replyTo}\r\n";
        $headers .= "Return-Path: {$fromEmail}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

        $message  = "--{$boundary}\r\n";
        $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $message .= $textBody . "\r\n\r\n";

        $message .= "--{$boundary}\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $message .= $htmlBody . "\r\n\r\n";

        $message .= "--{$boundary}--";

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
     * Send via direct SMTP socket
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
        $boundary  = '==Multipart_Boundary_x' . md5(time()) . 'x';

        $data  = "From: {$fromName} <{$fromEmail}>\r\n";
        $data .= "To: <{$to}>\r\n";
        $data .= "Subject: {$subject}\r\n";
        $data .= "MIME-Version: 1.0\r\n";
        $data .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n\r\n";

        $data .= "--{$boundary}\r\n";
        $data .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $data .= $textBody . "\r\n\r\n";

        $data .= "--{$boundary}\r\n";
        $data .= "Content-Type: text/html; charset=UTF-8\r\n";
        $data .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $data .= $htmlBody . "\r\n\r\n";

        $data .= "--{$boundary}--\r\n.";

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
