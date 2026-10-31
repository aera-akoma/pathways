import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProjectShareUrl, pushRoute, parseCurrentLocation } from './router.js';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ExternalLink,
  Plus,
  Search,
  Filter,
  X,
  Send,
  MoreVertical,
  Flag,
  Trash2,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Folder,
  Compass,
  Code,
  Globe,
  Smartphone,
  Cpu,
  Brain,
  Terminal,
  Coffee,
  Shield,
  Database as DbIcon,
  Palette,
  Briefcase,
  Rocket,
  Calendar,
  Clock,
  User,
  Users,
  Eye,
  AlertCircle,
  Bell,
  CheckCircle2,
  Image as ImageIcon,
  Copy,
  Layers,
  ArrowUpRight,
  BadgeCheck,
  Sparkles,
  Flame
} from 'lucide-react';
import { DEFAULT_STUDENT_AVATAR } from './defaultAvatar.js';

// SVG Icons for GitHub and YouTube
export function GithubIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function YoutubeIcon({ size = 15, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" />
    </svg>
  );
}

// Category icon mapper
export function getCategoryIcon(name, size = 15) {
  const map = {
    'Web Development': Globe,
    'Android Development': Smartphone,
    'Artificial Intelligence': Cpu,
    'Machine Learning': Brain,
    'Python': Terminal,
    'Java': Coffee,
    'C and C++': Code,
    'Cybersecurity': Shield,
    'Database Management': DbIcon,
    'Graphic Design': Palette,
    'Business Projects': Briefcase,
    'Marketing': TrendingUp,
    'Entrepreneurship': Rocket,
    'Other': Folder
  };
  const IconComponent = map[name] || Code;
  return <IconComponent size={size} />;
}

// Relative time formatter (e.g. "2h ago", "Yesterday")
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) {
      const days = Math.floor(diffSec / 86400);
      return days === 1 ? 'Yesterday' : `${days}d ago`;
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch (e) {
    return dateString;
  }
}

