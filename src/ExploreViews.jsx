import React, { useState, useMemo } from 'react';
import './styles.css';
import {
  Briefcase,
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  Clock,
  Search,
  Trophy,
  Check,
  X,
  BookOpen,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

// ========================================================
// SHARED EXPLORE SUBNAV (Removed as per user request)
// ========================================================
export function ExploreSubNav() {
  return null;
}

// ========================================================
// 1. OPPORTUNITIES (Minimal Student View)
// ========================================================
export const OPPORTUNITY_LIST = [
  {
    id: 'opp-1',
    title: 'Smart India Hackathon (SIH 2026)',
    organizer: 'Ministry of Education & AICTE',
    category: 'hackathon',
    prize: '₹1,00,000 / Team',
    deadline: '18 Nov 2026',
    mode: 'Campus (Hybrid)',
    team: '1–6 Members',
    summary: 'Nationwide hackathon addressing technology challenges from ministries and leading industries.'
  },
  {
    id: 'opp-2',
    title: 'Podar Innovation Sandbox 2026',
    organizer: 'Podar Incubation Cell',
    category: 'competition',
    prize: '₹2,50,000 Seed Grant',
    deadline: '10 Dec 2026',
    mode: 'Podar Auditorium',
    team: '1–4 Members',
    summary: 'Pitch practical student venture ideas to institutional investors and industry founders.'
  },
  {
    id: 'opp-3',
    title: 'Google Solution Challenge 2026',
    organizer: 'Google Developer Clubs',
    category: 'hackathon',
    prize: '$4,000 + Google Mentorship',
    deadline: '25 Jan 2027',
    mode: 'Online (Global)',
    team: '1–4 Members',
    summary: 'Engineer technical software solutions addressing UN Sustainable Development Goals.'
  },
  {
    id: 'opp-4',
    title: 'Open Source Engineering Fellowship',
    organizer: 'Open Tech India',
    category: 'fellowship',
    prize: '₹35,000 / month',
    deadline: '20 Nov 2026',
    mode: 'Remote',
    team: 'Individual',
    summary: '6-month mentored engineering fellowship contributing to high-impact production open source.'
  }
];

export function OpportunitiesView({ student, state, notify, navigate }) {
  const currentList = (state?.opportunities && state.opportunities.length > 0) ? state.opportunities : OPPORTUNITY_LIST;
  const [search, setSearch] = useState('');
  const [appliedIds, setAppliedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('podar-opps-applied') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedOpp, setSelectedOpp] = useState(null);

  const filtered = useMemo(() => {
    return currentList.filter(item => {
      return !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.organizer.toLowerCase().includes(search.toLowerCase());
    });
  }, [currentList, search]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    const next = [...new Set([...appliedIds, selectedOpp.id])];
    setAppliedIds(next);
    localStorage.setItem('podar-opps-applied', JSON.stringify(next));
    notify?.(`Registered for ${selectedOpp.title}!`);
    setSelectedOpp(null);
  };

  return (
    <div className="minimal-explore-container">
      <div className="minimal-explore-header">
        <div>
          <h2 className="minimal-explore-title">Opportunities</h2>
          <p className="minimal-explore-subtitle">Hackathons, competitions and external fellowships.</p>
        </div>
        <div className="minimal-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>

      <div className="minimal-cards-grid">
        {filtered.map(item => {
          const isApplied = appliedIds.includes(item.id);

          return (
            <div key={item.id} className="minimal-explore-card">
              <div className="minimal-explore-card-top">
                <span className="minimal-tag-pill">{item.organizer}</span>
                <span className="minimal-highlight-text">{item.prize}</span>
              </div>

              <h3 className="minimal-card-heading">{item.title}</h3>
              <p className="minimal-card-desc">{item.summary}</p>

              <div className="minimal-meta-line">
                <span>Closes {item.deadline}</span>
                <span>•</span>
                <span>{item.mode}</span>
                <span>•</span>
                <span>{item.team}</span>
              </div>

              <div className="minimal-card-bottom">
                {isApplied ? (
                  <button className="minimal-applied-btn" disabled>
                    <Check size={14} /> Applied
                  </button>
                ) : (
                  <button
                    className="minimal-primary-btn"
                    onClick={() => setSelectedOpp(item)}
                  >
                    <span>Apply Now</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOpp && (
        <div className="minimal-modal-backdrop" onClick={() => setSelectedOpp(null)}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{selectedOpp.title}</h3>
              <button className="minimal-close-btn" onClick={() => setSelectedOpp(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleApply}>
              <div className="minimal-modal-body">
                <p style={{ color: '#4b5563', marginBottom: '14px' }}>{selectedOpp.summary}</p>
                <div className="minimal-dialog-meta">
                  <div><strong>Organizer:</strong> {selectedOpp.organizer}</div>
                  <div><strong>Prize / Grant:</strong> {selectedOpp.prize}</div>
                  <div><strong>Deadline:</strong> {selectedOpp.deadline}</div>
                  <div><strong>Format:</strong> {selectedOpp.mode}</div>
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={() => setSelectedOpp(null)}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 2. INTERNSHIPS (Minimal Student View)
// ========================================================
export const INTERNSHIP_LIST = [
  {
    id: 'int-1',
    company: 'Razorpay Software',
    role: 'Frontend Engineering Intern',
    stipend: '₹25,000 / mo',
    duration: '3 Months',
    location: 'Remote',
    skills: ['React', 'TypeScript', 'Tailwind'],
    about: 'Build user-facing payment checkout interfaces and responsive dashboards.'
  },
  {
    id: 'int-2',
    company: 'DataWave Analytics',
    role: 'Data Science & BI Intern',
    stipend: '₹22,000 / mo',
    duration: '6 Months',
    location: 'Mumbai (BKC)',
    skills: ['Python', 'SQL', 'Pandas'],
    about: 'Process academic datasets, construct regression models and visual executive dashboards.'
  },
  {
    id: 'int-3',
    company: 'CloudScale Infrastructure',
    role: 'DevOps & Systems Intern',
    stipend: '₹30,000 / mo',
    duration: '4 Months',
    location: 'Pune',
    skills: ['Linux', 'Docker', 'AWS'],
    about: 'Maintain Kubernetes clusters and automated CI/CD deployment pipelines.'
  },
  {
    id: 'int-4',
    company: 'Barclays Global Service Centre',
    role: 'Technology Operations Intern',
    stipend: '₹35,000 / mo',
    duration: '6 Months',
    location: 'Mumbai',
    skills: ['Java', 'SQL', 'QA Automation'],
    about: 'Structured banking software internship covering algorithmic reconciliation test suites.'
  }
];

export function InternshipsView({ student, state, notify, navigate }) {
  const currentList = (state?.internships && state.internships.length > 0) ? state.internships : INTERNSHIP_LIST;
  const [search, setSearch] = useState('');
  const [appliedIds, setAppliedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('podar-interns-applied') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedIntern, setSelectedIntern] = useState(null);

  const filtered = useMemo(() => {
    return currentList.filter(item => {
      return !search.trim() ||
        item.company.toLowerCase().includes(search.toLowerCase()) ||
        item.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [currentList, search]);

  const handleApply = (e) => {
    e.preventDefault();
    if (!selectedIntern) return;
    const next = [...new Set([...appliedIds, selectedIntern.id])];
    setAppliedIds(next);
    localStorage.setItem('podar-interns-applied', JSON.stringify(next));
    notify?.(`Application submitted to ${selectedIntern.company}!`);
    setSelectedIntern(null);
  };

  return (
    <div className="minimal-explore-container">
      <div className="minimal-explore-header">
        <div>
          <h2 className="minimal-explore-title">Internships</h2>
          <p className="minimal-explore-subtitle">Verified corporate internships with official stipends.</p>
        </div>
        <div className="minimal-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search internships..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>

      <div className="minimal-cards-grid">
        {filtered.map(item => {
          const isApplied = appliedIds.includes(item.id);

          return (
            <div key={item.id} className="minimal-explore-card">
              <div className="minimal-explore-card-top">
                <span className="minimal-tag-pill">{item.company}</span>
                <span className="minimal-highlight-text">{item.stipend}</span>
              </div>

              <h3 className="minimal-card-heading">{item.role}</h3>
              <p className="minimal-card-desc">{item.about}</p>

              <div className="minimal-meta-line">
                <span>{item.duration}</span>
                <span>•</span>
                <span>{item.location}</span>
              </div>

              <div className="minimal-card-bottom">
                {isApplied ? (
                  <button className="minimal-applied-btn" disabled>
                    <Check size={14} /> Applied
                  </button>
                ) : (
                  <button
                    className="minimal-primary-btn"
                    onClick={() => setSelectedIntern(item)}
                  >
                    <span>Apply</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIntern && (
        <div className="minimal-modal-backdrop" onClick={() => setSelectedIntern(null)}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{selectedIntern.role}</h3>
              <button className="minimal-close-btn" onClick={() => setSelectedIntern(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleApply}>
              <div className="minimal-modal-body">
                <p style={{ color: '#4b5563', marginBottom: '14px' }}>{selectedIntern.about}</p>
                <div className="minimal-dialog-meta">
                  <div><strong>Company:</strong> {selectedIntern.company}</div>
                  <div><strong>Stipend:</strong> {selectedIntern.stipend}</div>
                  <div><strong>Duration:</strong> {selectedIntern.duration}</div>
                  <div><strong>Location:</strong> {selectedIntern.location}</div>
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={() => setSelectedIntern(null)}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 3. PLACEMENTS (Minimal Student View)
// ========================================================
export const PLACEMENT_DRIVES = [
  {
    id: 'dr-1',
    company: 'Tata Consultancy Services',
    role: 'Digital & Ninja Developer',
    package: '₹4.50 – ₹9.00 LPA',
    date: '15 Nov 2026',
    eligibility: 'BCA / BSc IT / MCA (Min 60% with no backlogs)',
    location: 'Podar Campus'
  },
  {
    id: 'dr-2',
    company: 'Infosys Limited',
    role: 'Specialist Programmer & Systems Engineer',
    package: '₹4.00 – ₹9.50 LPA',
    date: '22 Nov 2026',
    eligibility: 'Final Year Students (Min 65% aggregate)',
    location: 'Virtual + Campus'
  },
  {
    id: 'dr-3',
    company: 'Deloitte USI',
    role: 'Technology Advisory Analyst',
    package: '₹7.60 LPA',
    date: '28 Nov 2026',
    eligibility: 'Min 65% aggregate throughout graduation',
    location: 'Podar Auditorium'
  },
  {
    id: 'dr-4',
    company: 'Barclays Global Service Centre',
    role: 'Technology Associate',
    package: '₹11.50 – ₹14.00 LPA',
    date: '12 Dec 2026',
    eligibility: 'Min 70% or 7.5 CGPA; strong OOP skills',
    location: 'Virtual + On-Site'
  }
];

export function PlacementsView({ student, state, notify, navigate }) {
  const currentList = (state?.placements && state.placements.length > 0) ? state.placements : PLACEMENT_DRIVES;
  const [search, setSearch] = useState('');
  const [registeredIds, setRegisteredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('podar-real-drives-registered') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedDrive, setSelectedDrive] = useState(null);

  const filtered = useMemo(() => {
    return currentList.filter(d => {
      return !search.trim() ||
        d.company.toLowerCase().includes(search.toLowerCase()) ||
        d.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [currentList, search]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!selectedDrive) return;
    const next = [...new Set([...registeredIds, selectedDrive.id])];
    setRegisteredIds(next);
    localStorage.setItem('podar-real-drives-registered', JSON.stringify(next));
    notify?.(`Registered for ${selectedDrive.company} drive!`);
    setSelectedDrive(null);
  };

  return (
    <div className="minimal-explore-container">
      <div className="minimal-explore-header">
        <div>
          <h2 className="minimal-explore-title">Placements</h2>
          <p className="minimal-explore-subtitle">Campus recruitment drives and company visits.</p>
        </div>
        <div className="minimal-search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search drives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
        </div>
      </div>

      <div className="minimal-drives-list">
        {filtered.map(drive => {
          const isRegistered = registeredIds.includes(drive.id);

          return (
            <div key={drive.id} className="minimal-drive-row">
              <div className="minimal-drive-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="minimal-drive-company">{drive.company}</h3>
                  <span className="minimal-package-badge">{drive.package}</span>
                </div>
                <div className="minimal-drive-role">{drive.role}</div>
                <div className="minimal-meta-line" style={{ marginTop: '4px' }}>
                  <span>Date: {drive.date}</span>
                  <span>•</span>
                  <span>{drive.location}</span>
                  <span>•</span>
                  <span style={{ color: '#4b5563' }}>{drive.eligibility}</span>
                </div>
              </div>

              <div className="minimal-drive-action">
                {isRegistered ? (
                  <button className="minimal-applied-btn" disabled>
                    <Check size={14} /> Registered
                  </button>
                ) : (
                  <button
                    className="minimal-primary-btn"
                    onClick={() => setSelectedDrive(drive)}
                  >
                    Register
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDrive && (
        <div className="minimal-modal-backdrop" onClick={() => setSelectedDrive(null)}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{selectedDrive.company}</h3>
              <button className="minimal-close-btn" onClick={() => setSelectedDrive(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="minimal-modal-body">
                <div className="minimal-dialog-meta">
                  <div><strong>Position:</strong> {selectedDrive.role}</div>
                  <div><strong>Package:</strong> {selectedDrive.package}</div>
                  <div><strong>Drive Date:</strong> {selectedDrive.date}</div>
                  <div><strong>Venue:</strong> {selectedDrive.location}</div>
                  <div><strong>Eligibility:</strong> {selectedDrive.eligibility}</div>
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={() => setSelectedDrive(null)}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
