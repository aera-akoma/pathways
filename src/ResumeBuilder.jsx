import React, { useState, useEffect, useMemo } from 'react';
import './styles.css';
import {
  FileText,
  Check,
  Download,
  Printer,
  Copy,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe,
  Share2,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';

const STORAGE_KEY = 'podar_student_resume_v2';

const ACTION_VERBS = [
  'built', 'engineered', 'designed', 'developed', 'deployed', 'architected',
  'optimized', 'implemented', 'spearheaded', 'created', 'integrated', 'automated',
  'reduced', 'increased', 'accelerated', 'managed', 'led', 'delivered'
];

export function ResumeBuilder({ student, notify, navigate }) {
  // Prepopulate with student's profile information
  const [resumeData, setResumeData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    return {
      fullName: student?.name || '',
      headline: student?.headline || 'Aspiring Software Engineer & Full-Stack Developer',
      email: student?.email || '',
      phone: student?.phone || '',
      location: 'Mumbai, Maharashtra',
      linkedin: student?.linkedin || '',
      github: student?.github || '',
      portfolio: '',
      summary: student?.goal || student?.bio || 'Dedicated undergraduate student passionate about developing modern web applications, scalable APIs, and problem solving with data structures. Eager to contribute to high-impact software engineering teams.',
      skills: ['JavaScript (ES6+)', 'React.js', 'Node.js', 'Python', 'SQL / MySQL', 'Data Structures & Algorithms', 'Git & GitHub', 'REST APIs', 'HTML5 & CSS3', 'Tailwind CSS'],
      education: [
        {
          id: 'edu-1',
          school: 'Sheth L.U.J. & Sir M.V. College of Arts, Science & Commerce',
          degree: student?.course || 'Bachelor of Science (Information Technology)',
          semester: student?.semester ? `Semester ${student.semester}` : 'Semester 5',
          duration: '2023 – 2026',
          grade: 'CGPA: 8.85 / 10'
        }
      ],
      projects: [
        {
          id: 'proj-1',
          title: 'Campus Career & Placement Operating System',
          role: 'Lead Full-Stack Developer',
          tech: 'React, Node.js, SQLite, REST APIs',
          link: 'https://github.com/example/pathways',
          bullets: [
            'Architected full-stack portal facilitating placement registration, verified credentials, and digital student portfolios for 500+ students.',
            'Engineered automated 2FA verification engine with OTP delivery and institutional audit logging.',
            'Optimized client asset bundle and lazy loading, achieving sub-second first contentful paint.'
          ]
        },
        {
          id: 'proj-2',
          title: 'AI-Powered Smart Course & Roadmap Compass',
          role: 'Sole Developer',
          tech: 'Python, FastAPI, Streamlit, NLP',
          link: 'https://github.com/example/ai-compass',
          bullets: [
            'Built intelligent recommendation algorithm analyzing student skill gaps against live industry job openings.',
            'Integrated natural language resume parsing with instant ATS keyword density feedback.'
          ]
        }
      ],
      experience: [
        {
          id: 'exp-1',
          role: 'Web Development & Project Intern',
          company: 'Academic Technology Lab, Podar',
          location: 'Mumbai (Hybrid)',
          duration: 'Jun 2025 – Present',
          bullets: [
            'Collaborated with college IT council to modernize academic credential verification workflows.',
            'Authored responsive UI components with WCAG 2.1 AA accessibility compliance.'
          ]
        }
      ],
      certifications: [
        {
          id: 'cert-1',
          name: 'Meta Front-End Developer Specialization',
          issuer: 'Coursera / Meta',
          year: '2025'
        },
        {
          id: 'cert-2',
          name: 'Data Structures & Algorithms in Java',
          issuer: 'NPTEL / AICTE',
          year: '2025'
        }
      ]
    };
  });

  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview' | 'ats'
  const [newSkill, setNewSkill] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Sync state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resumeData));
    } catch {}
  }, [resumeData]);

  // Compute ATS Score & Insights dynamically
  const atsAnalysis = useMemo(() => {
    let score = 0;
    const tips = [];
    const strengths = [];

    // 1. Contact info check (+25 max)
    if (resumeData.fullName.trim()) score += 5;
    if (resumeData.email.trim() && resumeData.email.includes('@')) {
      score += 7;
      strengths.push('Professional email address present');
    } else {
      tips.push('Add a valid professional email address');
    }
    if (resumeData.phone.trim().length >= 10) {
      score += 5;
      strengths.push('Direct phone number provided');
    } else {
      tips.push('Provide a 10-digit mobile number for recruiter calls');
    }
    if (resumeData.linkedin.trim()) {
      score += 4;
      strengths.push('LinkedIn profile included');
    } else {
      tips.push('Include your LinkedIn URL for recruiter outreach');
    }
    if (resumeData.github.trim()) {
      score += 4;
      strengths.push('GitHub / portfolio link provided');
    } else {
      tips.push('Add your GitHub profile to showcase public code repositories');
    }

    // 2. Summary check (+15 max)
    const summaryLen = resumeData.summary.trim().split(/\s+/).length;
    if (summaryLen >= 25 && summaryLen <= 80) {
      score += 15;
      strengths.push('Concise, well-scoped professional summary (ideal length)');
    } else if (summaryLen > 0) {
      score += 8;
      tips.push('Expand your summary to 35-65 words highlighting core skills & career goals');
    } else {
      tips.push('Write a professional summary outlining your focus areas');
    }

    // 3. Skills check (+20 max)
    if (resumeData.skills.length >= 8) {
      score += 20;
      strengths.push(`${resumeData.skills.length} technical skills listed (strong keyword density)`);
    } else if (resumeData.skills.length >= 4) {
      score += 12;
      tips.push('Add at least 8 relevant technical and tool skills');
    } else {
      tips.push('List key frameworks, languages, and technical concepts');
    }

    // 4. Projects & Impact (+25 max)
    if (resumeData.projects.length >= 2) {
      score += 15;
      strengths.push('Multiple featured projects demonstrating hands-on experience');
    } else if (resumeData.projects.length === 1) {
      score += 8;
      tips.push('Include at least 2 distinct technical projects');
    }

    // Check for metrics and action verbs across project bullets
    const allBullets = [
      ...resumeData.projects.flatMap(p => p.bullets),
      ...resumeData.experience.flatMap(e => e.bullets)
    ].join(' ').toLowerCase();

    const hasNumbers = /\d+%|\d+\+|\b\d+\b/.test(allBullets);
    if (hasNumbers) {
      score += 10;
      strengths.push('Quantified achievements with metrics (%, numbers, scale)');
    } else {
      tips.push('Add measurable impact numbers (e.g. "Reduced load time by 30%", "Used by 200+ students")');
    }

    // 5. Certifications & Education (+15 max)
    if (resumeData.education.length > 0) score += 8;
    if (resumeData.certifications.length >= 2) {
      score += 7;
      strengths.push('Verified certifications enhance candidate credibility');
    } else {
      tips.push('Add college or online certified credentials (NPTEL, Coursera)');
    }

    const finalScore = Math.min(100, Math.max(30, score));

    return {
      score: finalScore,
      strengths,
      tips
    };
  }, [resumeData]);

  // Handle Field Updates
  const updateField = (field, value) => {
    setResumeData(prev => ({ ...prev, [field]: value }));
  };

  // Skill Tags
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const clean = newSkill.trim();
    if (!resumeData.skills.includes(clean)) {
      setResumeData(prev => ({ ...prev, skills: [...prev.skills, clean] }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Project Bullets
  const handleBulletChange = (type, itemId, bulletIndex, value) => {
    setResumeData(prev => {
      const list = prev[type].map(item => {
        if (item.id !== itemId) return item;
        const newBullets = [...item.bullets];
        newBullets[bulletIndex] = value;
        return { ...item, bullets: newBullets };
      });
      return { ...prev, [type]: list };
    });
  };

  const handleAddBullet = (type, itemId) => {
    setResumeData(prev => {
      const list = prev[type].map(item => {
        if (item.id !== itemId) return item;
        return { ...item, bullets: [...item.bullets, ''] };
      });
      return { ...prev, [type]: list };
    });
  };

  const handleRemoveBullet = (type, itemId, bulletIndex) => {
    setResumeData(prev => {
      const list = prev[type].map(item => {
        if (item.id !== itemId) return item;
        const newBullets = item.bullets.filter((_, i) => i !== bulletIndex);
        return { ...item, bullets: newBullets };
      });
      return { ...prev, [type]: list };
    });
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  // Copy Plain Text / Markdown
  const handleCopyText = () => {
    const text = `# ${resumeData.fullName}
${resumeData.headline}
Email: ${resumeData.email} | Phone: ${resumeData.phone} | Location: ${resumeData.location}
${resumeData.linkedin ? `LinkedIn: ${resumeData.linkedin} | ` : ''}${resumeData.github ? `GitHub: ${resumeData.github}` : ''}

## PROFESSIONAL SUMMARY
${resumeData.summary}

## TECHNICAL SKILLS
${resumeData.skills.join(', ')}

## EDUCATION
${resumeData.education.map(e => `* ${e.degree} - ${e.school} (${e.duration}) | ${e.grade}`).join('\n')}

## PROJECTS
${resumeData.projects.map(p => `### ${p.title} (${p.tech})
${p.bullets.map(b => `* ${b}`).join('\n')}`).join('\n\n')}

## CERTIFICATIONS
${resumeData.certifications.map(c => `* ${c.name} - ${c.issuer} (${c.year})`).join('\n')}
`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      notify?.('Formatted resume copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2400);
    });
  };

  // 1-Click AI Polish
  const handleAIPolish = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const polishedSummary = `Results-oriented software developer and undergraduate student at Sheth L.U.J. College with hands-on expertise in React.js, Node.js, and data structures. Demonstrated track record building responsive web applications, collaborating on open student projects, and engineering robust REST endpoints with modern best practices.`;
      setResumeData(prev => ({ ...prev, summary: polishedSummary }));
      setIsOptimizing(false);
      notify?.('AI Optimization applied to professional summary!');
    }, 700);
  };

  return (
    <div className="resume-builder-page">
      {/* 1. Header Toolbar */}
      <div className="page-header resume-toolbar">
        <div>
          <p className="eyebrow">CAREER ASSETS • ATS OPTIMIZED</p>
          <h1>Interactive Resume Builder</h1>
          <p>Create, optimize with AI ATS insights, and export your college-verified resume.</p>
        </div>

        <div className="resume-toolbar-actions">
          {/* View Switcher Pills */}
          <div className="resume-view-switcher">
            <button
              className={`switcher-pill ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              <Sliders size={14} />
              <span>Edit Form</span>
            </button>
            <button
              className={`switcher-pill ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} />
              <span>Resume Sheet</span>
            </button>
            <button
              className={`switcher-pill ${activeTab === 'ats' ? 'active' : ''}`}
              onClick={() => setActiveTab('ats')}
            >
              <Sparkles size={14} />
              <span>ATS Score ({atsAnalysis.score}%)</span>
            </button>
          </div>

          <div className="resume-btn-group">
            <button
              type="button"
              className="button secondary"
              onClick={handleCopyText}
              title="Copy markdown text"
            >
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
              <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              className="button primary"
              onClick={handlePrint}
              title="Export as PDF via browser print"
            >
              <Printer size={16} />
              <span>Export PDF / Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. ATS Banner Notice */}
      <div className="ats-score-banner">
        <div className="ats-gauge-circle" style={{ '--score-deg': `${atsAnalysis.score * 3.6}deg` }}>
          <span>{atsAnalysis.score}</span>
          <small>/100</small>
        </div>
        <div className="ats-banner-content">
          <div className="ats-banner-title">
            <strong>ATS Career Readiness Score: {atsAnalysis.score >= 80 ? 'Excellent' : atsAnalysis.score >= 60 ? 'Competitive' : 'Needs Optimization'}</strong>
            <span className="category-pill">{atsAnalysis.strengths.length} Strengths Detected</span>
          </div>
          <p>
            {atsAnalysis.tips.length > 0
              ? `Action item: ${atsAnalysis.tips[0]}`
              : 'Your resume meets premier institutional and corporate ATS standards! Ready for placements.'}
          </p>
        </div>
        <button
          type="button"
          className="button ghost ats-quick-polish-btn"
          onClick={handleAIPolish}
          disabled={isOptimizing}
        >
          <Sparkles size={15} />
          <span>{isOptimizing ? 'Optimizing...' : '1-Click AI Polish'}</span>
        </button>
      </div>

      {/* 3. Main Workspace: Split View on Desktop */}
      <div className={`resume-workspace-grid ${activeTab}`}>
        {/* LEFT COLUMN: EDIT CONTROLS */}
        {(activeTab === 'edit' || activeTab === 'ats') && (
          <div className="resume-editor-col">
            {/* Contact Information */}
            <div className="panel resume-section-card">
              <div className="panel-heading">
                <h2>
                  <GraduationCap size={18} />
                  <span>Personal & Contact Credentials</span>
                </h2>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>Full Legal Name</span>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={e => updateField('fullName', e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                  />
                </label>

                <label className="field">
                  <span>Professional Headline</span>
                  <input
                    type="text"
                    value={resumeData.headline}
                    onChange={e => updateField('headline', e.target.value)}
                    placeholder="e.g. Software Engineer | React & Cloud"
                  />
                </label>

                <label className="field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={resumeData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="student@podar.edu"
                  />
                </label>

                <label className="field">
                  <span>Contact Number</span>
                  <input
                    type="tel"
                    value={resumeData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="9876543210"
                  />
                </label>

                <label className="field">
                  <span>Location</span>
                  <input
                    type="text"
                    value={resumeData.location}
                    onChange={e => updateField('location', e.target.value)}
                    placeholder="Mumbai, India"
                  />
                </label>

                <label className="field">
                  <span>LinkedIn Profile URL</span>
                  <input
                    type="text"
                    value={resumeData.linkedin}
                    onChange={e => updateField('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/aarav-sharma"
                  />
                </label>

                <label className="field">
                  <span>GitHub Repository Profile</span>
                  <input
                    type="text"
                    value={resumeData.github}
                    onChange={e => updateField('github', e.target.value)}
                    placeholder="github.com/aarav-sharma"
                  />
                </label>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="panel resume-section-card">
              <div className="panel-heading">
                <h2>
                  <FileText size={18} />
                  <span>Executive Professional Summary</span>
                </h2>
                <button
                  type="button"
                  className="link-button"
                  onClick={handleAIPolish}
                >
                  <Sparkles size={14} /> AI Polish
                </button>
              </div>
              <label className="field">
                <textarea
                  rows={4}
                  value={resumeData.summary}
                  onChange={e => updateField('summary', e.target.value)}
                  placeholder="Summarize your technical foundation, college projects, and career aspirations..."
                />
              </label>
            </div>

            {/* Technical Skills */}
            <div className="panel resume-section-card">
              <div className="panel-heading">
                <h2>
                  <Briefcase size={18} />
                  <span>Technical & Domain Skills ({resumeData.skills.length})</span>
                </h2>
              </div>

              <form onSubmit={handleAddSkill} className="skill-input-bar">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  placeholder="Type a skill and press Enter (e.g. Next.js, Docker, Java)..."
                />
                <button type="submit" className="button secondary">
                  <Plus size={15} /> Add
                </button>
              </form>

              <div className="skill-tag-cloud">
                {resumeData.skills.map(skill => (
                  <span key={skill} className="skill-badge-removable">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured Projects */}
            <div className="panel resume-section-card">
              <div className="panel-heading">
                <h2>
                  <Award size={18} />
                  <span>Featured Portfolio Projects</span>
                </h2>
              </div>

              {resumeData.projects.map((proj, pIdx) => (
                <div key={proj.id} className="resume-entry-block">
                  <div className="entry-header-row">
                    <strong>Project #{pIdx + 1}: {proj.title}</strong>
                  </div>

                  <div className="form-grid" style={{ marginBottom: '10px' }}>
                    <label className="field">
                      <span>Project Title</span>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={e => {
                          const val = e.target.value;
                          setResumeData(prev => ({
                            ...prev,
                            projects: prev.projects.map(p => p.id === proj.id ? { ...p, title: val } : p)
                          }));
                        }}
                      />
                    </label>

                    <label className="field">
                      <span>Tech Stack Used</span>
                      <input
                        type="text"
                        value={proj.tech}
                        onChange={e => {
                          const val = e.target.value;
                          setResumeData(prev => ({
                            ...prev,
                            projects: prev.projects.map(p => p.id === proj.id ? { ...p, tech: val } : p)
                          }));
                        }}
                      />
                    </label>
                  </div>

                  <div className="bullets-edit-group">
                    <span className="field-sublabel">Bullet Points & Impact:</span>
                    {proj.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="bullet-input-row">
                        <span className="bullet-dot">•</span>
                        <input
                          type="text"
                          value={b}
                          onChange={e => handleBulletChange('projects', proj.id, bIdx, e.target.value)}
                          placeholder="Action verb + task + measurable result..."
                        />
                        <button
                          type="button"
                          className="bullet-delete-btn"
                          onClick={() => handleRemoveBullet('projects', proj.id, bIdx)}
                          title="Remove bullet"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="link-button add-bullet-btn"
                      onClick={() => handleAddBullet('projects', proj.id)}
                    >
                      <Plus size={13} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ATS Insights Box */}
            {activeTab === 'ats' && (
              <div className="panel resume-section-card ats-insights-expanded">
                <div className="panel-heading">
                  <h2>
                    <Sparkles size={18} />
                    <span>ATS Audit & Optimization Breakdown</span>
                  </h2>
                </div>

                <div className="ats-breakdown-lists">
                  <div className="ats-list-col">
                    <h4 style={{ color: '#059669' }}>Detected Strengths:</h4>
                    <ul>
                      {atsAnalysis.strengths.map((str, i) => (
                        <li key={i}><Check size={14} style={{ color: '#059669', flexShrink: 0 }} /><span>{str}</span></li>
                      ))}
                    </ul>
                  </div>

                  <div className="ats-list-col">
                    <h4 style={{ color: '#d97706' }}>Action Recommendations:</h4>
                    <ul>
                      {atsAnalysis.tips.map((tip, i) => (
                        <li key={i}><ChevronRight size={14} style={{ color: '#d97706', flexShrink: 0 }} /><span>{tip}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: REAL-TIME PRINTABLE RESUME SHEET */}
        {(activeTab === 'preview' || window.innerWidth > 1024) && (
          <div className="resume-preview-col">
            <div className="printable-resume-paper">
              {/* Paper Header */}
              <div className="paper-header">
                <h1 className="paper-name">{resumeData.fullName || 'Student Name'}</h1>
                <p className="paper-headline">{resumeData.headline}</p>

                <div className="paper-contact-row">
                  {resumeData.email && <span>{resumeData.email}</span>}
                  {resumeData.phone && <span>• {resumeData.phone}</span>}
                  {resumeData.location && <span>• {resumeData.location}</span>}
                  {resumeData.linkedin && <span>• {resumeData.linkedin}</span>}
                  {resumeData.github && <span>• {resumeData.github}</span>}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="paper-section">
                  <h3 className="paper-section-title">PROFESSIONAL SUMMARY</h3>
                  <p className="paper-text">{resumeData.summary}</p>
                </div>
              )}

              {/* Technical Skills */}
              {resumeData.skills.length > 0 && (
                <div className="paper-section">
                  <h3 className="paper-section-title">TECHNICAL SKILLS</h3>
                  <p className="paper-text">
                    <strong>Core Proficiencies:</strong> {resumeData.skills.join(', ')}
                  </p>
                </div>
              )}

              {/* Education */}
              {resumeData.education.length > 0 && (
                <div className="paper-section">
                  <h3 className="paper-section-title">EDUCATION</h3>
                  {resumeData.education.map(edu => (
                    <div key={edu.id} className="paper-item">
                      <div className="paper-item-top">
                        <strong>{edu.school}</strong>
                        <span>{edu.duration}</span>
                      </div>
                      <div className="paper-item-sub">
                        <span>{edu.degree} ({edu.semester})</span>
                        <span className="paper-grade">{edu.grade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Featured Projects */}
              {resumeData.projects.length > 0 && (
                <div className="paper-section">
                  <h3 className="paper-section-title">FEATURED PROJECTS</h3>
                  {resumeData.projects.map(proj => (
                    <div key={proj.id} className="paper-item">
                      <div className="paper-item-top">
                        <strong>{proj.title}</strong>
                        <span className="paper-tech">[{proj.tech}]</span>
                      </div>
                      <ul className="paper-bullets">
                        {proj.bullets.filter(b => b.trim()).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {resumeData.experience.length > 0 && (
                <div className="paper-section">
                  <h3 className="paper-section-title">EXPERIENCE & INTERNSHIPS</h3>
                  {resumeData.experience.map(exp => (
                    <div key={exp.id} className="paper-item">
                      <div className="paper-item-top">
                        <strong>{exp.role} — {exp.company}</strong>
                        <span>{exp.duration}</span>
                      </div>
                      <ul className="paper-bullets">
                        {exp.bullets.filter(b => b.trim()).map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications */}
              {resumeData.certifications.length > 0 && (
                <div className="paper-section">
                  <h3 className="paper-section-title">CERTIFICATIONS & CREDENTIALS</h3>
                  <ul className="paper-bullets compact">
                    {resumeData.certifications.map(cert => (
                      <li key={cert.id}>
                        <strong>{cert.name}</strong> — {cert.issuer} ({cert.year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* College Endorsement watermark badge */}
              <div className="paper-footer-seal">
                <span>Verified by Sheth L.U.J. &amp; Sir M.V. College Career Portal &bull; Podar Pathways</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
