import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Mic,
  MicOff,
  Clock,
  History,
  TrendingUp,
  Trash2,
  ArrowLeft,
  CornerDownLeft,
  ArrowRight,
  ChevronRight,
  Sparkles,
  BookOpen,
  Briefcase,
  GraduationCap,
  Building2,
  Building,
  FileText,
  BarChart3,
  Trophy,
  ShieldCheck,
  MessageSquareText,
  LayoutDashboard,
  Users,
  UserRound,
  Code,
  Cpu,
  Globe,
  Award,
  Compass,
  Layers,
  Target
} from 'lucide-react';

const SEARCH_HISTORY_STORAGE_KEY = 'podar_youtube_search_history_v2';

const DEFAULT_RECENT_SEARCHES = [
  'Meta Front-End Developer Specialization',
  'AWS Certified Cloud Practitioner Track',
  'AI Career Coach',
  'P-CARE Employability Score Breakdown',
  'Resume ATS Optimizer'
];

const TRENDING_TOPICS = [
  { text: 'Meta Front-End Developer', tag: 'Course', page: 'courses' },
  { text: 'AWS Cloud Practitioner', tag: 'Certification', page: 'courses' },
  { text: 'AI Career Coach', tag: 'Tool', page: 'coach' },
  { text: 'TCS Campus Hiring 2026', tag: 'Placement', page: 'placements' },
  { text: 'Smart India Hackathon', tag: 'Hackathon', page: 'opportunities' },
  { text: 'Resume ATS Optimizer', tag: 'Tool', page: 'resume' }
];

