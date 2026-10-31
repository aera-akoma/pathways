import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from './defaultAvatar.js';
import { INITIAL_CERTIFICATES } from './defaultCertificates.js';
import {
  User,
  Search,
  Building2,
  UserCheck,
  Compass,
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
  BellOff,
  Code,
  Home,
  Navigation,
  Hash,
  Shield,
  AlertCircle,
  Info,
  Grid,
  Award,
  Bookmark,
  Settings,
  Share2,
  BadgeCheck,
  Heart,
  MessageCircle,
  ExternalLink,
  Layers,
  Plus,
  Link2,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  X,
  Trophy,
  Flame,
  Briefcase
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
    'Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad',
    'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Satara', 'Sangli'
  ],
  'Gujarat': [
    'Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar',
    'Junagadh', 'Anand', 'Navsari', 'Morbi'
  ],
  'Uttar Pradesh': [
    'Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Noida', 'Ghaziabad',
    'Meerut', 'Aligarh', 'Bareilly', 'Gorakhpur', 'Mathura'
  ],
  'Madhya Pradesh': [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam'
  ],
  'Karnataka': [
    'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi'
  ]
};

const DEFAULT_STUDENT_PROJECTS = [];

export function ProfileSettings({ student, studentId, courses, state, setState, session, notify, onLogout, navigate, initialTab }) {
  const getTabFromUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const t = searchParams.get('tab');
      if (t && ['posts', 'certificates', 'saved', 'edit', 'security', 'notifications', 'directory', 'office'].includes(t)) {
        return t;
      }
    } catch (e) {}
    return initialTab || 'posts';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    try {
      const url = new URL(window.location.href);
      if (newTab === 'posts') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', newTab);
      }
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  };

  useEffect(() => {
    const handleRouteChange = (evt) => {
      const tabParam = evt.detail?.params?.tab;
      if (tabParam && ['posts', 'certificates', 'saved', 'edit', 'security', 'notifications', 'directory', 'office'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener('podar-route-change', handleRouteChange);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('podar-route-change', handleRouteChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Form State
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
    avatar: student?.avatar || DEFAULT_STUDENT_AVATAR,
    course: student?.course || 'BCA',
    semester: student?.semester || 'V',
    goal: student?.goal || 'Aspiring Software Engineer',
    gender: student?.gender || 'Male',
    bio: student?.bio || 'Building modern full-stack web and cloud applications. Passionate about algorithms, design systems, and practical AI solutions. Podar Pathways \'26 🚀'
  });

  // Sync state if student changes
  useEffect(() => {
    if (student) {
      setFormData(prev => ({
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
        avatar: student.avatar || prev.avatar || DEFAULT_STUDENT_AVATAR,
        course: student.course || prev.course,
        semester: student.semester || prev.semester,
        goal: student.goal || prev.goal,
        gender: student.gender || prev.gender,
        bio: student.bio || prev.bio
      }));
    }
  }, [student]);

  // Username
  const username = useMemo(() => {
    if (student?.username) return student.username;
    if (student?.name) return student.name.toLowerCase().replace(/\s+/g, '.');
    return 'student';
  }, [student]);

  // Quick View Project Lightbox
  const [selectedProject, setSelectedProject] = useState(null);

  // Student Projects
  const [userProjects, setUserProjects] = useState([]);
  useEffect(() => {
    let localPosts = [];
    try {
      const saved = localStorage.getItem('podar_local_projects');
      if (saved) localPosts = JSON.parse(saved);
    } catch (e) {}

    fetch('/api/projects?limit=30')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const posts = data?.posts || [];
        const combined = [...localPosts, ...posts];
        const userSpecific = combined.filter(p => p.studentId === student?.id || p.author?.id === student?.id);
        if (userSpecific.length > 0) {
          setUserProjects(userSpecific);
        } else {
          setUserProjects(DEFAULT_STUDENT_PROJECTS);
        }
      })
      .catch(() => {
        setUserProjects(localPosts.length > 0 ? localPosts : DEFAULT_STUDENT_PROJECTS);
      });
  }, [student?.id]);

  // Student Certificates
  const [userCertificates, setUserCertificates] = useState([]);
  useEffect(() => {
    let certsList = INITIAL_CERTIFICATES;
    try {
      const saved = localStorage.getItem('podar-pathways-certificates');
      if (saved) certsList = JSON.parse(saved);
    } catch (e) {}

    fetch('/api/certificates')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setUserCertificates(data.filter(c => c.studentId === student?.id));
        } else {
          setUserCertificates(certsList.filter(c => c.studentId === student?.id));
        }
      })
      .catch(() => {
        setUserCertificates(certsList.filter(c => c.studentId === student?.id));
      });
  }, [student?.id]);

  // Password change state
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
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Dynamic districts based on selected state
  const currentDistricts = (formData.state && INDIAN_STATES_DISTRICTS[formData.state])
    ? INDIAN_STATES_DISTRICTS[formData.state]
    : INDIAN_STATES_DISTRICTS['Rajasthan'];

  // Notification Preferences
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('podar-notifications-settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      jobAlerts: true,
      interviewReminders: true,
      weeklyDigest: true,
      collegeNotices: true,
      quizDeadlines: true,
      soundEffects: true
    };
  });

  const fileInputRef = useRef(null);

  // Avatar Upload with Compression
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify?.('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);

        setFormData(prev => ({ ...prev, avatar: compressedBase64 }));

        if (setState) {
          setState(prev => {
            const list = prev.students || [];
            return {
              ...prev,
              students: list.map(s => s.id === student?.id ? { ...s, avatar: compressedBase64 } : s)
            };
          });
        }

        try {
          const cur = JSON.parse(localStorage.getItem('podar-pathways-session') || 'null');
          if (cur) {
            if (cur.student) cur.student.avatar = compressedBase64;
            cur.avatar = compressedBase64;
            localStorage.setItem('podar-pathways-session', JSON.stringify(cur));
          }
        } catch (sessErr) {}

        if (student?.id) {
          fetch(`/api/students/${student.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: compressedBase64 })
          }).catch(() => {});
        }

        window.dispatchEvent(new CustomEvent('podar-student-updated', { detail: { avatar: compressedBase64 } }));
        notify?.('Profile photo updated successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (setState) {
      setState(prev => {
        const list = prev.students || [];
        return {
          ...prev,
          students: list.map(s => s.id === student?.id ? { ...s, avatar: '' } : s)
        };
      });
    }

    try {
      const cur = JSON.parse(localStorage.getItem('podar-pathways-session') || 'null');
      if (cur) {
        if (cur.student) cur.student.avatar = '';
        cur.avatar = '';
        localStorage.setItem('podar-pathways-session', JSON.stringify(cur));
      }
    } catch (sessErr) {}

    if (student?.id) {
      fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: '' })
      }).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('podar-student-updated', { detail: { avatar: '' } }));
    notify?.('Profile photo removed.');
  };

  // Save Profile Form
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      notify?.('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (formData.pinCode && formData.pinCode.length !== 6) {
      notify?.('Please enter a valid 6-digit PIN code.');
      return;
    }

    setIsSavingProfile(true);

    try {
      if (student?.id) {
        try {
          await fetch(`/api/students/${student.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              name: student.name,
              email: student.email
            })
          });
        } catch (serverErr) {}
      }

      if (setState) {
        setState(prev => {
          const updatedStudents = (prev.students || []).map(s =>
            s.id === student?.id ? { ...s, ...formData, name: student.name, email: student.email } : s
          );
          return { ...prev, students: updatedStudents };
        });
      }

      try {
        const cur = JSON.parse(localStorage.getItem('podar-pathways-session') || 'null');
        if (cur && cur.student) {
          cur.student = { ...cur.student, ...formData, name: student.name, email: student.email };
          localStorage.setItem('podar-pathways-session', JSON.stringify(cur));
        }
      } catch (sessErr) {}

      notify?.('Profile details saved successfully!');
    } catch (err) {
      notify?.(err.message || 'Error saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();

    if (!passwordData.newPassword) {
      notify?.('Please enter your new password.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      notify?.('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify?.('New passwords do not match. Please re-enter.');
      return;
    }

    setIsChangingPassword(true);

    try {
      if (student?.id) {
        const res = await fetch(`/api/students/${student.id}/change-password`, {
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

        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        notify?.('Password updated successfully! You can now use your new password.');
      } else {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        notify?.('Account password updated successfully.');
      }
    } catch (err) {
      notify?.(err.message || 'Could not update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Target user identification (URL query param or prop)
  const getTargetUserIdFromUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get('id') || searchParams.get('user') || studentId || null;
    } catch (e) {
      return studentId || null;
    }
  };

  const [targetUserId, setTargetUserId] = useState(getTargetUserIdFromUrl);

  // Sync when route or history changes
  useEffect(() => {
    const handleSyncUser = () => {
      setTargetUserId(getTargetUserIdFromUrl());
    };
    window.addEventListener('popstate', handleSyncUser);
    window.addEventListener('podar-route-change', handleSyncUser);
    return () => {
      window.removeEventListener('popstate', handleSyncUser);
      window.removeEventListener('podar-route-change', handleSyncUser);
    };
  }, [studentId]);

  // Load all administrators for Directory & Profile Switching
  const [allAdmins, setAllAdmins] = useState([
    {
      id: 'admin-podar-root',
      name: 'Podar Administrator',
      email: 'admin@podar.edu',
      phone: '9999988888',
      role: 'Super Admin',
      department: 'Career & Placement Cell',
      avatar: DEFAULT_ADMIN_AVATAR,
      bio: 'Directing career guidance, industry placements, examinations, and technical incubation for Podar institutions.'
    }
  ]);

  useEffect(() => {
    fetch('/api/admins')
      .then(res => res.ok ? res.json() : null)
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setAllAdmins(list.map(a => ({
            ...a,
            avatar: a.avatar || DEFAULT_ADMIN_AVATAR,
            userType: 'admin'
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Extra fetched students if state.students isn't populated
  const [fetchedStudents, setFetchedStudents] = useState([]);
  useEffect(() => {
    fetch('/api/students')
      .then(res => res.ok ? res.json() : null)
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setFetchedStudents(list);
        }
      })
      .catch(() => {});
  }, []);

  // Merged student roster
  const allStudents = useMemo(() => {
    const map = new Map();
    (state?.students || []).forEach(s => map.set(s.id, s));
    fetchedStudents.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    if (student && !map.has(student.id)) map.set(student.id, student);
    return Array.from(map.values()).map(s => ({
      ...s,
      avatar: s.avatar || DEFAULT_STUDENT_AVATAR,
      userType: 'student'
    }));
  }, [state?.students, fetchedStudents, student]);

  // Determine if viewing own profile or someone else
  const activeProfileUser = useMemo(() => {
    if (!targetUserId) return null;
    if (student?.id === targetUserId || session?.id === targetUserId) {
      return null;
    }
    const foundStudent = allStudents.find(s => s.id === targetUserId || s.email === targetUserId || s.phone === targetUserId);
    if (foundStudent) return { ...foundStudent, userType: 'student' };

    const foundAdmin = allAdmins.find(a => a.id === targetUserId || a.email === targetUserId || a.phone === targetUserId);
    if (foundAdmin) return { ...foundAdmin, userType: 'admin' };

    return null;
  }, [targetUserId, allStudents, allAdmins, student?.id, session?.id]);

  const isOwnProfile = !activeProfileUser;
  const isViewingAdmin = activeProfileUser?.userType === 'admin';
  const isViewingStudent = activeProfileUser?.userType === 'student';

  // Target peer projects
  const [peerProjects, setPeerProjects] = useState([]);
  useEffect(() => {
    if (!activeProfileUser || isViewingAdmin) {
      setPeerProjects([]);
      return;
    }
    fetch('/api/projects?limit=30')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const posts = data?.posts || [];
        const filtered = posts.filter(p => p.studentId === activeProfileUser.id || p.author?.id === activeProfileUser.id);
        if (filtered.length > 0) {
          setPeerProjects(filtered);
        } else {
          setPeerProjects([]);
        }
      })
      .catch(() => setPeerProjects([]));
  }, [activeProfileUser, isViewingAdmin]);

  // Target peer certificates
  const [peerCertificates, setPeerCertificates] = useState([]);
  useEffect(() => {
    if (!activeProfileUser || isViewingAdmin) {
      setPeerCertificates([]);
      return;
    }
    fetch('/api/certificates')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data)) {
          setPeerCertificates(data.filter(c => c.studentId === activeProfileUser.id));
        } else {
          setPeerCertificates([]);
        }
      })
      .catch(() => setPeerCertificates([]));
  }, [activeProfileUser, isViewingAdmin]);

  const currentProjects = isOwnProfile ? userProjects : peerProjects;
  const currentCertificates = isOwnProfile ? userCertificates : peerCertificates;

  // Campus Directory state
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState('all'); // 'all' | 'students' | 'admins'

  const directoryList = useMemo(() => {
    const sList = allStudents.map(s => ({
      ...s,
      userType: 'student',
      displayRole: `${s.course || 'BCA'} • Sem ${s.semester || 'V'}`,
      displayHeadline: s.goal || 'Student at Podar Pathways'
    }));
    const aList = allAdmins.map(a => ({
      ...a,
      userType: 'admin',
      displayRole: `${a.role || 'Administrator'} • ${a.department || 'Administration'}`,
      displayHeadline: a.department || 'Podar Administration'
    }));
    return [...sList, ...aList];
  }, [allStudents, allAdmins]);

  const filteredDirectoryList = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    return directoryList.filter(item => {
      if (directoryFilter === 'students' && item.userType !== 'student') return false;
      if (directoryFilter === 'admins' && item.userType !== 'admin') return false;
      if (!q) return true;
      const matchName = item.name?.toLowerCase().includes(q);
      const matchRole = item.displayRole?.toLowerCase().includes(q);
      const matchHeadline = item.displayHeadline?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      return matchName || matchRole || matchHeadline || matchEmail;
    });
  }, [directoryList, directorySearch, directoryFilter]);

  const handleSelectUser = (user) => {
    const isMe = (session?.role === 'student' && user.id === (student?.id || session?.id)) ||
                 (session?.role === 'admin' && user.id === session?.id);
    if (isMe) {
      handleBackToMyProfile();
    } else {
      setTargetUserId(user.id);
      setActiveTab(user.userType === 'admin' ? 'office' : 'posts');
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('id', user.id);
        url.searchParams.delete('tab');
        window.history.pushState(window.history.state, '', url.pathname + url.search + url.hash);
      } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToMyProfile = () => {
    setTargetUserId(null);
    setActiveTab('posts');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('id');
      url.searchParams.delete('user');
      url.searchParams.delete('tab');
      window.history.pushState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Canonical Share Profile Link Helper
  const getShareUrl = (customId) => {
    const origin = window.location.origin;
    const isHashMode = window.location.hash.startsWith('#/');
    const basePath = isHashMode ? `${origin}/#/profile` : `${origin}/profile`;
    const target = customId || (!isOwnProfile && activeProfileUser ? activeProfileUser.id : null);
    if (target) {
      return `${basePath}?id=${encodeURIComponent(target)}`;
    }
    return basePath;
  };

  const handleCopyShareUrl = async () => {
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedShare(true);
      notify?.('Profile link copied to clipboard!');
      setTimeout(() => setCopiedShare(false), 2500);
    } catch (e) {
      prompt('Copy profile link:', url);
    }
  };

  // Share Profile Action
  const handleShareProfile = async () => {
    const shareUrl = getShareUrl();
    const title = `${displayName} - Podar Pathways Profile`;
    const text = isOwnProfile
      ? `Check out ${displayName}'s student profile, projects, and credentials on Podar Pathways!`
      : `Check out ${displayName}'s ${isViewingAdmin ? 'administrative' : 'student'} profile on Podar Pathways!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl
        });
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback: open share modal
    setShowShareModal(true);
  };

  const studentName = formData.name || student?.name || 'Student';
  const studentSem = formData.semester ? (String(formData.semester).toLowerCase().startsWith('sem') ? formData.semester : `Semester ${formData.semester}`) : 'Semester V';
  const studentScore = student?.score || 78;
  const studentCompletion = student?.completion || 92;

  const displayName = isOwnProfile ? studentName : (activeProfileUser.name || 'User Profile');
  const displayAvatar = isOwnProfile ? (formData.avatar || DEFAULT_STUDENT_AVATAR) : (activeProfileUser.avatar || (isViewingAdmin ? DEFAULT_ADMIN_AVATAR : DEFAULT_STUDENT_AVATAR));
  const displayDeptOrCourse = isOwnProfile ? (formData.course || 'BCA') : (isViewingAdmin ? (activeProfileUser.department || 'Administration') : (activeProfileUser.course || 'BCA'));
  const displaySemOrRole = isOwnProfile ? studentSem : (isViewingAdmin ? (activeProfileUser.role || 'Super Admin') : (activeProfileUser.semester ? `Semester ${activeProfileUser.semester}` : 'Semester V'));
  const displayGoal = isOwnProfile ? formData.goal : (isViewingAdmin ? activeProfileUser.role : (activeProfileUser.goal || 'Aspiring Professional'));
  const displayBio = isOwnProfile ? formData.bio : (activeProfileUser.bio || (isViewingAdmin ? 'Directing career guidance, industry placements, examinations, and technical incubation for Podar institutions.' : 'Building modern projects and advancing skills at Podar Pathways.'));
  const displayScore = isOwnProfile ? studentScore : (activeProfileUser.score || 82);
  const displayCompletion = isOwnProfile ? studentCompletion : (activeProfileUser.completion || 88);
  const displayPortfolio = isOwnProfile ? formData.portfolioUrl : activeProfileUser.portfolioUrl;
  const displayGithub = isOwnProfile ? formData.github : activeProfileUser.github;
  const displayLinkedin = isOwnProfile ? formData.linkedin : activeProfileUser.linkedin;

  return (
    <div className="insta-profile-wrapper">
      {/* Hidden file input for avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
      />

      {/* ============================================================ */}
      {/* 1. INSTAGRAM PROFILE HEADER                                  */}
      {/* ============================================================ */}
            {/* Top Banner when viewing someone else */}
      {!isOwnProfile && (
        <div className="insta-peer-top-banner">
          <button
            type="button"
            className="insta-back-pill"
            onClick={handleBackToMyProfile}
          >
            <ChevronLeft size={16} />
            <span>Back to My Profile</span>
          </button>

          <div className="insta-peer-tag">
            <span className="insta-peer-dot" />
            <span>Viewing {isViewingAdmin ? 'Administrator' : 'Student'} Profile</span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. INSTAGRAM PROFILE HEADER                                  */}
      {/* ============================================================ */}
      <header className="insta-profile-header">
        {/* Left: Avatar with colorful story ring */}
        <div className="insta-avatar-column">
          <div
            className={`insta-avatar-ring-wrap ${isViewingAdmin ? 'admin-ring' : ''} ${!isOwnProfile ? 'peer' : ''}`}
            onClick={() => {
              if (isOwnProfile) fileInputRef.current?.click();
            }}
            title={isOwnProfile ? "Click to change profile picture" : displayName}
          >
            <div className={`insta-avatar-ring ${isViewingAdmin ? 'admin' : ''}`}>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="insta-avatar-img"
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="insta-avatar-fallback">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Username, Buttons, Stats, Bio */}
        <div className="insta-meta-column">
          {/* Top Row: Full Name + Verified Badge */}
          <div className="insta-user-actions-row">
            <div className="insta-username-group">
              <h2 className="insta-username">{displayName}</h2>
              {isViewingAdmin ? (
                <span className="insta-verified-badge admin" title="Verified Institutional Administrator">
                  <ShieldCheck size={20} fill="#f59e0b" color="#ffffff" />
                </span>
              ) : (
                <span className="insta-verified-badge" title="Verified College Student">
                  <BadgeCheck size={20} fill="#0284c7" color="#ffffff" />
                </span>
              )}
            </div>
          </div>

          {/* Stats Row */}
          {isViewingAdmin ? (
            <div className="insta-stats-row admin-stats">
              <div className="insta-stat-item static">
                <strong>{activeProfileUser.department || 'Administration'}</strong>
                <span>department</span>
              </div>
              <div className="insta-stat-item static">
                <strong>{activeProfileUser.role || 'Super Admin'}</strong>
                <span>role</span>
              </div>
              <div className="insta-stat-item static">
                <strong>Verified</strong>
                <span>institutional staff</span>
              </div>
              <button
                type="button"
                className="insta-stat-item"
                onClick={() => handleTabChange('directory')}
                title="Browse campus community"
              >
                <strong>{directoryList.length}</strong>
                <span>community</span>
              </button>
            </div>
          ) : (
            <div className="insta-stats-row">
              <button
                type="button"
                className="insta-stat-item"
                onClick={() => handleTabChange('posts')}
              >
                <strong>{currentProjects.length}</strong>
                <span>projects</span>
              </button>

              <button
                type="button"
                className="insta-stat-item"
                onClick={() => handleTabChange('certificates')}
                title="Click to view certificates & credentials"
              >
                <strong>{currentCertificates.length}</strong>
                <span>credentials</span>
              </button>

              <button
                type="button"
                className="insta-stat-item"
                onClick={() => {
                  if (isOwnProfile) navigate?.('score');
                }}
                title="P-CARE Employability score"
              >
                <strong>{displayScore}/100</strong>
                <span>P-CARE</span>
              </button>

              <button
                type="button"
                className="insta-stat-item"
                onClick={() => {
                  if (isOwnProfile) navigate?.('passport');
                }}
                title="Digital career readiness"
              >
                <strong>{displayCompletion}%</strong>
                <span>readiness</span>
              </button>
            </div>
          )}

          {/* Bio & Details Block */}
          <div className="insta-bio-block">
            <div className="insta-full-name-line">
              <span className={`insta-dept-pill ${isViewingAdmin ? 'admin' : ''}`}>
                {displayDeptOrCourse} • {displaySemOrRole}
              </span>
            </div>

            {displayGoal && (
              <p className={`insta-headline ${isViewingAdmin ? 'admin' : ''}`}>
                {isViewingAdmin ? (
                  <Briefcase size={14} className="insta-headline-icon" />
                ) : (
                  <Sparkles size={14} className="insta-headline-icon" />
                )}
                <span>{displayGoal}</span>
              </p>
            )}

            <p className="insta-bio-text">
              {displayBio}
            </p>

            {/* Clickable External Links in Bio */}
            <div className="insta-bio-links">
              {displayPortfolio && (
                <a
                  href={displayPortfolio.startsWith('http') ? displayPortfolio : `https://${displayPortfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="insta-bio-link"
                >
                  <Link2 size={13} />
                  <span>{displayPortfolio.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {displayGithub && (
                <a
                  href={displayGithub.startsWith('http') ? displayGithub : `https://${displayGithub}`}
                  target="_blank"
                  rel="noreferrer"
                  className="insta-bio-link"
                >
                  <Code size={13} />
                  <span>{displayGithub.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {displayLinkedin && (
                <a
                  href={displayLinkedin.startsWith('http') ? displayLinkedin : `https://${displayLinkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="insta-bio-link"
                >
                  <ExternalLink size={13} />
                  <span>{displayLinkedin.replace(/^https?:\/\//, '')}</span>
                </a>
              )}

              {isViewingAdmin && activeProfileUser.email && (
                <a
                  href={`mailto:${activeProfileUser.email}`}
                  className="insta-bio-link"
                >
                  <Mail size={13} />
                  <span>{activeProfileUser.email}</span>
                </a>
              )}

              {isViewingAdmin && activeProfileUser.phone && (
                <a
                  href={`tel:${activeProfileUser.phone}`}
                  className="insta-bio-link"
                >
                  <Phone size={13} />
                  <span>{activeProfileUser.phone}</span>
                </a>
              )}
            </div>

            {/* Action Buttons: Edit profile, Share profile, Campus Directory, Settings */}
            <div className="insta-action-buttons" style={{ marginTop: '16px' }}>
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className={`insta-btn-secondary ${activeTab === 'edit' ? 'active' : ''}`}
                    onClick={() => handleTabChange('edit')}
                  >
                    <Pencil size={14} />
                    <span>Edit profile</span>
                  </button>

                  <button
                    type="button"
                    className="insta-btn-secondary"
                    onClick={handleShareProfile}
                  >
                    {copiedShare ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                    <span>{copiedShare ? 'Copied' : 'Share profile'}</span>
                  </button>

                  <button
                    type="button"
                    className={`insta-icon-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => handleTabChange('security')}
                    title="Account security & settings"
                  >
                    <Settings size={18} />
                  </button>
                </>
              ) : isViewingAdmin ? (
                <>
                  <a
                    href={`mailto:${activeProfileUser.email || 'admin@podar.edu'}?subject=Inquiry%20from%20Student`}
                    className="insta-btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Mail size={14} />
                    <span>Email Office</span>
                  </a>

                  {activeProfileUser.phone && (
                    <a
                      href={`tel:${activeProfileUser.phone}`}
                      className="insta-btn-secondary"
                      style={{ textDecoration: 'none' }}
                    >
                      <Phone size={14} />
                      <span>Call Office</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="insta-btn-secondary"
                    onClick={handleShareProfile}
                  >
                    {copiedShare ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                    <span>{copiedShare ? 'Copied' : 'Share profile'}</span>
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={`mailto:${activeProfileUser.email || ''}?subject=Connecting%20via%20Podar%20Pathways`}
                    className="insta-btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    <Mail size={14} />
                    <span>Contact Student</span>
                  </a>

                  <button
                    type="button"
                    className="insta-btn-secondary"
                    onClick={handleShareProfile}
                  >
                    {copiedShare ? <Check size={14} color="#10b981" /> : <Share2 size={14} />}
                    <span>{copiedShare ? 'Copied' : 'Share profile'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. INSTAGRAM TAB NAVIGATION STRIP                            */}
      {/* ============================================================ */}
      <nav className="insta-tab-nav">
        {isViewingAdmin ? (
          <>
            <button
              type="button"
              className={`insta-tab-item ${activeTab === 'office' ? 'active' : ''}`}
              onClick={() => handleTabChange('office')}
            >
              <Building2 size={16} />
              <span>OFFICE INFO</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className={`insta-tab-item ${activeTab === 'posts' || activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('posts')}
            >
              <Grid size={16} />
              <span>PROJECTS</span>
            </button>

            {isOwnProfile && (
              <button
                type="button"
                className={`insta-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <Bell size={16} />
                <span>ALERTS</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* ============================================================ */}
      {/* 4. TAB CONTENT 1: INSTAGRAM PROJECTS GRID                    */}
      {/* ============================================================ */}
      {(activeTab === 'posts' || activeTab === 'profile') && (
        <div className="insta-tab-body">
          {currentProjects.length > 0 ? (
            <div className="insta-posts-grid">
              {currentProjects.map((proj, idx) => {
                const coverImg = Array.isArray(proj.images) && proj.images.length > 0
                  ? (proj.images[0]?.imageUrl || proj.images[0])
                  : (proj.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80');

                const hasMultipleImages = Array.isArray(proj.images) && proj.images.length > 1;

                return (
                  <div
                    key={proj.id || idx}
                    className="insta-grid-item"
                    onClick={() => setSelectedProject(proj)}
                  >
                    <img src={coverImg} alt={proj.title} className="insta-grid-img" loading="lazy" />

                    {hasMultipleImages && (
                      <span className="insta-multi-photo-icon" title="Multiple photos">
                        <Layers size={14} />
                      </span>
                    )}

                    {/* Instagram Hover Overlay with Likes & Comments */}
                    <div className="insta-grid-hover-overlay">
                      <div className="insta-hover-stat">
                        <Heart size={18} fill="#ffffff" color="#ffffff" />
                        <strong>{proj.likesCount || 34 + (idx * 7)}</strong>
                      </div>
                      <div className="insta-hover-stat">
                        <MessageCircle size={18} fill="#ffffff" color="#ffffff" />
                        <strong>{proj.commentsCount || 8 + (idx * 3)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="insta-empty-state">
              <Grid size={48} color="#94a3b8" />
              <h3>No Projects Shared Yet</h3>
              <p>Showcase your academic capstones, web apps, or prototypes with your student peers.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => navigate?.('projects')}
                style={{ marginTop: '12px' }}
              >
                <Plus size={16} />
                <span>Create First Project Post</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. TAB CONTENT 2: CERTIFICATES GALLERY                       */}
      {/* ============================================================ */}
      {activeTab === 'certificates' && (
        <div className="insta-tab-body">
          {currentCertificates.length > 0 ? (
            <div className="insta-certs-grid">
              {currentCertificates.map((cert) => (
                <div key={cert.id} className="insta-cert-card">
                  <div className="insta-cert-preview">
                    {cert.fileData?.startsWith('data:image') ? (
                      <img src={cert.fileData} alt={cert.programTitle} className="insta-cert-img" />
                    ) : (
                      <div className="insta-cert-fallback">
                        <Award size={36} color="#0d9488" />
                        <span>{cert.programTitle}</span>
                      </div>
                    )}
                  </div>
                  <div className="insta-cert-meta">
                    <h4 className="insta-cert-title">{cert.programTitle}</h4>
                    <span className="insta-cert-issuer">{cert.issuer || 'Podar Academic Board'}</span>
                    <div className="insta-cert-footer">
                      <code className="insta-cert-code">{cert.verificationCode || cert.credentialId || 'VERIFIED'}</code>
                      <span className="insta-cert-badge">
                        <ShieldCheck size={13} color="#059669" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="insta-empty-state">
              <Award size={48} color="#94a3b8" />
              <h3>No Certificates Added Yet</h3>
              <p>Complete certified courses and upload your credentials to earn verified badges and score points.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => navigate?.('courses')}
                style={{ marginTop: '12px' }}
              >
                <span>Browse Courses & Certifications</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. TAB CONTENT 3: SAVED ITEMS                                */}
      {/* ============================================================ */}
      {/* ============================================================ */}
      {/* TAB CONTENT: CAMPUS DIRECTORY & PROFILES                     */}
      {/* ============================================================ */}
      {activeTab === 'directory' && (
        <div className="insta-tab-body">
          <div className="insta-directory-container">
            {/* Directory Header */}
            <div className="insta-directory-hero">
              <div className="insta-dir-hero-icon">
                <Users size={28} />
              </div>
              <div>
                <h3>Campus Community & Directory</h3>
                <p>Browse and connect with registered students, faculty mentors, and college administrators across Podar Pathways.</p>
              </div>
            </div>

            {/* Directory Search & Filters */}
            <div className="insta-dir-controls">
              <div className="insta-dir-search-wrap">
                <Search size={18} className="insta-dir-search-icon" />
                <input
                  type="text"
                  className="insta-dir-search-input"
                  placeholder="Search by name, course, role, or department..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                />
                {directorySearch && (
                  <button
                    type="button"
                    className="insta-dir-clear-btn"
                    onClick={() => setDirectorySearch('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="insta-dir-filter-chips">
                <button
                  type="button"
                  className={`insta-dir-chip ${directoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('all')}
                >
                  All Members ({directoryList.length})
                </button>
                <button
                  type="button"
                  className={`insta-dir-chip ${directoryFilter === 'students' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('students')}
                >
                  Students ({directoryList.filter(u => u.userType === 'student').length})
                </button>
                <button
                  type="button"
                  className={`insta-dir-chip ${directoryFilter === 'admins' ? 'active' : ''}`}
                  onClick={() => setDirectoryFilter('admins')}
                >
                  Faculty & Admins ({directoryList.filter(u => u.userType === 'admin').length})
                </button>
              </div>
            </div>

            {/* Directory Grid */}
            {filteredDirectoryList.length > 0 ? (
              <div className="insta-dir-grid">
                {filteredDirectoryList.map((user) => {
                  const isMe = (session?.role === 'student' && user.id === (student?.id || session?.id)) ||
                               (session?.role === 'admin' && user.id === session?.id);
                  const isCurrentlyViewed = targetUserId ? targetUserId === user.id : isMe;

                  return (
                    <div
                      key={user.id}
                      className={`insta-dir-card ${isCurrentlyViewed ? 'current' : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <div className="insta-dir-avatar-wrap">
                        <div className={`insta-dir-avatar-ring ${user.userType === 'admin' ? 'admin' : ''}`}>
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="insta-dir-avatar-img"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="insta-dir-avatar-fallback">
                              {(user.name || 'User').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {user.userType === 'admin' ? (
                          <span className="insta-dir-badge-icon admin" title="College Administration">
                            <ShieldCheck size={14} color="#f59e0b" fill="#1e293b" />
                          </span>
                        ) : (
                          <span className="insta-dir-badge-icon student" title="Verified Student">
                            <BadgeCheck size={14} color="#0284c7" />
                          </span>
                        )}
                      </div>

                      <div className="insta-dir-card-body">
                        <div className="insta-dir-card-top">
                          <h4 className="insta-dir-user-name">
                            {user.name}
                            {isMe && <span className="insta-dir-you-tag">You</span>}
                          </h4>
                        </div>

                        <span className={`insta-dir-role-badge ${user.userType === 'admin' ? 'admin' : 'student'}`}>
                          {user.displayRole}
                        </span>

                        <p className="insta-dir-headline">
                          {user.displayHeadline || (user.userType === 'admin' ? 'College Administration' : 'Podar Student')}
                        </p>

                        <div className="insta-dir-card-footer">
                          <button
                            type="button"
                            className={`insta-dir-view-btn ${isCurrentlyViewed ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUser(user);
                            }}
                          >
                            {isMe ? 'My Profile' : 'View Profile'}
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="insta-empty-state">
                <Users size={48} color="#94a3b8" />
                <h3>No profiles match your search</h3>
                <p>Try searching with another name, course, role, or department.</p>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => { setDirectorySearch(''); setDirectoryFilter('all'); }}
                  style={{ marginTop: '12px' }}
                >
                  Clear Search Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT: ADMIN OFFICE & PURVIEW                          */}
      {/* ============================================================ */}
      {activeTab === 'office' && isViewingAdmin && (
        <div className="insta-tab-body">
          <div className="admin-office-card">
            <div className="admin-office-header">
              <div className="admin-office-badge">
                <ShieldCheck size={28} color="#0284c7" />
              </div>
              <div>
                <h3>Official Institutional Administration</h3>
                <p>Verified Faculty & Administrative Staff Member at Podar Pathways</p>
              </div>
            </div>

            <div className="admin-office-grid">
              <div className="admin-office-item">
                <span className="admin-office-label"><Briefcase size={14} /> Department / Cell</span>
                <strong>{activeProfileUser.department || 'Career & Placement Cell'}</strong>
              </div>
              <div className="admin-office-item">
                <span className="admin-office-label"><Shield size={14} /> Official Role</span>
                <strong>{activeProfileUser.role || 'Super Admin'}</strong>
              </div>
              <div className="admin-office-item">
                <span className="admin-office-label"><Mail size={14} /> Official Email</span>
                <a href={`mailto:${activeProfileUser.email}`}>{activeProfileUser.email || 'admin@podar.edu'}</a>
              </div>
              <div className="admin-office-item">
                <span className="admin-office-label"><Phone size={14} /> Direct Helpline / Phone</span>
                <a href={`tel:${activeProfileUser.phone}`}>{activeProfileUser.phone || '9999988888'}</a>
              </div>
            </div>

            <div className="admin-office-notice">
              <h4>Administrative Scope & Purview</h4>
              <p>
                Oversees student career advancement, corporate recruitment partnerships, internship validation,
                P-CARE employability score compliance, and verified institutional credentials across college cohorts.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="insta-tab-body">
          <div className="insta-empty-state">
            <Bookmark size={48} color="#94a3b8" />
            <h3>Save Posts and Opportunities</h3>
            <p>Save interesting student projects, hackathons, or job openings to revisit them anytime.</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate?.('opportunities')}
              style={{ marginTop: '12px' }}
            >
              <span>Explore Opportunities</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. TAB CONTENT 4: EDIT PROFILE DETAILS                       */}
      {/* ============================================================ */}
      {isOwnProfile && activeTab === 'edit' && (
        <div className="insta-tab-body">
          <form onSubmit={handleSaveProfile} className="panel insta-edit-panel">
            <div className="insta-panel-header">
              <div>
                <h3>Edit Student Profile</h3>
                <p>Keep your profile details, career aspirations, and contact records updated.</p>
              </div>
              <button
                type="submit"
                className="button primary"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Avatar Row */}
            <div className="insta-edit-avatar-row">
              <div className="insta-avatar-ring small">
                {formData.avatar ? (
                  <img src={formData.avatar} alt={studentName} className="insta-avatar-img" />
                ) : (
                  <div className="insta-avatar-fallback">{studentName.slice(0, 2).toUpperCase()}</div>
                )}
              </div>
              <div className="insta-edit-avatar-actions">
                <strong>{studentName}</strong>
                <div className="insta-avatar-btns-wrap">
                  <button
                    type="button"
                    className="button outline small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>Change Photo</span>
                  </button>
                  {formData.avatar && (
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={handleRemoveAvatar}
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Editor with Live Counter */}
            <div className="form-group" style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="field-label">Bio & Career Headline</label>
                <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                  {(formData.bio || '').length} / 250
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={250}
                placeholder="Share a brief introduction, your tech passions, or what you are currently building..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="field-textarea"
              />
            </div>

            {/* Career Goal */}
            <div className="form-group">
              <label className="field-label">Target Career Goal</label>
              <input
                type="text"
                placeholder="e.g. Cloud Solutions Architect, Full-Stack Developer"
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
                className="field-input"
              />
            </div>

            {/* Locked Institutional Credentials */}
            <div className="insta-locked-section">
              <div className="insta-locked-header">
                <Lock size={15} color="#64748b" />
                <span>Verified College Records (Locked by Administration)</span>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="field-label">Full Name</label>
                  <input type="text" value={formData.name} disabled className="field-input locked" />
                </div>
                <div className="form-group">
                  <label className="field-label">College Email</label>
                  <input type="text" value={formData.email} disabled className="field-input locked" />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <h4 className="insta-section-subtitle">Personal Details</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label className="field-label">Father's / Guardian's Name</label>
                <input
                  type="text"
                  placeholder="Father's Name"
                  value={formData.fathersName}
                  onChange={e => setFormData({ ...formData, fathersName: e.target.value })}
                  className="field-input"
                />
              </div>

              <div className="form-group">
                <label className="field-label">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={e => setFormData({ ...formData, dob: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="field-label">Registered Mobile (10-Digit)</label>
                <input
                  type="tel"
                  placeholder="9000000001"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="field-input"
                />
              </div>

              <div className="form-group">
                <label className="field-label">Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="field-select"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Residential Address */}
            <h4 className="insta-section-subtitle">Residential Address</h4>
            <div className="form-group">
              <label className="field-label">House / Flat / Street Address</label>
              <input
                type="text"
                placeholder="House No, Apartment, Street / Colony"
                value={formData.houseNo}
                onChange={e => setFormData({ ...formData, houseNo: e.target.value })}
                className="field-input"
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="field-label">State</label>
                <select
                  value={formData.state || 'Rajasthan'}
                  onChange={e => setFormData({ ...formData, state: e.target.value, district: '' })}
                  className="field-select"
                >
                  {Object.keys(INDIAN_STATES_DISTRICTS).map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">District</label>
                <select
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="field-select"
                >
                  <option value="">Select District</option>
                  {currentDistricts.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="field-label">PIN Code (6 Digits)</label>
                <input
                  type="text"
                  placeholder="302001"
                  maxLength={6}
                  value={formData.pinCode}
                  onChange={e => setFormData({ ...formData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="field-input"
                />
              </div>
            </div>

            {/* Social & Professional Links */}
            <h4 className="insta-section-subtitle">Social & Portfolio Links</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label className="field-label">Portfolio / Personal Website</label>
                <input
                  type="text"
                  placeholder="https://myportfolio.dev"
                  value={formData.portfolioUrl}
                  onChange={e => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  className="field-input"
                />
              </div>

              <div className="form-group">
                <label className="field-label">GitHub Profile</label>
                <input
                  type="text"
                  placeholder="github.com/username"
                  value={formData.github}
                  onChange={e => setFormData({ ...formData, github: e.target.value })}
                  className="field-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="field-label">LinkedIn Profile URL</label>
              <input
                type="text"
                placeholder="linkedin.com/in/username"
                value={formData.linkedin}
                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                className="field-input"
              />
            </div>

            {/* Footer Submit */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="button outline"
                onClick={() => handleTabChange('posts')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. TAB CONTENT 5: LOGIN & SECURITY                           */}
      {/* ============================================================ */}
      {isOwnProfile && activeTab === 'security' && (
        <div className="insta-tab-body">
          <form onSubmit={handleUpdatePassword} className="panel insta-edit-panel">
            <div className="insta-panel-header">
              <div>
                <h3>Login & Security Settings</h3>
                <p>Manage your account password, 2-factor authentication, and active sessions.</p>
              </div>
            </div>

            <div className="insta-security-card">
              <ShieldCheck size={24} color="#059669" />
              <div>
                <strong>Two-Factor Authentication (2FA) Active</strong>
                <p>Your account is protected by mobile OTP verification on institutional login.</p>
              </div>
            </div>

            <h4 className="insta-section-subtitle" style={{ marginTop: '20px' }}>Change Account Password</h4>
            <div className="form-group">
              <label className="field-label">Current Password</label>
              <div className="insta-pw-wrap">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="field-input"
                />
                <button
                  type="button"
                  className="insta-pw-eye"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="field-label">New Password (Min 6 Characters)</label>
                <div className="insta-pw-wrap">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="insta-pw-eye"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="field-label">Confirm New Password</label>
                <div className="insta-pw-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="field-input"
                  />
                  <button
                    type="button"
                    className="insta-pw-eye"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="button primary"
                disabled={isChangingPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              >
                {isChangingPassword ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>

            <div className="insta-danger-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
              <h4>Session Management</h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 14px 0' }}>
                You are currently signed in as <strong>{studentName}</strong>.
              </p>
              <button
                type="button"
                className="button outline"
                onClick={onLogout}
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
              >
                Sign Out from Device
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. TAB CONTENT 6: NOTIFICATIONS                              */}
      {/* ============================================================ */}
      {isOwnProfile && activeTab === 'notifications' && (
        <div className="insta-tab-body">
          <div className="panel insta-edit-panel">
            <div className="insta-panel-header">
              <div>
                <h3>Notification Preferences</h3>
                <p>Choose the career alerts and college campus announcements you receive.</p>
              </div>
            </div>

            <div className="insta-toggle-list">
              {[
                { key: 'jobAlerts', title: 'Job & Internship Opportunities', desc: 'Get notified when matching openings are published by campus placement cell.' },
                { key: 'interviewReminders', title: 'Interview & Schedule Reminders', desc: 'Alerts 24 hours prior to scheduled mock assessments or drives.' },
                { key: 'collegeNotices', title: 'Official Academic Notices', desc: 'Direct notices from Podar Academic Board and department heads.' },
                { key: 'quizDeadlines', title: 'Coursework & Certificate Deadlines', desc: 'Reminders for elected course validity and test submissions.' },
                { key: 'soundEffects', title: 'Audio Sound Cues', desc: 'Play subtle acoustic sounds on new notifications and achievements.' }
              ].map(item => (
                <div key={item.key} className="insta-toggle-row">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications[item.key] !== false}
                    onChange={e => {
                      const updated = { ...notifications, [item.key]: e.target.checked };
                      setNotifications(updated);
                      try {
                        localStorage.setItem('podar-notifications-settings', JSON.stringify(updated));
                      } catch (err) {}
                      notify?.('Notification preference updated.');
                    }}
                    className="insta-switch"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================ */}
      {/* 11. PROJECT QUICK VIEW MODAL (INSTAGRAM POST LIGHTBOX)       */}
      {/* ============================================================ */}
      {selectedProject && (
        <div className="insta-post-backdrop" onClick={() => setSelectedProject(null)}>
          <div className="insta-post-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Image Section */}
            <div className="insta-post-img-side">
              <img
                src={Array.isArray(selectedProject.images) && selectedProject.images.length > 0
                  ? (selectedProject.images[0]?.imageUrl || selectedProject.images[0])
                  : (selectedProject.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80')}
                alt={selectedProject.title}
                className="insta-post-full-img"
              />
            </div>

            {/* Modal Details Section */}
            <div className="insta-post-info-side">
              <div className="insta-post-info-header">
                <div className="insta-post-author">
                  <div className="insta-avatar-ring micro">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt={studentName} className="insta-avatar-img" />
                    ) : (
                      <div className="insta-avatar-fallback micro">{studentName.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <strong className="insta-post-author-name">{studentName}</strong>
                    <span className="insta-post-author-handle">@{username}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="insta-close-icon-btn"
                  onClick={() => setSelectedProject(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="insta-post-info-body">
                <h3 className="insta-post-modal-title">{selectedProject.title}</h3>
                <p className="insta-post-modal-desc">{selectedProject.description}</p>

                {Array.isArray(selectedProject.tags) && selectedProject.tags.length > 0 && (
                  <div className="insta-post-tags-wrap">
                    {selectedProject.tags.map(t => (
                      <span key={t} className="insta-post-tag-chip">#{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="insta-post-info-footer">
                <div className="insta-post-stats-row">
                  <span className="insta-post-stat">
                    <Heart size={16} color="#ef4444" fill="#ef4444" />
                    <strong>{selectedProject.likesCount || 42} likes</strong>
                  </span>
                  <span className="insta-post-stat">
                    <MessageCircle size={16} color="#64748b" />
                    <strong>{selectedProject.commentsCount || 9} comments</strong>
                  </span>
                </div>

                <div className="insta-post-btn-actions">
                  {selectedProject.demoUrl && (
                    <a
                      href={selectedProject.demoUrl.startsWith('http') ? selectedProject.demoUrl : `https://${selectedProject.demoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button primary small"
                      style={{ textDecoration: 'none' }}
                    >
                      <Globe size={14} />
                      <span>Live Demo</span>
                    </a>
                  )}

                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl.startsWith('http') ? selectedProject.githubUrl : `https://${selectedProject.githubUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="button outline small"
                      style={{ textDecoration: 'none' }}
                    >
                      <Code size={14} />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* 12. SHARE PROFILE MODAL                                     */}
      {/* ============================================================ */}
      {showShareModal && (
        <div className="share-modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="share-modal-card" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                  Share Student Profile
                </h3>
              </div>
              <button
                type="button"
                className="share-modal-close"
                onClick={() => setShowShareModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mini Profile Preview */}
            <div className="share-preview-card">
              <div className="insta-avatar-ring small" style={{ width: '52px', height: '52px' }}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt={studentName} className="insta-avatar-img" />
                ) : (
                  <div className="insta-avatar-fallback" style={{ fontSize: '18px' }}>
                    {studentName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a' }}>{studentName}</strong>
                  <BadgeCheck size={16} fill="#0284c7" color="#ffffff" />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {formData.course || 'BCA'} • {studentSem}
                </span>
                {formData.goal && (
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#0284c7', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formData.goal}
                  </p>
                )}
              </div>
            </div>

            {/* Copy Link Input */}
            <div className="share-link-box">
              <div className="share-link-input-wrap">
                <Link2 size={15} color="#64748b" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="share-link-input"
                  onClick={e => e.target.select()}
                />
              </div>
              <button
                type="button"
                className={`button ${copiedShare ? 'success' : 'primary'} small`}
                onClick={handleCopyShareUrl}
                style={{ flexShrink: 0 }}
              >
                {copiedShare ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedShare ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="share-channels-title">Share via:</div>
            <div className="share-channels-grid">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${studentName}'s student profile & projects on Podar Pathways:\n${getShareUrl()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-channel-btn whatsapp"
              >
                <span className="share-channel-icon">💬</span>
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-channel-btn linkedin"
              >
                <span className="share-channel-icon">💼</span>
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${studentName}'s student profile on Podar Pathways!`)}&url=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="share-channel-btn twitter"
              >
                <span className="share-channel-icon">𝕏</span>
                <span>Twitter / X</span>
              </a>

              <a
                href={`mailto:?subject=${encodeURIComponent(`${studentName} - Podar Pathways Profile`)}&body=${encodeURIComponent(`Hi,\n\nCheck out ${studentName}'s student profile, projects, and verified credentials on Podar Pathways:\n${getShareUrl()}\n\nBest regards,\n${studentName}`)}`}
                className="share-channel-btn email"
              >
                <Mail size={16} />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ADMIN PROFILE & PHOTO SETTINGS
// ========================================================
export function AdminProfileSettings({ session, state, setState, notify, onLogout }) {
  const fileInputRef = React.useRef(null);
  const [avatar, setAvatar] = React.useState(
    session?.avatar || session?.admin?.avatar || DEFAULT_ADMIN_AVATAR
  );
  const [name, setName] = React.useState(session?.name || session?.admin?.name || 'Podar Administrator');
  const [phone, setPhone] = React.useState(session?.adminPhone || session?.admin?.phone || '9999988888');
  const [department, setDepartment] = React.useState(session?.department || session?.admin?.department || 'Career & Placement Cell');
  const [role, setRole] = React.useState(session?.adminRole || session?.admin?.role || 'Super Admin');
  const email = session?.email || session?.admin?.email || 'admin@podar.edu';
  const [saving, setSaving] = React.useState(false);

  // Compress & handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify?.('Please select an image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(compressedDataUrl);

        // Update localStorage session
        try {
          const savedSession = JSON.parse(localStorage.getItem('podar-pathways-session') || '{}');
          savedSession.avatar = compressedDataUrl;
          if (savedSession.admin) savedSession.admin.avatar = compressedDataUrl;
          localStorage.setItem('podar-pathways-session', JSON.stringify(savedSession));
        } catch {}

        // Persist to server
        fetch('/api/admins/admin-podar-root', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: compressedDataUrl })
        }).catch(() => {});

        notify?.('Admin profile photo updated successfully!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar(DEFAULT_ADMIN_AVATAR);
    try {
      const savedSession = JSON.parse(localStorage.getItem('podar-pathways-session') || '{}');
      savedSession.avatar = DEFAULT_ADMIN_AVATAR;
      if (savedSession.admin) savedSession.admin.avatar = DEFAULT_ADMIN_AVATAR;
      localStorage.setItem('podar-pathways-session', JSON.stringify(savedSession));
    } catch {}

    fetch('/api/admins/admin-podar-root', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: DEFAULT_ADMIN_AVATAR })
    }).catch(() => {});

    notify?.('Profile photo reset to default.');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const savedSession = JSON.parse(localStorage.getItem('podar-pathways-session') || '{}');
      savedSession.name = name;
      savedSession.adminPhone = phone;
      savedSession.department = department;
      savedSession.avatar = avatar;
      if (savedSession.admin) {
        savedSession.admin.name = name;
        savedSession.admin.phone = phone;
        savedSession.admin.department = department;
        savedSession.admin.avatar = avatar;
      }
      localStorage.setItem('podar-pathways-session', JSON.stringify(savedSession));
    } catch {}

    fetch('/api/admins/admin-podar-root', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        department,
        avatar
      })
    }).catch(() => {});

    setTimeout(() => {
      setSaving(false);
      notify?.('Administrator profile saved successfully!');
    }, 300);
  };

  return (
    <div className="minimal-admin-container" style={{ maxWidth: '780px' }}>
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Admin Profile</h2>
          <p className="minimal-admin-subtitle">Your official administrator identity and profile photo.</p>
        </div>
        <button
          type="button"
          className="minimal-btn-secondary"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('podar-route-change', { detail: { page: 'profile', params: { tab: 'directory' } } }));
            }
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={15} />
          <span>Browse Campus Profiles</span>
        </button>
      </div>

      <div className="minimal-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '24px' }}>
        {/* Photo Upload Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={avatar || DEFAULT_ADMIN_AVATAR}
              alt="Admin Profile"
              style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #e5e7eb',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: '#111827',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Upload new profile photo"
            >
              <Camera size={13} />
            </button>
          </div>

          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#111827' }}>
              Administrator Profile Photo
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#6b7280' }}>
              Upload a clear photo for official recognition in the portal and navigation bar.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="minimal-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                Upload Photo
              </button>
              {avatar !== DEFAULT_ADMIN_AVATAR && (
                <button
                  type="button"
                  className="minimal-btn-action delete"
                  onClick={handleRemovePhoto}
                >
                  <Trash2 size={13} />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="minimal-form-group">
              <label>Official Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="minimal-form-group">
              <label>Official Email (Permanent)</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
              />
            </div>

            <div className="minimal-form-group">
              <label>Registered Mobile Number</label>
              <input
                type="tel"
                value={phone}
                maxLength={10}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="minimal-form-group">
              <label>Role</label>
              <input
                type="text"
                value={role}
                disabled
                style={{ background: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
              />
            </div>

            <div className="minimal-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Department / Cell</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <button
              type="submit"
              className="minimal-btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
