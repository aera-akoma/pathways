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
  Search,
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
  Trash2,
  Bell,
  Share2,
  Award,
  Check,
  ChevronLeft,
  Phone,
  Mail,
  Globe,
  CheckCheck,
  Filter,
  ShieldCheck,
  BadgeCheck
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
const DEFAULT_STUDENT_PHOTO = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';

// Helper to ensure external links don't navigate to relative paths
const formatExternalUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Placement Drive Notice',
    message: 'Google Summer Internship 2027 applications are now open for CS & IT students.',
    type: 'opportunity',
    date: '10m ago',
    read: false
  },
  {
    id: 'notif-2',
    title: 'P-CARE Score Updated',
    message: 'Your readiness score was upgraded to 85/100 following your project submission.',
    type: 'score',
    date: '2h ago',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Academic Milestone',
    message: 'Semester V course enrollments and elective electives have been confirmed.',
    type: 'academic',
    date: '1d ago',
    read: true
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
  // Check if viewing own profile vs a peer or admin view
  const isOwnProfile = useMemo(() => {
    if (studentId && session?.id && studentId !== session.id) return false;
    return true;
  }, [studentId, session?.id]);

  // Determine active tab from URL or props
  const getTabFromUrl = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const t = searchParams.get('tab');
      if (t && ['overview', 'projects', 'certificates', 'settings'].includes(t)) {
        return t;
      }
    } catch (e) {}
    if (initialTab === 'settings' || initialTab === 'edit') return 'settings';
    if (initialTab === 'projects' || initialTab === 'posts') return 'projects';
    if (initialTab === 'certificates') return 'certificates';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  const switchTab = (tabName) => {
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
  };

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
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

  // Email alerts toggle state
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
    degreeShort: student?.course || 'BCA',
    branch: student?.branch || 'Computer Science & Engineering',
    batch: student?.graduationYear || student?.batch || '2023–2027',
    semester: student?.semester ? (String(student.semester).includes('Sem') ? student.semester : `${student.semester}th Semester`) : '5th Semester',
    section: student?.section || 'Section A',
    headline: student?.headline || 'Full-Stack Web Engineer • Applied ML Researcher • Open Source Contributor',
    bio: student?.bio || 'Junior undergraduate passionate about distributed systems, full-stack web engineering, and applied machine learning. Technical Lead at the University Coding Club and Open Source contributor.',
    objective: student?.goal || student?.objective || 'Seeking Software Engineering internships for Summer 2027 to build scalable cloud-native applications and intelligent backend systems.',
    dob: student?.dob ? (typeof student.dob === 'string' && student.dob.includes('T') ? student.dob.split('T')[0] : String(student.dob)) : '14 Aug 2005',
    blood: student?.blood || 'O+',
    street: student?.address || student?.street || student?.houseNo || 'Flat 302, Green Park Residency, MG Road',
    city: student?.city || 'Bengaluru',
    pincode: student?.pinCode || student?.pincode || '560001',
    state: student?.state || 'Karnataka',
    district: student?.district || 'Bengaluru Urban',
    personalEmail: student?.email || 'aarav.sharma.dev@gmail.com',
    phone: student?.phone || '9876543210',
    portfolioUrl: student?.portfolio || student?.portfolioUrl || 'https://aaravsharma.dev',
    github: student?.github || 'https://github.com/aaravsharma',
    linkedin: student?.linkedin || 'https://linkedin.com/in/aaravsharma',
    score: student?.score || 85,
    completion: student?.completion || 95,
    skills: student?.skills
      ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',').map(s => s.trim()).filter(Boolean))
      : ['C++ / DSA', 'Python', 'React & TypeScript', 'Node.js', 'PostgreSQL', 'Linux Kernel', 'PyTorch', 'Docker & Git'],
    avatar: student?.avatar || DEFAULT_STUDENT_PHOTO,
    cover: student?.cover || DEFAULT_COVER_IMAGE
  });

  // Keep profile in sync if student prop updates
  useEffect(() => {
    if (student) {
      setProfile(prev => ({
        ...prev,
        name: student.name || prev.name,
        degreeShort: student.course || prev.degreeShort,
        branch: student.branch || prev.branch,
        batch: student.graduationYear || student.batch || prev.batch,
        semester: student.semester ? (String(student.semester).includes('Sem') ? student.semester : `${student.semester}th Semester`) : prev.semester,
        section: student.section || prev.section,
        headline: student.headline || prev.headline,
        bio: student.bio || prev.bio,
        objective: student.goal || student.objective || prev.objective,
        dob: student.dob ? (typeof student.dob === 'string' && student.dob.includes('T') ? student.dob.split('T')[0] : String(student.dob)) : prev.dob,
        blood: student.blood || prev.blood,
        street: student.address || student.street || student.houseNo || prev.street,
        city: student.city || prev.city,
        pincode: student.pinCode || student.pincode || prev.pincode,
        state: student.state || prev.state,
        district: student.district || prev.district,
        personalEmail: student.email || prev.personalEmail,
        phone: student.phone || prev.phone,
        portfolioUrl: student.portfolio || student.portfolioUrl || prev.portfolioUrl,
        github: student.github || prev.github,
        linkedin: student.linkedin || prev.linkedin,
        score: student.score || prev.score,
        completion: student.completion || prev.completion,
        avatar: student.avatar || prev.avatar,
        cover: student.cover || prev.cover,
        skills: student.skills
          ? (Array.isArray(student.skills) ? student.skills : student.skills.split(',').map(s => s.trim()).filter(Boolean))
          : prev.skills
      }));
    }
  }, [student]);

  // Highlighted skills set for the Overview tab
  const [highlightedSkills, setHighlightedSkills] = useState(
    () => new Set(['C++ / DSA', 'React & TypeScript', 'PyTorch'])
  );

  const toggleSkillHighlight = (skill) => {
    setHighlightedSkills(prev => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  };

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

  const [projectSearchInput, setProjectSearchInput] = useState('');

  // Certificates State
  const [certificates, setCertificates] = useState([
    {
      id: 'cert-1',
      title: 'Full Stack Cloud Development',
      issuer: 'Podar Academic Pathways',
      date: 'Aug 2026',
      status: 'verified',
      verifiedBy: 'Dr. H.P. Singh (Principal)'
    },
    {
      id: 'cert-2',
      title: 'Neural Networks & Deep Learning',
      issuer: 'DeepLearning.AI / Coursera',
      date: 'Jun 2026',
      status: 'verified',
      verifiedBy: 'Department of Computer Science'
    }
  ]);

  // Fetch certificates from API if available
  useEffect(() => {
    const studentIdToFetch = student?.id || session?.id;
    if (!studentIdToFetch) return;
    fetch('/api/certificates')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const studentCerts = data.filter(c => c.studentId === studentIdToFetch || c.studentName === profile.name);
          if (studentCerts.length > 0) setCertificates(studentCerts);
        }
      })
      .catch(() => {});
  }, [student?.id, session?.id, profile.name]);

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

  // Student Inbox & Notifications State
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [inboxFilter, setInboxFilter] = useState('all'); // 'all' | 'unread'

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All messages marked as read');
  };

  const markSingleNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Share profile handler
  const [copiedShare, setCopiedShare] = useState(false);
  const handleShareProfile = () => {
    try {
      const url = window.location.origin + '/?page=profile' + (profile.name ? `&name=${encodeURIComponent(profile.name)}` : '');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
      }
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2400);
      showToast('Profile link copied to clipboard!');
    } catch {
      showToast('Could not copy link to clipboard.', 'error');
    }
  };

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
            portfolio: updatedProfile.portfolioUrl
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
                  portfolio: updatedProfile.portfolioUrl
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
          headline: updatedProfile.headline,
          bio: updatedProfile.bio,
          goal: updatedProfile.objective,
          dob: updatedProfile.dob,
          blood: updatedProfile.blood,
          email: updatedProfile.personalEmail,
          phone: updatedProfile.phone,
          street: updatedProfile.street,
          address: updatedProfile.street,
          city: updatedProfile.city,
          pincode: updatedProfile.pincode,
          pinCode: updatedProfile.pincode,
          state: updatedProfile.state,
          district: updatedProfile.district,
          course: updatedProfile.degreeShort,
          branch: updatedProfile.branch,
          graduationYear: updatedProfile.batch,
          semester: updatedProfile.semester,
          section: updatedProfile.section,
          portfolio: updatedProfile.portfolioUrl,
          github: updatedProfile.github,
          linkedin: updatedProfile.linkedin,
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
    if (!profile.degreeShort) errors.degreeShort = 'Degree is required';
    if (!profile.branch) errors.branch = 'Branch is required';
    if (!profile.semester) errors.semester = 'Semester is required';
    if (!profile.section) errors.section = 'Section is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstKey = Object.keys(errors)[0];
      showToast(`Please fill in required field: ${errors[firstKey]}`, 'error');
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
      degreeShort: 'BCA',
      branch: 'Computer Science & Engineering',
      batch: '2023–2027',
      semester: '5th Semester',
      section: 'Section A',
      headline: 'Full-Stack Web Engineer • Applied ML Researcher • Open Source Contributor',
      bio: 'Junior undergraduate passionate about distributed systems, full-stack web engineering, and applied machine learning. Technical Lead at the University Coding Club and Open Source contributor.',
      objective: 'Seeking Software Engineering internships for Summer 2027 to build scalable cloud-native applications and intelligent backend systems.',
      dob: '14 Aug 2005',
      blood: 'O+',
      street: 'Flat 302, Green Park Residency, MG Road',
      city: 'Bengaluru',
      pincode: '560001',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      personalEmail: 'aarav.sharma.dev@gmail.com',
      phone: '9876543210',
      portfolioUrl: 'https://aaravsharma.dev',
      github: 'https://github.com/aaravsharma',
      linkedin: 'https://linkedin.com/in/aaravsharma',
      score: 85,
      completion: 95,
      skills: ['C++ / DSA', 'Python', 'React & TypeScript', 'Node.js', 'PostgreSQL', 'Linux Kernel', 'PyTorch', 'Docker & Git'],
      avatar: DEFAULT_STUDENT_PHOTO,
      cover: DEFAULT_COVER_IMAGE
    };
    setProfile(reset);
    setFormErrors({});
    showToast('Profile reset to default values');
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
      demoUrl: formatExternalUrl(composerState.demoUrl),
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

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    const query = projectSearchInput.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (Array.isArray(p.tech) && p.tech.some(t => t.toLowerCase().includes(query)))
    );
  }, [projects, projectSearchInput]);

  // Derived labels
  const degreeBranchLabel = useMemo(() => {
    const parts = [profile.degreeShort, profile.branch].filter(Boolean);
    if (!parts.length) return 'Academic program not specified';
    return parts.join(' • ');
  }, [profile.degreeShort, profile.branch]);

  const batchYearLabel = useMemo(() => {
    if (profile.batch && profile.batch.includes('–')) {
      return `Class of ${profile.batch.split('–')[1].trim()}`;
    }
    return profile.batch ? `Class of ${profile.batch}` : '';
  }, [profile.batch]);

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

        {/* Peer or Admin View Back Banner */}
        {!isOwnProfile && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('podar-route-change', { detail: { page: 'profile', params: { tab: 'directory' } } }));
                }
                navigate?.('profile');
              }}
              className="text-xs font-semibold text-navy-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Campus Directory</span>
            </button>
            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
              Viewing Student Record
            </span>
          </div>
        )}

        {/* 1. HEADER & ACADEMIC BANNER CARD */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors duration-300">

          {/* College Campus Cover Banner */}
          <div
            onClick={() => {
              if (isOwnProfile) coverUploadRef.current?.click();
            }}
            title={isOwnProfile ? "Click to change cover banner" : "Campus Cover"}
            className={`relative h-44 sm:h-56 w-full bg-gradient-to-r from-slate-900 via-indigo-900 to-navy-600 overflow-hidden group ${isOwnProfile ? 'cursor-pointer' : ''}`}
          >
            <img
              src={profile.cover || DEFAULT_COVER_IMAGE}
              alt="University Campus Banner"
              className="w-full h-full object-cover object-center opacity-85 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

            {/* Hover Camera Overlay (Only for own profile) */}
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 text-white pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium tracking-wide">Change Banner</span>
              </div>
            )}
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
          <div className="px-6 sm:px-8 pb-6">
            <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-14 sm:-mt-16 mb-5 gap-4">

              {/* Circular Student Avatar */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (isOwnProfile) avatarUploadRef.current?.click();
                }}
                title={isOwnProfile ? "Click to change profile photo" : profile.name}
                className={`relative inline-block w-28 h-28 sm:w-32 sm:h-32 rounded-full group ${isOwnProfile ? 'cursor-pointer' : ''}`}
              >
                <img
                  src={profile.avatar || DEFAULT_STUDENT_PHOTO}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full border-4 border-white dark:border-slate-900 shadow-lg bg-slate-200 dark:bg-slate-800"
                />

                {/* Avatar Hover Camera Overlay */}
                {isOwnProfile && (
                  <div className="absolute inset-1 rounded-full bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white pointer-events-none">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
                <input
                  type="file"
                  ref={avatarUploadRef}
                  accept="image/*"
                  onClick={(e) => e.stopPropagation()}
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Action Buttons Right Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsInboxOpen(true)}
                      className="relative px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-navy-400 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm"
                      title="Open Student Inbox"
                    >
                      <Bell className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                      <span>Inbox</span>
                      {unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-navy-400 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm"
                      title="Share Student Profile"
                    >
                      {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4 text-slate-500" />}
                      <span>{copiedShare ? 'Copied' : 'Share'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate?.('resume')}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-navy-400 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 shadow-sm"
                      title="Open Resume Builder"
                    >
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => switchTab('settings')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white transition-all flex items-center gap-2 shadow-sm shadow-indigo-500/20"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </>
                ) : (
                  <a
                    href={`mailto:${profile.personalEmail}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Contact Student</span>
                  </a>
                )}
              </div>
            </div>

            {/* Student Name, Academic Summary & Bio */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {profile.name}
                  </h1>
                  <span title="Verified College Student" className="text-indigo-600 dark:text-indigo-400">
                    <BadgeCheck className="w-5 h-5 fill-indigo-600 text-white dark:fill-indigo-500" />
                  </span>
                </div>
                <p className="text-sm sm:text-base font-medium text-navy-600 dark:text-indigo-400 mt-0.5">
                  {batchYearLabel ? `${degreeBranchLabel} • ${batchYearLabel}` : degreeBranchLabel}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {profile.headline}
                </p>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-sm max-w-3xl leading-relaxed">
                {profile.bio}
              </p>

              {/* Career Readiness & Quick Stats Row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => switchTab('projects')}
                  className="profile-stat-pill px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200/70 dark:border-slate-700"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-navy-600 dark:text-indigo-400" />
                  <strong>{projects.length}</strong>
                  <span className="text-slate-500 dark:text-slate-400">Projects</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('certificates')}
                  className="profile-stat-pill px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200/70 dark:border-slate-700"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <strong>{certificates.length}</strong>
                  <span className="text-slate-500 dark:text-slate-400">Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate?.('score')}
                  className="profile-stat-pill px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200/70 dark:border-slate-700"
                  title="View P-CARE Employability Score"
                >
                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                  <strong>{profile.score}/100</strong>
                  <span className="text-slate-500 dark:text-slate-400">P-CARE</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate?.('passport')}
                  className="profile-stat-pill px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200/70 dark:border-slate-700"
                  title="View Career Readiness Passport"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <strong>{profile.completion}%</strong>
                  <span className="text-slate-500 dark:text-slate-400">Readiness</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => switchTab('overview')}
              className={`tab-btn py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
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
              onClick={() => switchTab('projects')}
              className={`tab-btn py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
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
              onClick={() => switchTab('certificates')}
              className={`tab-btn py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                activeTab === 'certificates'
                  ? 'border-navy-600 text-navy-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificates</span>
              <span className="ml-0.5 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {certificates.length}
              </span>
            </button>

            {isOwnProfile && (
              <button
                type="button"
                onClick={() => switchTab('settings')}
                className={`tab-btn py-4 text-sm whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === 'settings'
                    ? 'border-navy-600 text-navy-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Profile Settings</span>
              </button>
            )}
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
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => switchTab('settings')}
                        className="text-xs font-medium text-navy-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Degree & Branch</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {[profile.degreeShort, profile.branch].filter(Boolean).join(' — ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Batch / Section</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {[profile.batch, profile.section].filter(Boolean).join(' • ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Current Semester</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.semester || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Date of Birth</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {profile.dob || 'Not specified'}
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
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => switchTab('settings')}
                        className="text-xs font-medium text-navy-600 dark:text-indigo-400 hover:underline"
                      >
                        Edit
                      </button>
                    )}
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
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
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

                {/* Web & Social Links Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 col-span-1 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                      <span>External Web & Social Profiles</span>
                    </h3>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => switchTab('settings')}
                        className="text-xs font-medium text-navy-600 dark:text-indigo-400 hover:underline"
                      >
                        Update Links
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {profile.portfolioUrl && (
                      <a
                        href={formatExternalUrl(profile.portfolioUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-navy-500 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Globe className="w-4 h-4 text-navy-600 dark:text-indigo-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Portfolio</p>
                            <p className="text-[11px] text-slate-400 truncate">{profile.portfolioUrl.replace(/^https?:\/\//, '')}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-600 transition-colors" />
                      </a>
                    )}

                    {profile.github && (
                      <a
                        href={formatExternalUrl(profile.github)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-navy-500 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Code2 className="w-4 h-4 text-navy-600 dark:text-indigo-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">GitHub</p>
                            <p className="text-[11px] text-slate-400 truncate">{profile.github.replace(/^https?:\/\//, '')}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-600 transition-colors" />
                      </a>
                    )}

                    {profile.linkedin && (
                      <a
                        href={formatExternalUrl(profile.linkedin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-navy-500 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Link className="w-4 h-4 text-navy-600 dark:text-indigo-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">LinkedIn</p>
                            <p className="text-[11px] text-slate-400 truncate">{profile.linkedin.replace(/^https?:\/\//, '')}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-navy-600 transition-colors" />
                      </a>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="tab-panel space-y-6">

              {/* Top Action Header, Search & Upload Button */}
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FolderGit2 className="w-5 h-5 text-navy-600 dark:text-indigo-400" />
                      <span>Uploaded Student Projects</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Showcase your academic builds, hackathon prototypes, and personal software projects.
                    </p>
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={handleOpenComposer}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-navy-600 hover:bg-navy-700 text-white shadow-sm shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Upload Project</span>
                    </button>
                  )}
                </div>

                {/* Search Filter Input */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="relative max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={projectSearchInput}
                      onChange={(e) => setProjectSearchInput(e.target.value)}
                      placeholder="Search uploaded projects by title or tech stack..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                    />
                  </div>
                </div>
              </div>

              {/* Projects Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No matching projects found
                    </p>
                    <p className="text-xs text-slate-400">
                      Try a different search keyword or upload a new project post.
                    </p>
                  </div>
                ) : (
                  filteredProjects.map(proj => {
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
                                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {t}
                                </span>
                              ))}
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setSelectedProject(proj)}
                              className="text-xs font-semibold text-navy-600 dark:text-indigo-400 hover:underline"
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

          {/* TAB 3: CERTIFICATES & CREDENTIALS */}
          {activeTab === 'certificates' && (
            <div className="tab-panel space-y-6">
              <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Verified Credentials & Certifications</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Institutional course accreditations, verified learning tracks, and industry certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {certificates.map(cert => (
                  <div
                    key={cert.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {cert.title || cert.programTitle}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {cert.issuer || cert.verifiedBy || 'Podar Pathways'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>Issued: {cert.date || 'Aug 2026'}</span>
                      <button
                        type="button"
                        onClick={() => showToast('Certificate verified by Podar College Authority.')}
                        className="text-navy-600 dark:text-indigo-400 font-semibold hover:underline"
                      >
                        Verification Proof
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'settings' && isOwnProfile && (
            <div className="tab-panel">
              <form onSubmit={handleSaveAllSettings} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left 2 Columns: Personal, Address, Academic, Social & Skills Cards */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Card A: Personal Information */}
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
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
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                            formErrors.name ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                          } text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        />
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
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Academic Bio
                      </label>
                      <textarea
                        rows={2}
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Career Objective
                      </label>
                      <textarea
                        rows={2}
                        value={profile.objective}
                        onChange={(e) => setProfile(prev => ({ ...prev, objective: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Date of Birth
                        </label>
                        <input
                          type="text"
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

                  {/* Card B: Web & Social Profiles */}
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Globe className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Web & Online Presence</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Link your online projects, code repositories, and professional network.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Portfolio Website
                        </label>
                        <input
                          type="text"
                          value={profile.portfolioUrl}
                          onChange={(e) => setProfile(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                          placeholder="e.g. aaravsharma.dev"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          GitHub Profile
                        </label>
                        <input
                          type="text"
                          value={profile.github}
                          onChange={(e) => setProfile(prev => ({ ...prev, github: e.target.value }))}
                          placeholder="e.g. github.com/username"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          LinkedIn Profile
                        </label>
                        <input
                          type="text"
                          value={profile.linkedin}
                          onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                          placeholder="e.g. linkedin.com/in/username"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card C: Address Details */}
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
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

                  {/* Card D: Academic & Enrollment Details */}
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-navy-600 dark:text-indigo-400" />
                        <span>Academic & Enrollment Details</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Program, branch, and semester details (<span className="text-rose-500 font-bold">*</span> required).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Degree <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <select
                          value={profile.degreeShort}
                          onChange={(e) => setProfile(prev => ({ ...prev, degreeShort: e.target.value }))}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                            formErrors.degreeShort ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                          } text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        >
                          <option value="">None</option>
                          <option value="B.Tech">B.Tech</option>
                          <option value="B.E.">B.E.</option>
                          <option value="B.Sc">B.Sc</option>
                          <option value="BCA">BCA</option>
                          <option value="M.Tech">M.Tech</option>
                          <option value="MCA">MCA</option>
                          <option value="Ph.D.">Ph.D.</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Branch / Department <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <select
                          value={profile.branch}
                          onChange={(e) => setProfile(prev => ({ ...prev, branch: e.target.value }))}
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border ${
                            formErrors.branch ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-slate-200 dark:border-slate-700'
                          } text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500`}
                        >
                          <option value="">None</option>
                          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Electrical Engineering">Electrical Engineering</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Civil Engineering">Civil Engineering</option>
                          <option value="Chemical Engineering">Chemical Engineering</option>
                          <option value="Biotechnology">Biotechnology</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                          Academic Batch
                        </label>
                        <input
                          type="text"
                          value={profile.batch}
                          onChange={(e) => setProfile(prev => ({ ...prev, batch: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                        />
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
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Section <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <select
                            value={profile.section}
                            onChange={(e) => setProfile(prev => ({ ...prev, section: e.target.value }))}
                            required
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card E: Technical Skills Manager */}
                  <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
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
                            className="hover:text-rose-500 transition-colors"
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
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                          isDarkMode ? 'bg-navy-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                            isDarkMode ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
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
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                          emailAlerts ? 'bg-navy-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                            emailAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Connected Pathways Hub Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Pathways Hub Shortcuts
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Directly navigate to your active modules and career tracks.
                    </p>
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate?.('courses')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <span>Explore Courses</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate?.('projects')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <span>Campus Projects Feed</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate?.('opportunities')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors"
                      >
                        <span>Placement Drives & Internships</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Save & Reset Actions Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-navy-600 hover:bg-navy-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save All Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Reset to Default
                    </button>
                  </div>

                </div>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* STUDENT INBOX & NOTIFICATIONS DRAWER MODAL */}
      {isInboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden modal-animate-enter flex flex-col max-h-[85vh]">
            
            {/* Inbox Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-navy-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Inbox</h3>
                  <p className="text-[11px] text-slate-400">
                    {unreadCount > 0 ? `${unreadCount} unread notices` : 'All caught up'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="p-1.5 text-xs text-navy-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsInboxOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInboxFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  inboxFilter === 'all'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setInboxFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  inboxFilter === 'unread'
                    ? 'bg-navy-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {/* Messages / Notifications List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {notifications
                .filter(n => (inboxFilter === 'unread' ? !n.read : true))
                .length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No notifications in this filter
                  </p>
                  <p className="text-xs text-slate-400">
                    You have no new notices or messages at the moment.
                  </p>
                </div>
              ) : (
                notifications
                  .filter(n => (inboxFilter === 'unread' ? !n.read : true))
                  .map(n => (
                    <div
                      key={n.id}
                      onClick={() => markSingleNotificationRead(n.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        !n.read
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              !n.read ? 'bg-navy-600 dark:bg-indigo-400' : 'bg-transparent'
                            }`}
                          />
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {n.title}
                          </h4>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{n.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 pl-4 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
              )}
            </div>

            {/* Inbox Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsInboxOpen(false);
                  navigate?.('notifications');
                }}
                className="text-xs font-semibold text-navy-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Full Notification Center</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsInboxOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SINGLE-VIEW INSTAGRAM-STYLE PROJECT POST COMPOSER MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
          <form
            onSubmit={handleShareProject}
            noValidate
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto modal-animate-enter"
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                New Project Post
              </h3>
              <button
                type="submit"
                className="text-xs sm:text-sm font-bold text-navy-600 dark:text-indigo-400 hover:text-navy-700 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg transition-colors"
              >
                Share
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12">

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
                    <img
                      src={profile.avatar || DEFAULT_STUDENT_PHOTO}
                      alt={profile.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
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
                        type="text"
                        value={composerState.demoUrl}
                        onChange={(e) => setComposerState(prev => ({ ...prev, demoUrl: e.target.value }))}
                        placeholder="https://my-project.vercel.app or github.com/..."
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden modal-animate-enter">
            <div className="h-48 w-full bg-gradient-to-r from-navy-700 to-indigo-600 relative overflow-hidden">
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
                className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-400">
                  Uploaded {selectedProject.date}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedProject.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                {selectedProject.demoUrl && (
                  <a
                    href={formatExternalUrl(selectedProject.demoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-navy-600 hover:bg-navy-700 text-white flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Project Link</span>
                  </a>
                )}
              </div>
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
          <div style={{ position: 'relative' }}>
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
