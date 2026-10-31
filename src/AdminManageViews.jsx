import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { DEFAULT_ADMIN_AVATAR, DEFAULT_STUDENT_AVATAR } from './defaultAvatar.js';
import { INITIAL_CERTIFICATES, generateCertificateSVG } from './defaultCertificates.js';
import './styles.css';
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  Lock,
  Search,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  ExternalLink,
  BookOpen,
  Trophy,
  Briefcase,
  Building2,
  Users,
  Calendar,
  Clock,
  Award,
  Download,
  Eye,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Filter,
  Upload,
  FileSpreadsheet,
  Phone,
  Mail,
  GraduationCap,
  ArrowRight,
  User
} from 'lucide-react';

// Helper: Format date for admin views
function formatAdminDate(val) {
  if (!val) return '31 Dec 2026';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {}
  return String(val);
}

// =========================================================================
// HELPER: Check if account is Root/Main Administrator
// =========================================================================
export function isMainAdminAccount(account) {
  if (!account) return false;
  const email = (account.email || '').trim().toLowerCase();
  const id = (account.id || '').trim().toLowerCase();
  const phone = String(account.phone || '').replace(/\D/g, '');
  return (
    account.isMain === true ||
    email === 'jatp22316@gmail.com' ||
    email === 'admin@podar.edu' ||
    id === 'admin-jatp-main' ||
    id === 'admin-podar-root' ||
    id === 'admin-root' ||
    phone === '9000000000' ||
    phone === '9999988888'
  );
}

// =========================================================================
// MODULE PERMISSIONS CONFIGURATION
// =========================================================================
export const PERMISSION_MODULES = [
  { key: 'manage_students', label: 'Students' },
  { key: 'manage_courses', label: 'Courses' },
  { key: 'manage_certificates', label: 'Certificates' },
  { key: 'manage_opportunities', label: 'Opportunities' },
  { key: 'manage_internships', label: 'Internships' },
  { key: 'manage_placements', label: 'Placements' },
  { key: 'manage_admins', label: 'Admins' }
];

if (typeof window !== 'undefined') {
  window.isMainAdminAccount = isMainAdminAccount;
  window.PERMISSION_MODULES = PERMISSION_MODULES;
}
if (typeof globalThis !== 'undefined') {
  globalThis.isMainAdminAccount = isMainAdminAccount;
  globalThis.PERMISSION_MODULES = PERMISSION_MODULES;
}

