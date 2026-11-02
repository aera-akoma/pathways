<?php
/** Shared, table-based transactional email layout. */
final class EmailTemplate {
    private static function escape(string $value): string {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
    public static function otp(string $name, string $code, int $minutes): string {
        $name = self::escape($name ?: 'Student');
        $code = self::escape($code);
        return <<<HTML
<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#334155">Hello {$name},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:25px;color:#475569">Enter the code below on Podar Pathways to continue. This code can be used once and expires in {$minutes} minutes.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cce5e3;background:#f0f8f7;border-radius:12px"><tr><td align="center" style="padding:24px 12px">
<p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;font-weight:bold;color:#366b68">YOUR VERIFICATION CODE</p>
<p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:36px;line-height:48px;font-weight:bold;letter-spacing:7px;color:#102a43">{$code}</p>
<p style="margin:12px 0 0;font-size:13px;color:#526b70">Valid for {$minutes} minutes</p>
</td></tr></table>
<p style="margin:24px 0 8px;font-size:14px;font-weight:bold;color:#102a43">Keep this code private</p>
<p style="margin:0;font-size:14px;line-height:23px;color:#64748b">Our team will never ask you to share this code. If you did not request it, you can safely ignore this email.</p>
HTML;
    }
    public static function render(array $params): string {
        $title = self::escape($params['title'] ?? 'Podar Pathways');
        $headline = self::escape($params['headline'] ?? 'Account notification');
        $label = self::escape($params['pill'] ?? 'ACCOUNT UPDATE');
        $recipient = self::escape($params['recipient'] ?? '');
        $content = $params['content'] ?? '';
        $year = date('Y');
        return <<<HTML
<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>{$title}</title>
<style>@media only screen and (max-width:480px){.email-padding{padding:26px 22px!important}.email-outer{padding:16px 10px!important}.email-title{font-size:25px!important}}</style></head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:Arial,Helvetica,sans-serif;color:#102a43">
<div style="display:none;font-size:1px;color:#eef2f6;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">{$headline}. Securely manage your Podar Pathways account.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f6"><tr><td class="email-outer" align="center" style="padding:40px 16px">
<!--[if mso]><table role="presentation" width="580"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #dce4ec;border-radius:14px">
<tr><td style="padding:24px 32px;background:#102a43;border-radius:14px 14px 0 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="48"><img src="cid:pathways_logo" alt="" width="40" height="40" style="display:block;border:0;border-radius:20px"></td><td style="font-size:20px;font-weight:bold;color:#ffffff">Podar Pathways<br><span style="font-size:11px;line-height:20px;font-weight:normal;color:#b7cbdc">CAREER DEVELOPMENT &amp; PLACEMENT</span></td></tr></table></td></tr>
<tr><td style="height:3px;background:#12877e;font-size:0;line-height:3px">&nbsp;</td></tr>
<tr><td class="email-padding" style="padding:34px 32px 36px"><p style="margin:0 0 12px;font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#087c72">{$label}</p><h1 class="email-title" style="margin:0 0 24px;font-size:28px;line-height:36px;letter-spacing:-.5px;color:#102a43">{$headline}</h1>{$content}</td></tr>
<tr><td class="email-padding" style="padding:22px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 14px 14px"><p style="margin:0 0 8px;font-size:12px;line-height:20px;color:#526477">Sent to {$recipient} by Podar Pathways.<br>This is an automated account notification.</p><p style="margin:0;font-size:11px;line-height:18px;color:#718096">&copy; {$year} Podar Pathways. All rights reserved.</p></td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>
HTML;
    }
}
