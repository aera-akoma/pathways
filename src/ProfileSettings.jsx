import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Camera,
  Check,
  BookOpen,
  Upload,
  Trash2,
  Globe,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Code,
  Home,
  Navigation,
  Map,
  Hash,
  Shield,
  AlertCircle,
  Info
} from 'lucide-react';

const INDIAN_STATES_DISTRICTS = {
  'Rajasthan': [
    'Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner', 'Alwar', 'Sikar',
    'Bhilwara', 'Bharatpur', 'Sri Ganganagar', 'Pali', 'Chittorgarh', 'Jhunjhunu',
    'Nagaur', 'Churu', 'Hanumangarh', 'Tonk', 'Dausa', 'Sawai Madhopur', 'Barmer',
    'Jaisalmer', 'Sirohi', 'Rajsamand', 'Banswara', 'Dungarpur', 'Baran', 'Jhalawar',
    'Bundi', 'Dholpur', 'Karauli', 'Pratapgarh', 'Beawar', 'Balotra', 'Deeg',
    'Didwana-Kuchaman', 'Dudu', 'Gangapur City', 'Jaipur Rural', 'Jodhpur Rural',
    'Kekri', 'Kotputli-Behror', 'Khairthal-Tijara', 'Neem Ka Thana', 'Phalodi',
    'Salumber', 'Sanchore', 'Shahpura'
  ],
  'Delhi NCR': [
    'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi',
    'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi',
    'West Delhi', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Gurugram', 'Faridabad'
  ],
  'Maharashtra': [
    'Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik',
    'Chhatrapati Sambhajinagar', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur Nagar', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Ghaziabad',
    'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur', 'Noida (GB Nagar)', 'Mathura', 'Ayodhya'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar',
    'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Mehsana', 'Kutch'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam'
  ],
  'Haryana': [
    'Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar',
    'Karnal', 'Sonipat', 'Panchkula'
  ],
  'Punjab': [
    'Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali (SAS Nagar)'
  ],
  'Karnataka': [
    'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi'
  ],
  'Bihar': [
    'Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'
  ],
  'West Bengal': [
    'Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Darjeeling'
  ],
  'Telangana': [
    'Hyderabad', 'Medchal-Malkajgiri', 'Rangareddy', 'Warangal', 'Nizamabad', 'Karimnagar'
  ],
  'Tamil Nadu': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'
  ],
  'Kerala': [
    'Thiruvananthapuram', 'Kochi (Ernakulam)', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'
  ],
  'Andhra Pradesh': [
    'Visakhapatnam', 'Vijayawada (NTR)', 'Guntur', 'Tirupati', 'Kurnool', 'Nellore'
  ],
  'Assam': [
    'Guwahati (Kamrup Metro)', 'Dibrugarh', 'Silchar (Cachar)', 'Jorhat', 'Nagaon'
  ],
  'Chandigarh': ['Chandigarh'],
  'Goa': ['North Goa', 'South Goa'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala (Kangra)', 'Mandi', 'Solan', 'Kullu'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  'Jharkhand': ['Ranchi', 'Jamshedpur (East Singhbhum)', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
  'Odisha': ['Bhubaneswar (Khurda)', 'Cuttack', 'Rourkela (Sundargarh)', 'Puri', 'Sambalpur'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Rishikesh']
};

export function ProfileSettings({ student, state, setState, session, notify, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');

  // 1. Profile details state (Name and Email locked)
  const [formData, setFormData] = useState({
    name: student?.name || '',
    fathersName: student?.fathersName || '',
    address: student?.address || '',
    houseNo: student?.houseNo || '',
    district: student?.district || '',
    state: student?.state || '',
    pinCode: student?.pinCode || '',
    email: student?.email || '',
    phone: student?.phone || '',
    linkedin: student?.linkedin || '',
    github: student?.github || '',
    portfolioUrl: student?.portfolioUrl || '',
    dob: student?.dob || '',
    avatar: student?.avatar || '',
    course: student?.course || 'BCA',
    semester: student?.semester || 'V',
    goal: student?.goal || '',
    gender: student?.gender || 'Male'
  });

  // Sync state if student changes
  useEffect(() => {
    if (student) {
      setFormData((prev) => ({
        ...prev,
        name: student.name || prev.name,
        email: student.email || prev.email,
        phone: student.phone || prev.phone,
        fathersName: student.fathersName || prev.fathersName,
        address: student.address || prev.address,
        houseNo: student.houseNo || prev.houseNo,
        district: student.district || prev.district,
        state: student.state || prev.state,
        pinCode: student.pinCode || prev.pinCode,
        linkedin: student.linkedin || prev.linkedin,
        github: student.github || prev.github,
        portfolioUrl: student.portfolioUrl || prev.portfolioUrl,
        dob: student.dob || prev.dob,
        avatar: student.avatar || prev.avatar,
        course: student.course || prev.course,
        semester: student.semester || prev.semester,
        goal: student.goal || prev.goal,
        gender: student.gender || prev.gender
      }));
    }
  }, [student]);

  // 2. Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const reqMatch = Boolean(
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword
  );

  // Dynamic districts based on selected state
  const currentDistricts = (formData.state && INDIAN_STATES_DISTRICTS[formData.state])
    ? INDIAN_STATES_DISTRICTS[formData.state]
    : INDIAN_STATES_DISTRICTS['Rajasthan'];

  // 3. Notification Preferences (saved in localStorage)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('podar-notifications-settings');
      return saved ? JSON.parse(saved) : {
        jobAlerts: true,
        interviewReminders: true,
        weeklyDigest: true,
        collegeNotices: true,
        quizDeadlines: true,
        soundEffects: true
      };
    } catch {
      return {
        jobAlerts: true,
        interviewReminders: true,
        weeklyDigest: true,
        collegeNotices: true,
        quizDeadlines: true,
        soundEffects: true
      };
    }
  });

  const fileInputRef = useRef(null);

  const handleProfileChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('podar-notifications-settings', JSON.stringify(updated));
      return updated;
    });
    if (notify) notify('Notification preferences updated.');
  };

  // Avatar Upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (notify) notify('Please upload a valid image (JPG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      if (notify) notify('Image file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setFormData((prev) => ({ ...prev, avatar: base64 }));
      if (notify) notify('Photo uploaded. Click "Save details" to apply.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (notify) notify('Profile photo removed.');
  };

  // Save Profile Details
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      if (notify) notify('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (formData.pinCode && formData.pinCode.length !== 6) {
      if (notify) notify('Please enter a valid 6-digit PIN code.');
      return;
    }

    setIsSavingProfile(true);

    try {
      if (student?.id) {
        try {
          const res = await fetch(`http://localhost:5000/api/students/${student.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              name: student.name,
              email: student.email
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('Backend update note:', errData);
          }
        } catch (serverErr) {
          console.warn('Backend offline, saving locally:', serverErr);
        }
      }

      if (setState) {
        setState((prev) => {
          const updatedStudents = (prev.students || []).map((s) =>
            s.id === student?.id ? { ...s, ...formData, name: student.name, email: student.email } : s
          );
          return {
            ...prev,
            students: updatedStudents
          };
        });
      }

      if (notify) {
        notify('Profile details saved successfully.');
      }
    } catch (err) {
      if (notify) notify(err.message || 'Error saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();

    if (!passwordData.newPassword) {
      if (notify) notify('Please enter your new password.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      if (notify) notify('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      if (notify) notify('New passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);

    try {
      if (student?.id) {
        const res = await fetch(`http://localhost:5000/api/students/${student.id}/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update password.');
        }

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        if (notify) {
          notify(data.message || 'Password changed successfully. You can now use your new password to sign in.');
        }
      } else {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        if (notify) notify('Demo account password updated.');
      }
    } catch (err) {
      if (notify) notify(err.message || 'Could not update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="profile-settings-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">ACCOUNT &amp; SETTINGS</p>
          <h1>Profile &amp; Settings</h1>
          <p>Manage your verified student records, login security, and platform preferences.</p>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="settings-nav-bar">
        <button
          type="button"
          className={`settings-nav-pill ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>Profile &amp; Details</span>
        </button>

        <button
          type="button"
          className={`settings-nav-pill ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <Lock size={16} />
          <span>Login &amp; Security</span>
        </button>

        <button
          type="button"
          className={`settings-nav-pill ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={16} />
          <span>Notifications</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: PROFILE & DETAILS                                     */}
      {/* ============================================================ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="panel profile-main-card">
          {/* Avatar Hero Banner */}
          <div className="profile-hero-section">
            <div className="profile-avatar-container">
              <div
                className="profile-avatar-circle"
                onClick={() => fileInputRef.current?.click()}
                title="Click to change profile picture"
              >
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.name || 'Student'}
                    className="profile-avatar-img"
                  />
                ) : (
                  <div className="profile-avatar-initials">{getInitials(formData.name)}</div>
                )}
                <div className="profile-avatar-overlay">
                  <Camera size={18} />
                </div>
              </div>

              {formData.avatar && (
                <button
                  type="button"
                  className="profile-avatar-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAvatar();
                  }}
                  title="Remove profile photo"
                >
                  <Trash2 size={13} />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>

            <div className="profile-hero-info">
              <div className="profile-hero-title-row">
                <h2>{formData.name || student?.name || 'Student Name'}</h2>
                <span className="verified-icon-only" title="Verified Student">
                  <ShieldCheck size={20} />
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Personal Details (Balanced 2x2 Grid) */}
          <div className="profile-section">
            <div className="profile-section-heading">
              <User size={18} className="profile-section-icon" />
              <div>
                <h3>Personal Identity &amp; Records</h3>
                <p>Official identification records registered with Podar Pathways.</p>
              </div>
            </div>

            <div className="profile-grid-2">
              {/* Full Name (LOCKED to Login Identity) */}
              <div className="field">
                <label>
                  Full Name
                  <span className="locked-badge" title="Official Login Identity (Locked)">
                    <Lock size={12} />
                  </span>
                </label>
                <div className="input-wrap">
                  <User size={17} />
                  <input
                    type="text"
                    value={formData.name || student?.name || ''}
                    readOnly
                    className="input-locked"
                    title="Official registered name is attached to login"
                  />
                </div>
                <small className="field-hint-locked">
                  <Lock size={11} /> Official verified record. Contact administration to modify.
                </small>
              </div>

              {/* Father's Name */}
              <div className="field">
                <label>Father's Name</label>
                <div className="input-wrap">
                  <Users size={17} />
                  <input
                    type="text"
                    value={formData.fathersName}
                    onChange={(e) => handleProfileChange('fathersName', e.target.value)}
                    placeholder="Enter father's name"
                  />
                </div>
              </div>

              {/* Date of Birth (DOB) */}
              <div className="field">
                <label>Date of Birth (DOB)</label>
                <div className="input-wrap">
                  <Calendar size={17} />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleProfileChange('dob', e.target.value)}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="field">
                <label>Gender</label>
                <div className="input-wrap">
                  <User size={17} />
                  <select
                    className="select-custom"
                    value={formData.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Online Presence (Balanced 2-Column Grid) */}
          <div className="profile-section">
            <div className="profile-section-heading">
              <Mail size={18} className="profile-section-icon" />
              <div>
                <h3>Contact &amp; Online Presence</h3>
                <p>Your official communication channels and web portfolios.</p>
              </div>
            </div>

            <div className="profile-grid-2">
              {/* Email Address (LOCKED to Login Identity) */}
              <div className="field">
                <label>
                  Email Address
                  <span className="locked-badge" title="Official Login Email (Locked)">
                    <Lock size={12} />
                  </span>
                </label>
                <div className="input-wrap">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={formData.email || student?.email || ''}
                    readOnly
                    className="input-locked"
                    title="Login email is attached to your account and cannot be modified"
                  />
                </div>
                <small className="field-hint-locked">
                  <Lock size={11} /> Attached to login. Used for verification OTPs and notices.
                </small>
              </div>

              {/* Mobile Number */}
              <div className="field">
                <label>Mobile Number</label>
                <div className="input-wrap">
                  <Phone size={17} />
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              {/* LinkedIn Profile */}
              <div className="field">
                <label>LinkedIn Profile URL</label>
                <div className="input-wrap">
                  <Globe size={17} />
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => handleProfileChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              {/* GitHub / Repository URL */}
              <div className="field">
                <label>GitHub Profile URL</label>
                <div className="input-wrap">
                  <Code size={17} />
                  <input
                    type="url"
                    value={formData.github}
                    onChange={(e) => handleProfileChange('github', e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              {/* Portfolio / Personal Website */}
              <div className="field full-width">
                <label>Portfolio / Personal Website</label>
                <div className="input-wrap">
                  <Globe size={17} />
                  <input
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => handleProfileChange('portfolioUrl', e.target.value)}
                    placeholder="https://yourname.dev"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Permanent Residential Address */}
          <div className="profile-section">
            <div className="profile-section-heading">
              <MapPin size={18} className="profile-section-icon" />
              <div>
                <h3>Permanent Residential Address</h3>
                <p>Official residential records for college postal communication and identity verification.</p>
              </div>
            </div>

            <div className="profile-grid-2">
              {/* House / Flat / Building No. */}
              <div className="field">
                <label>House / Flat / Building No.</label>
                <div className="input-wrap">
                  <Home size={17} />
                  <input
                    type="text"
                    value={formData.houseNo}
                    onChange={(e) => handleProfileChange('houseNo', e.target.value)}
                    placeholder="Flat, house or building number"
                  />
                </div>
              </div>

              {/* Street / Colony / Landmark */}
              <div className="field">
                <label>Street / Colony / Landmark</label>
                <div className="input-wrap">
                  <MapPin size={17} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    placeholder="Street address, colony or landmark"
                  />
                </div>
              </div>
            </div>

            <div className="profile-grid-3" style={{ marginTop: '18px' }}>
              {/* District Dropdown */}
              <div className="field">
                <label>District</label>
                <div className="input-wrap">
                  <Navigation size={17} />
                  <select
                    className="select-custom"
                    value={formData.district}
                    onChange={(e) => handleProfileChange('district', e.target.value)}
                  >
                    <option value="">Select District</option>
                    {formData.district && !currentDistricts.includes(formData.district) && (
                      <option value={formData.district}>{formData.district}</option>
                    )}
                    {currentDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* State Dropdown */}
              <div className="field">
                <label>State</label>
                <div className="input-wrap">
                  <Map size={17} />
                  <select
                    className="select-custom"
                    value={formData.state || 'Rajasthan'}
                    onChange={(e) => {
                      const newState = e.target.value;
                      handleProfileChange('state', newState);
                      const list = INDIAN_STATES_DISTRICTS[newState];
                      if (list && !list.includes(formData.district)) {
                        handleProfileChange('district', '');
                      }
                    }}
                  >
                    <option value="">Select State</option>
                    {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PIN Code */}
              <div className="field">
                <label>PIN Code (6 digits)</label>
                <div className="input-wrap">
                  <Hash size={17} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => handleProfileChange('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit PIN code"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Academic & Career Pathway */}
          <div className="profile-section">
            <div className="profile-section-heading">
              <GraduationCap size={18} className="profile-section-icon" />
              <div>
                <h3>Academic &amp; Career Pathway</h3>
                <p>Your degree program and target professional objectives.</p>
              </div>
            </div>

            <div className="profile-grid-2">
              <div className="field">
                <label>Course</label>
                <div className="input-wrap">
                  <GraduationCap size={17} />
                  <select
                    className="select-custom"
                    value={formData.course}
                    onChange={(e) => handleProfileChange('course', e.target.value)}
                  >
                    <option value="">Select Course</option>
                    {['BCA', 'BBA', 'B.Tech', 'MCA', 'MBA'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {formData.course && !['BCA', 'BBA', 'B.Tech', 'MCA', 'MBA'].some(c => c.toLowerCase() === formData.course.toLowerCase()) && (
                      <option value={formData.course}>{formData.course}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="field">
                <label>Current Semester</label>
                <div className="input-wrap">
                  <BookOpen size={17} />
                  <select
                    className="select-custom"
                    value={formData.semester}
                    onChange={(e) => handleProfileChange('semester', e.target.value)}
                  >
                    <option value="">Select Semester</option>
                    {['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                    {formData.semester && !['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'].some(s => s.toLowerCase() === formData.semester.toLowerCase()) && (
                      <option value={formData.semester}>{formData.semester}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="field full-width">
                <label>Career Goal &amp; Professional Summary</label>
                <textarea
                  rows={3}
                  value={formData.goal}
                  onChange={(e) => handleProfileChange('goal', e.target.value)}
                  placeholder="Enter your target career path and professional objectives"
                />
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="profile-footer-bar">
            <p className="profile-footer-note">
              <Info size={16} /> Changes made to your profile details will reflect across your student portal records.
            </p>
            <button
              type="submit"
              className="button primary"
              disabled={isSavingProfile}
            >
              <Check size={17} />
              {isSavingProfile ? 'Saving details...' : 'Save details'}
            </button>
          </div>
        </form>
      )}

      {/* ============================================================ */}
      {/* TAB 2: LOGIN & SECURITY                                      */}
      {/* ============================================================ */}
      {activeTab === 'security' && (
        <div className="settings-section-stack">
          {/* Card 1: Account Access / Sign-in Credentials */}
          <div className="panel security-credentials-card">
            <div className="security-card-header">
              <div>
                <h3>Account Sign-in</h3>
                <p>Manage your primary login credentials and account access.</p>
              </div>
            </div>

            <div className="security-credentials-list">
              <div className="security-credential-row">
                <div className="credential-row-left">
                  <div className="credential-icon-box">
                    <Mail size={18} />
                  </div>
                  <div className="credential-row-info">
                    <span className="credential-label">Sign-in Email</span>
                    <strong className="credential-value">{formData.email || student?.email || 'Registered Email'}</strong>
                  </div>
                </div>
                <div className="credential-row-right">
                  <span className="credential-status-badge verified">
                    <Check size={13} /> Verified
                  </span>
                </div>
              </div>

              <div className="security-credential-row">
                <div className="credential-row-left">
                  <div className="credential-icon-box">
                    <Lock size={18} />
                  </div>
                  <div className="credential-row-info">
                    <span className="credential-label">Password</span>
                    <strong className="credential-value password-dots">••••••••••••••••</strong>
                  </div>
                </div>
                <div className="credential-row-right">
                  <span className="credential-status-badge active">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Change Password */}
          <form onSubmit={handleUpdatePassword} className="panel security-password-card">
            <div className="security-card-header">
              <div>
                <h3>Change Password</h3>
                <p>Update your password to keep your student account secure.</p>
              </div>
            </div>

            <div className="security-form-fields">
              {/* Current Password */}
              <div className="field">
                <label>
                  Current Password <span className="required-star">*</span>
                </label>
                <div className="input-wrap">
                  <Lock size={17} />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Grid 2: New Password & Confirm Password */}
              <div className="profile-grid-2">
                <div className="field">
                  <label>
                    New Password <span className="required-star">*</span>
                  </label>
                  <div className="input-wrap">
                    <KeyRound size={17} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="field-hint">Must be at least 6 characters</span>
                </div>

                <div className="field">
                  <label>
                    Confirm New Password <span className="required-star">*</span>
                  </label>
                  <div className="input-wrap">
                    <KeyRound size={17} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="input-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && (
                    <span className={`field-hint ${reqMatch ? 'hint-success' : 'hint-error'}`}>
                      {reqMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="security-form-actions">
                <button
                  type="submit"
                  className="button primary"
                  disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  <Check size={16} />
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
                {(passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: NOTIFICATIONS & ALERTS                                */}
      {/* ============================================================ */}
      {activeTab === 'notifications' && (
        <div className="panel settings-stack-card">
          <div className="panel-heading">
            <h2>
              <Bell size={18} />
              Notification &amp; Alert Preferences
            </h2>
          </div>
          <p className="settings-desc">Choose how you want to be informed about new openings, interviews, and deadlines.</p>

          <div className="settings-toggle-list">
            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Placement &amp; Internship Openings</strong>
                <p>Receive email alerts as soon as new matched company openings are published for your branch.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.jobAlerts}
                  onChange={() => toggleNotification('jobAlerts')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Interview &amp; Mock Test Reminders</strong>
                <p>Get notification reminders 24 hours before your scheduled interviews and tests.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.interviewReminders}
                  onChange={() => toggleNotification('interviewReminders')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Weekly P-CARE Progress Digest</strong>
                <p>Weekly breakdown of your readiness score, roadmap tasks, and AI coach tips.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.weeklyDigest}
                  onChange={() => toggleNotification('weeklyDigest')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Campus Competitions &amp; Hackathons</strong>
                <p>Important notices for Startupthon 2026, Smart India Hackathon, and innovation summits.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.collegeNotices}
                  onChange={() => toggleNotification('collegeNotices')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Quiz &amp; Project Deadline Alerts</strong>
                <p>Notify 48 hours before course assignments, quizzes, and project submission deadlines.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.quizDeadlines}
                  onChange={() => toggleNotification('quizDeadlines')}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="setting-toggle-copy">
                <strong>Audio Chimes &amp; In-App Sounds</strong>
                <p>Play subtle audio cues for milestones reached and live interview invites.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.soundEffects}
                  onChange={() => toggleNotification('soundEffects')}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