// ========================================================
// 1. ADMIN MANAGE COURSES (Minimal Design with Edit & Delete)
// ========================================================
export function AdminCoursesView({ state, setState, notify, navigate }) {
  const courses = state?.courses || [];
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activeCourse, setActiveCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [targetCourse, setTargetCourse] = useState('All');
  const [validTill, setValidTill] = useState('2026-12-31');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setActiveCourse(null);
    setTitle('');
    setProvider('');
    setUrl('');
    setTargetCourse('All');
    setValidTill('2026-12-31');
    setDescription('');
    setModalMode('add');
  };

  const openEditModal = (course) => {
    setActiveCourse(course);
    setTitle(course.title || '');
    setProvider(course.provider || '');
    setUrl(course.url || '');
    setTargetCourse(course.targetCourse || 'All');

    let vt = course.validTill || course.deadline || course.valid_till || '2026-12-31';
    try {
      const d = new Date(vt);
      if (!isNaN(d.getTime())) {
        vt = d.toISOString().split('T')[0];
      }
    } catch (e) {}
    setValidTill(vt);

    setDescription(course.description || '');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveCourse(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      notify?.('Please provide course title and learning link.');
      return;
    }

    if (modalMode === 'add') {
      const newCourse = {
        id: `course-${Date.now()}`,
        title: title.trim(),
        provider: provider.trim() || 'Curated Academic Partner',
        url: url.trim(),
        targetCourse: targetCourse || 'All',
        validTill: validTill || '2026-12-31',
        deadline: validTill || '2026-12-31',
        description: description.trim() || 'Curated career preparation course.',
        createdAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        courses: [newCourse, ...(prev.courses || [])]
      }));

      fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.title,
          issuer: newCourse.provider,
          link: newCourse.url,
          targetCourse: newCourse.targetCourse,
          deadline: newCourse.validTill,
          validTill: newCourse.validTill,
          description: newCourse.description
        })
      }).catch(() => {});

      notify?.(`Course "${newCourse.title}" added successfully!`);
    } else if (modalMode === 'edit' && activeCourse) {
      const updatedCourse = {
        ...activeCourse,
        title: title.trim(),
        provider: provider.trim() || 'Curated Academic Partner',
        url: url.trim(),
        targetCourse: targetCourse || 'All',
        validTill: validTill || activeCourse.validTill || '2026-12-31',
        deadline: validTill || activeCourse.deadline || activeCourse.validTill || '2026-12-31',
        description: description.trim() || activeCourse.description
      };

      setState(prev => ({
        ...prev,
        courses: (prev.courses || []).map(c => c.id === activeCourse.id ? updatedCourse : c)
      }));

      fetch(`/api/programs/${activeCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedCourse,
          issuer: updatedCourse.provider,
          link: updatedCourse.url,
          deadline: updatedCourse.validTill,
          validTill: updatedCourse.validTill
        })
      }).catch(() => {});

      notify?.(`Course "${updatedCourse.title}" updated successfully!`);
    }

    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, title: cTitle } = deleteTarget;

    setState(prev => ({
      ...prev,
      courses: (prev.courses || []).filter(c => c.id !== id)
    }));

    fetch(`/api/programs/${id}`, { method: 'DELETE' }).catch(() => {});
    notify?.(`Course "${cTitle}" deleted.`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return courses.filter(c => {
      return !search.trim() ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.provider && c.provider.toLowerCase().includes(search.toLowerCase()));
    });
  }, [courses, search]);

  return (
    <div className="minimal-admin-container">
      {/* Minimal Header */}
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Courses</h2>
          <p className="minimal-admin-subtitle">Publish and curate student courses.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="minimal-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
          <button onClick={openAddModal} className="minimal-admin-btn-primary">
            <Plus size={15} /> Add Course
          </button>
        </div>
      </div>

      {/* Minimal Items List */}
      <div className="minimal-items-list">
        {filtered.length > 0 ? (
          filtered.map(course => (
            <div key={course.id} className="minimal-item-row">
              <div className="minimal-item-info">
                <h4 className="minimal-item-title">{course.title}</h4>
                <div className="minimal-item-meta">
                  <span>{course.provider || 'Academic Partner'}</span>
                  <span>•</span>
                  <span>{course.targetCourse || 'All Programs'}</span>
                  <span>•</span>
                  <span className="minimal-item-validity-tag">
                    <Calendar size={12} />
                    Valid till: {formatAdminDate(course.validTill || course.deadline || course.valid_till || '2026-12-31')}
                  </span>
                  <span>•</span>
                  <a href={course.url} target="_blank" rel="noreferrer" className="minimal-link">
                    {course.url}
                  </a>
                </div>
              </div>

              {/* ONLY Edit and Delete Buttons */}
              <div className="minimal-item-actions">
                <button
                  onClick={() => openEditModal(course)}
                  className="minimal-btn-action edit"
                  title="Edit Course"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(course)}
                  className="minimal-btn-action delete"
                  title="Delete Course"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="minimal-empty-state">No courses found.</div>
        )}
      </div>

      {/* Modal: Add or Edit Course */}
      {modalMode && (
        <div className="minimal-modal-backdrop" onClick={closeModal}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{modalMode === 'add' ? 'Add Course' : 'Edit Course'}</h3>
              <button className="minimal-close-btn" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="minimal-modal-body">
                <div className="minimal-form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. React & TypeScript Masterclass"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Partner / Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. Coursera / IBM / IIT Bombay NPTEL"
                    value={provider}
                    onChange={e => setProvider(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Target Academic Program</label>
                  <select value={targetCourse} onChange={e => setTargetCourse(e.target.value)}>
                    <option value="All">All Programs</option>
                    <option value="BCA">BCA</option>
                    <option value="BSc IT">BSc IT</option>
                    <option value="MCA">MCA</option>
                    <option value="BBA">BBA</option>
                  </select>
                </div>
                <div className="minimal-form-group">
                  <label>Valid Till / Expiration Date *</label>
                  <input
                    type="date"
                    value={validTill}
                    onChange={e => setValidTill(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Course Learning URL *</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the course..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  {modalMode === 'add' ? 'Add Course' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Course</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?</p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
export function AdminOpportunitiesView({ state, setState, notify, navigate }) {
  const opps = state?.opportunities || [];
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activeOpp, setActiveOpp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('hackathon');
  const [prize, setPrize] = useState('');
  const [deadline, setDeadline] = useState('');
  const [mode, setMode] = useState('Campus (Hybrid)');
  const [team, setTeam] = useState('1–4 Members');
  const [summary, setSummary] = useState('');

  const openAddModal = () => {
    setActiveOpp(null);
    setTitle('');
    setOrganizer('');
    setCategory('hackathon');
    setPrize('');
    setDeadline('');
    setMode('Campus (Hybrid)');
    setTeam('1–4 Members');
    setSummary('');
    setModalMode('add');
  };

  const openEditModal = (opp) => {
    setActiveOpp(opp);
    setTitle(opp.title || '');
    setOrganizer(opp.organizer || '');
    setCategory(opp.category || 'hackathon');
    setPrize(opp.prize || '');
    setDeadline(opp.deadline || '');
    setMode(opp.mode || 'Campus (Hybrid)');
    setTeam(opp.team || '1–4 Members');
    setSummary(opp.summary || '');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveOpp(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() || !organizer.trim()) {
      notify?.('Please provide title and organizer.');
      return;
    }

    if (modalMode === 'add') {
      const newOpp = {
        id: `opp-${Date.now()}`,
        title: title.trim(),
        organizer: organizer.trim(),
        category,
        prize: prize.trim() || 'Merit Certificate & Awards',
        deadline: deadline.trim() || 'TBA',
        mode: mode.trim(),
        team: team.trim(),
        summary: summary.trim() || 'Competitive student opportunity.',
        createdAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        opportunities: [newOpp, ...(prev.opportunities || [])]
      }));
      notify?.(`Opportunity "${newOpp.title}" added!`);
    } else if (modalMode === 'edit' && activeOpp) {
      const updated = {
        ...activeOpp,
        title: title.trim(),
        organizer: organizer.trim(),
        category,
        prize: prize.trim() || activeOpp.prize,
        deadline: deadline.trim() || activeOpp.deadline,
        mode: mode.trim(),
        team: team.trim(),
        summary: summary.trim() || activeOpp.summary
      };

      setState(prev => ({
        ...prev,
        opportunities: (prev.opportunities || []).map(o => o.id === activeOpp.id ? updated : o)
      }));
      notify?.(`Opportunity "${updated.title}" updated!`);
    }

    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, title: oTitle } = deleteTarget;

    setState(prev => ({
      ...prev,
      opportunities: (prev.opportunities || []).filter(o => o.id !== id)
    }));
    notify?.(`Opportunity "${oTitle}" deleted.`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return opps.filter(o => {
      return !search.trim() ||
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        (o.organizer && o.organizer.toLowerCase().includes(search.toLowerCase()));
    });
  }, [opps, search]);

  return (
    <div className="minimal-admin-container">
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Opportunities</h2>
          <p className="minimal-admin-subtitle">Manage hackathons, competitions and fellowships.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <button onClick={openAddModal} className="minimal-admin-btn-primary">
            <Plus size={15} /> Add Opportunity
          </button>
        </div>
      </div>

      <div className="minimal-items-list">
        {filtered.length > 0 ? (
          filtered.map(opp => (
            <div key={opp.id} className="minimal-item-row">
              <div className="minimal-item-info">
                <h4 className="minimal-item-title">{opp.title}</h4>
                <div className="minimal-item-meta">
                  <span>{opp.organizer}</span>
                  <span>•</span>
                  <span>{opp.prize}</span>
                  <span>•</span>
                  <span>Closes {opp.deadline}</span>
                  <span>•</span>
                  <span>{opp.mode}</span>
                </div>
              </div>

              {/* ONLY Edit and Delete Buttons */}
              <div className="minimal-item-actions">
                <button
                  onClick={() => openEditModal(opp)}
                  className="minimal-btn-action edit"
                  title="Edit Opportunity"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(opp)}
                  className="minimal-btn-action delete"
                  title="Delete Opportunity"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="minimal-empty-state">No opportunities found.</div>
        )}
      </div>

      {modalMode && (
        <div className="minimal-modal-backdrop" onClick={closeModal}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{modalMode === 'add' ? 'Add Opportunity' : 'Edit Opportunity'}</h3>
              <button className="minimal-close-btn" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="minimal-modal-body">
                <div className="minimal-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart India Hackathon 2026"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Organizer *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ministry of Education & AICTE"
                    value={organizer}
                    onChange={e => setOrganizer(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="hackathon">Hackathon</option>
                    <option value="competition">Competition</option>
                    <option value="fellowship">Fellowship</option>
                  </select>
                </div>
                <div className="minimal-form-group">
                  <label>Prize / Grant</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,00,000 Cash Prize"
                    value={prize}
                    onChange={e => setPrize(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Dec 2026"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Venue / Mode</label>
                  <input
                    type="text"
                    placeholder="e.g. Campus (Hybrid)"
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Team Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 1–4 Members"
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description..."
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                  />
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  {modalMode === 'add' ? 'Add Opportunity' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Opportunity</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?</p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
export function AdminInternshipsView({ state, setState, notify, navigate }) {
  const interns = state?.internships || [];
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activeIntern, setActiveIntern] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [stipend, setStipend] = useState('');
  const [duration, setDuration] = useState('3 Months');
  const [location, setLocation] = useState('Remote');
  const [skills, setSkills] = useState('');
  const [about, setAbout] = useState('');

  const openAddModal = () => {
    setActiveIntern(null);
    setCompany('');
    setRole('');
    setStipend('');
    setDuration('3 Months');
    setLocation('Remote');
    setSkills('');
    setAbout('');
    setModalMode('add');
  };

  const openEditModal = (item) => {
    setActiveIntern(item);
    setCompany(item.company || '');
    setRole(item.role || '');
    setStipend(item.stipend || '');
    setDuration(item.duration || '3 Months');
    setLocation(item.location || 'Remote');
    setSkills(Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''));
    setAbout(item.about || '');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveIntern(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      notify?.('Please provide company name and job role.');
      return;
    }

    const parsedSkills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : ['Software Development'];

    if (modalMode === 'add') {
      const newIntern = {
        id: `int-${Date.now()}`,
        company: company.trim(),
        role: role.trim(),
        stipend: stipend.trim() || '₹20,000 / month',
        duration: duration.trim(),
        location: location.trim(),
        skills: parsedSkills,
        about: about.trim() || 'Corporate internship opportunity.',
        createdAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        internships: [newIntern, ...(prev.internships || [])]
      }));
      notify?.(`Internship "${newIntern.role}" at ${newIntern.company} added!`);
    } else if (modalMode === 'edit' && activeIntern) {
      const updated = {
        ...activeIntern,
        company: company.trim(),
        role: role.trim(),
        stipend: stipend.trim() || activeIntern.stipend,
        duration: duration.trim(),
        location: location.trim(),
        skills: parsedSkills,
        about: about.trim() || activeIntern.about
      };

      setState(prev => ({
        ...prev,
        internships: (prev.internships || []).map(i => i.id === activeIntern.id ? updated : i)
      }));
      notify?.(`Internship at ${updated.company} updated!`);
    }

    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, company: cName, role: rName } = deleteTarget;

    setState(prev => ({
      ...prev,
      internships: (prev.internships || []).filter(i => i.id !== id)
    }));
    notify?.(`Internship "${rName}" at ${cName} deleted.`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return interns.filter(i => {
      return !search.trim() ||
        i.company.toLowerCase().includes(search.toLowerCase()) ||
        i.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [interns, search]);

  return (
    <div className="minimal-admin-container">
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Internships</h2>
          <p className="minimal-admin-subtitle">Post and manage verified student internships.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <button onClick={openAddModal} className="minimal-admin-btn-primary">
            <Plus size={15} /> Add Internship
          </button>
        </div>
      </div>

      <div className="minimal-items-list">
        {filtered.length > 0 ? (
          filtered.map(item => (
            <div key={item.id} className="minimal-item-row">
              <div className="minimal-item-info">
                <h4 className="minimal-item-title">{item.role}</h4>
                <div className="minimal-item-meta">
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.company}</span>
                  <span>•</span>
                  <span>{item.stipend}</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                  <span>•</span>
                  <span>{item.location}</span>
                </div>
              </div>

              {/* ONLY Edit and Delete Buttons */}
              <div className="minimal-item-actions">
                <button
                  onClick={() => openEditModal(item)}
                  className="minimal-btn-action edit"
                  title="Edit Internship"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="minimal-btn-action delete"
                  title="Delete Internship"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="minimal-empty-state">No internships found.</div>
        )}
      </div>

      {modalMode && (
        <div className="minimal-modal-backdrop" onClick={closeModal}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{modalMode === 'add' ? 'Add Internship' : 'Edit Internship'}</h3>
              <button className="minimal-close-btn" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="minimal-modal-body">
                <div className="minimal-form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Razorpay Software"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Job Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineering Intern"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Monthly Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹25,000 / month"
                    value={stipend}
                    onChange={e => setStipend(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 Months"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Location / Mode</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote or Mumbai (BKC)"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Required Skills (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, TypeScript, Tailwind"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Role responsibilities..."
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                  />
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  {modalMode === 'add' ? 'Add Internship' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Internship</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>Are you sure you want to delete <strong>"{deleteTarget.role}"</strong> at <strong>{deleteTarget.company}</strong>?</p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
export function AdminPlacementsView({ state, setState, notify, navigate }) {
  const placements = state?.placements || [];
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activePlacement, setActivePlacement] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [pkg, setPkg] = useState('');
  const [date, setDate] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [location, setLocation] = useState('On-Campus');
  const [status, setStatus] = useState('Registration Active');

  const openAddModal = () => {
    setActivePlacement(null);
    setCompany('');
    setRole('');
    setPkg('');
    setDate('');
    setEligibility('');
    setLocation('On-Campus');
    setStatus('Registration Active');
    setModalMode('add');
  };

  const openEditModal = (item) => {
    setActivePlacement(item);
    setCompany(item.company || '');
    setRole(item.role || '');
    setPkg(item.package || '');
    setDate(item.date || '');
    setEligibility(item.eligibility || '');
    setLocation(item.location || 'On-Campus');
    setStatus(item.status || 'Registration Active');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActivePlacement(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim() || !pkg.trim()) {
      notify?.('Please provide company name, role, and package.');
      return;
    }

    if (modalMode === 'add') {
      const newDrive = {
        id: `dr-${Date.now()}`,
        company: company.trim(),
        role: role.trim(),
        package: pkg.trim(),
        date: date.trim() || 'TBA',
        eligibility: eligibility.trim() || 'All eligible students',
        location: location.trim(),
        status,
        createdAt: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        placements: [newDrive, ...(prev.placements || [])]
      }));
      notify?.(`Drive for ${newDrive.company} added!`);
    } else if (modalMode === 'edit' && activePlacement) {
      const updated = {
        ...activePlacement,
        company: company.trim(),
        role: role.trim(),
        package: pkg.trim(),
        date: date.trim() || activePlacement.date,
        eligibility: eligibility.trim() || activePlacement.eligibility,
        location: location.trim(),
        status
      };

      setState(prev => ({
        ...prev,
        placements: (prev.placements || []).map(p => p.id === activePlacement.id ? updated : p)
      }));
      notify?.(`Drive for ${updated.company} updated!`);
    }

    closeModal();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, company: cName } = deleteTarget;

    setState(prev => ({
      ...prev,
      placements: (prev.placements || []).filter(p => p.id !== id)
    }));
    notify?.(`Drive for ${cName} deleted.`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return placements.filter(p => {
      return !search.trim() ||
        p.company.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [placements, search]);

  return (
    <div className="minimal-admin-container">
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Placements</h2>
          <p className="minimal-admin-subtitle">Schedule and coordinate campus placement drives.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
          <button onClick={openAddModal} className="minimal-admin-btn-primary">
            <Plus size={15} /> Add Placement Drive
          </button>
        </div>
      </div>

      <div className="minimal-items-list">
        {filtered.length > 0 ? (
          filtered.map(drive => (
            <div key={drive.id} className="minimal-item-row">
              <div className="minimal-item-info">
                <h4 className="minimal-item-title">{drive.company}</h4>
                <div className="minimal-item-meta">
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{drive.role}</span>
                  <span>•</span>
                  <span style={{ color: '#0f766e', fontWeight: 600 }}>{drive.package}</span>
                  <span>•</span>
                  <span>Drive: {drive.date}</span>
                  <span>•</span>
                  <span>{drive.location}</span>
                </div>
              </div>

              {/* ONLY Edit and Delete Buttons */}
              <div className="minimal-item-actions">
                <button
                  onClick={() => openEditModal(drive)}
                  className="minimal-btn-action edit"
                  title="Edit Drive"
                >
                  <Pencil size={14} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteTarget(drive)}
                  className="minimal-btn-action delete"
                  title="Delete Drive"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="minimal-empty-state">No placement drives found.</div>
        )}
      </div>

      {modalMode && (
        <div className="minimal-modal-backdrop" onClick={closeModal}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{modalMode === 'add' ? 'Add Placement Drive' : 'Edit Placement Drive'}</h3>
              <button className="minimal-close-btn" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="minimal-modal-body">
                <div className="minimal-form-group">
                  <label>Company *</label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Consultancy Services"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Role *</label>
                  <input
                    type="text"
                    placeholder="e.g. Systems Engineer"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Package (CTC) *</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹4.50 – ₹9.00 LPA"
                    value={pkg}
                    onChange={e => setPkg(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Drive Date</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Nov 2026"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Venue / Mode</label>
                  <input
                    type="text"
                    placeholder="e.g. Podar Campus Auditorium (On-Campus)"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Registration Active">Registration Active</option>
                    <option value="Upcoming Drive">Upcoming Drive</option>
                    <option value="Shortlisting Underway">Shortlisting Underway</option>
                  </select>
                </div>
                <div className="minimal-form-group">
                  <label>Eligibility Criteria</label>
                  <input
                    type="text"
                    placeholder="e.g. BCA / BSc IT / MCA (Min 60% with no backlogs)"
                    value={eligibility}
                    onChange={e => setEligibility(e.target.value)}
                  />
                </div>
              </div>
              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  {modalMode === 'add' ? 'Add Drive' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Placement Drive</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>Are you sure you want to delete drive for <strong>"{deleteTarget.company}"</strong>?</p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
export function AdminUserManagementView({ state, setState, session, notify, navigate }) {
  const currentEmail = (session?.email || '').trim().toLowerCase();
  const isCurrentUserMainAdmin = isMainAdminAccount(session) || currentEmail === 'jatp22316@gmail.com' || currentEmail === 'admin@podar.edu';

  const defaultAdmins = [
    {
      id: 'admin-jatp-main',
      name: 'Main Administrator',
      email: 'jatp22316@gmail.com',
      phone: '9000000000',
      role: 'Super Admin',
      department: 'Executive Governance Desk',
      avatar: DEFAULT_ADMIN_AVATAR,
      permissions: ['all', 'manage_students', 'manage_courses', 'manage_certificates', 'manage_opportunities', 'manage_internships', 'manage_placements', 'manage_admins'],
      isMain: true
    },
    {
      id: 'admin-podar-root',
      name: 'Podar Administrator',
      email: 'admin@podar.edu',
      phone: '9999988888',
      role: 'Super Admin',
      department: 'Career & Placement Cell',
      avatar: DEFAULT_ADMIN_AVATAR,
      permissions: ['all', 'manage_students', 'manage_courses', 'manage_certificates', 'manage_opportunities', 'manage_internships', 'manage_placements', 'manage_admins'],
      isMain: true
    }
  ];

  // Keep only active configured admins, removing dummy placeholders
  const admins = (state?.admins && state.admins.length > 0)
    ? state.admins.filter(a => !a.email?.includes('neha.kulkarni') && !a.email?.includes('rajesh.mehra') && a.id !== 'admin-super' && a.id !== 'admin-podar-com')
    : defaultAdmins;

  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [activeAdmin, setActiveAdmin] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Career & Placement Cell');
  const [role, setRole] = useState('Placement Officer');
  const [password, setPassword] = useState('Admin@123');
  const [permissions, setPermissions] = useState(['manage_students', 'manage_internships', 'manage_placements']);

  useEffect(() => {
    fetch('/api/admins')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(a => ({
            ...a,
            isMain: isMainAdminAccount(a),
            permissions: Array.isArray(a.permissions) ? a.permissions : []
          }));
          setState(prev => ({ ...prev, admins: mapped }));
        }
      })
      .catch(() => {});
  }, []);

  const openAddModal = () => {
    setActiveAdmin(null);
    setName('');
    setEmail('');
    setPhone('');
    setDepartment('Career & Placement Cell');
    setRole('Placement Officer');
    setPassword('Admin@123');
    setPermissions(['manage_students', 'manage_internships', 'manage_placements']);
    setModalMode('add');
  };

  const openEditModal = (admin) => {
    setActiveAdmin(admin);
    setName(admin.name || '');
    setEmail(admin.email || '');
    setPhone(admin.phone || '');
    setDepartment(admin.department || 'Career & Placement Cell');
    setRole(admin.role || 'Placement Officer');
    setPassword('');
    setPermissions(Array.isArray(admin.permissions) ? admin.permissions : []);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveAdmin(null);
  };

  const togglePermission = async (adminId, permKey) => {
    const target = admins.find(a => a.id === adminId);
    if (!target) return;

    if (isMainAdminAccount(target)) {
      notify?.('Main Root Admin holds full permissions.');
      return;
    }

    const cur = Array.isArray(target.permissions) ? target.permissions : [];
    const updated = cur.includes(permKey) ? cur.filter(p => p !== permKey) : [...cur, permKey];

    const updatedList = admins.map(a => a.id === adminId ? { ...a, permissions: updated } : a);
    setState(prev => ({ ...prev, admins: updatedList }));

    try {
      await fetch(`/api/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updated })
      });
      notify?.('Permission updated.');
    } catch {
      notify?.('Permission updated.');
    }
  };

  const toggleModalPerm = (permKey) => {
    setPermissions(prev =>
      prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      notify?.('Name and email are required.');
      return;
    }

    if (modalMode === 'add') {
      const cleanPhone = phone.replace(/\D/g, '') || '9800000000';
      const newAdminObj = {
        id: `admin-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        department: department.trim(),
        role: role.trim(),
        permissions,
        isMain: false,
        createdAt: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: cleanPhone,
            department: department.trim(),
            role: role.trim(),
            password: password || 'Admin@123',
            permissions
          })
        });

        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            admins: [...admins, { ...(data.admin || newAdminObj), isMain: false, permissions }]
          }));
        } else {
          setState(prev => ({ ...prev, admins: [...admins, newAdminObj] }));
        }
      } catch {
        setState(prev => ({ ...prev, admins: [...admins, newAdminObj] }));
      }

      notify?.(`Administrator "${name}" added successfully!`);
    } else if (modalMode === 'edit' && activeAdmin) {
      const cleanPhone = phone.replace(/\D/g, '') || activeAdmin.phone;
      const isMain = isMainAdminAccount(activeAdmin);
      const updated = {
        ...activeAdmin,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        department: department.trim(),
        role: role.trim(),
        permissions: isMain ? activeAdmin.permissions : permissions
      };

      setState(prev => ({
        ...prev,
        admins: (prev.admins || []).map(a => a.id === activeAdmin.id ? updated : a)
      }));

      try {
        await fetch(`/api/admins/${activeAdmin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch {}

      notify?.(`Administrator "${updated.name}" updated!`);
    }

    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    // RULE 1: Main Admin can never be deleted
    if (isMainAdminAccount(target)) {
      notify?.('The Main Administrator cannot be deleted.');
      setDeleteTarget(null);
      return;
    }

    // RULE 2: Only Main Admin can delete other admins
    if (!isCurrentUserMainAdmin) {
      notify?.('Only the Main Administrator can delete administrators.');
      setDeleteTarget(null);
      return;
    }

    try {
      await fetch(`/api/admins/${target.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': currentEmail || 'admin@podar.edu'
        }
      });
    } catch {}

    const filtered = admins.filter(a => a.id !== target.id);
    setState(prev => ({ ...prev, admins: filtered }));
    notify?.(`Administrator "${target.name}" deleted.`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    return admins.filter(a => {
      return !search.trim() ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
        (a.role && a.role.toLowerCase().includes(search.toLowerCase()));
    });
  }, [admins, search]);

  return (
    <div className="minimal-admin-container">
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Administrators</h2>
          <p className="minimal-admin-subtitle">Manage staff administrators and module permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="minimal-search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search administrators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')}><X size={12} /></button>}
          </div>
          <button onClick={openAddModal} className="minimal-admin-btn-primary">
            <UserPlus size={15} /> Add Administrator
          </button>
        </div>
      </div>

      <div className="minimal-items-list">
        {filtered.length > 0 ? (
          filtered.map(admin => {
            const isMain = isMainAdminAccount(admin);
            const adminPerms = Array.isArray(admin.permissions) ? admin.permissions : [];

            return (
              <div key={admin.id} className="minimal-item-row" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
                  <img
                    src={admin.avatar || DEFAULT_ADMIN_AVATAR}
                    alt={admin.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid #e5e7eb',
                      flexShrink: 0
                    }}
                  />
                  <div className="minimal-item-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 className="minimal-item-title">{admin.name}</h4>
                    {isMain ? (
                      <span className="minimal-badge-root">Main Admin</span>
                    ) : (
                      <span className="minimal-badge-role">{admin.role || 'Admin'}</span>
                    )}
                  </div>

                  <div className="minimal-item-meta" style={{ marginTop: '4px' }}>
                    <span>{admin.email}</span>
                    <span>•</span>
                    <span>{admin.phone}</span>
                    <span>•</span>
                    <span>{admin.department || 'Placement Cell'}</span>
                  </div>

                  {/* Clean Minimal Permissions Toggles */}
                  <div className="minimal-perm-strip">
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Permissions:</span>
                    {PERMISSION_MODULES.map(pm => {
                      const isOn = isMain ? true : adminPerms.includes(pm.key);
                      return (
                        <button
                          key={pm.key}
                          type="button"
                          className={`minimal-perm-chip ${isOn ? 'is-active' : ''}`}
                          onClick={() => togglePermission(admin.id, pm.key)}
                          disabled={isMain}
                          title={isMain ? 'Locked for Main Admin' : `Toggle ${pm.label}`}
                        >
                          <span className="minimal-perm-dot" />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </div>

                {/* ONLY Edit and Delete Buttons */}
                <div className="minimal-item-actions">
                  <button
                    onClick={() => openEditModal(admin)}
                    className="minimal-btn-action edit"
                    title="Edit Administrator"
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>

                  {isMain ? (
                    <span className="minimal-btn-locked" title="The Main Administrator cannot be deleted">
                      <Lock size={13} />
                      <span>Protected</span>
                    </span>
                  ) : isCurrentUserMainAdmin ? (
                    <button
                      onClick={() => setDeleteTarget(admin)}
                      className="minimal-btn-action delete"
                      title="Delete Administrator"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <span className="minimal-btn-locked" title="Only Main Administrator can delete administrators">
                      <Lock size={13} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="minimal-empty-state">No administrators found.</div>
        )}
      </div>

      {/* Modal: Add / Edit Administrator */}
      {modalMode && (
        <div className="minimal-modal-backdrop" onClick={closeModal}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>{modalMode === 'add' ? 'Add Administrator' : 'Edit Administrator'}</h3>
              <button className="minimal-close-btn" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="minimal-modal-body">
                <div className="minimal-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Prof. Vikram Joshi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="e.g. vikram.joshi@podar.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Mobile Number (10 Digits)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9812345678"
                    value={phone}
                    maxLength={10}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <div className="minimal-form-group">
                  <label>Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}>
                    <option value="Career & Placement Cell">Career & Placement Cell</option>
                    <option value="Academics & Curriculum">Academics & Curriculum</option>
                    <option value="Student Affairs">Student Affairs</option>
                    <option value="Dean Office">Dean Office</option>
                  </select>
                </div>
                <div className="minimal-form-group">
                  <label>Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Placement Officer"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  />
                </div>
                {modalMode === 'add' && (
                  <div className="minimal-form-group">
                    <label>Password</label>
                    <input
                      type="text"
                      placeholder="Admin@123"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                )}

                {/* Permissions Toggles in Modal */}
                {!(activeAdmin && isMainAdminAccount(activeAdmin)) && (
                  <div className="minimal-form-group">
                    <label>Module Permissions:</label>
                    <div className="minimal-perm-strip" style={{ marginTop: '6px' }}>
                      {PERMISSION_MODULES.map(pm => {
                        const isChecked = permissions.includes(pm.key);
                        return (
                          <button
                            key={pm.key}
                            type="button"
                            className={`minimal-perm-chip ${isChecked ? 'is-active' : ''}`}
                            onClick={() => toggleModalPerm(pm.key)}
                          >
                            <span className="minimal-perm-dot" />
                            <span>{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  {modalMode === 'add' ? 'Add Administrator' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Administrator</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>Are you sure you want to delete administrator <strong>"{deleteTarget.name}"</strong> ({deleteTarget.email})?</p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 6. ADMIN CERTIFICATES MANAGEMENT VIEW
// =========================================================================
const CERT_STORAGE_KEY = 'podar-pathways-certificates';

export function AdminCertificatesView({ state, setState, session, notify, navigate }) {
  const [certificates, setCertificates] = useState(() => {
    try {
      const saved = localStorage.getItem(CERT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CERTIFICATES;
  });

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'verified' | 'rejected'
  const [courseFilter, setCourseFilter] = useState('all'); // 'all' | 'BCA' | 'MCA' | etc.
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest' | 'student-az' | 'course-az'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCert, setSelectedCert] = useState(null); // for inspect lightbox modal
  const [deleteTarget, setDeleteTarget] = useState(null); // for delete confirmation modal
  const [rejectModalCert, setRejectModalCert] = useState(null); // for reject remarks modal
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Sync with API on mount
  useEffect(() => {
    fetch('/api/certificates')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCertificates(data);
          try {
            localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  const saveCertificates = (newList) => {
    setCertificates(newList);
    try {
      localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {}
  };

  // Metrics
  const totalCount = certificates.length;
  const pendingCount = certificates.filter(c => c.status === 'pending').length;
  const verifiedCount = certificates.filter(c => c.status === 'verified').length;
  const rejectedCount = certificates.filter(c => c.status === 'rejected').length;
  const uniqueStudentsCertified = new Set(
    certificates.filter(c => c.status === 'verified').map(c => c.studentId || c.studentName)
  ).size;

  // Available unique courses
  const availableCourses = useMemo(() => {
    const set = new Set(['BCA', 'MCA', 'B.Sc IT', 'BBA', 'B.Com']);
    certificates.forEach(c => {
      const crs = c.course || c.studentCourse || c.studentDepartment;
      if (crs) set.add(crs);
    });
    (state?.students || []).forEach(s => {
      if (s.course) set.add(s.course);
    });
    return Array.from(set).filter(Boolean);
  }, [certificates, state?.students]);

  // Filtered & Sorted List
  const filteredCertificates = useMemo(() => {
    const list = certificates.filter(cert => {
      // Status filter
      if (activeFilter !== 'all' && cert.status !== activeFilter) return false;

      // Course filter
      if (courseFilter !== 'all') {
        const certCourse = (cert.course || cert.studentCourse || cert.studentDepartment || '').toLowerCase();
        if (certCourse !== courseFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName = (cert.studentName || '').toLowerCase();
        const pTitle = (cert.programTitle || '').toLowerCase();
        const credId = (cert.credentialId || '').toLowerCase();
        const vCode = (cert.verificationCode || '').toLowerCase();
        const issuer = (cert.issuer || '').toLowerCase();
        const dept = (cert.studentDepartment || cert.course || cert.studentCourse || '').toLowerCase();
        return sName.includes(q) || pTitle.includes(q) || credId.includes(q) || vCode.includes(q) || issuer.includes(q) || dept.includes(q);
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === 'newest') {
        const dateA = new Date(a.submittedAt || a.issueDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.issueDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortOrder === 'oldest') {
        const dateA = new Date(a.submittedAt || a.issueDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.issueDate || b.createdAt || 0).getTime();
        return dateA - dateB;
      }
      if (sortOrder === 'student-az') {
        return (a.studentName || '').localeCompare(b.studentName || '');
      }
      if (sortOrder === 'course-az') {
        const crsA = a.course || a.studentCourse || a.studentDepartment || '';
        const crsB = b.course || b.studentCourse || b.studentDepartment || '';
        return crsA.localeCompare(crsB);
      }
      return 0;
    });
  }, [certificates, activeFilter, courseFilter, searchQuery, sortOrder]);

  // Action: Approve & Verify Certificate
  const handleApprove = async (cert) => {
    const verifiedCode = cert.verificationCode || `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`;
    const verifiedCert = {
      ...cert,
      status: 'verified',
      verificationCode: verifiedCode,
      verifiedBy: session?.name || 'Podar Academic Board',
      verifiedAt: new Date().toISOString(),
      adminRemarks: 'Verified and approved by college administrator.'
    };

    try {
      await fetch(`/api/certificates/${cert.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'verified',
          verificationCode: verifiedCode,
          verifiedBy: session?.name || 'Podar Academic Board',
          adminRemarks: 'Verified and approved by college administrator.'
        })
      });
    } catch (e) {}

    const updated = certificates.map(c => c.id === cert.id ? verifiedCert : c);
    saveCertificates(updated);

    // Update student score & cert count in state
    if (setState && cert.studentId) {
      setState(prev => {
        const studs = (prev.students || []).map(s => {
          if (s.id === cert.studentId) {
            const curCerts = typeof s.certificates === 'number' ? s.certificates : 0;
            return {
              ...s,
              certificates: curCerts + 1,
              score: Math.min(100, (Number(s.score) || 70) + 8)
            };
          }
          return s;
        });
        return { ...prev, students: studs };
      });
    }

    notify?.(`Certificate for "${cert.programTitle}" has been verified! Code: ${verifiedCode}`);
  };

  // Action: Open Reject Modal
  const openRejectModal = (cert) => {
    setRejectModalCert(cert);
    setRejectRemarks('');
  };

  // Action: Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectModalCert) return;
    const remarks = rejectRemarks.trim() || 'Submission does not meet credential criteria. Please re-upload a clear copy.';
    const rejectedCert = {
      ...rejectModalCert,
      status: 'rejected',
      adminRemarks: remarks
    };

    try {
      await fetch(`/api/certificates/${rejectModalCert.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          adminRemarks: remarks
        })
      });
    } catch (e) {}

    const updated = certificates.map(c => c.id === rejectModalCert.id ? rejectedCert : c);
    saveCertificates(updated);
    const targetStudent = rejectModalCert.studentName || 'Student';
    setRejectModalCert(null);
    setRejectRemarks('');
    notify?.(`Submission declined. Rejection notification email dispatched to ${targetStudent}.`);
  };

  // Action: Confirm Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/certificates/${deleteTarget.id}`, { method: 'DELETE' });
    } catch (e) {}

    const updated = certificates.filter(c => c.id !== deleteTarget.id);
    saveCertificates(updated);

    if (setState && deleteTarget.status === 'verified' && deleteTarget.studentId) {
      setState(prev => {
        const studs = (prev.students || []).map(s => {
          if (s.id === deleteTarget.studentId) {
            return {
              ...s,
              certificates: Math.max(0, (Number(s.certificates) || 1) - 1)
            };
          }
          return s;
        });
        return { ...prev, students: studs };
      });
    }

    notify?.(`Certificate "${deleteTarget.programTitle}" deleted successfully.`);
    if (selectedCert?.id === deleteTarget.id) setSelectedCert(null);
    setDeleteTarget(null);
  };

  return (
    <div className="minimal-admin-container">
      {/* 1. Header */}
      <div className="minimal-admin-header">
        <div>
          <span className="minimal-admin-eyebrow">ACADEMIC CREDENTIAL GOVERNANCE</span>
          <h1 className="minimal-admin-title">Student Certificates Management</h1>
          <p className="minimal-admin-subtitle">
            Verify student-submitted professional credentials, review credential authentications, and award verified badges &amp; P-CARE employability score points.
          </p>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="minimal-stats-grid" style={{ marginBottom: '24px' }}>
        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#f1f5f9', color: '#0f172a' }}>
            <FileText size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Total Submissions</span>
            <strong className="minimal-stat-val">{totalCount}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Pending Verification</span>
            <strong className="minimal-stat-val" style={{ color: pendingCount > 0 ? '#d97706' : '#0f172a' }}>
              {pendingCount}
            </strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Verified Credentials</span>
            <strong className="minimal-stat-val" style={{ color: '#16a34a' }}>{verifiedCount}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#ede9fe', color: '#7c3aed' }}>
            <Users size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Certified Students</span>
            <strong className="minimal-stat-val">{uniqueStudentsCertified}</strong>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="minimal-admin-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Filter Tabs */}
          <div className="admin-cert-tabs">
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All</span>
              <span className="admin-cert-tab-badge">{totalCount}</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeFilter === 'pending' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              <span>Pending</span>
              {pendingCount > 0 && <span className="admin-cert-tab-badge alert">{pendingCount}</span>}
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeFilter === 'verified' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('verified')}
            >
              <span>Verified</span>
              <span className="admin-cert-tab-badge success">{verifiedCount}</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeFilter === 'rejected' ? 'is-active' : ''}`}
              onClick={() => setActiveFilter('rejected')}
            >
              <span>Rejected</span>
              <span className="admin-cert-tab-badge">{rejectedCount}</span>
            </button>
          </div>

          {/* Course Filter, Sort Order & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <select
              className="minimal-table-filter-select"
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              title="Filter by student course"
              style={{ minWidth: '130px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
            >
              <option value="all">All Courses</option>
              {availableCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="minimal-table-filter-select"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              title="Sort certificates"
              style={{ minWidth: '150px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="student-az">Student (A-Z)</option>
              <option value="course-az">Course (A-Z)</option>
            </select>

            {/* Search Box */}
            <div className="minimal-search-box" style={{ maxWidth: '280px', width: '100%', margin: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search student, course, code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Certificate Cards List */}
      <div className="minimal-admin-panel" style={{ padding: '0' }}>
        {filteredCertificates.length > 0 ? (
          <div className="admin-cert-list">
            {filteredCertificates.map(cert => {
              const isVerified = cert.status === 'verified';
              const isPending = cert.status === 'pending';
              const isRejected = cert.status === 'rejected';

              return (
                <div key={cert.id} className={`admin-cert-row ${cert.status}`}>
                  {/* Certificate Thumbnail Preview */}
                  <div
                    className="admin-cert-thumb-box"
                    onClick={() => setSelectedCert(cert)}
                    title="Click to inspect full certificate"
                  >
                    {(cert.certificateImg || cert.fileData) ? (
                      <img src={cert.certificateImg || cert.fileData} alt={cert.programTitle} className="admin-cert-thumb-img" />
                    ) : (
                      <div className="admin-cert-fallback-thumb">
                        <Award size={28} color="#0d9488" />
                      </div>
                    )}
                    <div className="admin-cert-thumb-hover">
                      <Eye size={18} color="#ffffff" />
                      <span>Inspect</span>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="admin-cert-details">
                    <div className="admin-cert-header-line">
                      <h3 className="admin-cert-title" onClick={() => setSelectedCert(cert)}>
                        {cert.programTitle}
                      </h3>
                      {isVerified ? (
                        <span className="admin-status-badge verified">
                          <ShieldCheck size={13} />
                          <span>Verified</span>
                        </span>
                      ) : isPending ? (
                        <span className="admin-status-badge pending">
                          <Clock size={13} />
                          <span>Pending Review</span>
                        </span>
                      ) : (
                        <span className="admin-status-badge rejected">
                          <AlertTriangle size={13} />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    <div className="admin-cert-meta-grid">
                      <div className="admin-cert-meta-item">
                        <span className="meta-lbl">Student:</span>
                        <strong className="meta-val">{cert.studentName}</strong>
                        {(cert.course || cert.studentCourse || cert.studentDepartment) && (
                          <span className="minimal-badge info" style={{ marginLeft: '6px', fontSize: '11px', padding: '2px 7px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                            {cert.course || cert.studentCourse || cert.studentDepartment}
                          </span>
                        )}
                      </div>

                      <div className="admin-cert-meta-item">
                        <span className="meta-lbl">Issuer:</span>
                        <span className="meta-val">{cert.issuer || 'Academic Partner'}</span>
                      </div>

                      <div className="admin-cert-meta-item">
                        <span className="meta-lbl">Credential ID:</span>
                        <code className="meta-code">{cert.credentialId || 'N/A'}</code>
                      </div>

                      <div className="admin-cert-meta-item">
                        <span className="meta-lbl">Issue Date:</span>
                        <span className="meta-val">{formatAdminDate(cert.issueDate)}</span>
                      </div>

                      {cert.verificationCode && (
                        <div className="admin-cert-meta-item">
                          <span className="meta-lbl">Official Code:</span>
                          <code className="meta-code highlight">{cert.verificationCode}</code>
                        </div>
                      )}

                      {cert.verifiedBy && (
                        <div className="admin-cert-meta-item">
                          <span className="meta-lbl">Verified By:</span>
                          <span className="meta-val">{cert.verifiedBy}</span>
                        </div>
                      )}
                    </div>

                    {cert.adminRemarks && (
                      <div className="admin-cert-remarks-box">
                        <span className="remarks-lbl">Admin Remarks:</span>
                        <span className="remarks-text">{cert.adminRemarks}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="admin-cert-actions">
                    {/* Approve / Verify Button */}
                    {!isVerified && (
                      <button
                        type="button"
                        className="minimal-btn-action approve"
                        onClick={() => handleApprove(cert)}
                        title="Approve and issue verification code"
                      >
                        <Check size={14} />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {!isRejected && (
                      <button
                        type="button"
                        className="minimal-btn-action reject"
                        onClick={() => openRejectModal(cert)}
                        title="Reject submission with remarks"
                      >
                        <X size={14} />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Inspect Full Certificate */}
                    <button
                      type="button"
                      className="minimal-btn-action inspect"
                      onClick={() => setSelectedCert(cert)}
                      title="Inspect certificate document"
                    >
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>

                    {/* Download File */}
                    {cert.fileData && (
                      <a
                        href={cert.fileData}
                        download={cert.fileName || 'certificate.svg'}
                        className="minimal-btn-action download"
                        title="Download certificate file"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    )}

                    {/* Delete Certificate */}
                    <button
                      type="button"
                      className="minimal-btn-action delete"
                      onClick={() => setDeleteTarget(cert)}
                      title="Permanently delete certificate"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="minimal-empty-state">
            <Award size={42} color="#94a3b8" />
            <h3>No certificates found</h3>
            <p>
              {searchQuery
                ? `No certificates matched "${searchQuery}". Try a different keyword.`
                : activeFilter !== 'all'
                ? `There are currently no certificates in "${activeFilter}" status.`
                : 'No certificates submitted by students yet.'}
            </p>
          </div>
        )}
      </div>

      {/* 5. Full Certificate Lightbox & Inspect Modal */}
      {selectedCert && (
        <div className="minimal-modal-backdrop" onClick={() => setSelectedCert(null)}>
          <div className="minimal-modal-dialog large admin-cert-inspect-modal" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <div>
                <span className="minimal-admin-eyebrow">CREDENTIAL INSPECTOR</span>
                <h3>{selectedCert.programTitle}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Student: <strong>{selectedCert.studentName}</strong> • {selectedCert.studentDepartment || 'BCA • Semester V'}
                </p>
              </div>
              <button className="minimal-close-btn" onClick={() => setSelectedCert(null)}><X size={18} /></button>
            </div>

            <div className="minimal-modal-body admin-cert-modal-body">
              {/* Document Canvas Area */}
              <div className="admin-cert-modal-canvas">
                {(selectedCert.certificateImg || selectedCert.fileData) ? (
                  <img
                    src={selectedCert.certificateImg || selectedCert.fileData}
                    alt={selectedCert.programTitle}
                    className="admin-cert-modal-img"
                  />
                ) : (
                  <div className="admin-cert-fallback-canvas">
                    <Award size={64} color="#0d9488" />
                    <h4>{selectedCert.programTitle}</h4>
                    <p>Awarded to {selectedCert.studentName}</p>
                  </div>
                )}
              </div>

              {/* Side Metadata Card */}
              <div className="admin-cert-modal-sidebar">
                <div className="admin-cert-inspect-card">
                  <h4>Verification Status</h4>
                  {selectedCert.status === 'verified' ? (
                    <div className="admin-cert-status-callout verified">
                      <ShieldCheck size={20} color="#16a34a" />
                      <div>
                        <strong>Verified Credential</strong>
                        <span>Validated by {selectedCert.verifiedBy || 'Podar Academic Board'}</span>
                      </div>
                    </div>
                  ) : selectedCert.status === 'pending' ? (
                    <div className="admin-cert-status-callout pending">
                      <Clock size={20} color="#d97706" />
                      <div>
                        <strong>Awaiting Verification</strong>
                        <span>Submitted by student and pending review.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-cert-status-callout rejected">
                      <AlertTriangle size={20} color="#dc2626" />
                      <div>
                        <strong>Rejected Credential</strong>
                        <span>{selectedCert.adminRemarks || 'Declined by administration.'}</span>
                      </div>
                    </div>
                  )}

                  <div className="admin-inspect-fields">
                    <div className="inspect-field">
                      <span className="lbl">Official Verification Code</span>
                      <code className="val highlight">{selectedCert.verificationCode || 'Not yet issued'}</code>
                    </div>

                    <div className="inspect-field">
                      <span className="lbl">Credential ID</span>
                      <code className="val">{selectedCert.credentialId || 'N/A'}</code>
                    </div>

                    <div className="inspect-field">
                      <span className="lbl">Partner / Issuer</span>
                      <span className="val">{selectedCert.issuer || 'Podar Academic Board'}</span>
                    </div>

                    <div className="inspect-field">
                      <span className="lbl">Issue Date</span>
                      <span className="val">{formatAdminDate(selectedCert.issueDate)}</span>
                    </div>

                    <div className="inspect-field">
                      <span className="lbl">Submitted On</span>
                      <span className="val">{formatAdminDate(selectedCert.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-cert-modal-actions-side">
                  {selectedCert.status !== 'verified' && (
                    <button
                      type="button"
                      className="minimal-btn-primary"
                      onClick={() => {
                        handleApprove(selectedCert);
                        setSelectedCert(prev => ({
                          ...prev,
                          status: 'verified',
                          verificationCode: prev.verificationCode || `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`
                        }));
                      }}
                    >
                      <Check size={16} />
                      <span>Approve & Verify</span>
                    </button>
                  )}

                  {selectedCert.fileData && (
                    <a
                      href={selectedCert.fileData}
                      download={selectedCert.fileName || 'certificate.svg'}
                      className="minimal-btn-secondary"
                      style={{ textAlign: 'center', textDecoration: 'none' }}
                    >
                      <Download size={16} />
                      <span>Download Document</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="minimal-btn-danger"
                    onClick={() => {
                      setDeleteTarget(selectedCert);
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Delete Certificate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Reject Remarks Modal */}
      {rejectModalCert && (
        <div className="minimal-modal-backdrop" onClick={() => setRejectModalCert(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Decline Certificate</h3>
              <button className="minimal-close-btn" onClick={() => setRejectModalCert(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: '#4b5563' }}>
                Please provide feedback for <strong>{rejectModalCert.studentName}</strong> regarding why their certificate for <em>"{rejectModalCert.programTitle}"</em> was declined:
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {[
                  'Certificate image is blurry or unreadable.',
                  'Student name does not match enrollment record.',
                  'Missing official institution seal or verification QR/URL.',
                  'Course credential does not match syllabus requirements.'
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectRemarks(preset)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
              <div className="minimal-form-field">
                <textarea
                  rows={4}
                  placeholder="e.g. Scanned certificate is blurry. Please re-upload high-resolution PDF or SVG credential with visible verification URL."
                  value={rejectRemarks}
                  onChange={e => setRejectRemarks(e.target.value)}
                />
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                💡 An official rejection notice with these remarks will be emailed directly to the student.
              </p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setRejectModalCert(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={handleConfirmReject}>
                Decline Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Certificate</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>
            <div className="minimal-modal-body">
              <p>
                Are you sure you want to permanently delete certificate <strong>"{deleteTarget.programTitle}"</strong> belonging to <strong>{deleteTarget.studentName}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0 0' }}>
                This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="minimal-modal-footer">
              <button className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="minimal-btn-danger" onClick={confirmDelete}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// 7. ADMIN MANAGE STUDENT DIRECTORY & ROSTER (Minimal & Professional)
// ========================================================
export function AdminStudentDirectoryView({ state, setState, session, notify, navigate }) {
  const students = state?.students || [];
  const roster = state?.roster || [];

  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'roster'
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [importing, setImporting] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form states for Add Student
  const [newStudent, setNewStudent] = useState({
    name: '',
    fathersName: '',
    phone: '',
    email: '',
    course: 'BCA',
    semester: 'Semester V',
    goal: 'Software Engineer',
    score: 75
  });

  const fileInputRef = useRef(null);

  // 1. Download .CSV Template
  const handleDownloadCsvTemplate = () => {
    const csvContent =
      "Student Name,Father Name,Mobile Number,Course,Semester,Email,Career Goal\n" +
      "Aarav Sharma,Rajesh Sharma,9876543210,BCA,Semester V,aarav.sharma@example.com,Full-Stack Web Developer\n" +
      "Rohan Deshmukh,Sanjay Deshmukh,9876543211,B.Sc IT,Semester III,rohan.deshmukh@example.com,Cybersecurity Analyst\n" +
      "Priya Verma,Anil Verma,9876543212,MCA,Semester I,priya.verma@example.com,Data Scientist & Machine Learning\n" +
      "Sneha Patel,Mahesh Patel,9876543213,BCA,Semester IV,sneha.patel@example.com,Cloud & DevOps Engineer\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify?.('Downloaded student_roster_template.csv');
  };

  // 2. Export Enrolled Students to CSV
  const handleExportStudentsCsv = () => {
    if (students.length === 0) {
      notify?.('No students to export.');
      return;
    }
    const headers = "Student Name,Father Name,Mobile Number,Course,Semester,Email,Career Goal,P-CARE Score,Completion %\n";
    const rows = students.map(s => {
      const escape = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
      return [
        escape(s.name),
        escape(s.fathersName || ''),
        escape(s.phone),
        escape(s.course || 'BCA'),
        escape(s.semester || 'V'),
        escape(s.email || ''),
        escape(s.goal || ''),
        s.score || 0,
        s.completion || 0
      ].join(',');
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `enrolled_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify?.('Exported student directory to CSV.');
  };

  // 3. Upload CSV / Excel Roster
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonRows || jsonRows.length === 0) {
        throw new Error('The uploaded spreadsheet contains no data rows.');
      }

      const parsedStudents = jsonRows.map(row => {
        const name = (row['Student Name'] || row['Name'] || row['student_name'] || row['studentName'] || '').trim();
        const fathersName = (row['Father Name'] || row["Father's Name"] || row['father_name'] || row['fathersName'] || '').trim();
        const phone = String(row['Mobile Number'] || row['Mobile'] || row['Phone'] || row['phone'] || row['mobile_no'] || '').replace(/\D/g, '').slice(-10);
        const course = (row['Course'] || row['course'] || 'BCA').trim();
        const semester = (row['Semester'] || row['semester'] || 'Semester V').trim();
        const email = (row['Email'] || row['email'] || '').trim();
        const goal = (row['Career Goal'] || row['Goal'] || row['goal'] || 'Software Engineer').trim();
        return { name, fathersName, phone, course, semester, email, goal };
      }).filter(s => s.name && s.phone && s.phone.length === 10);

      if (parsedStudents.length === 0) {
        throw new Error('No valid students found. Ensure your columns include Name and a 10-digit Mobile Number.');
      }

      // Send to server
      try {
        await fetch('/api/students/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: parsedStudents })
        });
      } catch (err) {}

      // Update local state
      const rosterList = parsedStudents.map(s => ({ name: s.name, phone: s.phone }));
      setState?.(prev => {
        const existingPhones = new Set((prev.students || []).map(s => s.phone));
        const newStudents = parsedStudents
          .filter(s => !existingPhones.has(s.phone))
          .map((s, idx) => ({
            id: `student-csv-${Date.now()}-${idx}`,
            name: s.name,
            fathersName: s.fathersName,
            phone: s.phone,
            course: s.course,
            semester: s.semester,
            email: s.email,
            goal: s.goal,
            score: 75,
            completion: 30,
            applications: 0,
            projects: 0,
            certificates: 0,
            avatar: DEFAULT_STUDENT_AVATAR
          }));

        return {
          ...prev,
          roster: [...(prev.roster || []), ...rosterList],
          students: [...(prev.students || []), ...newStudents]
        };
      });

      notify?.(`Successfully imported ${parsedStudents.length} student records from file.`);
    } catch (err) {
      notify?.(err.message || 'Could not parse uploaded file.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // 4. Create Single Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.phone.trim()) {
      notify?.('Name and mobile number are required.');
      return;
    }
    const cleanPhone = newStudent.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      notify?.('Please enter a valid 10-digit mobile number.');
      return;
    }

    const studentRecord = {
      id: `student-${Date.now()}`,
      name: newStudent.name.trim(),
      fathersName: newStudent.fathersName.trim(),
      phone: cleanPhone,
      email: newStudent.email.trim(),
      course: newStudent.course,
      semester: newStudent.semester,
      goal: newStudent.goal.trim() || 'Software Engineer',
      score: Number(newStudent.score) || 75,
      completion: 35,
      applications: 0,
      projects: 0,
      certificates: 0,
      avatar: DEFAULT_STUDENT_AVATAR
    };

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentRecord)
      });
    } catch (err) {}

    setState?.(prev => ({
      ...prev,
      students: [studentRecord, ...(prev.students || [])],
      roster: [{ name: studentRecord.name, phone: studentRecord.phone }, ...(prev.roster || [])]
    }));

    setShowAddModal(false);
    setNewStudent({
      name: '',
      fathersName: '',
      phone: '',
      email: '',
      course: 'BCA',
      semester: 'Semester V',
      goal: 'Software Engineer',
      score: 75
    });
    notify?.(`Student "${studentRecord.name}" enrolled successfully.`);
  };

  // 5. Update Student
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;

    try {
      await fetch(`/api/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStudent)
      });
    } catch (err) {}

    setState?.(prev => ({
      ...prev,
      students: (prev.students || []).map(s => s.id === editStudent.id ? { ...s, ...editStudent } : s)
    }));

    setEditStudent(null);
    notify?.(`Updated profile for ${editStudent.name}.`);
  };

  // 6. Delete Student
  const handleDeleteStudent = async () => {
    if (!deleteTarget) return;

    try {
      await fetch(`/api/students/${deleteTarget.id}`, { method: 'DELETE' });
    } catch (err) {}

    setState?.(prev => ({
      ...prev,
      students: (prev.students || []).filter(s => s.id !== deleteTarget.id),
      roster: (prev.roster || []).filter(r => r.phone !== deleteTarget.phone)
    }));

    setDeleteTarget(null);
    notify?.(`Deleted student account "${deleteTarget.name}".`);
  };

  // Filtering
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      const matchSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.goal && s.goal.toLowerCase().includes(q));

      const matchCourse = courseFilter === 'all' || s.course === courseFilter;
      return matchSearch && matchCourse;
    });
  }, [students, search, courseFilter]);

  const filteredRoster = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter(r => {
      return (
        !q ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
      );
    });
  }, [roster, search]);

  const avgScore = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / students.length)
    : 0;

  return (
    <div className="minimal-admin-container">
      {/* Hidden file input for CSV/Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        style={{ display: 'none' }}
      />

      {/* 1. Header Section */}
      <div className="minimal-admin-header">
        <div>
          <p className="minimal-admin-eyebrow">ACADEMIC GOVERNANCE</p>
          <h1 className="minimal-admin-title">Student Directory</h1>
          <p className="minimal-admin-subtitle">
            Manage enrolled student accounts, upload bulk CSV rosters, and download standard intake templates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="minimal-btn-secondary"
            onClick={handleDownloadCsvTemplate}
            title="Download CSV template format with sample student columns"
            type="button"
          >
            <Download size={14} />
            <span>Download CSV Template</span>
          </button>

          <button
            className="minimal-btn-secondary"
            onClick={handleExportStudentsCsv}
            title="Export all student records to CSV"
            type="button"
          >
            <FileSpreadsheet size={14} />
            <span>Export CSV</span>
          </button>

          <button
            className="minimal-btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            type="button"
          >
            <Upload size={14} />
            <span>{importing ? 'Importing...' : 'Upload Roster'}</span>
          </button>

          <button
            className="minimal-btn-primary"
            onClick={() => setShowAddModal(true)}
            type="button"
          >
            <Plus size={14} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Stats Grid */}
      <div className="minimal-stats-grid">
        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#f1f5f9', color: '#0f172a' }}>
            <Users size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Enrolled Students</span>
            <strong className="minimal-stat-val">{students.length}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            <FileSpreadsheet size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Signup Roster</span>
            <strong className="minimal-stat-val">{roster.length}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Trophy size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Avg P-CARE Score</span>
            <strong className="minimal-stat-val">{avgScore}%</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Briefcase size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Active Applications</span>
            <strong className="minimal-stat-val">
              {students.reduce((acc, s) => acc + (Number(s.applications) || 0), 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="minimal-controls-bar" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="admin-cert-tabs">
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <Users size={14} />
              <span>Enrolled Accounts ({students.length})</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              <FileSpreadsheet size={14} />
              <span>College Signup Roster ({roster.length})</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, maxWidth: '440px', justifyContent: 'flex-end' }}>
          <div className="minimal-search-box" style={{ flex: 1 }}>
            <Search size={14} className="minimal-search-icon" />
            <input
              type="text"
              placeholder={activeTab === 'students' ? "Search student, mobile, course..." : "Search roster..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="minimal-search-input"
            />
            {search && (
              <button className="minimal-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {activeTab === 'students' && (
            <select
              value={courseFilter}
              onChange={e => setCourseFilter(e.target.value)}
              className="minimal-select"
              style={{ width: 'auto', minWidth: '110px' }}
            >
              <option value="all">All Courses</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Sc IT">B.Sc IT</option>
              <option value="BBA">BBA</option>
              <option value="B.Com">B.Com</option>
            </select>
          )}
        </div>
      </div>

      {/* 4. CONTENT TAB 1: ENROLLED STUDENT ACCOUNTS */}
      {activeTab === 'students' && (
        <div className="minimal-table-wrap">
          {filteredStudents.length > 0 ? (
            <table className="minimal-data-table">
              <thead>
                <tr>
                  <th style={{ width: '28%' }}>STUDENT</th>
                  <th style={{ width: '22%' }}>CONTACT</th>
                  <th style={{ width: '16%' }}>COURSE & SEM</th>
                  <th style={{ width: '16%' }}>READINESS</th>
                  <th style={{ width: '18%', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar small" style={{ width: '34px', height: '34px', flexShrink: 0 }}>
                          {st.avatar ? (
                            <img src={st.avatar} alt={st.name} className="avatar-img" onError={e => { e.currentTarget.style.display = 'none'; }} />
                          ) : (
                            st.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <button
                            type="button"
                            className="link-button"
                            style={{ fontWeight: '600', color: '#0f172a', textAlign: 'left', display: 'block', fontSize: '13.5px' }}
                            onClick={() => navigate?.(`admin-student:${st.id}`)}
                          >
                            {st.name}
                          </button>
                          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {st.goal || 'General Pathway'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', color: '#334155' }}>
                        <strong style={{ display: 'block', color: '#0f172a' }}>{st.phone}</strong>
                        <span style={{ color: '#64748b' }}>{st.email || 'No email registered'}</span>
                      </div>
                    </td>

                    <td>
                      <span className="minimal-badge blue">
                        {st.course || 'BCA'} • {st.semester || 'Sem V'}
                      </span>
                    </td>

                    <td>
                      <div style={{ width: '110px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                          <strong style={{ color: '#0f172a' }}>{st.score || 0}/100</strong>
                          <span style={{ color: '#64748b' }}>{st.completion || 0}% done</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, st.score || 0)}%`, height: '100%', background: '#0f172a', borderRadius: '999px' }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="minimal-btn-table"
                          onClick={() => navigate?.(`admin-student:${st.id}`)}
                          title="Open student profile"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          className="minimal-btn-table"
                          onClick={() => setEditStudent(st)}
                          title="Edit details"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="minimal-btn-table danger"
                          onClick={() => setDeleteTarget(st)}
                          title="Delete student"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="minimal-empty-state">
              <Users size={40} color="#94a3b8" />
              <h3>No student accounts found</h3>
              <p>Upload a CSV roster, click "Add Student", or adjust your search filter.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. CONTENT TAB 2: COLLEGE SIGNUP ROSTER */}
      {activeTab === 'roster' && (
        <div className="minimal-table-wrap">
          {filteredRoster.length > 0 ? (
            <table className="minimal-data-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>STUDENT NAME</th>
                  <th style={{ width: '35%' }}>ELIGIBLE MOBILE NUMBER</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((item, idx) => {
                  const isRegistered = students.some(s => s.phone === item.phone);
                  return (
                    <tr key={`${item.phone}-${idx}`}>
                      <td>
                        <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{item.name}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155' }}>
                          <Phone size={13} color="#64748b" />
                          <span>{item.phone}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isRegistered ? (
                          <span className="minimal-badge green">
                            <CheckCircle2 size={11} />
                            <span>Account Activated</span>
                          </span>
                        ) : (
                          <span className="minimal-badge orange">
                            <span>Pending Signup</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="minimal-empty-state">
              <FileSpreadsheet size={40} color="#94a3b8" />
              <h3>No roster entries found</h3>
              <p>Upload your college intake spreadsheet using the "Upload Roster" button above.</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD STUDENT                                     */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="minimal-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Enroll New Student</h3>
              <button className="minimal-close-btn" onClick={() => setShowAddModal(false)} type="button">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="minimal-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="minimal-form-field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={newStudent.name}
                      onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="minimal-form-field">
                    <label>Father's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={newStudent.fathersName}
                      onChange={e => setNewStudent({ ...newStudent, fathersName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                  <div className="minimal-form-field">
                    <label>10-Digit Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      maxLength={10}
                      value={newStudent.phone}
                      onChange={e => setNewStudent({ ...newStudent, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="minimal-form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="student@example.com"
                      value={newStudent.email}
                      onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                  <div className="minimal-form-field">
                    <label>Course</label>
                    <select
                      value={newStudent.course}
                      onChange={e => setNewStudent({ ...newStudent, course: e.target.value })}
                    >
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc IT">B.Sc IT</option>
                      <option value="BBA">BBA</option>
                      <option value="B.Com">B.Com</option>
                    </select>
                  </div>
                  <div className="minimal-form-field">
                    <label>Semester</label>
                    <select
                      value={newStudent.semester}
                      onChange={e => setNewStudent({ ...newStudent, semester: e.target.value })}
                    >
                      <option value="Semester I">Semester I</option>
                      <option value="Semester II">Semester II</option>
                      <option value="Semester III">Semester III</option>
                      <option value="Semester IV">Semester IV</option>
                      <option value="Semester V">Semester V</option>
                      <option value="Semester VI">Semester VI</option>
                    </select>
                  </div>
                </div>

                <div className="minimal-form-field" style={{ marginTop: '10px' }}>
                  <label>Career Ambition / Target Track</label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack Web Developer, Cloud Engineer"
                    value={newStudent.goal}
                    onChange={e => setNewStudent({ ...newStudent, goal: e.target.value })}
                  />
                </div>
              </div>

              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  <Check size={14} />
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT STUDENT                                    */}
      {/* ======================================================== */}
      {editStudent && (
        <div className="minimal-modal-backdrop" onClick={() => setEditStudent(null)}>
          <div className="minimal-modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Edit Student Profile</h3>
              <button className="minimal-close-btn" onClick={() => setEditStudent(null)} type="button">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="minimal-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="minimal-form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={editStudent.name}
                      onChange={e => setEditStudent({ ...editStudent, name: e.target.value })}
                    />
                  </div>
                  <div className="minimal-form-field">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={editStudent.phone}
                      onChange={e => setEditStudent({ ...editStudent, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                  <div className="minimal-form-field">
                    <label>Course</label>
                    <select
                      value={editStudent.course || 'BCA'}
                      onChange={e => setEditStudent({ ...editStudent, course: e.target.value })}
                    >
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="B.Sc IT">B.Sc IT</option>
                      <option value="BBA">BBA</option>
                      <option value="B.Com">B.Com</option>
                    </select>
                  </div>
                  <div className="minimal-form-field">
                    <label>Semester</label>
                    <input
                      type="text"
                      value={editStudent.semester || 'Semester V'}
                      onChange={e => setEditStudent({ ...editStudent, semester: e.target.value })}
                    />
                  </div>
                </div>

                <div className="minimal-form-field" style={{ marginTop: '10px' }}>
                  <label>Career Goal</label>
                  <input
                    type="text"
                    value={editStudent.goal || ''}
                    onChange={e => setEditStudent({ ...editStudent, goal: e.target.value })}
                  />
                </div>

                <div className="minimal-form-field" style={{ marginTop: '10px' }}>
                  <label>P-CARE Employability Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editStudent.score || 0}
                    onChange={e => setEditStudent({ ...editStudent, score: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="minimal-modal-footer">
                <button type="button" className="minimal-btn-secondary" onClick={() => setEditStudent(null)}>
                  Cancel
                </button>
                <button type="submit" className="minimal-btn-primary">
                  <Check size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION                             */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="minimal-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="minimal-modal-dialog small" onClick={e => e.stopPropagation()}>
            <div className="minimal-modal-header">
              <h3>Delete Student Account</h3>
              <button className="minimal-close-btn" onClick={() => setDeleteTarget(null)} type="button">
                <X size={16} />
              </button>
            </div>
            <div className="minimal-modal-body">
              <p>
                Are you sure you want to delete student account <strong>"{deleteTarget.name}"</strong> ({deleteTarget.phone})?
              </p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0 0' }}>
                This will remove their profile record from the active directory.
              </p>
            </div>
            <div className="minimal-modal-footer">
              <button type="button" className="minimal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="minimal-btn-danger" onClick={handleDeleteStudent}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
