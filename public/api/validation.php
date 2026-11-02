<?php
function validatePassword($value): void {
    if (!is_string($value) || strlen($value) < 8 || strlen($value) > 72 || !preg_match('/[A-Z]/', $value) || !preg_match('/[a-z]/', $value) || !preg_match('/[0-9]/', $value) || !preg_match('/[^A-Za-z0-9\s]/', $value)) jsonError('Use 8–72 characters with uppercase, lowercase, a number and a symbol.');
}
function validateRequestFields(array $body, string $route): void {
    foreach (['email','phone','otp','password','newPassword','currentPassword','name','goal','pinCode','dob','state','district','github','linkedin','portfolio','portfolioUrl'] as $key) {
        if (isset($body[$key]) && !is_scalar($body[$key])) jsonError('Invalid value for ' . $key . '.');
    }
    if (isset($body['email']) && $body['email'] !== '' && !cleanEmail($body['email'])) jsonError('Enter a valid email address.');
    if (isset($body['phone']) && $body['phone'] !== '' && !preg_match('/^[0-9]{10}$/', cleanPhone($body['phone']))) jsonError('Enter a valid 10-digit mobile number.');
    if (isset($body['otp']) && !preg_match('/^[0-9]{6}$/', (string)$body['otp'])) jsonError('Enter the 6-digit verification code.');
    if (isset($body['password']) && (str_ends_with($route, '/register') || str_ends_with($route, '/reset') || $route === '/admins')) validatePassword($body['password']);
    if (isset($body['newPassword'])) {
        validatePassword($body['newPassword']);
        if (empty($body['currentPassword'])) jsonError('Enter your current password.');
        if ($body['newPassword'] === $body['currentPassword']) jsonError('Choose a different new password.');
    }
    if (isset($body['goal']) && strlen($body['goal']) > 800) jsonError('Career goal is too long.');
    if (!empty($body['pinCode']) && !preg_match('/^[0-9]{6}$/', (string)$body['pinCode'])) jsonError('Enter a valid 6-digit PIN code.');
    if (!empty($body['dob'])) {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $body['dob']);
        if (!$date || $date->format('Y-m-d') !== $body['dob'] || $date > new DateTimeImmutable('today')) jsonError('Enter a valid date of birth in the past.');
    }
    foreach (['github','linkedin','portfolio','portfolioUrl','demoUrl','githubUrl','youtubeUrl'] as $field) {
        if (empty($body[$field])) continue;
        if (!is_string($body[$field])) jsonError('Enter a valid website address.');
        $url = str_contains($body[$field], '://') ? $body[$field] : 'https://' . $body[$field];
        if (!filter_var($url, FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($url, PHP_URL_SCHEME) ?? ''), ['https','http'], true)) jsonError('Enter a valid website address for ' . $field . '.');
    }
}