// Helper to highlight matching keyword in search results
function HighlightMatch({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const cleanQ = query.trim();
  if (!cleanQ) return <>{text}</>;

  try {
    const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(regex);

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="yt-search-highlight">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

export function GlobalSearch({ session, state, navigate, notify }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const [liveProjects, setLiveProjects] = useState([]);
  const [liveCertificates, setLiveCertificates] = useState([]);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      setSpeechSupported(true);
      try {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            setQuery(transcript);
            setIsOpen(true);
            saveHistory(transcript);
            notify?.(`Voice recognized: "${transcript}"`);
          }
          setIsListening(false);
        };

        rec.onerror = (e) => {
          setIsListening(false);
          if (e.error === 'not-allowed') {
            notify?.('Microphone permission denied. Allow microphone access in your browser.');
          } else if (e.error !== 'no-speech') {
            notify?.('Voice could not be recognized. Please try again.');
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } catch (err) {
        console.warn('SpeechRecognition init error:', err);
      }
    }
  }, [notify]);

  // Fetch live projects from PHP API
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.posts && Array.isArray(data.posts)) {
          setLiveProjects(data.posts);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live certificates from PHP API
  useEffect(() => {
    fetch('/api/certificates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveCertificates(data);
        }
      })
      .catch(() => {});
  }, []);

  // Save history helper
  const saveHistory = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeHistoryItem = (term, e) => {
    e?.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllHistory = (e) => {
    e?.stopPropagation();
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
    } catch {}
    notify?.('Search history cleared.');
  };

  const toggleVoiceSearch = () => {
    if (!speechSupported) {
      notify?.('Voice search requires Google Chrome, Edge or Safari with speech permission enabled.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        notify?.('Listening... Speak your search query.');
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchActive(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();

  // 1. Pages & Workspaces
  const allPages = [
    { id: 'dashboard', title: 'Dashboard', desc: 'Overview, stats and readiness score', category: 'Overview', icon: LayoutDashboard },
    { id: 'coach', title: 'AI Career Coach', desc: 'Ask career questions, interview & resume prep', category: 'AI Tools', icon: Sparkles },
    { id: 'roadmap', title: 'Learning Roadmap', desc: 'Step-by-step career pathway and milestones', category: 'Roadmap', icon: Compass },
    { id: 'score', title: 'P-CARE Employability Score', desc: 'Academic & career readiness breakdown (82%)', category: 'Assessments', icon: BarChart3 },
    { id: 'resume', title: 'Resume Builder', desc: 'Create and AI-optimize your ATS resume', category: 'Career Assets', icon: FileText },
    { id: 'projects', title: 'Student Projects Platform', desc: 'Instagram-style showcase of peer academic and live projects', category: 'Portfolio', icon: Target },
    { id: 'courses', title: 'Course Catalog', desc: 'Browse and elect certified partner courses', category: 'Academics', icon: BookOpen },
    { id: 'certificates', title: 'Certificates & Credentials', desc: 'Verified certifications, courses and badges', category: 'Portfolio', icon: Trophy },
    { id: 'opportunities', title: 'Opportunities Marketplace', desc: 'Jobs, internships, hackathons and challenges', category: 'Opportunities', icon: Briefcase },
    { id: 'internships', title: 'Internship Tracker', desc: 'Track ongoing applications & interview rounds', category: 'Opportunities', icon: GraduationCap },
    { id: 'placements', title: 'Placement Centre', desc: 'Campus placements and company offers', category: 'Opportunities', icon: Building2 },
    { id: 'passport', title: 'Digital Career Passport', desc: 'Verified digital QR career identity', category: 'Portfolio', icon: Award },
    { id: 'profile', title: 'Profile & Settings', desc: 'Personal details, career goals and contacts', category: 'Account', icon: UserRound },
  ];

  if (session?.role === 'admin') {
    allPages.unshift(
      { id: 'students', title: 'Student Directory', desc: 'Manage enrolled student accounts & college roster', category: 'Admin Tools', icon: Users },
      { id: 'courses', title: 'Manage Courses', desc: 'Publish and manage college courses', category: 'Admin Tools', icon: BookOpen },
      { id: 'certificates', title: 'Certificates Desk', desc: 'Verify and approve student certificates', category: 'Admin Tools', icon: Trophy },
      { id: 'projects', title: 'Moderate Projects', desc: 'Review, pin and govern student project submissions', category: 'Admin Tools', icon: Target },
      { id: 'admins', title: 'Admin Governance', desc: 'User permissions and team administrator roles', category: 'Admin Tools', icon: ShieldCheck },
      { id: 'admin-profile', title: 'Admin Profile', desc: 'Administrator workspace settings', category: 'Admin Tools', icon: ShieldCheck }
    );
  }

  // 2. Opportunities, Internships & Contests
  const allOpportunities = [
    { title: 'Frontend React Developer Internship', company: 'Tech Innovation Labs', tags: 'React • TypeScript • Remote • ₹25k/mo', type: 'Internship', page: 'opportunities', icon: Code },
    { title: 'Software development internship', company: 'Tech Innovation Labs', tags: 'Java • React • Remote • 3 months', type: 'Internship', page: 'opportunities', icon: Briefcase },
    { title: 'Data Science & Analytics Internship', company: 'DataWave Insights', tags: 'Python • SQL • Tableau • Hybrid Mumbai', type: 'Internship', page: 'opportunities', icon: BarChart3 },
    { title: 'AI Innovation Challenge 2026', company: 'Open Innovation Challenge', tags: 'AI • Machine Learning • Hackathon', type: 'Hackathon', page: 'opportunities', icon: Sparkles },
    { title: 'Podar Startupthon 2026', company: 'Podar Education Network', tags: 'Think • Innovate • Impact • Grants', type: 'Startupthon', page: 'opportunities', icon: Target },
    { title: 'Cloud & DevOps Engineering Associate', company: 'CloudScale Technologies', tags: 'AWS • Docker • Kubernetes • 6 months', type: 'Internship', page: 'opportunities', icon: Cpu },
    { title: 'Cybersecurity & Ethical Hacking Fellowship', company: 'CyberDefend Security', tags: 'VAPT • Network Security • Cert Provided', type: 'Fellowship', page: 'opportunities', icon: ShieldCheck },
    { title: 'Mobile App Developer (Flutter & React Native)', company: 'AppStudio Solutions', tags: 'iOS • Android • Cross-Platform', type: 'Internship', page: 'opportunities', icon: Globe },
    { title: 'UI/UX Product Design Challenge', company: 'CreativePulse Studio', tags: 'Figma • Design Systems • Wireframing', type: 'Design Challenge', page: 'opportunities', icon: Layers },
    { title: 'Smart India Hackathon (SIH 2026)', company: 'Ministry of Education & AICTE', tags: 'National Contest • Innovation • Cash Prizes', type: 'Hackathon', page: 'opportunities', icon: Trophy },
    { title: 'Podar Campus Placement Drive 2026', company: 'Podar Placement Cell', tags: 'BCA / BSc / BBA Final Year • On-Campus', type: 'Placements', page: 'placements', icon: Building2 },
    { title: 'Tata Consultancy Services (TCS)', company: 'TCS Digital & Ninja', tags: 'Campus Recruitment • ₹7.5 LPA • Mumbai / Pune', type: 'Placements', page: 'placements', icon: Building2 },
    { title: 'Infosys Springboard', company: 'Infosys Technologies', tags: 'Systems Engineer & Specialist Programmer', type: 'Placements', page: 'placements', icon: Building2 },
  ];

  // 3. Courses (State + Defaults)
  const defaultCourses = [
    { id: 'c1', title: 'Career Readiness Foundations', desc: 'Core career curriculum, goal setting & professional ethics', page: 'courses', category: 'Foundation', icon: BookOpen },
    { id: 'c2', title: 'Google IT Automation with Python', desc: 'Professional Certificate: Automating real-world tasks with Python', page: 'courses', category: 'Professional Cert', icon: BookOpen },
    { id: 'c3', title: 'Meta Frontend Developer Specialization', desc: 'HTML, CSS, JavaScript, React, UI design & version control', page: 'courses', category: 'Specialization', icon: BookOpen },
    { id: 'c4', title: 'AWS Certified Cloud Practitioner Track', desc: 'Comprehensive guide to AWS cloud architecture and certifications', page: 'courses', category: 'Cloud Track', icon: BookOpen },
    { id: 'c5', title: 'Data Structures Masterclass in Java', desc: 'Master coding patterns for top tech interviews', page: 'courses', category: 'Coding Track', icon: BookOpen },
  ];

  const dynamicCourses = (state?.courses || []).map((c) => ({
    id: c.id,
    title: c.title,
    desc: c.description || c.issuer || 'Course shared by your college.',
    page: 'courses',
    category: c.issuer || 'College Course',
    icon: BookOpen
  }));

  const allCourses = [...defaultCourses, ...dynamicCourses.filter((dc) => !defaultCourses.some((df) => df.title.toLowerCase() === dc.title.toLowerCase()))];

  // 4. Student Projects (Live from PHP API + Fallbacks)
  const formattedProjects = liveProjects.map((p) => ({
    id: p.id,
    title: p.title,
    desc: `By ${p.studentName} (${p.studentCourse || 'Student'}) • ${p.category || 'Project'} • ${(p.tags || []).join(', ')}`,
    page: 'projects',
    category: p.category || 'Student Project',
    icon: Target,
    badge: p.category || 'Live Project'
  }));

  // 5. Certificates (Live from PHP API)
  const formattedCertificates = liveCertificates.map((c) => ({
    id: c.id,
    title: c.programTitle || 'Course Certificate',
    desc: `Awarded to ${c.studentName} • Status: ${c.status || 'Verified'} • Code: ${c.verificationCode || c.credentialId || 'N/A'}`,
    page: 'certificates',
    category: 'Verified Credential',
    icon: Trophy,
    badge: c.status === 'verified' ? 'Verified' : 'Under Review'
  }));

  // 6. Dynamic Students (for admin)
  const students = session?.role === 'admin'
    ? (state?.students || []).map((s) => ({
        id: s.id,
        title: s.name,
        desc: `${s.course} • Sem ${s.semester} • ${s.phone} • Score: ${s.score}/100`,
        page: `admin-student:${s.id}`,
        category: 'Student Account',
        icon: UserRound
      }))
    : [];

  // 7. Filter items when query is present
  const matchedPages = q && (activeTab === 'all' || activeTab === 'tools')
    ? allPages.filter((p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    : [];

  const matchedCourses = q && (activeTab === 'all' || activeTab === 'courses')
    ? allCourses.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
    : [];

  const matchedProjects = q && (activeTab === 'all' || activeTab === 'projects')
    ? formattedProjects.filter((p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
    : [];

  const matchedOpps = q && (activeTab === 'all' || activeTab === 'opportunities')
    ? allOpportunities.filter((o) => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.tags.toLowerCase().includes(q) || o.type.toLowerCase().includes(q))
    : [];

  const matchedCerts = q && (activeTab === 'all' || activeTab === 'certificates')
    ? formattedCertificates.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
    : [];

  const matchedStudents = q && (activeTab === 'all' || activeTab === 'students')
    ? students.filter((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
    : [];

  // Organized categorized groups
  const groups = [
    { id: 'courses', title: 'Courses & Certifications', items: matchedCourses, type: 'course' },
    { id: 'projects', title: 'Student Projects', items: matchedProjects, type: 'project' },
    { id: 'opps', title: 'Opportunities & Drives', items: matchedOpps, type: 'opp' },
    { id: 'certificates', title: 'Certificates & Credentials', items: matchedCerts, type: 'cert' },
    { id: 'pages', title: 'Platform Pages & Tools', items: matchedPages, type: 'page' },
    { id: 'students', title: 'Student Accounts', items: matchedStudents, type: 'student' }
  ].filter((g) => g.items.length > 0);

  const flatResults = groups.flatMap((g) => g.items.map((item) => ({ ...item, groupType: g.type })));
  const totalCount = flatResults.length;

  const handleSelect = (page, itemTitle) => {
    if (itemTitle) {
      saveHistory(itemTitle);
    } else if (query.trim()) {
      saveHistory(query.trim());
    }

    if (page && navigate) {
      navigate(page);
    }
    setIsOpen(false);
    setIsMobileSearchActive(false);
    setQuery('');
    if (notify && itemTitle) {
      notify(`Navigating to ${itemTitle}`);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      setIsOpen(true);
      return;
    }

    saveHistory(trimmed);

    // If a suggestion is highlighted via arrow keys
    if (flatResults.length > 0 && selectedIndex >= 0 && selectedIndex < flatResults.length) {
      const selected = flatResults[selectedIndex];
      handleSelect(selected.page || selected.id, selected.title || selected.name);
      return;
    }

    // If there are search matches, pick the top result
    if (flatResults.length > 0) {
      const top = flatResults[0];
      handleSelect(top.page || top.id, top.title || top.name);
      return;
    }

    // Smart semantic navigation fallback
    const lower = trimmed.toLowerCase();
    if (lower.includes('project')) {
      navigate('projects');
    } else if (lower.includes('course') || lower.includes('meta') || lower.includes('aws') || lower.includes('python') || lower.includes('google')) {
      navigate('courses');
    } else if (lower.includes('cert') || lower.includes('badge')) {
      navigate('certificates');
    } else if (lower.includes('resume') || lower.includes('cv')) {
      navigate('resume');
    } else if (lower.includes('coach') || lower.includes('ai') || lower.includes('chat')) {
      navigate('coach');
    } else if (lower.includes('roadmap') || lower.includes('dsa')) {
      navigate('roadmap');
    } else if (lower.includes('score') || lower.includes('p-care')) {
      navigate('score');
    } else if (lower.includes('intern') || lower.includes('job') || lower.includes('placement')) {
      navigate('opportunities');
    } else if (session?.role === 'admin' && (lower.includes('student') || lower.includes('roster'))) {
      navigate('students');
    } else {
      navigate('dashboard');
    }

    setIsOpen(false);
    setIsMobileSearchActive(false);
    notify?.(`Searching for "${trimmed}"`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatResults.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatResults.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatResults.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsMobileSearchActive(false);
      inputRef.current?.blur();
    }
  };

  // Filter Tabs
  const tabs = [
    { id: 'all', label: 'All', count: totalCount },
    { id: 'courses', label: 'Courses', count: allCourses.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)).length },
    { id: 'projects', label: 'Projects', count: formattedProjects.filter((p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).length },
    { id: 'opportunities', label: 'Opportunities', count: allOpportunities.filter((o) => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q)).length },
    { id: 'certificates', label: 'Certificates', count: formattedCertificates.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)).length },
    { id: 'tools', label: 'Tools', count: allPages.filter((p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).length }
  ];

  if (session?.role === 'admin') {
    tabs.push({
      id: 'students',
      label: 'Students',
      count: students.filter((s) => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)).length
    });
  }

  let runningIndex = 0;

  return (
    <>
      {/* 1. Mobile Search Trigger Button (Visible only on small screens) */}
      <button
        type="button"
        className="yt-mobile-search-trigger"
        onClick={() => {
          setIsMobileSearchActive(true);
          setIsOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 80);
        }}
        aria-label="Open search"
        title="Search"
      >
        <Search size={20} />
      </button>

      {/* 2. Main YouTube Navbar Search Bar Container */}
      <div
        className={`yt-search-container ${isMobileSearchActive ? 'mobile-active' : ''}`}
        ref={containerRef}
      >
        {/* Mobile Back Button (when mobile search is open) */}
        {isMobileSearchActive && (
          <button
            type="button"
            className="yt-mobile-back-btn"
            onClick={() => {
              setIsMobileSearchActive(false);
              setIsOpen(false);
            }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* The YouTube Pill Search Form */}
        <form
          className={`yt-search-box ${isFocused || isOpen ? 'is-focused' : ''}`}
          onSubmit={handleSearchSubmit}
          role="search"
        >
          {/* Left Pill: Input Wrap */}
          <div className="yt-search-input-wrap">
            {/* Active search icon inside input on focus (YouTube style) */}
            <div className={`yt-search-input-icon ${isFocused ? 'active' : ''}`}>
              <Search size={16} />
            </div>

            <input
              ref={isMobileSearchActive ? mobileInputRef : inputRef}
              type="text"
              className="yt-search-input"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                setIsOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => {
                setIsFocused(true);
                setIsOpen(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search courses, projects, certificates..."
              aria-label="Search"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear Button (X) */}
            {query && (
              <button
                type="button"
                className="yt-search-clear-btn"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                  mobileInputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

            {/* Ctrl+K shortcut badge (Desktop) */}
            {!query && !isFocused && (
              <div className="yt-search-shortcut-badge" title="Press Ctrl+K to search">
                <span className="yt-kbd">Ctrl</span>
                <span className="yt-kbd">K</span>
              </div>
            )}
          </div>

          {/* Right Pill: Attached Search Submit Button */}
          <button
            type="submit"
            className="yt-search-btn"
            title="Search"
            aria-label="Search"
          >
            <Search size={19} />
          </button>
        </form>

        {/* Circular Voice Search Button (YouTube Mic) */}
        <button
          type="button"
          className={`yt-voice-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleVoiceSearch}
          title={isListening ? 'Listening... click to stop' : 'Search with your voice'}
          aria-label="Voice search"
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          {isListening && <span className="yt-voice-ripple" />}
        </button>

        {/* YouTube Autocomplete Dropdown Popup */}
        {isOpen && (
          <div className="yt-search-dropdown" role="listbox">
            {/* Category Filter Pills (when query typed) */}
            {Boolean(q) && (
              <div className="yt-search-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yt-search-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(tab.id);
                      setSelectedIndex(0);
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && <span className="yt-tab-count">{tab.count}</span>}
                  </button>
                ))}
              </div>
            )}

            <div className="yt-search-scroll-area">
              {/* STATE A: EMPTY QUERY -> SHOW RECENT SEARCHES & TRENDING */}
              {!q && (
                <div className="yt-empty-query-menu">
                  {/* Recent Searches Section */}
                  {history.length > 0 && (
                    <div className="yt-history-section">
                      <div className="yt-section-header">
                        <span className="yt-section-title">
                          <History size={13} style={{ display: 'inline', marginRight: 6 }} />
                          Recent searches
                        </span>
                        <button
                          type="button"
                          className="yt-clear-history-btn"
                          onClick={clearAllHistory}
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="yt-history-list">
                        {history.map((term, idx) => (
                          <div
                            key={`hist-${idx}`}
                            className="yt-history-row"
                            onClick={() => {
                              setQuery(term);
                              inputRef.current?.focus();
                              handleSelect(null, term);
                            }}
                          >
                            <div className="yt-history-left">
                              <Clock size={16} className="yt-history-icon" />
                              <strong className="yt-history-text">{term}</strong>
                            </div>
                            <button
                              type="button"
                              className="yt-remove-history-btn"
                              onClick={(e) => removeHistoryItem(term, e)}
                              title="Delete from history"
                              aria-label={`Remove ${term}`}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending / Recommended Topics */}
                  <div className="yt-trending-section">
                    <div className="yt-section-header">
                      <span className="yt-section-title">
                        <TrendingUp size={13} style={{ display: 'inline', marginRight: 6, color: '#0d9488' }} />
                        Trending across Podar Pathways
                      </span>
                    </div>

                    <div className="yt-trending-chips">
                      {TRENDING_TOPICS.map((topic, i) => (
                        <button
                          key={`trend-${i}`}
                          type="button"
                          className="yt-trending-chip"
                          onClick={() => {
                            setQuery(topic.text);
                            handleSelect(topic.page, topic.text);
                          }}
                        >
                          <TrendingUp size={13} className="yt-trend-icon" />
                          <span className="yt-trend-text">{topic.text}</span>
                          <span className="yt-trend-badge">{topic.tag}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STATE B: QUERY ACTIVE WITH 0 MATCHES */}
              {Boolean(q) && totalCount === 0 && (
                <div className="yt-search-no-results">
                  <div className="yt-no-results-icon">
                    <Search size={24} />
                  </div>
                  <strong>No exact matches for "{query}"</strong>
                  <p>Try searching for a course, project name, or career skill.</p>
                  <div className="yt-suggested-queries">
                    {['React', 'AWS', 'Python', 'Certificates', 'Resume', 'Interview'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="yt-suggestion-chip"
                        onClick={() => {
                          setQuery(chip);
                          setSelectedIndex(0);
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STATE C: QUERY ACTIVE WITH MATCHES */}
              {Boolean(q) && totalCount > 0 && (
                <div className="yt-search-results-list">
                  {groups.map((group) => (
                    <div key={group.id} className="yt-result-group">
                      <div className="yt-result-group-header">
                        <span className="yt-group-title">{group.title}</span>
                        <span className="yt-group-count">{group.items.length}</span>
                      </div>

                      {group.items.map((item, idx) => {
                        const currentFlatIdx = runningIndex++;
                        const isSelected = currentFlatIdx === selectedIndex;
                        const IconComponent = item.icon || Search;
                        const itemTitle = item.title || item.name;
                        const itemPage = item.page || item.id;
                        const itemDesc = item.desc || item.tags || '';
                        const badgeText = item.badge || item.category;

                        return (
                          <div
                            key={`${group.id}-${idx}`}
                            className={`yt-result-row ${isSelected ? 'is-selected' : ''}`}
                            onMouseEnter={() => setSelectedIndex(currentFlatIdx)}
                            onClick={() => handleSelect(itemPage, itemTitle)}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {/* Icon / Avatar */}
                            <div className={`yt-row-icon yt-icon-${group.type}`}>
                              <IconComponent size={16} />
                            </div>

                            {/* Content */}
                            <div className="yt-row-content">
                              <div className="yt-row-title-line">
                                <span className="yt-row-title">
                                  <HighlightMatch text={itemTitle} query={q} />
                                </span>
                                {badgeText && (
                                  <span className={`yt-row-badge yt-badge-${group.type}`}>
                                    {badgeText}
                                  </span>
                                )}
                              </div>
                              {itemDesc && (
                                <span className="yt-row-desc">
                                  <HighlightMatch text={itemDesc} query={q} />
                                </span>
                              )}
                            </div>

                            {/* Action indicator */}
                            <div className="yt-row-action">
                              {isSelected ? (
                                <div className="yt-enter-pill">
                                  <span>Open</span>
                                  <CornerDownLeft size={11} />
                                </div>
                              ) : (
                                <ChevronRight size={14} className="yt-row-arrow" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with YouTube / Keyboard Shortcuts */}
            <div className="yt-search-footer">
              <div className="yt-footer-shortcuts">
                <span className="yt-shortcut-item">
                  <kbd className="yt-mini-kbd">↑</kbd>
                  <kbd className="yt-mini-kbd">↓</kbd>
                  <span className="yt-shortcut-lbl">Navigate</span>
                </span>
                <span className="yt-shortcut-item">
                  <kbd className="yt-mini-kbd">↵</kbd>
                  <span className="yt-shortcut-lbl">Select</span>
                </span>
                <span className="yt-shortcut-item">
                  <kbd className="yt-mini-kbd">esc</kbd>
                  <span className="yt-shortcut-lbl">Close</span>
                </span>
              </div>
              <div className="yt-footer-count">
                <span>{Boolean(q) ? `${totalCount} results` : 'Search Podar Pathways'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Full-screen Voice Listening Modal Backdrop */}
        {isListening && (
          <div className="yt-voice-modal-backdrop" onClick={toggleVoiceSearch}>
            <div className="yt-voice-modal-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="yt-voice-modal-close"
                onClick={toggleVoiceSearch}
                aria-label="Close voice search"
              >
                <X size={20} />
              </button>
              <div className="yt-voice-pulsing-ring">
                <Mic size={38} className="yt-voice-modal-mic" />
              </div>
              <h3 className="yt-voice-modal-title">Listening...</h3>
              <p className="yt-voice-modal-prompt">
                Say something like <em>"Meta Front-End"</em>, <em>"AWS Cloud"</em>, or <em>"AI Career Coach"</em>
              </p>
              <button
                type="button"
                className="yt-voice-cancel-btn"
                onClick={toggleVoiceSearch}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
