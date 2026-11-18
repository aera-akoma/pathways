import React, { useState, useRef, useEffect, useMemo } from 'react';
import ProfileAvatar from './ProfileAvatar.jsx';
import { requestJson, requireRecord } from './api.js';
import { DEFAULT_STUDENT_AVATAR, DEFAULT_ADMIN_AVATAR } from './defaultAvatar.js';
import { INDIAN_STATES_DISTRICTS } from './indianStatesDistricts.js';
import './student-profile.css';

import {
  GraduationCap,
  Camera,
  User,
  FolderGit2,
  Settings,
  FileText,
  MapPin,
  Code2,
  PlusCircle,
  Sparkles,
  Crop,
  ImagePlus,
  X,
  Send,
  ExternalLink,
  Save,
  Star,
  Plus,
  Link,
  Users,
  Trash2
} from 'lucide-react';

export { INDIAN_STATES_DISTRICTS };

// Instagram-style CSS photo filter definitions
const FILTER_STYLES = {
  'Original': 'none',
  'Clarendon': 'contrast(1.2) saturate(1.35)',
  'Juno': 'sepia(0.15) contrast(1.15) saturate(1.4) brightness(1.05)',
  'Lark': 'contrast(0.9) brightness(1.1) saturate(1.15)',
  'Moon': 'grayscale(1) contrast(1.1) brightness(1.1)',
  'Gingham': 'brightness(1.05) hue-rotate(-10deg) sepia(0.12)'
};

