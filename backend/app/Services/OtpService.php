<?php

namespace App\Services;

use App\Models\EmailOtp;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class OtpService
{
    const OTP_EXPIRY_SECONDS = 600; // 10 minutes

    public static function generateOtp(string $email, string $purpose, string $role = 'student', ?string $payload = null): string
    {
        $code = str_pad((string)random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $now = time();
        $expires = $now + self::OTP_EXPIRY_SECONDS;

        // Invalidate old OTPs for same email & purpose
        EmailOtp::where('email', strtolower(trim($email)))
            ->where('purpose', $purpose)
            ->delete();

        EmailOtp::create([
            'email' => strtolower(trim($email)),
            'code' => $code,
            'role' => $role,
            'purpose' => $purpose,
            'payload' => $payload,
            'createdAt' => $now,
            'expiresAt' => $expires,
            'isUsed' => 0,
            'attempts' => 0,
        ]);

        return $code;
    }

    public static function verifyOtp(string $email, string $code, string $purpose): bool
    {
        $cleanEmail = strtolower(trim($email));
        $cleanCode = trim($code);

        // Allow developer/test bypass in local environment
        if (app()->environment('local') && ($cleanCode === '123456' || $cleanCode === '000000')) {
            EmailOtp::where('email', $cleanEmail)
                ->where('purpose', $purpose)
                ->update(['isUsed' => 1]);
            return true;
        }

        $now = time();
        $record = EmailOtp::where('email', $cleanEmail)
            ->where('purpose', $purpose)
            ->where('isUsed', 0)
            ->where('expiresAt', '>=', $now)
            ->orderBy('id', 'desc')
            ->first();

        if (!$record) {
            return false;
        }

        if ($record->attempts >= 5) {
            $record->delete();
            return false;
        }

        if ($record->code !== $cleanCode) {
            $record->increment('attempts');
            return false;
        }

        $record->update(['isUsed' => 1]);
        return true;
    }

    public static function sendOtpEmail(string $email, string $name, string $otp, string $purpose): bool
    {
        Log::info("[OTP SERVICE] OTP for {$email} ({$purpose}): {$otp}");

        // In local development or without live SMTP, simulation succeeds
        if (app()->environment('local')) {
            return true;
        }

        try {
            $subjectTitles = [
                'registration' => 'Your Podar Pathways verification code',
                'admin-login' => 'Verify your Podar Pathways administrator sign-in',
                'reset-password' => 'Reset your Podar Pathways password',
            ];
            $subject = $subjectTitles[$purpose] ?? 'Podar Pathways - Verification Code';

            Mail::raw("Hello {$name},\n\nYour security verification code is: {$otp}\n\nThis code expires in 10 minutes.\n\nPodar Pathways Career Operating System", function ($message) use ($email, $subject) {
                $message->to($email)
                    ->subject($subject);
            });
            return true;
        } catch (\Throwable $e) {
            Log::error("[OTP SERVICE] Email dispatch error: " . $e->getMessage());
            return false;
        }
    }
}
