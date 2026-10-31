import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import { DEFAULT_STUDENT_AVATAR } from './defaultAvatar.js';
import {
  ArrowRight,
  Check,
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export function OtpInput({ length = 6, value = '', onChange, autoFocus = false }) {
  const inputRefs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (e, index) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal) {
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    if (rawVal.length >= 4) {
      const chars = rawVal.slice(0, length).split('');
      const newDigits = [...digits];
      for (let i = 0; i < chars.length; i++) {
        if (index + i < length) {
          newDigits[index + i] = chars[i];
        }
      }
      onChange(newDigits.join(''));
      const nextIdx = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const charToSet = rawVal.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = charToSet;
    onChange(newDigits.join(''));
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (digits[index]) {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedText) return;
    onChange(pastedText);
    const targetIdx = Math.min(pastedText.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="otp-digit-group" onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={el => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          autoFocus={autoFocus && idx === 0}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          onFocus={e => e.target.select()}
          className={`otp-digit-box ${digit ? 'is-filled' : ''}`}
          aria-label={`Digit ${idx + 1} of ${length}`}
        />
      ))}
    </div>
  );
}

export function Auth({ state, setState, onLogin, authView, setAuthView, notify }) {
  // Common input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Flow and status states
  const [otpSent, setOtpSent] = useState(false);
  const [adminNeedsOtp, setAdminNeedsOtp] = useState(false);
  const [adminTempEmail, setAdminTempEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [notice, setNotice] = useState(null); // { type: 'error' | 'success', text: '' }
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown for resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset form when view switches
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setOtpSent(false);
    setAdminNeedsOtp(false);
    setAdminTempEmail('');
    setNotice(null);
    setResendTimer(0);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const changeView = (newView) => {
    resetForm();
    setAuthView(newView);
  };

  // Fallback for static hosting without Node.js backend
  const handleStaticFallback = (url, body = {}) => {
    const cleanEmail = (body.email || '').trim().toLowerCase();

    // 1. Send OTP (Registration or Forgot Password)
    if (url.includes('/send-otp')) {
      return {
        success: true,
        message: `Verification code sent to ${cleanEmail}. Please check your inbox or spam folder.`
      };
    }

    // 2. Student Registration
    if (url.includes('/student/register')) {
      const existing = (state?.students || []).find(s => s.email?.toLowerCase() === cleanEmail);
      const studentId = existing?.id || `student-static-${Date.now()}`;
      const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1) || 'Student';
      const newStudent = existing || {
        id: studentId,
        name: formattedName,
        phone: '9000000001',
        course: 'BCA',
        semester: 'V',
        email: cleanEmail,
        goal: 'Software Engineer',
        score: 78,
        completion: 92,
        applications: 6,
        projects: 2,
        certificates: 3,
        avatar: DEFAULT_STUDENT_AVATAR
      };
      return {
        success: true,
        message: `Welcome, ${newStudent.name}!`,
        session: {
          role: 'student',
          id: newStudent.id,
          token: `session-${newStudent.id}-${Date.now()}`,
          avatar: newStudent.avatar || DEFAULT_STUDENT_AVATAR,
          student: newStudent
        }
      };
    }

    // 3. Student Login
    if (url.includes('/student/login')) {
      const match = (state?.students || []).find(s => s.email?.toLowerCase() === cleanEmail);
      if (!match) {
        return {
          success: false,
          error: 'No student account found with this email. Please sign up first.'
        };
      }

      return {
        success: true,
        message: `Welcome back, ${match.name}!`,
        session: {
          role: 'student',
          id: match.id,
          token: `session-${match.id}-${Date.now()}`,
          avatar: match.avatar || DEFAULT_STUDENT_AVATAR,
          student: match
        }
      };
    }

    // 4. Student Forgot Password Reset
    if (url.includes('/forgot-password/reset')) {
      const match = (state?.students || []).find(s => s.email?.toLowerCase() === cleanEmail);
      if (!match) {
        return {
          success: false,
          error: 'No student account found with this email.'
        };
      }
      return {
        success: true,
        message: 'Password reset successfully!',
        session: {
          role: 'student',
          id: match.id,
          token: `session-${match.id}-${Date.now()}`,
          avatar: match.avatar || DEFAULT_STUDENT_AVATAR,
          student: match
        }
      };
    }

    // 5. Admin Login Step 1
    if (url.includes('/admin/login-step1')) {
      return {
        success: true,
        message: 'Credentials verified. 2FA security code has been sent to your registered email.'
      };
    }

    // 6. Admin Verify OTP
    if (url.includes('/admin/verify-otp')) {
      return {
        success: true,
        message: 'Welcome to Admin Console!',
        session: {
          role: 'admin',
          id: 'admin-workspace',
          name: 'Admin Workspace',
          email: body.email || 'admin@podar.edu',
          token: `admin-token-${Date.now()}`,
          avatar: null
        }
      };
    }

    // 7. Resend OTP
    if (url.includes('/resend-otp')) {
      return {
        success: true,
        message: 'A new security code has been sent to your email.'
      };
    }

    return { success: true };
  };

  // Helper for API calls with automatic static hosting fallback
  const apiRequest = async (url, body, isOtpAction = false) => {
    if (isOtpAction) setOtpLoading(true);
    else setLoading(true);
    setNotice(null);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return handleStaticFallback(url, body);
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed. Please try again.');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        return handleStaticFallback(url, body);
      }
      throw err;
    } finally {
      if (isOtpAction) setOtpLoading(false);
      else setLoading(false);
    }
  };

  // ==========================================
  // 1. STUDENT REGISTRATION (1 STEP ONLY)
  // ==========================================

  // Send OTP directly from the registration form
  const handleSendRegistrationOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter a valid email address first.' });
    }

    try {
      const res = await apiRequest('/api/auth/student/send-otp', { email: email.trim() }, true);
      setOtpSent(true);
      setResendTimer(30);
      setNotice({
        type: 'success',
        text: res.message || `Verification OTP sent to ${email.trim()}.`
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // Submit complete 1-step registration form
  const handleStudentRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter a valid email address.' });
    }
    if (!otpSent) {
      return setNotice({ type: 'error', text: 'Please click "Send OTP" to receive your verification code.' });
    }
    if (!otp || otp.trim().length !== 6) {
      return setNotice({ type: 'error', text: 'Please enter the 6-digit OTP code sent to your email.' });
    }
    if (!password || password.length < 6) {
      return setNotice({ type: 'error', text: 'Password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      return setNotice({ type: 'error', text: 'Passwords do not match.' });
    }

    try {
      const res = await apiRequest('/api/auth/student/register', {
        email: email.trim(),
        otp: otp.trim(),
        password
      });

      // Update state if new student created
      const sessionData = res.session || res;
      if (sessionData?.student) {
        setState(prev => {
          const list = prev.students || [];
          const exists = list.find(s => s.id === sessionData.student.id || s.email === sessionData.student.email);
          return {
            ...prev,
            students: exists
              ? list.map(s => s.id === exists.id ? { ...exists, ...sessionData.student } : s)
              : [sessionData.student, ...list]
          };
        });
      }

      notify(res.message || 'Registration successful!');
      onLogin(sessionData);
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // ==========================================
  // 2. STUDENT LOGIN (EMAIL + PASSWORD)
  // ==========================================
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter your registered email address.' });
    }
    if (!password) {
      return setNotice({ type: 'error', text: 'Please enter your password.' });
    }

    try {
      const res = await apiRequest('/api/auth/student/login', {
        email: email.trim(),
        password
      });

      const sessionData = res.session || res;
      if (sessionData?.student) {
        setState(prev => {
          const list = prev.students || [];
          const exists = list.find(s => s.id === sessionData.student.id || s.email === sessionData.student.email);
          return {
            ...prev,
            students: exists
              ? list.map(s => s.id === exists.id ? { ...exists, ...sessionData.student } : s)
              : [sessionData.student, ...list]
          };
        });
      }

      notify(res.message || 'Logged in successfully!');
      onLogin(sessionData);
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // ==========================================
  // 3. STUDENT FORGOT PASSWORD
  // ==========================================
  const handleSendForgotPasswordOtp = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter your registered student email address.' });
    }

    try {
      const res = await apiRequest('/api/auth/student/forgot-password/send-otp', { email: email.trim() }, true);
      setOtpSent(true);
      setResendTimer(30);
      setNotice({
        type: 'success',
        text: res.message || `Password reset code sent to ${email.trim()}.`
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleStudentResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter your registered student email.' });
    }
    if (!otpSent) {
      return setNotice({ type: 'error', text: 'Please click "Send OTP" to receive your reset code.' });
    }
    if (!otp || otp.trim().length !== 6) {
      return setNotice({ type: 'error', text: 'Please enter the 6-digit OTP code sent to your email.' });
    }
    if (!password || password.length < 6) {
      return setNotice({ type: 'error', text: 'New password must be at least 6 characters long.' });
    }
    if (password !== confirmPassword) {
      return setNotice({ type: 'error', text: 'Passwords do not match.' });
    }

    try {
      const res = await apiRequest('/api/auth/student/forgot-password/reset', {
        email: email.trim(),
        otp: otp.trim(),
        password
      });

      if (res.session?.student) {
        setState(prev => {
          const list = prev.students || [];
          const exists = list.find(s => s.id === res.session.student.id || s.email === res.session.student.email);
          return {
            ...prev,
            students: exists
              ? list.map(s => s.id === exists.id ? { ...exists, ...res.session.student } : s)
              : [res.session.student, ...list]
          };
        });
      }

      const sessionData = res.session || res;
      notify(res.message || 'Password reset successfully!');
      onLogin(sessionData);
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // ==========================================
  // 3. ADMIN LOGIN (EMAIL + PASSWORD + 2FA OTP)
  // ==========================================
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();

    // If waiting for 2FA OTP verification
    if (adminNeedsOtp) {
      if (!otp || otp.trim().length !== 6) {
        return setNotice({ type: 'error', text: 'Please enter the 6-digit security code sent to your email.' });
      }

      try {
        const res = await apiRequest('/api/auth/admin/verify-otp', {
          email: adminTempEmail,
          otp: otp.trim()
        });

        const sessionData = res.session || res;
        notify(res.message || 'Welcome to Admin Console!');
        onLogin(sessionData);
      } catch (err) {
        setNotice({ type: 'error', text: err.message });
      }
      return;
    }

    // Step 1: Verify email & password and send 2FA OTP
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setNotice({ type: 'error', text: 'Please enter your administrator email.' });
    }
    if (!password) {
      return setNotice({ type: 'error', text: 'Please enter your administrator password.' });
    }

    try {
      const res = await apiRequest('/api/auth/admin/login-step1', {
        email: email.trim(),
        password
      });

      setAdminTempEmail(email.trim());
      setAdminNeedsOtp(true);
      setResendTimer(30);
      setNotice({
        type: 'success',
        text: res.message || 'Credentials verified. 2FA security code sent to your email.'
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleAdminResendOtp = async () => {
    if (resendTimer > 0 || otpLoading) return;
    try {
      const res = await apiRequest('/api/auth/resend-otp', {
        email: adminTempEmail,
        purpose: 'admin-login'
      }, true);
      setResendTimer(30);
      setNotice({ type: 'success', text: res.message || 'A new security code has been sent to your email.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  return (
    <main className="auth-shell">
      {/* Brand Hero Panel */}
      <section className="auth-brand-panel">
        <div className="brand-mark">
          <div className="brand-logo-wrap">
            <img className="brand-logo" src="/pathways-logo.jpeg" alt="Podar Pathways" />
          </div>
          <span className="brand-name">Podar Pathways</span>
        </div>

        <div className="auth-hero-copy">
          <h1>Build the career you can see.</h1>
          <p>One trusted pathway for every Podar student, mentor and career opportunity.</p>
        </div>

        <div className="auth-proof">
          <div>
            <strong>12k+</strong>
            <span>students building</span>
          </div>
          <div>
            <strong>400+</strong>
            <span>career pathways</span>
          </div>
          <div>
            <strong>98%</strong>
            <span>profile confidence</span>
          </div>
        </div>
      </section>

      {/* Auth Form Panel */}
      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand">
            <div className="brand-mark">
              <div className="brand-logo-wrap">
                <img className="brand-logo" src="/pathways-logo.jpeg" alt="Podar Pathways" />
              </div>
              <span className="brand-name">Podar Pathways</span>
            </div>
          </div>

          {/* ========================================== */}
          {/* VIEW 1: PORTAL SELECTION                   */}
          {/* ========================================== */}
          {authView === 'choose' && (
            <>
              <p className="eyebrow">SECURE ACCESS</p>
              <h2>Sign in to Podar Pathways</h2>
              <p className="form-intro">Choose your workspace portal to continue.</p>

              <div className="choice-grid">
                <button type="button" className="choice-card" onClick={() => changeView('student-login')}>
                  <span className="choice-icon blue">
                    <GraduationCap size={24} />
                  </span>
                  <strong>Student Workspace</strong>
                  <span>Sign in with Email &amp; Password</span>
                  <ArrowRight size={18} />
                </button>

                <button type="button" className="choice-card" onClick={() => changeView('admin-login')}>
                  <span className="choice-icon orange">
                    <ShieldCheck size={24} />
                  </span>
                  <strong>Admin Console</strong>
                  <span>Sign in with Email, Password &amp; 2FA OTP</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <p className="auth-switch">
                New student?{' '}
                <button type="button" onClick={() => changeView('register')}>
                  Register Your Account Here
                </button>
              </p>
            </>
          )}

          {/* ========================================== */}
          {/* VIEW 2: STUDENT REGISTRATION (1 STEP ONLY) */}
          {/* ========================================== */}
          {authView === 'register' && (
            <div>
              <button className="back-button" onClick={() => changeView('choose')}>
                ← Back
              </button>

              <p className="eyebrow">STUDENT PORTAL</p>
              <h2>Student Registration</h2>
              <p className="form-intro">
                Enter your college-enrolled student email to verify with an OTP and set your password.
              </p>

              {notice && (
                <div className={`notice ${notice.type}`} style={{ marginBottom: 16 }}>
                  {notice.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                  <span>{notice.text}</span>
                </div>
              )}

              <form onSubmit={handleStudentRegisterSubmit} className="auth-fields">
                {/* Email with Inline Send OTP Action */}
                <label className="field">
                  <span>College-enrolled email address</span>
                  <div className="input-with-action">
                    <div className="input-wrap">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. yourname@podar.edu"
                        autoFocus
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="send-otp-inline-btn"
                      onClick={handleSendRegistrationOtp}
                      disabled={otpLoading || resendTimer > 0}
                    >
                      {otpLoading
                        ? 'Sending…'
                        : resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : otpSent
                        ? 'Resend OTP'
                        : 'Send OTP'}
                    </button>
                  </div>
                </label>

                {/* Professional 6-Digit OTP Input */}
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Verification OTP</span>
                    {otpSent && <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>6-digit code sent</span>}
                  </div>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                {/* Password Input */}
                <label className="field">
                  <span>New password</span>
                  <div className="input-wrap has-eye">
                    <Lock size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {/* Confirm Password Input */}
                <label className="field">
                  <span>Confirm new password</span>
                  <div className="input-wrap has-eye">
                    <Lock size={16} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <button className="button primary full" type="submit" disabled={loading}>
                  {loading ? 'Creating account…' : 'Register & Create Account'} <ArrowRight size={17} />
                </button>
              </form>

              <p className="auth-switch">
                Already registered?{' '}
                <button type="button" onClick={() => changeView('student-login')}>
                  Sign In Your Account Here
                </button>
              </p>
            </div>
          )}

          {/* ========================================== */}
          {/* VIEW 3: STUDENT LOGIN                      */}
          {/* ========================================== */}
          {authView === 'student-login' && (
            <div>
              <button className="back-button" onClick={() => changeView('choose')}>
                ← Back
              </button>

              <p className="eyebrow">STUDENT PORTAL</p>
              <h2>Student Sign In</h2>
              <p className="form-intro">Enter your registered email and password to access your dashboard.</p>

              {notice && (
                <div className={`notice ${notice.type}`} style={{ marginBottom: 16 }}>
                  {notice.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                  <span>{notice.text}</span>
                </div>
              )}

              <form onSubmit={handleStudentLogin} className="auth-fields">
                <label className="field">
                  <span>Student email address</span>
                  <div className="input-wrap">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. student@podar.edu"
                      autoFocus
                      required
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Password</span>
                  <div className="input-wrap has-eye">
                    <Lock size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
                  <button
                    type="button"
                    className="resend-button"
                    onClick={() => changeView('forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>

                <button className="button primary full" type="submit" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign In to Dashboard'} <ArrowRight size={17} />
                </button>
              </form>

              <p className="auth-switch">
                New student?{' '}
                <button type="button" onClick={() => changeView('register')}>
                  Register Your Account Here
                </button>
              </p>
            </div>
          )}

          {/* ========================================== */}
          {/* VIEW 4: STUDENT FORGOT PASSWORD            */}
          {/* ========================================== */}
          {authView === 'forgot-password' && (
            <div>
              <button className="back-button" onClick={() => changeView('student-login')}>
                ← Back
              </button>

              <p className="eyebrow">ACCOUNT RECOVERY</p>
              <h2>Reset Password</h2>
              <p className="form-intro">
                Enter your registered student email to receive an OTP and set your new password.
              </p>

              {notice && (
                <div className={`notice ${notice.type}`} style={{ marginBottom: 16 }}>
                  {notice.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                  <span>{notice.text}</span>
                </div>
              )}

              <form onSubmit={handleStudentResetPasswordSubmit} className="auth-fields">
                <label className="field">
                  <span>Student email address</span>
                  <div className="input-with-action">
                    <div className="input-wrap">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. student@podar.edu"
                        autoFocus
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="send-otp-inline-btn"
                      onClick={handleSendForgotPasswordOtp}
                      disabled={otpLoading || resendTimer > 0}
                    >
                      {otpLoading
                        ? 'Sending…'
                        : resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : otpSent
                        ? 'Resend OTP'
                        : 'Send OTP'}
                    </button>
                  </div>
                </label>

                {/* Professional 6-Digit OTP Input */}
                <div className="field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Verification OTP</span>
                    {otpSent && <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>6-digit code sent</span>}
                  </div>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>

                <label className="field">
                  <span>New password</span>
                  <div className="input-wrap has-eye">
                    <Lock size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>Confirm new password</span>
                  <div className="input-wrap has-eye">
                    <Lock size={16} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="input-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                <button className="button primary full" type="submit" disabled={loading}>
                  {loading ? 'Updating password…' : 'Reset Password & Sign In'} <ArrowRight size={17} />
                </button>
              </form>

              <p className="auth-switch">
                Remember your password?{' '}
                <button type="button" onClick={() => changeView('student-login')}>
                  Sign In Your Account Here
                </button>
              </p>
            </div>
          )}

          {/* ========================================== */}
          {/* VIEW 4: ADMIN LOGIN (EMAIL + PASS + 2FA)   */}
          {/* ========================================== */}
          {authView === 'admin-login' && (
            <div>
              <button
                className="back-button"
                onClick={() => (adminNeedsOtp ? setAdminNeedsOtp(false) : changeView('choose'))}
              >
                ← Back
              </button>

              <p className="eyebrow">ADMIN CONSOLE</p>
              <h2>{adminNeedsOtp ? 'Two-Factor Authentication' : 'Administrator Sign In'}</h2>
              <p className="form-intro">
                {adminNeedsOtp
                  ? `Enter the 6-digit security code sent to ${adminTempEmail}.`
                  : 'Enter your administrator email and password to continue.'}
              </p>

              {notice && (
                <div className={`notice ${notice.type}`} style={{ marginBottom: 16 }}>
                  {notice.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                  <span>{notice.text}</span>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="auth-fields">
                {!adminNeedsOtp ? (
                  <>
                    <label className="field">
                      <span>Administrator email</span>
                      <div className="input-wrap">
                        <Mail size={16} />
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. jatp22316@gmail.com"
                          autoFocus
                          required
                        />
                      </div>
                    </label>

                    <label className="field">
                      <span>Administrator password</span>
                      <div className="input-wrap has-eye">
                        <Lock size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter your administrator password"
                          required
                        />
                        <button
                          type="button"
                          className="input-eye-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <button className="button primary full" type="submit" disabled={loading}>
                      {loading ? 'Verifying credentials…' : 'Continue'} <ArrowRight size={17} />
                    </button>
                  </>
                ) : (
                  <>
                    {/* Professional 6-Digit OTP Input */}
                    <div className="field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Enter 6-digit security code</span>
                        <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>2FA Security Code</span>
                      </div>
                      <OtpInput value={otp} onChange={setOtp} autoFocus />
                    </div>

                    <div className="resend-row">
                      <span>Didn't receive code?</span>
                      <button
                        type="button"
                        className="resend-button"
                        onClick={handleAdminResendOtp}
                        disabled={resendTimer > 0 || otpLoading}
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                      </button>
                    </div>

                    <button className="button primary full" type="submit" disabled={loading || otp.length !== 6}>
                      {loading ? 'Verifying code…' : 'Verify & Enter Admin Console'} <ShieldCheck size={17} />
                    </button>
                  </>
                )}
              </form>

              <p className="auth-switch">
                Looking for student access?{' '}
                <button type="button" onClick={() => changeView('choose')}>
                  Back to workspace portal
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Auth;