const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80';
const PROFILE_CLASSES = ['BCA', 'MCA', 'BBA', 'MBA', 'Other'];
const normalizeProfileClass = value => {
  const normalized = String(value || '').trim().toUpperCase();
  return PROFILE_CLASSES.includes(normalized) ? normalized : (value ? 'Other' : 'BCA');
};
const normalizeDateInput = value => {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

// Ensure external URLs include protocol to avoid relative-path 404s
const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

// Safe date formatter for local calendar display without UTC timezone shift
const formatDateDisplay = (dateString) => {
  if (!dateString) return 'Not specified';
  const raw = String(dateString).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? 'Not specified' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const INITIAL_PROJECTS = [
  {
    id: 101,
    title: 'CampusFlow — Smart Attendance & Lecture Analytics',
    description: 'Automated facial-recognition and BLE beacon attendance system integrated with faculty dashboards, cutting roll-call overhead by 90%.',
    tech: ['React', 'FastAPI', 'OpenCV', 'PostgreSQL'],
    demoUrl: 'https://github.com/aaravsharma/campusflow',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
    filter: 'Original',
    aspect: '16:9',
    date: 'Oct 2026'
  },
  {
    id: 102,
    title: 'DistriKV — Raft Consensus Key-Value Store',
    description: 'Fault-tolerant distributed key-value storage engine implemented from scratch in Go with leader election, log replication, and snapshotting.',
    tech: ['Go', 'gRPC', 'Raft', 'Docker'],
    demoUrl: 'https://github.com/aaravsharma/distrikv',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
    filter: 'Clarendon',
    aspect: '16:9',
    date: 'Aug 2026'
  },
  {
    id: 103,
    title: 'MedScan AI — Chest X-Ray Triage Assistant',
    description: 'Deep learning diagnostic assistant utilizing DenseNet-121 with Grad-CAM heatmaps to highlight thoracic anomalies for rural clinics.',
    tech: ['PyTorch', 'Python', 'Grad-CAM', 'Streamlit'],
    demoUrl: '',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    filter: 'Lark',
    aspect: '16:9',
    date: 'May 2026'
  }
];

export function ProfileSettings({
  student,
  studentId,
  courses,
  state,
  setState,
  session,
  notify,
  onLogout,
  navigate,
  initialTab
}) {
  // Determine active tab from URL or props
  const getTabFromUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const t = searchParams.get('tab');
      if (t && ['overview', 'projects', 'settings'].includes(t)) {
        return t;
      }
    } catch (e) {}
    return initialTab === 'settings' || initialTab === 'edit'
      ? 'settings'
      : initialTab === 'projects' || initialTab === 'posts'
      ? 'projects'
      : 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  const switchTab = (tabName, scrollToId = null) => {
    setActiveTab(tabName);
    try {
      const url = new URL(window.location.href);
      if (tabName === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tabName);
      }
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}
    if (scrollToId) {
      setTimeout(() => {
        const el = document.getElementById(scrollToId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          el.classList.add('ring-2', 'ring-navy-500/40');
          setTimeout(() => el.classList.remove('ring-2', 'ring-navy-500/40'), 1500);
        }
      }, 100);
    }
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      let enabled = document.documentElement.classList.contains('dark');
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) enabled = savedTheme === 'dark';
      } catch {}
      document.documentElement.classList.toggle('dark', enabled);
      return enabled;
    }
    return false;
  });

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (typeof document !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
    showToast(nextDark ? 'Dark theme enabled' : 'Light theme enabled');
  };

  // Email alerts toggle state (synced with notification center)
  const [emailAlerts, setEmailAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('podar-notifications-settings');
      if (saved) return JSON.parse(saved).enabled !== false;
    } catch {}
    return true;
  });

  const handleToggleEmailAlerts = () => {
    const next = !emailAlerts;
    setEmailAlerts(next);
    try {
      const existing = JSON.parse(localStorage.getItem('podar-notifications-settings') || '{}');
      const updated = { ...existing, enabled: next, jobAlerts: next };
      localStorage.setItem('podar-notifications-settings', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('podar-notifications-changed', { detail: updated }));
    } catch {}
    showToast(`Email alerts ${next ? 'enabled' : 'disabled'}`);
  };

  // Toast Notification State
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Student Profile Data
  const [profile, setProfile] = useState({
    name: student?.name || 'Aarav Sharma',
    degreeShort: normalizeProfileClass(student?.course),
    branch: student?.branch || 'Computer Science & Engineering',
    semester: student?.semester ? (String(student.semester).includes('Sem') ? student.semester : `${student.semester}th Semester`) : '5th Semester',
    section: student?.section || 'Section A',
    headline: student?.headline || 'Full-Stack Web Engineer • Applied ML Researcher • Open Source Contributor',
    bio: student?.bio || 'Junior undergraduate passionate about distributed systems, full-stack web engineering, and applied machine learning. Technical Lead at the University Coding Club and Open Source contributor.',
    objective: student?.goal || student?.objective || 'Seeking Software Engineering internships for Summer 2027 to build scalable cloud-native applications and intelligent backend systems.',
    dob: normalizeDateInput(student?.dob),
    phone: student?.phone || session?.phone || '',
    blood: student?.blood || 'O+',
    street: student?.address || student?.street || student?.houseNo || 'Flat 302, Green Park Residency, MG Road',
    city: student?.city || 'Bengaluru',
    pincode: student?.pinCode || student?.pincode || '560001',
    state: student?.state || 'Karnataka',
    district: student?.district || 'Bengaluru Urban',
    personalEmail: student?.email || 'aarav.sharma.dev@gmail.com',
    skills: student?.skills
      ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',').map(s => s.trim()).filter(Boolean))
      : ['C++ / DSA', 'Python', 'React & TypeScript', 'Node.js', 'PostgreSQL', 'Linux Kernel', 'PyTorch', 'Docker & Git'],
    avatar: student?.avatar || DEFAULT_STUDENT_AVATAR,
    cover: student?.cover || DEFAULT_COVER_IMAGE
  });

  // Keep profile in sync if student prop updates
  useEffect(() => {
    if (student) {
      setProfile(prev => ({
        ...prev,
        name: student.name || prev.name,
        degreeShort: student.course ? normalizeProfileClass(student.course) : prev.degreeShort,
        branch: student.branch || prev.branch,
        semester: student.semester ? (String(student.semester).includes('Sem') ? student.semester : `${student.semester}th Semester`) : prev.semester,
        section: student.section || prev.section,
        headline: student.headline || prev.headline,
        bio: student.bio || prev.bio,
        objective: student.goal || student.objective || prev.objective,
        dob: student.dob ? normalizeDateInput(student.dob) : prev.dob,
        phone: student.phone || prev.phone,
        blood: student.blood || prev.blood,
        street: student.address || student.street || student.houseNo || prev.street,
        city: student.city || prev.city,
        pincode: student.pinCode || student.pincode || prev.pincode,
        state: student.state || prev.state,
        district: student.district || prev.district,
        personalEmail: student.email || prev.personalEmail,
        avatar: student.avatar || prev.avatar,
        cover: student.cover || prev.cover,
        skills: student.skills
          ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',').map(s => s.trim()).filter(Boolean))
          : prev.skills
      }));
    }
  }, [student]);

  // Highlighted skills set for the Overview tab (persisted)
  const [highlightedSkills, setHighlightedSkills] = useState(() => {
    try {
      const saved = localStorage.getItem('podar-highlighted-skills');
      if (saved) return new Set(JSON.parse(saved));
    } catch {}
    return new Set(['C++ / DSA', 'React & TypeScript', 'PyTorch']);
  });

  const toggleSkillHighlight = (skill) => {
    setHighlightedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      try {
        localStorage.setItem('podar-highlighted-skills', JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  // Close open modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsComposerOpen(false);
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scrolling when modal overlays are active
  useEffect(() => {
    if (isComposerOpen || selectedProject) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isComposerOpen, selectedProject]);

  // Projects State
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('podar_local_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PROJECTS;
  });


  // Selected project for Details Modal
  const [selectedProject, setSelectedProject] = useState(null);

  // New Project Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerState, setComposerState] = useState({
    title: '',
    description: '',
    tech: '',
    demoUrl: '',
    imageDataUrl: '',
    useGradientCover: false,
    aspectRatio: '16:9',
    filter: 'Original'
  });
  const [composerDragOver, setComposerDragOver] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // File Upload Refs
  const coverUploadRef = useRef(null);
  const avatarUploadRef = useRef(null);
  const projectImgUploadRef = useRef(null);

  // Handle Cover Banner Upload
  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target.result;
      setProfile(prev => ({ ...prev, cover: url }));
      showToast('Cover banner updated!');
      persistProfileToServer({ cover: url });
    };
    reader.readAsDataURL(file);
  };

  // Handle Avatar Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = evt.target.result;
      setProfile(prev => ({ ...prev, avatar: url }));
      showToast('Profile photo updated!');
      persistProfileToServer({ avatar: url });
    };
    reader.readAsDataURL(file);
  };

  // Persist partial or full profile updates to local session and server
  const persistProfileToServer = async (customFields = {}) => {
    const activeStudentId = student?.id || session?.id || studentId;
    if (!activeStudentId) return;

    const updatedProfile = { ...profile, ...customFields };

    // Update localStorage session
    try {
      const curSession = JSON.parse(localStorage.getItem('podar-pathways-session') || 'null');
      if (curSession) {
        if (customFields.avatar) curSession.avatar = customFields.avatar;
        if (curSession.student) {
          curSession.student = {
            ...curSession.student,
            ...updatedProfile,
            course: updatedProfile.degreeShort,
            goal: updatedProfile.objective,
            address: updatedProfile.street,
          pinCode: updatedProfile.pincode,
          phone: updatedProfile.phone
          };
        }
        localStorage.setItem('podar-pathways-session', JSON.stringify(curSession));
      }

      // Update state if setState provided
      if (setState) {
        setState(prev => ({
          ...prev,
          students: (prev.students || []).map(s =>
            s.id === activeStudentId
              ? {
                  ...s,
                  ...updatedProfile,
                  course: updatedProfile.degreeShort,
                  goal: updatedProfile.objective,
                  address: updatedProfile.street,
                  pinCode: updatedProfile.pincode,
                  phone: updatedProfile.phone
                }
              : s
          )
        }));
      }
    } catch (e) {}

    // Send PUT request to API
    try {
      await fetch(`/api/students/${encodeURIComponent(activeStudentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          headline: updatedProfile.headline,
          bio: updatedProfile.bio,
          goal: updatedProfile.objective,
          dob: updatedProfile.dob,
          blood: updatedProfile.blood,
          email: updatedProfile.personalEmail,
          street: updatedProfile.street,
          address: updatedProfile.street,
          city: updatedProfile.city,
          pincode: updatedProfile.pincode,
          pinCode: updatedProfile.pincode,
          state: updatedProfile.state,
          district: updatedProfile.district,
          course: updatedProfile.degreeShort,
          branch: updatedProfile.branch,
          semester: updatedProfile.semester,
          section: updatedProfile.section,
          skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills.join(', ') : updatedProfile.skills,
          avatar: updatedProfile.avatar,
          cover: updatedProfile.cover
        })
      });
    } catch (err) {
      console.warn('API sync notice:', err);
    }
  };

  // Add new skill in settings
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const val = newSkillInput.trim();
    if (!val) return;
    if (!profile.skills.includes(val)) {
      const nextSkills = [...profile.skills, val];
      setProfile(prev => ({ ...prev, skills: nextSkills }));
      showToast(`Added "${val}" to skills`);
    }
    setNewSkillInput('');
  };

  // Remove skill in settings
  const handleRemoveSkill = (index) => {
    const removed = profile.skills[index];
    const nextSkills = profile.skills.filter((_, i) => i !== index);
    setProfile(prev => ({ ...prev, skills: nextSkills }));
    setHighlightedSkills(prev => {
      const next = new Set(prev);
      next.delete(removed);
      return next;
    });
  };

  // Save full settings form
  const handleSaveAllSettings = (e) => {
    e.preventDefault();
    const errors = {};

    if (!profile.name.trim()) errors.name = 'Full Name is required';
    if (!/^[0-9]{10}$/.test(String(profile.phone || ''))) errors.phone = 'Enter a valid 10-digit mobile number';
    if (!profile.degreeShort) errors.degreeShort = 'Class is required';
    if (!profile.semester) errors.semester = 'Semester is required';
    if (!profile.section) errors.section = 'Section is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showToast(`Please check required field: ${errors[firstKey]}`, 'error');
      setTimeout(() => {
        const firstErrorEl = document.querySelector('[aria-invalid="true"]');
        if (firstErrorEl) {
          firstErrorEl.focus();
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    setFormErrors({});
    persistProfileToServer();
    showToast('All student profile changes saved!');
    switchTab('overview');
  };

  // Reset profile defaults
  const handleResetDefaults = () => {
    const reset = {
      name: 'Aarav Sharma',
      degreeShort: '',
      branch: '',
      phone: '',
      semester: '',
      section: '',
      headline: 'Full-Stack Web Engineer • Applied ML Researcher • Open Source Contributor',
      bio: 'Junior undergraduate passionate about distributed systems, full-stack web engineering, and applied machine learning. Technical Lead at the University Coding Club and Open Source contributor.',
      objective: 'Seeking Software Engineering internships for Summer 2027 to build scalable cloud-native applications and intelligent backend systems.',
      dob: '',
      blood: '',
      street: '',
      city: '',
      pincode: '',
      state: '',
      district: '',
      personalEmail: 'aarav.sharma.dev@gmail.com',
      skills: ['C++ / DSA', 'Python', 'React & TypeScript', 'Node.js', 'PostgreSQL', 'Linux Kernel', 'PyTorch', 'Docker & Git'],
      avatar: DEFAULT_STUDENT_AVATAR,
      cover: DEFAULT_COVER_IMAGE
    };
    setProfile(reset);
    setFormErrors({});
    showToast('Profile reset to default (dropdowns set to None)');
  };

  // Project Composer Handlers
  const handleOpenComposer = () => {
    setComposerState({
      title: '',
      description: '',
      tech: '',
      demoUrl: '',
      imageDataUrl: '',
      useGradientCover: false,
      aspectRatio: '16:9',
      filter: 'Original'
    });
    setIsComposerOpen(true);
  };

  const handleComposerFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setComposerState(prev => ({
        ...prev,
        imageDataUrl: evt.target.result,
        useGradientCover: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleShareProject = (e) => {
    e.preventDefault();
    if (!composerState.title.trim()) {
      showToast('Project Title is required', 'error');
      return;
    }

    const techTags = composerState.tech
      ? composerState.tech.split(',').map(t => t.trim()).filter(Boolean)
      : ['Student Project'];

    const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const newProject = {
      id: Date.now(),
      title: composerState.title.trim(),
      description: composerState.description.trim(),
      tech: techTags,
      demoUrl: composerState.demoUrl.trim(),
      image: composerState.imageDataUrl || '',
      filter: composerState.filter,
      aspect: composerState.aspectRatio,
      date: dateLabel
    };

    const nextProjects = [newProject, ...projects];
    setProjects(nextProjects);

    try {
      localStorage.setItem('podar_local_projects', JSON.stringify(nextProjects));
    } catch (e) {}

    setIsComposerOpen(false);
    showToast('Project shared to your portfolio!');
  };

  // Derived labels
  const degreeBranchLabel = useMemo(() => {
    return profile.degreeShort || 'Class not specified';
  }, [profile.degreeShort]);

  // Cascading districts list for Settings
  const districtOptions = useMemo(() => {
    if (profile.state && INDIAN_STATES_DISTRICTS[profile.state]) {
      return INDIAN_STATES_DISTRICTS[profile.state];
    }
    return [];
  }, [profile.state]);

  return (
    <div className={`student-profile-portal bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased transition-colors duration-300 min-h-screen pb-16 ${isDarkMode ? 'dark' : ''}`}>

      {/* Floating Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
          <div className={`${toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700'} px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 transition-all duration-300 modal-animate-enter pointer-events-auto`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* 1. HEADER & ACADEMIC BANNER CARD */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors duration-300">

          {/* College Campus Cover Banner */}
          <div
            onClick={() => coverUploadRef.current?.click()}
            title="Click to change cover banner"
            className="relative h-36 sm:h-52 md:h-60 w-full bg-gradient-to-r from-slate-900 via-indigo-900 to-navy-600 overflow-hidden group cursor-pointer"
          >
            <img
              src={profile.cover || DEFAULT_COVER_IMAGE}
              alt="University Campus Banner"
              className="w-full h-full object-cover object-center opacity-85 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent"></div>

            {/* Desktop Hover Camera Overlay */}
            <div className="hidden sm:flex absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
              <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-medium tracking-wide">Change Banner</span>
            </div>

            {/* Mobile Visible Camera Badge (Tap to Change Banner) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                coverUploadRef.current?.click();
              }}
              className="sm:hidden absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
              aria-label="Change banner photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Cover</span>
            </button>
            <input
              type="file"
              ref={coverUploadRef}
              accept="image/*"
              onClick={(e) => e.stopPropagation()}
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>

          {/* Student Profile Info Section */}
          <div className="px-4 sm:px-8 pb-6">
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 sm:-mt-16 mb-4 sm:mb-5 gap-3 sm:gap-4">

              {/* Circular Student Avatar with Mobile Badge */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  avatarUploadRef.current?.click();
                }}
                title="Click to change profile photo"
                className="relative inline-block w-24 h-24 sm:w-32 sm:h-32 rounded-full group cursor-pointer flex-shrink-0"
              >
                <ProfileAvatar
                  src={profile.avatar || DEFAULT_STUDENT_AVATAR}
                  name={profile.name}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-slate-200 dark:bg-slate-800"
                />

                {/* Desktop Hover Camera Overlay */}
                <div className="hidden sm:flex absolute inset-1 rounded-full bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center justify-center text-white pointer-events-none">
                  <Camera className="w-6 h-6 text-white" />
                </div>

                {/* Mobile Camera Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarUploadRef.current?.click();
                  }}
                  className="sm:hidden absolute bottom-0 right-0 p-1.5 rounded-full bg-navy-600 text-white shadow-md border-2 border-white dark:border-slate-900 active:scale-95 transition-transform"
                  aria-label="Change profile photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={avatarUploadRef}
                  accept="image/*"
                  onClick={(e) => e.stopPropagation()}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Header Quick Actions (Upload Project & Edit Profile) */}
              <div className="flex items-center gap-2 pt-1 sm:pt-0 sm:self-end w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleOpenComposer}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Upload Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('settings')}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Student Name, Academic Summary & Bio */}
            <div className="space-y-2.5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {profile.name}
                </h1>
                <p className="text-sm sm:text-base font-medium text-navy-600 dark:text-indigo-400 mt-0.5">
                  {degreeBranchLabel}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.headline}
                </p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-3xl leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="student-profile-tabs border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar" role="tablist" aria-label="Profile sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-current={activeTab === 'overview' ? 'page' : undefined}
              onClick={() => switchTab('overview')}
              className={`tab-btn profile-tab py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'overview'
                  ? 'border-navy-600 text-navy-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'projects'}
              aria-current={activeTab === 'projects' ? 'page' : undefined}
              onClick={() => switchTab('projects')}
              className={`tab-btn profile-tab py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'projects'
                  ? 'border-navy-600 text-navy-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
              <span className="ml-0.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-300">
                {projects.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'settings'}
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              onClick={() => switchTab('settings')}
              className={`tab-btn profile-tab py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'settings'
                  ? 'border-navy-600 text-navy-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>
        </section>

        {/* 2. TAB PANELS */}
        <div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-panel space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* About, Career Objective & Domain Interests Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                    <span>About & Career Objective</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {profile.bio || 'No academic bio added yet.'}
                  </p>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Career Objective
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {profile.objective || 'No career objective specified.'}
                    </p>
                  </div>
                  <div className="pt-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Research & Domain Interests
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-navy-600 dark:text-indigo-300">
                        Distributed Systems
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-navy-600 dark:text-indigo-300">
                        Full-Stack Architecture
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-navy-600 dark:text-indigo-300">
                        Applied AI / LLMs
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-navy-600 dark:text-indigo-300">
                        Cloud & DevOps
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic & Personal Identity Details */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                      <span>Academic & Personal Details</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => switchTab('settings', 'settings-academic')}
                      className="profile-edit-btn text-xs font-medium text-navy-600 dark:text-indigo-400"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Class</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.degreeShort || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Section</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.section || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Current Semester</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.semester || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Mobile Number</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.phone || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Date of Birth</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {formatDateDisplay(profile.dob)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Blood Group</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.blood || 'Not specified'}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-slate-400 font-medium">Personal Email</p>
                      <p
                        className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate"
                        title={profile.personalEmail}
                      >
                        {profile.personalEmail || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Address Details Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                      <span>Address Details</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => switchTab('settings', 'settings-address')}
                      className="profile-edit-btn text-xs font-medium text-navy-600 dark:text-indigo-400"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs">
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-slate-400 font-medium">Street / House / Area Address</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.street || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">City / Town</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.city || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">District</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.district || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">State / UT</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.state || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">PIN Code</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.pincode || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technical Skills & Stack */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                      <span>Technical Skills & Stack</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Tap to highlight • Edit in Settings</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.skills.length === 0 ? (
                      <p className="text-xs text-slate-400">No skills added yet. Add them in Profile Settings.</p>
                    ) : (
                      profile.skills.map(skill => {
                        const isPinned = highlightedSkills.has(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkillHighlight(skill)}
                            className={`profile-skill-chip px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                              isPinned
                                ? 'bg-navy-600 text-white border-navy-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-navy-400'
                            }`}
                          >
                            {isPinned && <Star className="w-3 h-3 fill-current" />}
                            <span>{skill}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="tab-panel space-y-6">

              {/* Projects Action Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderGit2 className="w-5 h-5 text-navy-600 dark:text-indigo-400" />
                    <span>My Coursework & Projects</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Showcase engineering prototypes, coursework builds, and hackathon projects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenComposer}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Project</span>
                </button>
              </div>

              {/* Projects Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-navy-600 dark:text-indigo-400 flex items-center justify-center">
                      <FolderGit2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      You haven't uploaded any projects yet
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Showcase your coursework builds, hackathon creations, and engineering prototypes to build an impressive student portfolio.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleOpenComposer}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Upload Your First Project</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  projects.map(proj => {
                    const cssFilter = FILTER_STYLES[proj.filter] || 'none';
                    return (
                      <article
                        key={proj.id}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all"
                      >
                        <div>
                          <div
                            onClick={() => setSelectedProject(proj)}
                            className="relative h-44 w-full bg-gradient-to-br from-navy-700 via-indigo-700 to-blue-600 overflow-hidden cursor-pointer"
                          >
                            {proj.image ? (
                              <img
                                src={proj.image}
                                alt={proj.title}
                                style={{ filter: cssFilter }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5">
                                <Code2 className="w-8 h-8" />
                                <span className="text-[11px] font-medium opacity-80">Software Build</span>
                              </div>
                            )}
                            <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-slate-950/65 text-white text-[11px] font-medium backdrop-blur-sm">
                              {proj.date}
                            </span>
                          </div>

                          <div className="p-5 space-y-2.5">
                            <h3
                              onClick={() => setSelectedProject(proj)}
                              className="text-base font-bold text-slate-900 dark:text-white group-hover:text-navy-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
                            >
                              {proj.title}
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                              {proj.description || 'No description provided.'}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {Array.isArray(proj.tech) &&
                              proj.tech.map((t, idx) => (
                                <span
                                  key={idx}
                                  className="profile-project-tech-chip px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {t}
                                </span>
                              ))}
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setSelectedProject(proj)}
                              className="profile-project-details-btn text-xs font-semibold text-navy-600 dark:text-indigo-400"
                            >
                              View Details
                            </button>

                            {proj.demoUrl ? (
                              <a
                                href={formatExternalUrl(proj.demoUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
                              >
                                <span>Live / Repo</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">Local build</span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="tab-panel">
              <form onSubmit={handleSaveAllSettings} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left 2 Columns: Personal, Address, Academic & Skills Cards */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Card A: Personal Information */}
                  <div id="settings-personal" className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-all">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Personal Information</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Fields marked with <span className="text-rose-500 font-bold">*</span> are required; all others are optional.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Full Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                          required
                          aria-invalid={Boolean(formErrors.name)}
                          aria-describedby={formErrors.name ? 'profile-name-error' : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                            formErrors.name ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                          } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        />
                        {formErrors.name && (
                          <p id="profile-name-error" className="mt-1 text-xs text-rose-600" role="alert">
                            {formErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Tagline / Headline
                        </label>
                        <input
                          type="text"
                          value={profile.headline}
                          onChange={(e) => setProfile(prev => ({ ...prev, headline: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Academic Bio
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {(profile.bio || '').length} / 400
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={400}
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Career Objective
                        </label>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {(profile.objective || '').length} / 300
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        maxLength={300}
                        value={profile.objective}
                        onChange={(e) => setProfile(prev => ({ ...prev, objective: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Mobile Number <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          required
                          placeholder="10-digit mobile number"
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                          aria-invalid={Boolean(formErrors.phone)}
                          aria-describedby={formErrors.phone ? 'profile-phone-error' : undefined}
                          className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border ${formErrors.phone ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'} text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        />
                        {formErrors.phone && <p id="profile-phone-error" className="mt-1 text-xs text-rose-600" role="alert">{formErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          value={profile.dob}
                          onChange={(e) => setProfile(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Blood Group
                        </label>
                        <select
                          value={profile.blood}
                          onChange={(e) => setProfile(prev => ({ ...prev, blood: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        >
                          <option value="">None</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Personal Email
                        </label>
                        <input
                          type="email"
                          value={profile.personalEmail}
                          onChange={(e) => setProfile(prev => ({ ...prev, personalEmail: e.target.value }))}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card B: Address Details */}
                  <div id="settings-address" className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-all">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Address Details</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Residential and permanent location details (optional).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Street / House / Area Address
                      </label>
                      <input
                        type="text"
                        value={profile.street}
                        onChange={(e) => setProfile(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="e.g., Flat 302, Green Park Residency, MG Road"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          City / Town
                        </label>
                        <input
                          type="text"
                          value={profile.city}
                          onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g., Bengaluru"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          PIN Code
                        </label>
                        <input
                          type="text"
                          value={profile.pincode}
                          onChange={(e) => setProfile(prev => ({ ...prev, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                          placeholder="e.g., 560001"
                          maxLength={6}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>
                    </div>

                    {/* Cascading State & District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          State / Union Territory
                        </label>
                        <select
                          value={profile.state}
                          onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value, district: '' }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        >
                          <option value="">None</option>
                          {Object.keys(INDIAN_STATES_DISTRICTS).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          District
                        </label>
                        <select
                          value={profile.district}
                          onChange={(e) => setProfile(prev => ({ ...prev, district: e.target.value }))}
                          disabled={!profile.state || districtOptions.length === 0}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">None</option>
                          {districtOptions.map(dist => (
                            <option key={dist} value={dist}>{dist}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Card C: Academic & Enrollment Details */}
                  <div id="settings-academic" className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5 transition-all">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Academic & Enrollment Details</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Class and semester details (<span className="text-rose-500 font-bold">*</span> required).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Class <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <select
                          value={profile.degreeShort}
                          onChange={(e) => setProfile(prev => ({ ...prev, degreeShort: e.target.value }))}
                          required
                          aria-invalid={Boolean(formErrors.degreeShort)}
                          aria-describedby={formErrors.degreeShort ? 'profile-degree-error' : undefined}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                            formErrors.degreeShort ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                          } text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        >
                          <option value="">Select class</option>
                          {PROFILE_CLASSES.map(className => <option key={className} value={className}>{className}</option>)}
                        </select>
                        {formErrors.degreeShort && (
                          <p id="profile-degree-error" className="mt-1 text-xs text-rose-600" role="alert">
                            {formErrors.degreeShort}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Semester <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <select
                            value={profile.semester}
                            onChange={(e) => setProfile(prev => ({ ...prev, semester: e.target.value }))}
                            required
                            aria-invalid={Boolean(formErrors.semester)}
                            aria-describedby={formErrors.semester ? 'profile-semester-error' : undefined}
                            className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                              formErrors.semester ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                            } text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                          >
                            <option value="">None</option>
                            <option value="1st Semester">1st Sem</option>
                            <option value="2nd Semester">2nd Sem</option>
                            <option value="3rd Semester">3rd Sem</option>
                            <option value="4th Semester">4th Sem</option>
                            <option value="5th Semester">5th Sem</option>
                            <option value="6th Semester">6th Sem</option>
                            <option value="7th Semester">7th Sem</option>
                            <option value="8th Semester">8th Sem</option>
                          </select>
                          {formErrors.semester && (
                            <p id="profile-semester-error" className="mt-1 text-xs text-rose-600" role="alert">
                              {formErrors.semester}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Section <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <select
                            value={profile.section}
                            onChange={(e) => setProfile(prev => ({ ...prev, section: e.target.value }))}
                            required
                            aria-invalid={Boolean(formErrors.section)}
                            aria-describedby={formErrors.section ? 'profile-section-error' : undefined}
                            className={`w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                              formErrors.section ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                            } text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                          >
                            <option value="">None</option>
                            <option value="Section A">Section A</option>
                            <option value="Section B">Section B</option>
                            <option value="Section C">Section C</option>
                            <option value="Section D">Section D</option>
                          </select>
                          {formErrors.section && (
                            <p id="profile-section-error" className="mt-1 text-xs text-rose-600" role="alert">
                              {formErrors.section}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card D: Technical Skills Manager */}
                  <div id="settings-skills" className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-all">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Technical Skills & Expertise</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage skills showcased on your public academic profile.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="e.g. Next.js, Docker, PyTorch"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-4 py-2.5 rounded-xl bg-navy-600 hover:bg-navy-700 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {profile.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="profile-skill-remove hover:text-rose-500 transition-colors"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Preferences & Save Actions */}
                <div className="space-y-6">

                  {/* Preferences Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      System Preferences
                    </h3>

                    {/* Dark Theme Switch */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dark Theme</p>
                        <p className="text-[11px] text-slate-400">Toggle high-contrast dark mode</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isDarkMode}
                        onClick={toggleDarkMode}
                        className={`profile-setting-switch ${isDarkMode ? 'is-on' : ''}`}
                      >
                        <span className="profile-setting-switch-thumb" />
                      </button>
                    </div>

                    {/* Email Alerts Switch */}
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email Alerts</p>
                        <p className="text-[11px] text-slate-400">Project & portal activity alerts</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={emailAlerts}
                        onClick={handleToggleEmailAlerts}
                        className={`profile-setting-switch ${emailAlerts ? 'is-on' : ''}`}
                      >
                        <span className="profile-setting-switch-thumb" />
                      </button>
                    </div>
                  </div>

                  {/* Save & Reset Actions Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <button
                      type="submit"
                      className="profile-save-button"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save All Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="profile-reset-button"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {/* Mobile Floating / Sticky Quick Save Bar */}
                  <div className="lg:hidden sticky bottom-4 z-30 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2">
                    <button
                      type="submit"
                      className="profile-save-button flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="profile-reset-button py-2.5 px-3 text-xs"
                    >
                      Reset
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* SINGLE-VIEW INSTAGRAM-STYLE PROJECT POST COMPOSER MODAL */}
      {isComposerOpen && (
        <div
          className="profile-popup-layer fixed inset-0 z-[2147483000] overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex items-start sm:items-center justify-center overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsComposerOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="New Project Post"
        >
          <form
            onSubmit={handleShareProject}
            noValidate
            className="profile-project-composer bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col modal-animate-enter"
          >
            {/* Modal Header (Sticky / Non-shrinking) */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="profile-composer-cancel text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                New Project Post
              </h3>
              <button
                type="submit"
                className="profile-composer-share inline-flex text-xs sm:text-sm font-bold text-navy-600 dark:text-indigo-400 hover:text-navy-700 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg transition-colors"
              >
                Share
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12">

              {/* Left Pane: Media Dropzone, Aspect Ratio & Filters */}
              <div className="lg:col-span-7 bg-slate-100/80 dark:bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setComposerDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setComposerDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setComposerDragOver(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleComposerFile(file);
                  }}
                  className={`relative w-full min-h-[260px] sm:min-h-[320px] rounded-2xl border-2 border-dashed ${
                    composerDragOver ? 'border-navy-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-300 dark:border-slate-700'
                  } bg-white dark:bg-slate-900/90 flex items-center justify-center overflow-hidden transition-all`}
                >
                  {!composerState.imageDataUrl && !composerState.useGradientCover ? (
                    /* Empty Dropzone State */
                    <div className="p-6 text-center space-y-3.5 max-w-xs mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                        <PlusCircle className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Drag project screenshot here
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          or select a cover photo from your device
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => projectImgUploadRef.current?.click()}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm transition-colors"
                        >
                          Select from device
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposerState(prev => ({ ...prev, useGradientCover: true, imageDataUrl: '' }))}
                          className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                        >
                          Use Gradient Cover
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Preview State */
                    <div className="w-full h-full flex flex-col items-center justify-center p-3">
                      <div
                        className={`relative w-full ${
                          composerState.aspectRatio === '4:5'
                            ? 'aspect-[4/5]'
                            : composerState.aspectRatio === '1:1'
                            ? 'aspect-square'
                            : 'aspect-video'
                        } max-h-[300px] rounded-xl overflow-hidden shadow-md bg-gradient-to-br from-navy-700 via-indigo-700 to-blue-600 flex items-center justify-center transition-all duration-300`}
                      >
                        {composerState.imageDataUrl ? (
                          <img
                            src={composerState.imageDataUrl}
                            alt="Preview"
                            style={{ filter: FILTER_STYLES[composerState.filter] || 'none' }}
                            className="w-full h-full object-cover transition-all duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/95 gap-2 p-4 text-center">
                            <Code2 className="w-10 h-10" />
                            <span className="text-xs font-semibold tracking-wide uppercase opacity-90">
                              Custom Gradient Cover
                            </span>
                          </div>
                        )}

                        {/* Top-Right Quick Actions */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => projectImgUploadRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-950 text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1 transition-colors"
                          >
                            <ImagePlus className="w-3 h-3" />
                            <span>Change Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setComposerState(prev => ({ ...prev, imageDataUrl: '', useGradientCover: false }))}
                            className="px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-rose-600 text-white text-[11px] font-medium backdrop-blur-md flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={projectImgUploadRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleComposerFile(file);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Aspect Ratio & Filter Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Crop className="w-3.5 h-3.5" />
                      <span>Aspect Ratio</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {['16:9', '4:5', '1:1'].map(ratio => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setComposerState(prev => ({ ...prev, aspectRatio: ratio }))}
                          className={`aspect-pill px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                            composerState.aspectRatio === ratio
                              ? 'font-semibold bg-navy-600 text-white'
                              : 'font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Photo Filters</span>
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {Object.keys(FILTER_STYLES).map(filterName => (
                        <button
                          key={filterName}
                          type="button"
                          onClick={() => setComposerState(prev => ({ ...prev, filter: filterName }))}
                          className={`img-filter-pill px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition-colors ${
                            composerState.filter === filterName
                              ? 'font-semibold bg-navy-600 text-white'
                              : 'font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {filterName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Author, Title, Description, Tech Tags & Link */}
              <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <ProfileAvatar
                      src={profile.avatar || DEFAULT_STUDENT_AVATAR}
                      name={profile.name}
                      alt={profile.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      style={{ width: '2.25rem', height: '2.25rem' }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {profile.name}
                      </p>
                      <p className="text-[11px] text-slate-400">Posting to Student Portfolio</p>
                    </div>
                  </div>

                  {/* Project Title * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Project Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={composerState.title}
                      onChange={(e) => setComposerState(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Campus Smart Attendance System"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                  </div>

                  {/* Caption / Description with Counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Caption / Description
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {composerState.description.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={composerState.description}
                      onChange={(e) => setComposerState(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write a caption about what you built, how it works, and key highlights..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                    />
                  </div>

                  {/* Tech Stack / Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tech Stack / Tags
                    </label>
                    <input
                      type="text"
                      value={composerState.tech}
                      onChange={(e) => setComposerState(prev => ({ ...prev, tech: e.target.value }))}
                      placeholder="React, Node.js, MongoDB (comma-separated)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                    {composerState.tech && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {composerState.tech.split(',').map(t => t.trim()).filter(Boolean).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Project / Live Link */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Project / Live Link
                    </label>
                    <div className="relative">
                      <Link className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={composerState.demoUrl}
                        onChange={(e) => setComposerState(prev => ({ ...prev, demoUrl: e.target.value }))}
                        placeholder="https://my-project.vercel.app (optional)"
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Share Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 lg:hidden">
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Share Project</span>
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* PROJECT DETAIL MODAL */}
      {selectedProject && (
        <div
          className="profile-popup-layer fixed inset-0 z-[2147483000] overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 flex items-start sm:items-center justify-center overscroll-contain"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProject(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Project Details"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto modal-animate-enter">
            <div className="h-44 sm:h-52 w-full bg-gradient-to-r from-navy-700 to-indigo-600 relative overflow-hidden flex-shrink-0">
              {selectedProject.image && (
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  style={{ filter: FILTER_STYLES[selectedProject.filter] || 'none' }}
                  className="w-full h-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors shadow-md"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">
                  Uploaded {selectedProject.date}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {selectedProject.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedProject.description || 'No description provided.'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Array.isArray(selectedProject.tech) &&
                  selectedProject.tech.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-300"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {selectedProject.demoUrl && (
                <a
                  href={formatExternalUrl(selectedProject.demoUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Project Link</span>
                </a>
              )}
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
  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(
    session?.avatar || session?.admin?.avatar || DEFAULT_ADMIN_AVATAR
  );
  const [name, setName] = useState(session?.name || session?.admin?.name || 'Podar Administrator');
  const [phone, setPhone] = useState(session?.adminPhone || session?.admin?.phone || '');
  const [department, setDepartment] = useState(session?.department || session?.admin?.department || 'Career & Placement Cell');
  const [role, setRole] = useState(session?.adminRole || session?.admin?.role || 'Super Admin');
  const email = session?.email || session?.admin?.email || '';
  const [saving, setSaving] = useState(false);

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
        fetch(`/api/admins/${encodeURIComponent(session.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: compressedDataUrl })
        }).then(res => { if(!res.ok) throw Error('Unable to save profile photo.'); notify?.('Admin profile photo updated successfully!'); }).catch(err => notify?.(err.message));
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

    fetch(`/api/admins/${encodeURIComponent(session.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: DEFAULT_ADMIN_AVATAR })
    }).then(res => { if(!res.ok) throw Error('Unable to reset profile photo.'); notify?.('Profile photo reset to default.'); }).catch(err => notify?.(err.message));
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

    fetch(`/api/admins/${encodeURIComponent(session.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        department,
        avatar
      })
    }).then(res => { if(!res.ok) throw Error('Unable to save administrator profile.'); notify?.('Administrator profile saved successfully!'); }).catch(err => notify?.(err.message)).finally(() => setSaving(false));
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
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile photo"
          >
            <ProfileAvatar
              name={name}
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
            <div
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
                pointerEvents: 'none'
              }}
            >
              <Camera size={13} />
            </div>
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
                {avatar !== DEFAULT_ADMIN_AVATAR ? 'Change Photo' : 'Upload Photo'}
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