// Client-side image compression for fast photo uploads
function compressProjectImage(file) {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =========================================================================
// MAIN COMPONENT: STUDENT PROJECTS PLATFORM
// =========================================================================
export function ProjectsPlatform({ session, student, state, setState, notify, navigate }) {
  const currentStudentId = student?.id || session?.id || 'student-demo';
  const currentStudentName = student?.name || session?.name || 'Student Demo';
  const currentStudentAvatar = student?.avatar || session?.avatar || '';
  const currentStudentCourse = student?.course || 'BCA';
  const currentStudentSem = student?.semester || 'Semester V';
  const isAdmin = session?.role === 'admin';

  // Navigation tab: 'feed' | 'search' | 'saved' | 'students'
  const initLoc = parseCurrentLocation(isAdmin ? 'admin' : 'student');
  const [activeTab, setActiveTab] = useState(() => {
    if (initLoc.params?.tab && ['feed', 'search', 'trending', 'my', 'saved', 'students'].includes(initLoc.params.tab)) {
      return initLoc.params.tab === 'my' ? 'students' : initLoc.params.tab;
    }
    return 'feed';
  });
  const [selectedCategory, setSelectedCategory] = useState(initLoc.params?.category || 'All');
  const [searchQuery, setSearchQuery] = useState(initLoc.params?.search || '');
  const [selectedTag, setSelectedTag] = useState(initLoc.params?.tag || '');
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'trending' | 'most_liked'

  // Data states
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Modals & Panels
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDetails, setReportDetails] = useState('');

  // Notifications
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Copied link toast state
  const [copiedId, setCopiedId] = useState(null);

  // Mobile finger gestures: horizontal swipe to switch tabs (Feed <-> Search)
  const tabTouchStartX = useRef(0);
  const tabTouchStartY = useRef(0);
  const handleTabTouchStart = (e) => {
    tabTouchStartX.current = e.touches[0].clientX;
    tabTouchStartY.current = e.touches[0].clientY;
  };
  const handleTabTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - tabTouchStartX.current;
    const deltaY = e.changedTouches[0].clientY - tabTouchStartY.current;
    if (Math.abs(deltaX) > 75 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
      if (deltaX < 0 && activeTab === 'feed') {
        // Swiped Left on Feed -> switch to Search
        setActiveTab('search');
        pushRoute('projects', isAdmin ? 'admin' : 'student', { params: { tab: 'search' }, replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (deltaX > 0 && activeTab === 'search') {
        // Swiped Right on Search -> switch to Feed
        setActiveTab('feed');
        pushRoute('projects', isAdmin ? 'admin' : 'student', { replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Fetch Categories
  useEffect(() => {
    fetch('/api/projects/categories')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.categories) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  // Fetch Notifications
  const fetchNotifications = () => {
    if (!currentStudentId) return;
    fetch(`/api/projects/notifications?studentId=${encodeURIComponent(currentStudentId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.notifications) {
          setNotifications(data.notifications);
          setUnreadNotifCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [currentStudentId]);

  // Student Exploration states & data
  const [directoryStudents, setDirectoryStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('All');

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.ok ? res.json() : null)
      .then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setDirectoryStudents(list);
        }
      })
      .catch(() => {});
  }, []);

  const allStudents = useMemo(() => {
    const map = new Map();
    (state?.students || []).forEach(s => map.set(s.id, s));
    directoryStudents.forEach(s => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    if (student && !map.has(student.id)) map.set(student.id, student);
    return Array.from(map.values());
  }, [state?.students, directoryStudents, student]);

  const studentProjectCounts = useMemo(() => {
    const counts = {};
    posts.forEach(p => {
      if (p.studentId) {
        counts[p.studentId] = (counts[p.studentId] || 0) + 1;
      }
    });
    return counts;
  }, [posts]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      const q = studentSearch.trim().toLowerCase();
      const matchSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.goal && s.goal.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );

      let matchCourse = true;
      if (studentCourseFilter === 'Creators') {
        matchCourse = (studentProjectCounts[s.id] || 0) > 0;
      } else if (studentCourseFilter !== 'All') {
        matchCourse = s.course === studentCourseFilter;
      }

      return matchSearch && matchCourse;
    });
  }, [allStudents, studentSearch, studentCourseFilter, studentProjectCounts]);

  // Load feed based on active filters
  const loadFeed = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        currentStudentId,
        sort: activeTab === 'trending' ? 'trending' : sortOrder
      });

      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (selectedTag) {
        params.append('tag', selectedTag);
      }
      if (activeTab === 'my') {
        params.append('studentId', currentStudentId);
      }
      if (activeTab === 'saved') {
        params.append('bookmarkedBy', currentStudentId);
      }

      let localSaved = [];
      try {
        localSaved = JSON.parse(localStorage.getItem('podar_local_projects') || '[]');
      } catch (e) {}

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let incoming = data.posts || [];
        if (pageNum === 1 && localSaved.length > 0) {
          const apiIds = new Set(incoming.map(p => p.id));
          const uniqueLocal = localSaved.filter(p => !apiIds.has(p.id));
          incoming = [...uniqueLocal, ...incoming];
        }
        setPosts(prev => append ? [...prev, ...incoming] : incoming);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalPosts(data.total || incoming.length);
      } else if (localSaved.length > 0) {
        setPosts(localSaved);
        setTotalPosts(localSaved.length);
      }
    } catch (e) {
      try {
        const localSaved = JSON.parse(localStorage.getItem('podar_local_projects') || '[]');
        if (localSaved.length > 0) {
          setPosts(localSaved);
          setTotalPosts(localSaved.length);
        }
      } catch (err) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadFeed(1, false);
  }, [activeTab, selectedCategory, selectedTag, sortOrder, searchQuery]);

  // Handle URL deep-link to project: ?project=id or /projects/:id
  useEffect(() => {
    const loc = parseCurrentLocation(isAdmin ? 'admin' : 'student');
    const projId = loc.params?.project;
    if (projId) {
      fetch(`/api/projects/${projId}?currentStudentId=${encodeURIComponent(currentStudentId)}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.post) {
            setPosts(prev => prev.some(p => p.id === data.post.id) ? prev : [data.post, ...prev]);
            notify?.(`Viewing shared project: "${data.post.title}"`);
            setTimeout(() => {
              const el = document.getElementById(`post-${data.post.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('soc-card-highlighted');
                setTimeout(() => el.classList.remove('soc-card-highlighted'), 3500);
              }
            }, 300);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Optimistic Like Handler
  const handleToggleLike = async (post) => {
    const postId = post.id;
    const previousIsLiked = post.isLiked;
    const previousLikesCount = post.likesCount;

    // Optimistic UI
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !previousIsLiked;
        const likesCount = isLiked ? previousLikesCount + 1 : Math.max(0, previousLikesCount - 1);
        return { ...p, isLiked, likesCount };
      }
      return p;
    }));

    try {
      const res = await fetch(`/api/projects/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          studentName: currentStudentName,
          studentAvatar: currentStudentAvatar
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount } : p));
    } catch (e) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: previousIsLiked, likesCount: previousLikesCount } : p));
      notify?.('Unable to record like. Please try again.');
    }
  };

  // Optimistic Bookmark Handler
  const handleToggleBookmark = async (post) => {
    const postId = post.id;
    const previousBm = post.isBookmarked;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: !previousBm } : p));

    try {
      const res = await fetch(`/api/projects/${postId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentStudentId })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      notify?.(data.isBookmarked ? 'Saved to Bookmarks!' : 'Removed from Bookmarks.');
    } catch (e) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: previousBm } : p));
    }
  };

  // Native Share / Copy Link
  const handleShare = async (post) => {
    const shareUrl = getProjectShareUrl(post.id);
    try {
      pushRoute('projects', isAdmin ? 'admin' : 'student', { params: { project: post.id }, replace: true });
    } catch (e) {}

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out "${post.title}" on Podar Pathways Student Projects!`,
          url: shareUrl
        });
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(post.id);
      notify?.('Project link copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      notify?.('Share link: ' + shareUrl);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this project post?')) return;
    try {
      const res = await fetch(`/api/projects/${postId}?studentId=${encodeURIComponent(currentStudentId)}&isAdmin=${isAdmin ? '1' : '0'}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        notify?.('Project post deleted.');
      }
    } catch (e) {
      notify?.('Could not delete project.');
    }
  };

  // Submit Report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingPost) return;
    try {
      await fetch(`/api/projects/${reportingPost.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentStudentId,
          reporterName: currentStudentName,
          reason: reportReason,
          details: reportDetails
        })
      });
      notify?.('Report submitted. Administrators will review this post.');
      setReportingPost(null);
      setReportDetails('');
    } catch (e) {
      notify?.('Could not submit report.');
    }
  };

  // Mark all notifications read
  const handleMarkNotifsRead = async () => {
    try {
      await fetch('/api/projects/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentStudentId })
      });
      setUnreadNotifCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
    } catch (e) {}
  };

  // Top Creators & Trending Tags (Extracted from posts)
  const trendingTags = useMemo(() => {
    const counts = {};
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        const cleaned = t.replace(/^#/, '');
        counts[cleaned] = (counts[cleaned] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [posts]);

  const topCreators = useMemo(() => {
    const creatorMap = {};
    posts.forEach(p => {
      if (!creatorMap[p.studentId]) {
        creatorMap[p.studentId] = {
          id: p.studentId,
          name: p.studentName,
          avatar: p.studentAvatar,
          course: p.studentCourse,
          sem: p.studentSemester,
          projectCount: 0,
          likesCount: 0
        };
      }
      creatorMap[p.studentId].projectCount += 1;
      creatorMap[p.studentId].likesCount += (p.likesCount || 0);
    });
    return Object.values(creatorMap).sort((a, b) => b.likesCount - a.likesCount).slice(0, 5);
  }, [posts]);

  return (
    <div className="soc-projects-root">
      {/* 1. TOP HEADER (Minimal & Clean, zero options) */}
      <header className="soc-header-bar">
        <h1 className="soc-page-title">{activeTab === 'students' ? 'Explore Students' : 'Projects'}</h1>
        <p className="soc-page-subtitle">
          {activeTab === 'students'
            ? 'Discover student portfolios, view fellow creators, and connect across campus.'
            : 'Student builds, technical portfolios and showcased work.'}
        </p>
      </header>

      {/* Active Filter Indicator */}
      {activeTab !== 'students' && (selectedTag || searchQuery || selectedCategory !== 'All') && (
        <div className="soc-filter-active-pills">
          <span className="soc-filter-lead">Active filters:</span>
          {selectedCategory !== 'All' && (
            <span className="soc-active-pill">
              Category: {selectedCategory}
              <button onClick={() => setSelectedCategory('All')}><X size={12} /></button>
            </span>
          )}
          {selectedTag && (
            <span className="soc-active-pill">
              #{selectedTag}
              <button onClick={() => setSelectedTag('')}><X size={12} /></button>
            </span>
          )}
          {searchQuery && (
            <span className="soc-active-pill">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')}><X size={12} /></button>
            </span>
          )}
          <button
            className="soc-reset-all-btn"
            onClick={() => { setSelectedCategory('All'); setSelectedTag(''); setSearchQuery(''); }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT AREA (Supports mobile swipe gestures between tabs) */}
      <main
        className="soc-feed-container"
        onTouchStart={handleTabTouchStart}
        onTouchEnd={handleTabTouchEnd}
      >
        {/* EXPLORE STUDENTS HUB */}
        {activeTab === 'students' ? (
          <div className="soc-students-hub">
            {/* Search and Filters */}
            <div className="soc-students-filter-box">
              <div className="soc-insta-search-box" style={{ maxWidth: '100%' }}>
                <Search size={16} className="soc-insta-search-icon" />
                <input
                  type="text"
                  placeholder="Search students by name, course, goal, or skills..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                {studentSearch && (
                  <button className="soc-clear-btn" onClick={() => setStudentSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Course & Role Filter Chips */}
              <div className="soc-insta-cat-scroll" style={{ marginTop: '12px', paddingBottom: '4px' }}>
                {['All', 'Creators', 'BCA', 'B.Tech', 'MCA', 'BBA', 'MBA'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className={`soc-insta-cat-chip ${studentCourseFilter === chip ? 'active' : ''}`}
                    onClick={() => setStudentCourseFilter(chip)}
                  >
                    {chip === 'Creators' ? '🚀 Active Creators' : chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Creators Spotlight row */}
            {topCreators.length > 0 && !studentSearch && studentCourseFilter === 'All' && (
              <div className="soc-creators-spotlight">
                <div className="soc-spotlight-heading">
                  <Flame size={16} color="#f97316" />
                  <span>Featured Project Creators</span>
                </div>
                <div className="soc-creators-scroll">
                  {topCreators.map(creator => (
                    <div
                      key={creator.id}
                      className="soc-creator-chip-card"
                      onClick={() => {
                        setSelectedAuthor({
                          studentId: creator.id,
                          studentName: creator.name,
                          studentAvatar: creator.avatar,
                          studentCourse: creator.course,
                          studentSemester: creator.sem
                        });
                      }}
                    >
                      <div className="soc-creator-chip-avatar">
                        {creator.avatar ? (
                          <img src={creator.avatar} alt={creator.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
                        ) : (
                          (creator.name || 'S').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="soc-creator-chip-info">
                        <strong>{creator.name}</strong>
                        <span>{creator.projectCount} {creator.projectCount === 1 ? 'project' : 'projects'} • {creator.likesCount} ❤️</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students Grid */}
            {filteredStudents.length > 0 ? (
              <div className="soc-students-grid">
                {filteredStudents.map(st => {
                  const projCount = studentProjectCounts[st.id] || (st.projects ? Number(st.projects) : 0);
                  const isCurrent = st.id === currentStudentId;
                  return (
                    <div key={st.id} className="soc-student-card">
                      <div className="soc-student-card-header">
                        <div className="soc-student-avatar">
                          {st.avatar ? (
                            <img src={st.avatar} alt={st.name} onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            (st.name || 'S').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="soc-student-info">
                          <div className="soc-student-name-row">
                            <h4 className="soc-student-name">{st.name}</h4>
                            <BadgeCheck size={16} fill="#0284c7" color="#ffffff" />
                            {isCurrent && <span className="soc-you-badge">You</span>}
                          </div>
                          <span className="soc-student-meta">
                            {st.course || 'BCA'} • {st.semester ? (String(st.semester).startsWith('Sem') ? st.semester : `Sem ${st.semester}`) : 'Semester V'}
                          </span>
                        </div>
                      </div>

                      {st.goal && (
                        <p className="soc-student-headline">
                          <Sparkles size={13} className="soc-headline-icon" />
                          <span>{st.goal}</span>
                        </p>
                      )}

                      <div className="soc-student-stats-row">
                        <div className="soc-student-stat">
                          <strong>{projCount}</strong>
                          <span>Projects</span>
                        </div>
                        <div className="soc-student-stat">
                          <strong>{st.score || 78}/100</strong>
                          <span>P-CARE</span>
                        </div>
                        <div className="soc-student-stat">
                          <strong>{st.completion || 92}%</strong>
                          <span>Readiness</span>
                        </div>
                      </div>

                      <div className="soc-student-card-actions">
                        <button
                          type="button"
                          className="soc-btn-primary"
                          onClick={() => {
                            setSelectedAuthor({
                              studentId: st.id,
                              studentName: st.name,
                              studentAvatar: st.avatar,
                              studentCourse: st.course,
                              studentSemester: st.semester
                            });
                          }}
                        >
                          <Folder size={14} />
                          <span>Projects ({projCount})</span>
                        </button>

                        <button
                          type="button"
                          className="soc-btn-secondary"
                          onClick={() => {
                            if (navigate) {
                              navigate('profile', { params: { user: st.id } });
                            } else {
                              pushRoute('profile', isAdmin ? 'admin' : 'student', { params: { user: st.id } });
                            }
                          }}
                          title="View student profile"
                        >
                          <User size={14} />
                          <span>Profile</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="soc-empty-state-card">
                <Users size={40} className="soc-empty-icon" />
                <h3>No students found</h3>
                <p>No student accounts match "{studentSearch || studentCourseFilter}". Try a different keyword.</p>
                <button
                  type="button"
                  className="soc-btn-secondary"
                  onClick={() => { setStudentSearch(''); setStudentCourseFilter('All'); }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'search' ? (
          <div className="soc-insta-search-view">
            {/* Insta Search Bar */}
            <div className="soc-insta-search-box">
              <Search size={16} className="soc-insta-search-icon" />
              <input
                type="text"
                autoFocus
                placeholder="Search projects, technologies, students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="soc-clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Horizontal Category Chips */}
            <div className="soc-insta-cat-scroll">
              <button
                className={`soc-insta-cat-chip ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {(categories.length > 0 ? categories : [
                { id: '1', name: 'Web Development' },
                { id: '2', name: 'Android Development' },
                { id: '3', name: 'Artificial Intelligence' },
                { id: '4', name: 'Machine Learning' },
                { id: '5', name: 'Python' },
                { id: '6', name: 'Java' },
                { id: '7', name: 'C and C++' },
                { id: '8', name: 'Cybersecurity' },
                { id: '9', name: 'Database Management' },
                { id: '10', name: 'Graphic Design' },
                { id: '11', name: 'Business Projects' },
                { id: '12', name: 'Entrepreneurship' },
                { id: '13', name: 'Other' }
              ]).map(cat => (
                <button
                  key={cat.id || cat.name}
                  className={`soc-insta-cat-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Instagram 3-Column Explore Grid */}
            {loading && posts.length === 0 ? (
              <div className="soc-insta-grid-skel">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="soc-insta-skel-tile" />
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="soc-insta-grid">
                {posts.map(post => {
                  const hasImg = post.images && post.images.length > 0;
                  const coverImg = hasImg ? (post.images[0]?.imageUrl || post.images[0]) : null;

                  return (
                    <div
                      key={post.id}
                      className="soc-insta-grid-item"
                      onClick={() => {
                        setActiveTab('feed');
                        setTimeout(() => {
                          const el = document.getElementById(`post-${post.id}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 150);
                      }}
                      title={post.title}
                    >
                      {coverImg ? (
                        <img src={coverImg} alt={post.title} loading="lazy" />
                      ) : (
                        <div className="soc-insta-text-tile">
                          <Code size={22} />
                          <span>{post.title}</span>
                        </div>
                      )}

                      {/* Multi-image badge */}
                      {hasImg && post.images.length > 1 && (
                        <div className="soc-insta-multi-indicator">
                          <Layers size={13} />
                        </div>
                      )}

                      {/* Instagram Hover Stats Overlay */}
                      <div className="soc-insta-hover-overlay">
                        <span>
                          <Heart size={15} fill="#ffffff" />
                          <strong>{post.likesCount || 0}</strong>
                        </span>
                        <span>
                          <MessageSquare size={15} fill="#ffffff" />
                          <strong>{post.commentsCount || 0}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="soc-empty-state-card">
                <Search size={36} className="soc-empty-icon" />
                <h3>No projects found</h3>
                <p>Try searching for different keywords or select another category.</p>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD VERTICAL POSTS FEED (Feed / Saved / My Posts) */
          <>
            {loading && posts.length === 0 ? (
              <div className="soc-skeleton-list">
                {[1, 2, 3].map(n => (
                  <div key={n} className="soc-post-card soc-skeleton-card">
                    <div className="soc-skel-header">
                      <div className="soc-skel-avatar"></div>
                      <div className="soc-skel-lines">
                        <div className="soc-skel-line short"></div>
                        <div className="soc-skel-line tiny"></div>
                      </div>
                    </div>
                    <div className="soc-skel-img"></div>
                    <div className="soc-skel-line"></div>
                    <div className="soc-skel-line medium"></div>
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="soc-posts-list">
                {posts.map(post => (
                  <ProjectCard
                    key={post.id}
                    post={post}
                    currentStudentId={currentStudentId}
                    isAdmin={isAdmin}
                    onToggleLike={() => handleToggleLike(post)}
                    onToggleBookmark={() => handleToggleBookmark(post)}
                    onShare={() => handleShare(post)}
                    onEdit={() => { setEditingPost(post); setComposerOpen(true); }}
                    onDelete={() => handleDeletePost(post.id)}
                    onReport={() => setReportingPost(post)}
                    onOpenAuthor={() => setSelectedAuthor(post)}
                    onTagClick={(tag) => setSelectedTag(tag)}
                    notify={notify}
                  />
                ))}

                {page < totalPages && (
                  <div className="soc-load-more-wrap">
                    <button
                      className="soc-btn-secondary"
                      onClick={() => loadFeed(page + 1, true)}
                      disabled={loading}
                    >
                      {loading ? 'Loading more projects...' : 'Load more projects'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="soc-empty-state-card">
                <Folder size={40} className="soc-empty-icon" />
                <h3>{activeTab === 'saved' ? 'No saved projects' : activeTab === 'my' ? 'No published projects yet' : 'No projects found'}</h3>
                <p>{activeTab === 'saved' ? 'Bookmark projects to access them anytime.' : activeTab === 'my' ? 'Publish your builds and showcase your work.' : 'Be the first to share your project.'}</p>
                <button
                  className="soc-btn-primary"
                  onClick={() => { setEditingPost(null); setComposerOpen(true); }}
                >
                  <Plus size={15} />
                  <span>Create New Project</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ========================================================================= */}
      {/* INSTAGRAM-STYLE FIXED BOTTOM NAVIGATION BAR (Desktop & Mobile View) */}
      {/* ========================================================================= */}
      <nav className="soc-bottom-nav">
        {/* 1. Feed / Home */}
        <button
          className={`soc-bottom-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('feed');
            setSelectedCategory('All');
            setSelectedTag('');
            setSearchQuery('');
            pushRoute('projects', isAdmin ? 'admin' : 'student', { replace: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Home Feed"
        >
          <Layers size={19} />
          <span>Feed</span>
        </button>

        {/* 2. Search / Explore */}
        <button
          className={`soc-bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('search');
            pushRoute('projects', isAdmin ? 'admin' : 'student', { params: { tab: 'search' }, replace: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Search & Explore"
        >
          <Search size={19} />
          <span>Search</span>
        </button>

        {/* 3. Create Center Button */}
        <button
          className="soc-bottom-nav-center-btn"
          onClick={() => {
            setEditingPost(null);
            setComposerOpen(true);
          }}
          title="Create Project"
        >
          <Plus size={22} />
        </button>

        {/* 4. Saved Bookmarks */}
        <button
          className={`soc-bottom-nav-item ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('saved');
            setSelectedCategory('All');
            setSelectedTag('');
            pushRoute('projects', isAdmin ? 'admin' : 'student', { params: { tab: 'saved' }, replace: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Saved Projects"
        >
          <Bookmark size={19} />
          <span>Saved</span>
        </button>

        {/* 5. Explore Students */}
        <button
          className={`soc-bottom-nav-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('students');
            setSelectedCategory('All');
            setSelectedTag('');
            pushRoute('projects', isAdmin ? 'admin' : 'student', { params: { tab: 'students' }, replace: true });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Explore Students"
        >
          <div className="soc-nav-icon-wrap">
            <Users size={19} />
          </div>
          <span>Students</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE / EDIT PROJECT POST COMPOSER */}
      {/* ========================================================================= */}
      {composerOpen && (
        <ProjectComposerModal
          isOpen={composerOpen}
          onClose={() => { setComposerOpen(false); setEditingPost(null); }}
          postToEdit={editingPost}
          categories={categories}
          currentStudent={{
            id: currentStudentId,
            name: currentStudentName,
            avatar: currentStudentAvatar,
            course: currentStudentCourse,
            semester: currentStudentSem
          }}
          onPostSaved={(savedPost, isEdit) => {
            if (isEdit) {
              setPosts(prev => prev.map(p => p.id === savedPost.id ? savedPost : p));
              if (detailsPost?.id === savedPost.id) setDetailsPost(savedPost);
            } else {
              setPosts(prev => [savedPost, ...prev]);
            }
            setComposerOpen(false);
            setEditingPost(null);
            notify?.(isEdit ? 'Project updated successfully!' : 'Project published to community feed!');
          }}
          notify={notify}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STUDENT PROFILE SUMMARY */}
      {/* ========================================================================= */}
      {selectedAuthor && (
        <StudentProfileModal
          author={selectedAuthor}
          onClose={() => setSelectedAuthor(null)}
          onOpenProject={(proj) => {
            setSelectedAuthor(null);
            setActiveTab('feed');
            setTimeout(() => {
              const el = document.getElementById(`post-${proj.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 150);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: REPORT INAPPROPRIATE POST */}
      {/* ========================================================================= */}
      {reportingPost && (
        <div className="soc-modal-backdrop" onClick={() => setReportingPost(null)}>
          <div className="soc-modal-card small" onClick={e => e.stopPropagation()}>
            <div className="soc-modal-header">
              <h3>Report Project Post</h3>
              <button className="soc-close-btn" onClick={() => setReportingPost(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="soc-modal-form">
              <p className="soc-modal-desc">
                Help us keep Podar Pathways a safe, respectful academic space.
              </p>
              <label className="soc-form-field">
                <span>Reason for reporting *</span>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  <option value="Inappropriate Content">Inappropriate or offensive content</option>
                  <option value="Spam or Advertising">Spam or commercial advertising</option>
                  <option value="Plagiarism / Copyright">Plagiarism or copyright violation</option>
                  <option value="Broken / Malicious Links">Suspicious or malicious link</option>
                  <option value="Harassment">Harassment or bullying</option>
                  <option value="Other">Other issue</option>
                </select>
              </label>
              <label className="soc-form-field">
                <span>Additional details (optional)</span>
                <textarea
                  rows={3}
                  placeholder="Provide context for campus moderators..."
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                />
              </label>
              <div className="soc-modal-actions">
                <button type="button" className="soc-btn-secondary" onClick={() => setReportingPost(null)}>
                  Cancel
                </button>
                <button type="submit" className="soc-btn-danger">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: PROJECT NOTIFICATIONS */}
      {/* ========================================================================= */}
      {notifDrawerOpen && (
        <div className="soc-modal-backdrop" onClick={() => setNotifDrawerOpen(false)}>
          <div className="soc-drawer-panel" onClick={e => e.stopPropagation()}>
            <div className="soc-drawer-header">
              <div className="soc-drawer-title-row">
                <Bell size={18} />
                <h3>Project Activity</h3>
              </div>
              <button className="soc-close-btn" onClick={() => setNotifDrawerOpen(false)}><X size={16} /></button>
            </div>
            <div className="soc-drawer-body">
              {notifications.length > 0 ? (
                <div className="soc-notif-list">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`soc-notif-item ${!n.isRead ? 'unread' : ''}`}
                      onClick={() => {
                        setNotifDrawerOpen(false);
                        fetch(`/api/projects/${n.postId}?currentStudentId=${encodeURIComponent(currentStudentId)}`)
                          .then(r => r.ok ? r.json() : null)
                          .then(d => { if (d?.post) setDetailsPost(d.post); });
                      }}
                    >
                      <div className="soc-avatar tiny">
                        {n.actorAvatar ? (
                          <img src={n.actorAvatar} alt={n.actorName} onError={e => e.currentTarget.style.display = 'none'} />
                        ) : (
                          (n.actorName || 'U').slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="soc-notif-content">
                        <p>{n.message}</p>
                        <span>{formatRelativeTime(n.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="soc-empty-notifs">
                  <Bell size={32} />
                  <p>No project activity yet. When peers like or comment on your projects, you will see notifications here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: SOCIAL PROJECT CARD
// =========================================================================
function ProjectCard({
  post,
  currentStudentId,
  isAdmin,
  onToggleLike,
  onToggleBookmark,
  onShare,
  onEdit,
  onDelete,
  onReport,
  onOpenAuthor,
  onTagClick,
  notify
}) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const menuRef = useRef(null);

  // Finger gesture refs
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapRef = useRef(0);

  const isOwner = post.studentId === currentStudentId;
  const images = post.images || [];

  // Finger gesture: Double tap to like (Instagram-style)
  const triggerDoubleTapLike = () => {
    if (!post.isLiked) {
      onToggleLike();
    }
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
  };

  // Finger gesture: Touch swipe left / right on image carousel
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_GAP = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_GAP) {
      triggerDoubleTapLike();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (images.length <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Horizontal finger swipe detection
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swipe Left: next photo
        setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
      } else {
        // Swipe Right: previous photo
        setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }
  };

  // Close options menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Handle comment submit
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/projects/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudentId,
          content: commentText.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
        post.commentsCount = (post.commentsCount || 0) + 1;
        notify?.('Comment added!');
      }
    } catch (err) {
      notify?.('Could not add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Truncate description text
  const isLongDesc = (post.description || '').length > 220;
  const displayDesc = isLongDesc && !expandedDesc
    ? post.description.slice(0, 220) + '...'
    : post.description;

  return (
    <article className="soc-post-card" id={`post-${post.id}`}>
      {/* 1. AUTHOR HEADER */}
      <div className="soc-post-header">
        <div className="soc-author-box" onClick={onOpenAuthor}>
          <div className="soc-avatar">
            {post.studentAvatar ? (
              <img src={post.studentAvatar} alt={post.studentName} onError={e => e.currentTarget.style.display = 'none'} />
            ) : (
              (post.studentName || 'S').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="soc-author-meta">
            <strong className="soc-author-name">{post.studentName}</strong>
            <span className="soc-author-sub">
              {post.studentCourse} • {post.studentSemester} • {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        {/* Category Badge & Options Menu */}
        <div className="soc-header-actions" ref={menuRef}>
          <span className="soc-category-badge">
            {getCategoryIcon(post.category, 12)}
            <span>{post.category || 'Web Development'}</span>
          </span>

          <div className="soc-options-dropdown-wrap">
            <button
              className="soc-icon-btn small"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Post Options"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="soc-options-menu">
                <button onClick={() => { setMenuOpen(false); onShare(); }}>
                  <Share2 size={14} />
                  <span>Share Project</span>
                </button>
                {(isOwner || isAdmin) && (
                  <button onClick={() => { setMenuOpen(false); onEdit(); }}>
                    <Edit3 size={14} />
                    <span>Edit Post</span>
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button className="danger" onClick={() => { setMenuOpen(false); onDelete(); }}>
                    <Trash2 size={14} />
                    <span>Delete Post</span>
                  </button>
                )}
                {!isOwner && (
                  <button onClick={() => { setMenuOpen(false); onReport(); }}>
                    <Flag size={14} />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PROJECT TITLE */}
      <h2 className="soc-post-title">
        {post.title}
      </h2>

      {/* 3. MULTI-IMAGE CAROUSEL / GALLERY (With Touch Gesture Control) */}
      {images.length > 0 && (
        <div
          className="soc-carousel-container"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={triggerDoubleTapLike}
        >
          <div className="soc-carousel-slide">
            <img
              src={images[currentImgIndex]?.imageUrl || images[currentImgIndex]}
              alt={post.title}
              loading="lazy"
              draggable="false"
            />
            {/* Double Tap Heart Pop Gesture Animation */}
            {showHeartPop && (
              <div className="soc-heart-pop-anim">
                <Heart size={68} fill="#ffffff" color="#ffffff" />
              </div>
            )}
          </div>

          {/* Slide navigation if multiple images */}
          {images.length > 1 && (
            <>
              <button
                className="soc-carousel-arrow left"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
                }}
                aria-label="Previous Image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="soc-carousel-arrow right"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImgIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
                }}
                aria-label="Next Image"
              >
                <ChevronRight size={18} />
              </button>

              <div className="soc-carousel-counter">
                <span>{currentImgIndex + 1} / {images.length}</span>
              </div>

              <div className="soc-carousel-dots">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    className={`soc-dot ${idx === currentImgIndex ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCurrentImgIndex(idx); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. POST DESCRIPTION */}
      <div className="soc-post-body">
        <p className="soc-post-desc">
          {displayDesc}
          {isLongDesc && (
            <button
              className="soc-expand-toggle"
              onClick={() => setExpandedDesc(prev => !prev)}
            >
              {expandedDesc ? ' Show less' : ' See more'}
            </button>
          )}
        </p>

        {/* 5. TECH TAGS */}
        {post.tags && post.tags.length > 0 && (
          <div className="soc-post-tags-row">
            {post.tags.map(tag => (
              <button
                key={tag}
                className="soc-tech-tag-pill"
                onClick={() => onTagClick?.(tag.replace(/^#/, ''))}
              >
                #{tag.replace(/^#/, '')}
              </button>
            ))}
          </div>
        )}

        {/* 6. EXTERNAL LINKS (Live Demo, GitHub, YouTube) */}
        {(post.demoUrl || post.githubUrl || post.youtubeUrl) && (
          <div className="soc-links-bar">
            {post.demoUrl && (
              <a
                href={post.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="soc-link-pill primary"
                title="Open Live Website / Prototype"
              >
                <ExternalLink size={13} />
                <span>Live Demo</span>
              </a>
            )}
            {post.githubUrl && (
              <a
                href={post.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="soc-link-pill github"
                title="View GitHub Repository"
              >
                <GithubIcon size={13} />
                <span>Repository</span>
              </a>
            )}
            {post.youtubeUrl && (
              <a
                href={post.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="soc-link-pill youtube"
                title="Watch Video Presentation"
              >
                <YoutubeIcon size={13} />
                <span>Video Demo</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* 7. ACTION BUTTONS (Like, Comment, Bookmark, Share) */}
      <div className="soc-post-actions-bar">
        <div className="soc-actions-left">
          <button
            className={`soc-action-btn like ${post.isLiked ? 'active' : ''}`}
            onClick={onToggleLike}
            title={post.isLiked ? 'Unlike' : 'Like Project'}
          >
            <Heart size={18} className={post.isLiked ? 'fill-heart' : ''} />
            <span>{post.likesCount || 0}</span>
          </button>

          <button
            className="soc-action-btn comment"
            onClick={() => setCommentsOpen(prev => !prev)}
            title="Comments"
          >
            <MessageSquare size={18} />
            <span>{post.commentsCount || 0}</span>
          </button>

          <button
            className="soc-action-btn share"
            onClick={onShare}
            title="Share Project"
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="soc-actions-right">
          <button
            className={`soc-action-btn bookmark ${post.isBookmarked ? 'active' : ''}`}
            onClick={onToggleBookmark}
            title={post.isBookmarked ? 'Saved in Bookmarks' : 'Save Project'}
          >
            <Bookmark size={18} className={post.isBookmarked ? 'fill-bm' : ''} />
          </button>
        </div>
      </div>

      {/* 8. COLLAPSIBLE COMMENTS SECTION */}
      {commentsOpen && (
        <div className="soc-comments-section">
          {/* Add comment box */}
          <form onSubmit={handleAddComment} className="soc-comment-input-row">
            <input
              type="text"
              placeholder="Write a constructive comment or question..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={submittingComment}
            />
            <button
              type="submit"
              className="soc-comment-send-btn"
              disabled={!commentText.trim() || submittingComment}
            >
              <Send size={15} />
            </button>
          </form>

          {/* Comments list */}
          <div className="soc-comments-thread">
            {comments.length > 0 ? (
              comments.map(c => (
                <div key={c.id} className="soc-comment-bubble">
                  <div className="soc-avatar tiny">
                    {c.studentAvatar ? (
                      <img src={c.studentAvatar} alt={c.studentName} onError={e => e.currentTarget.style.display = 'none'} />
                    ) : (
                      (c.studentName || 'U').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="soc-comment-body">
                    <div className="soc-comment-meta">
                      <strong>{c.studentName}</strong>
                      <span>{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p>{c.content}</p>

                    {/* Nested replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="soc-replies-list">
                        {c.replies.map(r => (
                          <div key={r.id} className="soc-reply-bubble">
                            <strong>{r.studentName}</strong>: {r.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="soc-no-comments">No comments yet. Start the conversation!</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// =========================================================================
// SUB-COMPONENT: CREATE / EDIT PROJECT MODAL (COMPOSER)
// =========================================================================
// =========================================================================
// SUB-COMPONENT: CREATE / EDIT PROJECT POST COMPOSER MODAL
// =========================================================================
const DRAFT_KEY = 'podar_project_draft';
const QUICK_TECH_TAGS = [
  'React', 'Node.js', 'Python', 'TailwindCSS', 'Flutter', 'TypeScript',
  'MySQL', 'MongoDB', 'Next.js', 'MachineLearning', 'FastAPI', 'Docker',
  'Firebase', 'Java', 'C++', 'GraphQL'
];

function ProjectComposerModal({
  isOpen,
  onClose,
  postToEdit,
  categories,
  currentStudent,
  onPostSaved,
  notify
}) {
  const isEdit = !!postToEdit;

  // Check if draft exists for new posts
  const [hasDraft, setHasDraft] = useState(() => {
    if (isEdit) return false;
    try {
      return !!localStorage.getItem(DRAFT_KEY);
    } catch {
      return false;
    }
  });

  const [title, setTitle] = useState(postToEdit?.title || '');
  const [description, setDescription] = useState(postToEdit?.description || '');
  const [category, setCategory] = useState(postToEdit?.category || 'Web Development');
  const [demoUrl, setDemoUrl] = useState(postToEdit?.demoUrl || '');
  const [githubUrl, setGithubUrl] = useState(postToEdit?.githubUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(postToEdit?.youtubeUrl || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(postToEdit?.tags || ['React', 'WebDevelopment']);

  // Images state: array of { imageUrl, caption }
  const [images, setImages] = useState(() => {
    if (postToEdit?.images && postToEdit.images.length > 0) {
      return postToEdit.images.map(img => typeof img === 'string' ? { imageUrl: img, caption: '' } : img);
    }
    return [];
  });
  const [compressing, setCompressing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const fileInputRef = useRef(null);

  // Restore saved draft
  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.description) setDescription(d.description);
      if (d.category) setCategory(d.category);
      if (d.demoUrl) setDemoUrl(d.demoUrl);
      if (d.githubUrl) setGithubUrl(d.githubUrl);
      if (d.youtubeUrl) setYoutubeUrl(d.youtubeUrl);
      if (Array.isArray(d.tags)) setTags(d.tags);
      if (Array.isArray(d.images)) setImages(d.images);
      setHasDraft(false);
      notify?.('Draft restored successfully!');
    } catch (e) {
      notify?.('Could not restore draft.');
    }
  };

  // Discard draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
    setHasDraft(false);
  };

  // Explicit Save Draft
  const handleSaveDraft = () => {
    if (!title.trim() && !description.trim() && images.length === 0) {
      notify?.('Add some project details before saving draft.');
      return;
    }
    try {
      const draftObj = {
        title,
        description,
        category,
        demoUrl,
        githubUrl,
        youtubeUrl,
        tags,
        images,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftObj));
      notify?.('Draft saved! You can resume editing anytime.');
    } catch (e) {
      notify?.('Unable to save draft locally.');
    }
  };

  // Add tag
  const handleAddTag = (textToAdd) => {
    const raw = textToAdd || tagInput;
    const clean = raw.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Sanitize external URLs
  const sanitizeUrl = (str) => {
    const trimmed = (str || '').trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  };

  // Image Upload with client compression
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 8) {
      notify?.('Maximum 8 photos/screenshots allowed per project post.');
      return;
    }

    setCompressing(true);
    try {
      const newImages = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressedDataUrl = await compressProjectImage(file);
        newImages.push({
          imageUrl: compressedDataUrl,
          caption: file.name.replace(/\.[^/.]+$/, '')
        });
      }
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      notify?.('Failed to process image files.');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove image
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  // Update caption for specific image
  const handleImageCaptionChange = (index, newCaption) => {
    setImages(images.map((img, idx) => idx === index ? { ...img, caption: newCaption } : img));
  };

  // Save / Publish
  const handlePublish = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) {
      notify?.('Please provide a project title.');
      return;
    }
    if (!description.trim()) {
      notify?.('Please provide a project description or summary.');
      return;
    }

    setPublishing(true);
    const cleanedDemo = sanitizeUrl(demoUrl);
    const cleanedGithub = sanitizeUrl(githubUrl);
    const cleanedYoutube = sanitizeUrl(youtubeUrl);

    const payload = {
      studentId: currentStudent?.id || 'student-demo',
      studentName: currentStudent?.name || 'Student Demo',
      studentAvatar: currentStudent?.avatar || '',
      studentCourse: currentStudent?.course || 'BCA',
      studentSemester: currentStudent?.semester || 'Semester V',
      title: title.trim(),
      description: description.trim(),
      category: category || 'Web Development',
      demoUrl: cleanedDemo,
      githubUrl: cleanedGithub,
      youtubeUrl: cleanedYoutube,
      tags: tags.length > 0 ? tags : ['Project'],
      images
    };

    let savedSuccessfully = false;

    // 1. Try sending to API
    try {
      const url = isEdit ? `/api/projects/${postToEdit.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.post) {
          savedSuccessfully = true;
          // Clear draft
          try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
          // Save to local backup cache
          try {
            const localSaved = JSON.parse(localStorage.getItem('podar_local_projects') || '[]');
            const updated = isEdit
              ? localSaved.map(p => p.id === data.post.id ? data.post : p)
              : [data.post, ...localSaved.filter(p => p.id !== data.post.id)];
            localStorage.setItem('podar_local_projects', JSON.stringify(updated));
          } catch (e) {}

          onPostSaved(data.post, isEdit);
          notify?.(isEdit ? 'Project updated successfully!' : 'Project published to community feed!');
          return;
        }
      }
    } catch (err) {
      console.warn('API error when publishing, using local fallback:', err);
    }

    // 2. Client-side Fallback (Guarantee the project is never lost)
    if (!savedSuccessfully) {
      const fallbackPost = {
        id: isEdit ? postToEdit.id : `proj-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        studentId: payload.studentId,
        studentName: payload.studentName,
        studentAvatar: payload.studentAvatar,
        studentCourse: payload.studentCourse,
        studentSemester: payload.studentSemester,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        demoUrl: payload.demoUrl,
        githubUrl: payload.githubUrl,
        youtubeUrl: payload.youtubeUrl,
        tags: payload.tags,
        images: payload.images,
        likesCount: isEdit ? (postToEdit.likesCount || 0) : 0,
        commentsCount: isEdit ? (postToEdit.commentsCount || 0) : 0,
        isLiked: false,
        isBookmarked: false,
        comments: [],
        createdAt: isEdit ? postToEdit.createdAt : new Date().toISOString()
      };

      try {
        const localSaved = JSON.parse(localStorage.getItem('podar_local_projects') || '[]');
        const updated = isEdit
          ? localSaved.map(p => p.id === fallbackPost.id ? fallbackPost : p)
          : [fallbackPost, ...localSaved.filter(p => p.id !== fallbackPost.id)];
        localStorage.setItem('podar_local_projects', JSON.stringify(updated));
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {}

      onPostSaved(fallbackPost, isEdit);
      notify?.(isEdit ? 'Project updated successfully!' : 'Project published to community feed!');
    }

    setPublishing(false);
  };

  return (
    <div className="soc-modal-backdrop" onClick={onClose}>
      <div className="soc-modal-card large" onClick={e => e.stopPropagation()}>
        <div className="soc-modal-header">
          <div>
            <h3 className="soc-modal-title">{isEdit ? 'Edit Project Post' : 'Create Project Post'}</h3>
            <p className="soc-modal-subtitle">Share your code, live apps, designs, or prototypes with student peers.</p>
          </div>
          <button className="soc-close-btn" onClick={onClose} title="Close"><X size={18} /></button>
        </div>

        {/* Draft Recovery Banner */}
        {hasDraft && !isEdit && (
          <div className="soc-draft-banner">
            <span>You have an unposted project draft. Would you like to resume it?</span>
            <div className="soc-draft-banner-btns">
              <button type="button" className="soc-btn-outline-sm" onClick={handleRestoreDraft}>
                Restore Draft
              </button>
              <button type="button" className="soc-btn-ghost-sm" onClick={handleDiscardDraft}>
                Discard
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handlePublish} className="soc-composer-form">
          <div className="soc-composer-body">
            {/* Title */}
            <div className="soc-form-field">
              <label>Project Title *</label>
              <input
                type="text"
                placeholder="e.g. CampusKart - Peer-to-Peer College Marketplace"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category & Tags Row */}
            <div className="soc-form-row">
              <div className="soc-form-field">
                <label>Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {(categories && categories.length > 0 ? categories : [
                    { name: 'Web Development' },
                    { name: 'Android Development' },
                    { name: 'Artificial Intelligence' },
                    { name: 'Machine Learning' },
                    { name: 'Python' },
                    { name: 'Java' },
                    { name: 'C and C++' },
                    { name: 'Cybersecurity' },
                    { name: 'Database Management' },
                    { name: 'Graphic Design' },
                    { name: 'Business Projects' },
                    { name: 'Marketing' },
                    { name: 'Entrepreneurship' },
                    { name: 'Other' }
                  ]).map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="soc-form-field">
                <label>Technology Tags</label>
                <div className="soc-tag-input-row">
                  <input
                    type="text"
                    placeholder="Type a tag & press Enter"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button type="button" className="soc-btn-outline" onClick={() => handleAddTag()}>
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tag Recommendations */}
            <div className="soc-quick-tags-wrap">
              <span className="soc-quick-tags-label">Quick Suggestions:</span>
              <div className="soc-quick-tags-list">
                {QUICK_TECH_TAGS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`soc-quick-tag-chip ${tags.includes(t) ? 'selected' : ''}`}
                    onClick={() => tags.includes(t) ? handleRemoveTag(t) : handleAddTag(t)}
                  >
                    {tags.includes(t) ? '✓ ' : '+ '}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Selected Tags Strip */}
            {tags.length > 0 && (
              <div className="soc-tags-selected-strip">
                {tags.map(t => (
                  <span key={t} className="soc-selected-tag">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} title="Remove tag"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Description / Caption */}
            <div className="soc-form-field">
              <label>Project Caption & Description *</label>
              <textarea
                rows={5}
                placeholder="Share the story behind your project: what problem does it solve, technologies used, challenges overcome, and next steps..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Screenshots & Photos Upload */}
            <div className="soc-form-field">
              <div className="soc-file-header">
                <label>Project Screenshots & Photos ({images.length}/8)</label>
                {compressing && <span className="soc-compressing-badge">Optimizing photos...</span>}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: 'none' }}
              />

              <div className="soc-image-previews-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="soc-img-thumb-card">
                    <div className="soc-img-thumb-box">
                      <img src={img.imageUrl || img} alt={`Upload ${idx + 1}`} />
                      <button
                        type="button"
                        className="soc-remove-thumb-btn"
                        onClick={() => handleRemoveImage(idx)}
                        title="Remove image"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="soc-img-caption-input"
                      placeholder="Optional screenshot caption..."
                      value={img.caption || ''}
                      onChange={e => handleImageCaptionChange(idx, e.target.value)}
                    />
                  </div>
                ))}

                {images.length < 8 && (
                  <button
                    type="button"
                    className="soc-upload-trigger-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={compressing}
                  >
                    <ImageIcon size={24} />
                    <span>{compressing ? 'Compressing...' : 'Upload Photos'}</span>
                    <small>Supports PNG, JPG, WebP</small>
                  </button>
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="soc-links-input-grid">
              <div className="soc-form-field">
                <label>
                  <Globe size={13} />
                  <span>Live Demo / App Website (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://myproject.vercel.app"
                  value={demoUrl}
                  onChange={e => setDemoUrl(e.target.value)}
                />
              </div>

              <div className="soc-form-field">
                <label>
                  <GithubIcon size={13} />
                  <span>GitHub Repository URL (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. github.com/username/project"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                />
              </div>

              <div className="soc-form-field">
                <label>
                  <YoutubeIcon size={13} />
                  <span>YouTube Video Presentation (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={e => setYoutubeUrl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="soc-modal-actions">
            {!isEdit && (
              <button
                type="button"
                className="soc-btn-ghost"
                onClick={handleSaveDraft}
                disabled={publishing}
              >
                Save Draft
              </button>
            )}
            <button
              type="button"
              className="soc-btn-secondary"
              onClick={onClose}
              disabled={publishing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="soc-btn-primary"
              disabled={publishing || compressing}
            >
              {publishing ? 'Publishing...' : isEdit ? 'Save Changes' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: STUDENT CREATOR PROFILE MODAL
// =========================================================================
function StudentProfileModal({ author, onClose, onOpenProject }) {
  const [authorProjects, setAuthorProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects?studentId=${encodeURIComponent(author.studentId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.posts) setAuthorProjects(data.posts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [author.studentId]);

  return (
    <div className="soc-modal-backdrop" onClick={onClose}>
      <div className="soc-modal-card author-profile-card" onClick={e => e.stopPropagation()}>
        <div className="soc-profile-header-banner">
          <button className="soc-close-btn light" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="soc-profile-body">
          <div className="soc-profile-avatar-wrap">
            <div className="soc-avatar large">
              {author.studentAvatar ? (
                <img src={author.studentAvatar} alt={author.studentName} onError={e => e.currentTarget.style.display = 'none'} />
              ) : (
                (author.studentName || 'S').slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <h2 className="soc-profile-name">{author.studentName}</h2>
          <p className="soc-profile-program">{author.studentCourse} • {author.studentSemester}</p>

          <div className="soc-profile-stats-strip">
            <div>
              <strong>{authorProjects.length}</strong>
              <span>Projects</span>
            </div>
            <div>
              <strong>
                {authorProjects.reduce((acc, p) => acc + (p.likesCount || 0), 0)}
              </strong>
              <span>Likes Received</span>
            </div>
          </div>

          <h3 className="soc-profile-section-heading">Published Projects</h3>
          <div className="soc-author-projects-grid">
            {loading ? (
              <p>Loading projects...</p>
            ) : authorProjects.length > 0 ? (
              authorProjects.map(proj => (
                <div
                  key={proj.id}
                  className="soc-author-proj-card"
                  onClick={() => onOpenProject(proj)}
                >
                  {proj.images && proj.images[0] ? (
                    <img src={proj.images[0].imageUrl || proj.images[0]} alt={proj.title} />
                  ) : (
                    <div className="soc-fallback-img">
                      <Code size={24} />
                    </div>
                  )}
                  <div className="soc-author-proj-meta">
                    <h4>{proj.title}</h4>
                    <span>{proj.likesCount || 0} likes • {proj.category}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="soc-no-comments">No projects published yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ADMIN COMPONENT: ADMIN PROJECTS MANAGEMENT & MODERATION VIEW
// =========================================================================
export function AdminProjectsManagementView({ state, setState, session, notify, navigate }) {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'reports' | 'categories'
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalLikes: 0,
    totalComments: 0,
    reportedCount: 0,
    creatorsCount: 0
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'likes' | 'comments'
  const [loading, setLoading] = useState(true);

  // New Category input
  const [newCatName, setNewCatName] = useState('');

  // Detailed Project Inspection Modal State
  const [inspectingProject, setInspectingProject] = useState(null);
  const [projectComments, setProjectComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [adminCommentInput, setAdminCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Delete Confirmation Modal Target
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch all admin data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, repRes, catRes, statRes] = await Promise.all([
        fetch('/api/projects?limit=100'),
        fetch('/api/projects/admin/reports'),
        fetch('/api/projects/categories'),
        fetch('/api/projects/admin/stats')
      ]);

      if (projRes.ok) {
        const d = await projRes.json();
        setProjects(d.posts || []);
      }
      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (statRes.ok) {
        const d = await statRes.json();
        setStats(d.stats || {});
      }
    } catch (e) {
      console.warn('Error loading admin project data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Project Inspection Modal & Load Comments
  const handleOpenInspect = async (post) => {
    setInspectingProject(post);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/projects/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setProjectComments(data.comments || []);
      } else {
        setProjectComments(post.comments || []);
      }
    } catch {
      setProjectComments(post.comments || []);
    } finally {
      setLoadingComments(false);
    }
  };

  // Delete project as admin
  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    const postId = deleteTarget.id;
    const postTitle = deleteTarget.title;

    try {
      const res = await fetch(`/api/projects/${postId}?isAdmin=1`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== postId));
        setReports(prev => prev.filter(r => r.postId !== postId));
        notify?.(`Project "${postTitle}" deleted successfully.`);
        if (inspectingProject?.id === postId) {
          setInspectingProject(null);
        }
      } else {
        notify?.('Could not delete project.');
      }
    } catch {
      notify?.('Could not delete project.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Dismiss a reported post report
  const handleDismissReport = async (reportId) => {
    try {
      const res = await fetch(`/api/projects/admin/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        notify?.('Report dismissed. Project remains published.');
      }
    } catch {
      setReports(prev => prev.filter(r => r.id !== reportId));
      notify?.('Report dismissed.');
    }
  };

  // Delete a specific comment as admin
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`/api/projects/comments/${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjectComments(prev => prev.filter(c => c.id !== commentId));
        if (inspectingProject) {
          setProjects(prev => prev.map(p =>
            p.id === inspectingProject.id
              ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) }
              : p
          ));
        }
        notify?.('Comment removed.');
      }
    } catch {
      notify?.('Could not remove comment.');
    }
  };

  // Post official administrator comment
  const handleAddAdminComment = async (e) => {
    e.preventDefault();
    if (!adminCommentInput.trim() || !inspectingProject) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/projects/${inspectingProject.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: session?.id || 'admin-root',
          content: `🛡️ [Administrator Review]: ${adminCommentInput.trim()}`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setProjectComments(prev => [...prev, data.comment]);
        setAdminCommentInput('');
        setProjects(prev => prev.map(p =>
          p.id === inspectingProject.id
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p
        ));
        notify?.('Administrator comment published.');
      }
    } catch {
      notify?.('Could not post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Add category as admin
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch('/api/projects/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (res.ok) {
        const d = await res.json();
        setCategories(prev => [...prev, d.category]);
        setNewCatName('');
        notify?.(`Category "${newCatName.trim()}" added!`);
      }
    } catch {
      notify?.('Could not add category.');
    }
  };

  // Delete category as admin
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/projects/categories/${catId}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== catId));
        notify?.(`Category "${catName}" deleted.`);
      }
    } catch {
      notify?.('Could not delete category.');
    }
  };

  // Unique Courses for Filter
  const availableCourses = useMemo(() => {
    const set = new Set(['BCA', 'MCA', 'B.Sc IT', 'BBA', 'B.Com']);
    projects.forEach(p => {
      if (p.studentCourse) set.add(p.studentCourse);
    });
    return Array.from(set).filter(Boolean);
  }, [projects]);

  // Set of reported post IDs for flagging cards
  const reportedPostIds = useMemo(() => {
    return new Set(reports.map(r => r.postId));
  }, [reports]);

  // Filtered and Sorted Projects
  const filteredProjects = useMemo(() => {
    let list = projects.filter(p => {
      // Category filter
      if (selectedCategory !== 'All') {
        if ((p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      // Course filter
      if (courseFilter !== 'All') {
        if ((p.studentCourse || '').toLowerCase() !== courseFilter.toLowerCase()) return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = (p.title || '').toLowerCase().includes(q);
        const inAuthor = (p.studentName || '').toLowerCase().includes(q);
        const inCat = (p.category || '').toLowerCase().includes(q);
        const inDesc = (p.description || '').toLowerCase().includes(q);
        const inTags = Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inAuthor && !inCat && !inDesc && !inTags) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOrder === 'likes') {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortOrder === 'comments') {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      return 0;
    });
  }, [projects, selectedCategory, courseFilter, search, sortOrder]);

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="minimal-admin-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px 60px' }}>
      {/* 1. Header with Title & Action */}
      <div className="minimal-admin-header" style={{ marginBottom: '24px' }}>
        <div>
          <span className="minimal-admin-eyebrow">PORTFOLIO MODERATION & GOVERNANCE</span>
          <h1 className="minimal-admin-title">Student Projects Platform</h1>
          <p className="minimal-admin-subtitle">
            Review student project portfolios, inspect codebases, moderate community comments, and manage official categories.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="minimal-btn-primary"
            onClick={() => setActiveTab('categories')}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={15} />
            <span>Manage Categories</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="minimal-stats-grid" style={{ marginBottom: '22px' }}>
        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#f1f5f9', color: '#0f172a' }}>
            <Folder size={18} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Total Projects</span>
            <strong className="minimal-stat-val">{stats.totalProjects || projects.length}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            <Heart size={18} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Total Reactions</span>
            <strong className="minimal-stat-val">{stats.totalLikes || 0}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Users size={18} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Student Creators</span>
            <strong className="minimal-stat-val">{stats.creatorsCount || 0}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: pendingReportsCount > 0 ? '#fee2e2' : '#fef3c7', color: pendingReportsCount > 0 ? '#dc2626' : '#d97706' }}>
            <Flag size={18} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Flagged Reports</span>
            <strong className="minimal-stat-val" style={{ color: pendingReportsCount > 0 ? '#dc2626' : '#0f172a' }}>
              {pendingReportsCount}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Top Navigation Tabs */}
      <div className="minimal-admin-panel" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          <div className="admin-cert-tabs">
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeTab === 'projects' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <Folder size={14} />
              <span>All Projects</span>
              <span className="admin-cert-tab-badge">{projects.length}</span>
            </button>

            <button
              type="button"
              className={`admin-cert-tab-btn ${activeTab === 'reports' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Flag size={14} />
              <span>Flagged Reports</span>
              <span className={`admin-cert-tab-badge ${pendingReportsCount > 0 ? 'danger' : ''}`}>
                {pendingReportsCount}
              </span>
            </button>

            <button
              type="button"
              className={`admin-cert-tab-btn ${activeTab === 'categories' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              <Layers size={14} />
              <span>Categories</span>
              <span className="admin-cert-tab-badge">{categories.length}</span>
            </button>
          </div>

          {activeTab === 'projects' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <select
                className="minimal-table-filter-select"
                value={courseFilter}
                onChange={e => setCourseFilter(e.target.value)}
                title="Filter by course"
                style={{ minWidth: '130px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
              >
                <option value="All">All Courses</option>
                {availableCourses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                className="minimal-table-filter-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                title="Sort projects"
                style={{ minWidth: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
              >
                <option value="newest">Newest First</option>
                <option value="likes">Most Liked ❤️</option>
                <option value="comments">Most Discussed 💬</option>
              </select>

              <div className="minimal-search-box" style={{ maxWidth: '240px', width: '100%', margin: 0 }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="clear-search-btn" onClick={() => setSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Category Filter Pills (When on All Projects Tab) */}
        {activeTab === 'projects' && (
          <div className="soc-insta-cat-scroll" style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className={`soc-insta-cat-chip ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Categories ({projects.length})
            </button>
            {(categories.length > 0 ? categories : [
              { id: '1', name: 'Web Development' },
              { id: '2', name: 'Android Development' },
              { id: '3', name: 'Artificial Intelligence' },
              { id: '4', name: 'Machine Learning' },
              { id: '5', name: 'Python' },
              { id: '6', name: 'Cybersecurity' },
              { id: '7', name: 'Cloud & DevOps' }
            ]).map(cat => {
              const count = projects.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  className={`soc-insta-cat-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.name)}
                >
                  {cat.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: ALL PROJECTS (VISUAL CARDS - STUDENT LOOK + ADMIN CONTROLS) */}
      {activeTab === 'projects' && (
        <>
          {filteredProjects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {filteredProjects.map(post => {
                const isReported = reportedPostIds.has(post.id);
                const coverImg = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : (post.image || null);
                const hasMultipleImgs = Array.isArray(post.images) && post.images.length > 1;

                return (
                  <article
                    key={post.id}
                    className="soc-post-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      border: isReported ? '1.5px solid #f87171' : '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      overflow: 'hidden',
                      background: '#ffffff',
                      position: 'relative'
                    }}
                  >
                    {/* 1. Author Row & Admin Delete Button */}
                    <div className="soc-post-header" style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                      <div className="soc-author-box">
                        <div className="soc-avatar">
                          {post.studentAvatar ? (
                            <img src={post.studentAvatar} alt={post.studentName} onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            (post.studentName || 'S').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="soc-author-meta">
                          <strong className="soc-author-name">{post.studentName}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            {post.studentCourse ? `${post.studentCourse} • ${post.studentSemester || 'V'}` : 'Student Portfolio'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isReported && (
                          <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <AlertCircle size={11} /> Flagged
                          </span>
                        )}
                        <button
                          type="button"
                          className="minimal-btn-action delete"
                          onClick={() => setDeleteTarget(post)}
                          title="Delete project post"
                          style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '12px' }}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. Visual Project Media Cover */}
                    <div
                      style={{
                        position: 'relative',
                        aspectRatio: '16/10',
                        background: '#0f172a',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenInspect(post)}
                    >
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={post.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '8px' }}>
                          <Code size={36} color="#38bdf8" />
                          <span style={{ fontSize: '13px', fontWeight: 600 }}>{post.title}</span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        {post.category && (
                          <span style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                            {post.category}
                          </span>
                        )}
                        {hasMultipleImgs && (
                          <span style={{ background: 'rgba(15, 23, 42, 0.85)', color: '#ffffff', fontSize: '10.5px', fontWeight: 700, padding: '3px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Layers size={11} /> {post.images.length}
                          </span>
                        )}
                      </div>

                      {/* Hover Stats Bar */}
                      <div className="soc-insta-hover-overlay">
                        <span>
                          <Heart size={14} fill="#ffffff" />
                          <strong>{post.likesCount || 0}</strong>
                        </span>
                        <span>
                          <MessageSquare size={14} fill="#ffffff" />
                          <strong>{post.commentsCount || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {/* 3. Card Body */}
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h3
                        style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#0f172a', cursor: 'pointer', lineHeight: '1.3' }}
                        onClick={() => handleOpenInspect(post)}
                      >
                        {post.title}
                      </h3>

                      {post.description && (
                        <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.description}
                        </p>
                      )}

                      {/* Tech Stack Pills */}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                          {post.tags.slice(0, 4).map(tag => (
                            <span
                              key={tag}
                              style={{ background: '#f1f5f9', color: '#334155', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px' }}
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 4 && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{post.tags.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Links */}
                      {(post.demoUrl || post.githubUrl) && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {post.demoUrl && (
                            <a
                              href={post.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#0284c7', textDecoration: 'none', background: '#f0f9ff', padding: '3px 8px', borderRadius: '4px', border: '1px solid #bae6fd' }}
                            >
                              <ExternalLink size={11} /> Live Demo ↗
                            </a>
                          )}
                          {post.githubUrl && (
                            <a
                              href={post.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, color: '#334155', textDecoration: 'none', background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                            >
                              <GithubIcon size={12} /> Code Repo ↗
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. Admin Footer (Engagement & Inspect Button) */}
                    <div style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Heart size={14} color="#ef4444" /> {post.likesCount || 0}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={14} color="#0284c7" /> {post.commentsCount || 0}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="minimal-btn-secondary"
                        onClick={() => handleOpenInspect(post)}
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                      >
                        <Eye size={13} />
                        <span>Inspect & Moderate</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Folder size={44} color="#94a3b8" />
              <h3 style={{ margin: '12px 0 6px 0', fontSize: '17px', color: '#0f172a' }}>No student projects match your filters</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#64748b' }}>
                Try selecting a different category or clearing search terms.
              </p>
              <button
                type="button"
                className="minimal-btn-secondary"
                onClick={() => { setSearch(''); setSelectedCategory('All'); setCourseFilter('All'); }}
                style={{ margin: '0 auto' }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB 2: FLAGGED REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reports.length > 0 ? (
            reports.map(r => (
              <div
                key={r.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.05)'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                      Reported: {r.reason || 'Flagged by student'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {formatRelativeTime(r.createdAt)}
                    </span>
                  </div>

                  <h4 style={{ margin: '4px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {r.postTitle || `Project ID: ${r.postId}`}
                  </h4>

                  <p style={{ margin: 0, fontSize: '12.5px', color: '#475569' }}>
                    Author: <strong>{r.authorName || 'Student'}</strong> • Reported by: <strong>{r.reporterName || 'Anonymous Student'}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="minimal-btn-secondary"
                    onClick={() => handleDismissReport(r.id)}
                    style={{ fontSize: '12.5px', padding: '6px 12px' }}
                  >
                    <Check size={13} color="#059669" />
                    <span>Dismiss Flag</span>
                  </button>

                  <button
                    type="button"
                    className="minimal-btn-danger"
                    onClick={() => handleDelete(r.postId, r.postTitle || 'Reported Project')}
                    style={{ fontSize: '12.5px', padding: '6px 12px' }}
                  >
                    <Trash2 size={13} />
                    <span>Remove Project</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <CheckCircle2 size={44} color="#10b981" />
              <h3 style={{ margin: '12px 0 6px 0', fontSize: '17px', color: '#0f172a' }}>Zero Pending Reports</h3>
              <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>
                All student projects are verified and compliant with college community standards.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            Manage Project Showcase Categories
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#64748b' }}>
            Add, update, or remove track tags that students use to categorize their portfolio builds.
          </p>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', maxWidth: '520px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="e.g. Blockchain & Web3, AR / VR Projects..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
            <button type="submit" className="minimal-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
            {categories.map(cat => {
              const count = projects.filter(p => (p.category || '').toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <div
                  key={cat.id || cat.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{cat.name}</strong>
                    <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b' }}>{count} {count === 1 ? 'project' : 'projects'}</span>
                  </div>
                  <button
                    type="button"
                    className="minimal-btn-action delete"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    title="Delete category"
                    style={{ padding: '4px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Project Full Inspection & Comments Moderation Modal */}
      {inspectingProject && (
        <div className="minimal-modal-backdrop" onClick={() => setInspectingProject(null)}>
          <div
            className="minimal-modal-dialog"
            style={{ maxWidth: '720px', width: '95%' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="minimal-modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {inspectingProject.category || 'Portfolio Project'}
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', color: '#0f172a' }}>
                  {inspectingProject.title}
                </h3>
              </div>
              <button className="minimal-close-btn" onClick={() => setInspectingProject(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="minimal-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '20px' }}>
              {/* Author Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="soc-avatar">
                    {inspectingProject.studentAvatar ? (
                      <img src={inspectingProject.studentAvatar} alt={inspectingProject.studentName} />
                    ) : (
                      (inspectingProject.studentName || 'S').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{inspectingProject.studentName}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>
                      {inspectingProject.studentCourse} • {inspectingProject.studentSemester || 'Semester V'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {inspectingProject.demoUrl && (
                    <a
                      href={inspectingProject.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="minimal-btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 10px', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> Live Demo ↗
                    </a>
                  )}
                  {inspectingProject.githubUrl && (
                    <a
                      href={inspectingProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="minimal-btn-secondary"
                      style={{ fontSize: '12px', padding: '5px 10px', textDecoration: 'none' }}
                    >
                      <GithubIcon size={12} /> GitHub ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Cover Image Carousel or Single Image */}
              {Array.isArray(inspectingProject.images) && inspectingProject.images.length > 0 && (
                <div style={{ marginBottom: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a' }}>
                  <img
                    src={inspectingProject.images[0]}
                    alt={inspectingProject.title}
                    style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
                  />
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Project Overview
                </h5>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#1e293b', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {inspectingProject.description || 'No description provided.'}
                </p>
              </div>

              {/* Tech Stack */}
              {Array.isArray(inspectingProject.tags) && inspectingProject.tags.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Technologies & Tools
                  </h5>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {inspectingProject.tags.map(t => (
                      <span key={t} style={{ background: '#f1f5f9', color: '#1e293b', fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '5px' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments & Moderation Section */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Comments & Peer Reviews ({projectComments.length})
                  </h5>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Admin Moderation Active</span>
                </div>

                {/* Add Official Admin Comment Form */}
                <form onSubmit={handleAddAdminComment} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Post official feedback or administrative note..."
                    value={adminCommentInput}
                    onChange={e => setAdminCommentInput(e.target.value)}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  <button
                    type="submit"
                    className="minimal-btn-primary"
                    disabled={submittingComment || !adminCommentInput.trim()}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Send size={12} />
                    <span>Post Note</span>
                  </button>
                </form>

                {/* Comments List with Admin Delete buttons */}
                {loadingComments ? (
                  <p style={{ fontSize: '12.5px', color: '#64748b' }}>Loading comments...</p>
                ) : projectComments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {projectComments.map(c => (
                      <div
                        key={c.id}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{c.studentName || 'Student'}</strong>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {formatRelativeTime(c.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                            {c.content}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="minimal-btn-action delete"
                          onClick={() => handleDeleteComment(c.id)}
                          title="Delete inappropriate comment"
                          style={{ padding: '3px 6px', fontSize: '11px' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '12.5px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                    No comments have been posted on this project yet.
                  </p>
                )}
              </div>
            </div>

            <div className="minimal-modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="minimal-btn-danger"
                onClick={() => {
                  setDeleteTarget(inspectingProject);
                }}
                style={{ fontSize: '12.5px', padding: '6px 14px' }}
              >
                <Trash2 size={13} />
                <span>Delete Project</span>
              </button>

              <button
                type="button"
                className="minimal-btn-secondary"
                onClick={() => setInspectingProject(null)}
                style={{ fontSize: '12.5px', padding: '6px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Student Project</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#1e293b' }}>
                Are you sure you want to permanently delete <strong>"{deleteTarget.title}"</strong> by <strong>{deleteTarget.studentName}</strong>?
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#dc2626' }}>
                ⚠️ This action cannot be undone. All screenshots, tags, and peer comments will be deleted.
              </p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDeleteProject}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
