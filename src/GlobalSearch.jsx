import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Briefcase,
  Sparkles,
  Target,
  BookOpen,
  UserRound,
  ChevronRight,
  GraduationCap,
  Building2,
  FileText,
  BarChart3,
  Trophy,
  ShieldCheck,
  MessageSquareText,
  LayoutDashboard,
  Users,
  Code,
  Cpu,
  Globe,
  Award,
  Compass,
  Layers,
  Building,
  CornerDownLeft,
  ArrowRight
} from 'lucide-react';

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
            <mark key={i} className="search-highlight">
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
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus, Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        if (query.trim()) {
          setIsOpen(true);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();

  // 1. Pages, Tools & Workspaces
  const allPages = [
    { id: 'dashboard', title: 'Dashboard', desc: 'Overview, stats and readiness score', category: 'Overview', icon: LayoutDashboard },
    { id: 'coach', title: 'AI Career Coach', desc: 'Ask career questions, interview & resume prep', category: 'AI Tools', icon: Sparkles },
    { id: 'roadmap', title: 'Learning Roadmap', desc: 'Step-by-step career pathway and milestones', category: 'Roadmap', icon: Compass },
    { id: 'score', title: 'P-CARE Employability Score', desc: 'Academic & career readiness breakdown (82%)', category: 'Assessments', icon: BarChart3 },
    { id: 'resume', title: 'Resume Builder', desc: 'Create and AI-optimize your ATS resume', category: 'Career Assets', icon: FileText },
    { id: 'opportunities', title: 'Opportunities Marketplace', desc: 'Jobs, internships, hackathons and challenges', category: 'Opportunities', icon: Briefcase },
    { id: 'internships', title: 'Internship Tracker', desc: 'Track ongoing applications & interview rounds', category: 'Opportunities', icon: GraduationCap },
    { id: 'placements', title: 'Placement Centre', desc: 'Campus placements and company offers', category: 'Opportunities', icon: Building2 },
    { id: 'projects', title: 'Projects Portfolio', desc: 'Showcase academic, personal and live client projects', category: 'Portfolio', icon: Target },
    { id: 'certificates', title: 'Certificates & Credentials', desc: 'Verified certifications, courses and badges', category: 'Portfolio', icon: Trophy },
    { id: 'passport', title: 'Digital Career Passport', desc: 'Verified digital QR career identity', category: 'Portfolio', icon: Award },
    { id: 'profile', title: 'Profile & Settings', desc: 'Personal details, career goals and contacts', category: 'Account', icon: UserRound },
  ];

  if (session?.role === 'admin') {
    allPages.unshift(
      { id: 'students', title: 'Student Directory', desc: 'Manage enrolled student accounts & college roster', category: 'Admin Tools', icon: Users },
      { id: 'courses', title: 'Course Catalog', desc: 'Publish and manage college courses', category: 'Admin Tools', icon: BookOpen },
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
    { title: 'Software engineering internship', company: 'Global Tech Corp', tags: 'Remote • 3 months • Full Stack', type: 'Internship', page: 'opportunities', icon: Briefcase },
  ];

  // 3. Top Companies & Employers
  const allCompanies = [
    { name: 'Google / Alphabet', role: 'Software Engineering Apprentice & Cloud Intern', location: 'Bengaluru / Hyderabad', page: 'opportunities', icon: Building },
    { name: 'Microsoft', role: 'SWE Internship & Azure Cloud Solutions', location: 'Noida / Hyderabad / Remote', page: 'opportunities', icon: Building },
    { name: 'Amazon (AWS)', role: 'Cloud Support Associate & SDE Intern', location: 'Bengaluru / Pune', page: 'opportunities', icon: Building },
    { name: 'Tata Consultancy Services (TCS)', role: 'TCS Digital & Ninja Campus Hiring', location: 'Mumbai / Pune / Pan-India', page: 'placements', icon: Building2 },
    { name: 'Infosys', role: 'Springboard Tech Fellowship & Systems Engineer', location: 'Mysore / Bengaluru', page: 'placements', icon: Building2 },
    { name: 'Wipro', role: 'Elite Turbo National Talent Hunt', location: 'Bengaluru / Hyderabad', page: 'placements', icon: Building2 },
    { name: 'Deloitte', role: 'Technology & Risk Advisory Analyst', location: 'Mumbai / Gurugram', page: 'placements', icon: Building2 },
    { name: 'Tech Innovation Labs', role: 'Full Stack & Mobile App Developer', location: 'Remote / Mumbai', page: 'opportunities', icon: Building },
  ];

  // 4. Skills, Technologies & Interview Prep
  const allSkills = [
    { title: 'Data Structures & Algorithms (DSA)', desc: 'Arrays, Trees, Graphs, DP, LeetCode, Java/C++', page: 'roadmap', icon: Code, badge: 'High Priority' },
    { title: 'React.js & Modern Frontend', desc: 'Hooks, State Management, Next.js, Tailwind CSS', page: 'roadmap', icon: Globe, badge: 'Tech Skill' },
    { title: 'Node.js & Backend Architecture', desc: 'Express.js, RESTful APIs, JWT Auth, Microservices', page: 'roadmap', icon: Cpu, badge: 'Tech Skill' },
    { title: 'Python Programming & Data Analysis', desc: 'NumPy, Pandas, Matplotlib, Automation Scripting', page: 'coach', icon: Sparkles, badge: 'In Demand' },
    { title: 'SQL & Database Design', desc: 'PostgreSQL, MySQL, SQLite, MongoDB, Indexing', page: 'roadmap', icon: Layers, badge: 'Tech Skill' },
    { title: 'Cloud Computing (AWS & Azure)', desc: 'EC2, S3, Lambda, Docker, Kubernetes, Cloud Ops', page: 'roadmap', icon: Globe, badge: 'Cloud' },
    { title: 'Artificial Intelligence & Machine Learning', desc: 'Scikit-Learn, PyTorch, Neural Networks, Computer Vision', page: 'coach', icon: Sparkles, badge: 'AI & ML' },
    { title: 'Generative AI & Prompt Engineering', desc: 'LLMs, OpenAI APIs, LangChain, RAG Systems', page: 'coach', icon: Sparkles, badge: 'Trending' },
    { title: 'Cybersecurity & Network Defense', desc: 'OWASP Top 10, VAPT, Penetration Testing, Ethical Hacking', page: 'roadmap', icon: ShieldCheck, badge: 'Security' },
    { title: 'Git, GitHub & Version Control', desc: 'Git Workflow, Branching, Pull Requests, CI/CD Actions', page: 'roadmap', icon: Code, badge: 'Core Tool' },
    { title: 'Interview Preparation & HR Rounds', desc: 'Mock interviews, Behavioral STAR method, Salary negotiation', page: 'coach', icon: MessageSquareText, badge: 'Soft Skill' },
    { title: 'Campus Aptitude & Logical Reasoning', desc: 'Quantitative Aptitude, Verbal Ability, Coding rounds', page: 'score', icon: BarChart3, badge: 'Placement' },
  ];

  // 5. Courses & Learning Tracks
  const defaultCourses = [
    { id: 'c1', title: 'Career Readiness Foundations', desc: 'Core career curriculum, goal setting & professional ethics', page: 'courses', category: 'Foundation', icon: BookOpen },
    { id: 'c2', title: 'Google IT Automation with Python', desc: 'Professional Certificate: Automating real-world tasks with Python', page: 'courses', category: 'Professional Cert', icon: BookOpen },
    { id: 'c3', title: 'Meta Frontend Developer Specialization', desc: 'HTML, CSS, JavaScript, React, UI design & version control', page: 'courses', category: 'Specialization', icon: BookOpen },
    { id: 'c4', title: 'AWS Certified Cloud Practitioner Track', desc: 'Comprehensive guide to AWS cloud architecture and certifications', page: 'courses', category: 'Cloud Track', icon: BookOpen },
    { id: 'c5', title: 'Data Structures Masterclass in Java', desc: 'Master coding patterns for top tech interviews', page: 'courses', category: 'Coding Track', icon: BookOpen },
  ];

  // Combine with dynamic courses from state
  const dynamicCourses = (state?.courses || []).map(c => ({
    id: c.id,
    title: c.title,
    desc: c.description || 'Course shared by your college.',
    page: 'courses',
    category: 'College Course',
    icon: BookOpen
  }));

  const allCourses = [...defaultCourses, ...dynamicCourses.filter(dc => !defaultCourses.some(df => df.title.toLowerCase() === dc.title.toLowerCase()))];

  // 6. Quick Career Actions
  const careerActions = [
    { title: 'Ask AI Career Coach a Question', desc: 'Get instant personalized guidance for your career goal', page: 'coach', icon: Sparkles },
    { title: 'Run AI Resume Optimization', desc: 'Check ATS score, keywords and improvement tips', page: 'resume', icon: FileText },
    { title: 'Check P-CARE Score Breakdown', desc: 'View technical skills, projects and certifications scores', page: 'score', icon: BarChart3 },
    { title: 'Explore Open Placement Drives', desc: 'View upcoming company visits and campus recruitment', page: 'placements', icon: Building2 },
    { title: 'View Digital Career Passport', desc: 'Access your QR-ready verified academic identity', page: 'passport', icon: Award },
  ];

  // 7. Dynamic Students (if admin)
  const students = session?.role === 'admin' ? (state?.students || []).map(s => ({
    id: s.id,
    title: s.name,
    desc: `${s.course} • Sem ${s.semester} • ${s.phone}`,
    page: `admin-student:${s.id}`,
    category: 'Student',
    icon: UserRound
  })) : [];

  // Filter items based on query & active tab - strictly active when query is non-empty
  const matchedPages = q && (activeTab === 'all' || activeTab === 'tools')
    ? allPages.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    : [];

  const matchedOpps = q && (activeTab === 'all' || activeTab === 'opportunities')
    ? allOpportunities.filter(o => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.tags.toLowerCase().includes(q) || o.type.toLowerCase().includes(q))
    : [];

  const matchedCompanies = q && (activeTab === 'all' || activeTab === 'companies')
    ? allCompanies.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
    : [];

  const matchedSkills = q && (activeTab === 'all' || activeTab === 'skills')
    ? allSkills.filter(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || (s.badge && s.badge.toLowerCase().includes(q)))
    : [];

  const matchedCourses = q && (activeTab === 'all' || activeTab === 'courses')
    ? allCourses.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
    : [];

  const matchedActions = q && (activeTab === 'all' || activeTab === 'tools')
    ? careerActions.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))
    : [];

  const matchedStudents = q && (activeTab === 'all' || activeTab === 'students')
    ? students.filter(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
    : [];

  // Organized categorized groups for professional sectioning
  const groups = [
    { id: 'pages', title: 'Pages & Portals', items: matchedPages, type: 'page' },
    { id: 'opps', title: 'Opportunities & Contests', items: matchedOpps, type: 'opp' },
    { id: 'companies', title: 'Companies & Partners', items: matchedCompanies, type: 'company' },
    { id: 'skills', title: 'Skills & Tech Roadmap', items: matchedSkills, type: 'skill' },
    { id: 'courses', title: 'Courses & Certifications', items: matchedCourses, type: 'course' },
    { id: 'actions', title: 'Career Actions & Tools', items: matchedActions, type: 'action' },
    { id: 'students', title: 'Student Directory', items: matchedStudents, type: 'student' }
  ].filter(g => g.items.length > 0);

  // Flatten for keyboard navigation
  const flatResults = groups.flatMap(g => g.items.map(item => ({ ...item, groupType: g.type })));
  const totalCount = flatResults.length;

  // Auto-scroll selected item into view smoothly
  useEffect(() => {
    if (isOpen && totalCount > 0) {
      const selectedEl = containerRef.current?.querySelector('.search-item.is-selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen, totalCount]);

  const handleSelect = (page, itemTitle) => {
    if (page && navigate) {
      navigate(page);
    }
    setIsOpen(false);
    setQuery('');
    if (notify && itemTitle) {
      notify(`Opened ${itemTitle}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || totalCount === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatResults[selectedIndex] || flatResults[0];
      if (current) {
        handleSelect(current.page || current.id, current.title || current.name);
      }
    }
  };

  // Tab definitions with dynamic match counters
  const tabs = [
    { id: 'all', label: 'All', count: totalCount },
    {
      id: 'opportunities',
      label: 'Opportunities',
      count: allOpportunities.filter(o => o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.tags.toLowerCase().includes(q)).length
    },
    {
      id: 'companies',
      label: 'Companies',
      count: allCompanies.filter(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)).length
    },
    {
      id: 'skills',
      label: 'Skills',
      count: allSkills.filter(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)).length
    },
    {
      id: 'courses',
      label: 'Courses',
      count: allCourses.filter(c => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)).length
    },
    {
      id: 'tools',
      label: 'Tools',
      count: allPages.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).length +
             careerActions.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)).length
    },
  ];

  if (session?.role === 'admin') {
    tabs.push({
      id: 'students',
      label: 'Students',
      count: students.filter(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)).length
    });
  }

  const showDropdown = isOpen && Boolean(q);
  let runningIndex = 0;

  return (
    <div className="global-search-container" ref={containerRef}>
      <div 
        className={`global-search-bar ${showDropdown ? 'active' : ''}`}
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setIsOpen(Boolean(val.trim()));
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search opportunities, skills, companies, tools..."
          aria-label="Search opportunities, skills, companies, tools"
        />
        {query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            title="Clear search (Esc)"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="search-shortcut-badge" title="Press Ctrl+K or Cmd+K to search">
            <span className="search-kbd">Ctrl</span>
            <span className="search-kbd">K</span>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="search-dropdown-menu">
          {/* Quick Filter Category Tabs */}
          <div className="search-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`search-tab-pill ${activeTab === tab.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(tab.id);
                  setSelectedIndex(0);
                }}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && <span className="search-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Results Scroll Area */}
          <div className="search-results-scroll">
            {totalCount === 0 ? (
              <div className="search-empty-state">
                <div className="search-empty-icon-wrap">
                  <Search size={22} />
                </div>
                <strong>No matches found for "{query.trim()}"</strong>
                <p>Try searching by role, skill, company or system feature</p>
                <div className="search-quick-tags">
                  {['React', 'Internship', 'DSA', 'Google', 'Python', 'AWS', 'Resume'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="search-quick-chip"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuery(tag);
                        setIsOpen(true);
                        setSelectedIndex(0);
                        inputRef.current?.focus();
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="search-group">
                  <div className="search-group-header">
                    <span className="search-group-title">{group.title}</span>
                    <span className="search-group-count">{group.items.length}</span>
                  </div>

                  {group.items.map((item, idx) => {
                    const currentFlatIdx = runningIndex++;
                    const isSelected = currentFlatIdx === selectedIndex;
                    const IconComponent = item.icon || Search;
                    const itemTitle = item.title || item.name;
                    const itemPage = item.page || item.id;
                    const itemDesc = item.desc || item.tags || (item.role ? `${item.role} • ${item.location}` : '');
                    const badgeText = item.badge || item.type || item.category;

                    return (
                      <div
                        key={`${group.id}-${idx}`}
                        className={`search-item ${isSelected ? 'is-selected' : ''}`}
                        onMouseEnter={() => setSelectedIndex(currentFlatIdx)}
                        onClick={() => handleSelect(itemPage, itemTitle)}
                      >
                        <div className={`search-item-icon ${group.type}-icon`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="search-item-info">
                          <div className="search-item-title-row">
                            <strong className="search-item-title">
                              <HighlightMatch text={itemTitle} query={q} />
                            </strong>
                            {badgeText && (
                              <span className={`search-badge ${group.type}-badge`}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                          {itemDesc && (
                            <span className="search-item-desc">
                              <HighlightMatch text={itemDesc} query={q} />
                            </span>
                          )}
                        </div>

                        {isSelected ? (
                          <div className="search-item-enter-hint">
                            <span>Open</span>
                            <CornerDownLeft size={12} />
                          </div>
                        ) : (
                          <ChevronRight size={14} className="search-item-arrow" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Linear-style Professional Footer */}
          <div className="search-footer">
            <div className="search-footer-shortcuts">
              <span className="search-shortcut-item">
                <kbd className="search-mini-kbd">↑</kbd>
                <kbd className="search-mini-kbd">↓</kbd>
                <span className="search-shortcut-label">Navigate</span>
              </span>
              <span className="search-shortcut-item">
                <kbd className="search-mini-kbd">↵</kbd>
                <span className="search-shortcut-label">Select</span>
              </span>
              <span className="search-shortcut-item">
                <kbd className="search-mini-kbd">esc</kbd>
                <span className="search-shortcut-label">Close</span>
              </span>
            </div>
            <div className="search-footer-count">
              <span>{totalCount} {totalCount === 1 ? 'result' : 'results'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
