import React, { useState, useMemo } from 'react';
import './styles.css';
import {
  BarChart3,
  Target,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sliders,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Trophy
} from 'lucide-react';

export function PCareScoreBreakdown({ student, navigate }) {
  const baseScore = Number(student?.score || 78);
  const studentName = student?.name ? student.name.split(' ')[0] : 'Student';
  const studentCourse = student?.course || 'Information Technology';
  const studentSem = student?.semester ? `Semester ${student.semester}` : 'Semester 5';

  // Interactive Simulator State
  const [simulateCerts, setSimulateCerts] = useState(false);
  const [simulateProject, setSimulateProject] = useState(false);
  const [simulateResume, setSimulateResume] = useState(false);
  const [simulateInterview, setSimulateInterview] = useState(false);

  // Dynamic calculated simulated score
  const simulatedScore = useMemo(() => {
    let boost = 0;
    if (simulateCerts) boost += 12;
    if (simulateProject) boost += 10;
    if (simulateResume) boost += 8;
    if (simulateInterview) boost += 5;
    return Math.min(100, baseScore + boost);
  }, [baseScore, simulateCerts, simulateProject, simulateResume, simulateInterview]);

  const scoreDelta = simulatedScore - baseScore;

  // Breakdown Pillars
  const pillars = [
    {
      id: 'tech',
      title: 'Technical Mastery & Problem Solving',
      score: 84,
      weight: '30%',
      icon: Target,
      tone: 'blue',
      summary: 'Proficiency in core programming languages, algorithms, data structures, and framework architectures.',
      metrics: [
        { label: 'Data Structures & Algorithms', val: '80%' },
        { label: 'Full-Stack Web Technologies', val: '88%' },
        { label: 'Database Design & SQL', val: '84%' }
      ],
      actionLabel: 'View Learning Roadmap',
      actionRoute: 'roadmap'
    },
    {
      id: 'projects',
      title: 'Project Portfolio & Live Deployments',
      score: 75,
      weight: '25%',
      icon: Trophy,
      tone: 'green',
      summary: 'End-to-end applications deployed with public GitHub documentation, architecture diagrams, and live URLs.',
      metrics: [
        { label: 'Architecture & Code Quality', val: '76%' },
        { label: 'Public GitHub Documentation', val: '80%' },
        { label: 'Peer & Faculty Endorsements', val: '70%' }
      ],
      actionLabel: 'Publish / Manage Projects',
      actionRoute: 'projects'
    },
    {
      id: 'credentials',
      title: 'Faculty-Verified Certifications',
      score: Math.min(95, 60 + (student?.certificates || 0) * 12),
      weight: '20%',
      icon: Award,
      tone: 'orange',
      summary: 'Valid credentials verified by college placement committee from NPTEL, Coursera, AWS, and college courses.',
      metrics: [
        { label: 'Verified Certificates', val: `${student?.certificates || 0} Credentials` },
        { label: 'Issuer Credibility Rating', val: 'Grade A' },
        { label: 'Validity & Recency', val: '100%' }
      ],
      actionLabel: 'Submit Certificate for Verification',
      actionRoute: 'certificates'
    },
    {
      id: 'softskills',
      title: 'Employability & Communication',
      score: 78,
      weight: '15%',
      icon: Briefcase,
      tone: 'purple',
      summary: 'Professional communication, technical presentation, mock interviews, and collaborative aptitude.',
      metrics: [
        { label: 'Mock Technical Interview', val: '80%' },
        { label: 'STAR Method Competency', val: '75%' },
        { label: 'Professional Etiquette', val: '82%' }
      ],
      actionLabel: 'Practice with AI Coach',
      actionRoute: 'coach'
    },
    {
      id: 'career-assets',
      title: 'Career Assets & ATS Optimization',
      score: student?.completion || 88,
      weight: '10%',
      icon: GraduationCap,
      tone: 'teal',
      summary: 'Quantified ATS-ready resume, verified digital career passport, and institutional student profile.',
      metrics: [
        { label: 'Resume ATS Compliance', val: '86%' },
        { label: 'Profile Completeness', val: `${student?.completion || 88}%` },
        { label: 'QR Passport Status', val: 'Active' }
      ],
      actionLabel: 'Open Resume Optimizer',
      actionRoute: 'resume'
    }
  ];

  return (
    <div className="pcare-score-page">
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">INSTITUTIONAL METRIC • PLACEMENT READINESS</p>
          <h1>P-CARE Employability Score</h1>
          <p>The official institutional readiness benchmark for Sheth L.U.J. &amp; Sir M.V. College students.</p>
        </div>

        <div className="pcare-header-actions">
          <button
            type="button"
            className="button primary"
            onClick={() => navigate('roadmap')}
          >
            <span>Follow Action Roadmap</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Hero Score Card */}
      <div className="panel pcare-hero-card">
        <div className="pcare-hero-left">
          <div className="pcare-gauge-wrap">
            <div className="pcare-gauge-ring" style={{ '--score-deg': `${simulatedScore * 3.6}deg` }}>
              <div className="pcare-gauge-inner">
                <strong>{simulatedScore}</strong>
                <span>/ 100</span>
                {scoreDelta > 0 && <span className="pcare-boost-pill">+{scoreDelta} Boost</span>}
              </div>
            </div>
          </div>

          <div className="pcare-hero-info">
            <span className="eyebrow" style={{ color: '#0d9488' }}>
              CURRENT STANDING • {studentCourse.toUpperCase()}
            </span>
            <h2>{studentName}&apos;s Career Readiness Index</h2>
            <p>
              Your score is in the <strong>Top 14%</strong> of the department. Verified credentials, capstone projects, and ATS optimization directly determine your placement shortlist priority.
            </p>

            <div className="pcare-badges-row">
              <span className="pcare-meta-pill">Department Rank: #12</span>
              <span className="pcare-meta-pill">Placement Category: Tier 1 Elite</span>
              <span className="pcare-meta-pill">Profile: {student?.completion || 85}% Verified</span>
            </div>
          </div>
        </div>

        {/* 3. Interactive Simulator */}
        <div className="pcare-simulator-box">
          <div className="simulator-header">
            <div className="simulator-title">
              <Sliders size={16} style={{ color: '#0d9488' }} />
              <strong>Interactive Score Simulator</strong>
            </div>
            <span className="simulator-hint">Check actions to see projected score</span>
          </div>

          <div className="simulator-checklist">
            <label className="simulator-item">
              <input
                type="checkbox"
                checked={simulateCerts}
                onChange={e => setSimulateCerts(e.target.checked)}
              />
              <div className="simulator-label-wrap">
                <span>Verify +1 Professional Certificate</span>
                <small className="boost-tag">+12 points</small>
              </div>
            </label>

            <label className="simulator-item">
              <input
                type="checkbox"
                checked={simulateProject}
                onChange={e => setSimulateProject(e.target.checked)}
              />
              <div className="simulator-label-wrap">
                <span>Publish +1 Full-Stack Project</span>
                <small className="boost-tag">+10 points</small>
              </div>
            </label>

            <label className="simulator-item">
              <input
                type="checkbox"
                checked={simulateResume}
                onChange={e => setSimulateResume(e.target.checked)}
              />
              <div className="simulator-label-wrap">
                <span>Reach 90%+ ATS Score in Resume</span>
                <small className="boost-tag">+8 points</small>
              </div>
            </label>

            <label className="simulator-item">
              <input
                type="checkbox"
                checked={simulateInterview}
                onChange={e => setSimulateInterview(e.target.checked)}
              />
              <div className="simulator-label-wrap">
                <span>Complete AI Mock Interview</span>
                <small className="boost-tag">+5 points</small>
              </div>
            </label>
          </div>

          {scoreDelta > 0 ? (
            <div className="simulator-result">
              <span>Projected Score: <strong>{simulatedScore}/100</strong> (+{scoreDelta} pts)</span>
              <button
                type="button"
                className="button primary small-button"
                onClick={() => navigate(simulateCerts ? 'certificates' : simulateProject ? 'projects' : 'resume')}
              >
                Take Next Action &rarr;
              </button>
            </div>
          ) : (
            <div className="simulator-result empty">
              <span>Select any milestone above to simulate your score progression.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Five Pillars Breakdown Grid */}
      <div className="pcare-pillars-heading">
        <h2>Five Core Employability Pillars</h2>
        <p>Comprehensive assessment weighted according to corporate campus recruitment standards.</p>
      </div>

      <div className="pcare-pillars-grid">
        {pillars.map(pillar => {
          const Icon = pillar.icon;
          return (
            <div key={pillar.id} className="panel pcare-pillar-card">
              <div className="pillar-card-top">
                <div className={`pillar-icon-box ${pillar.tone}`}>
                  <Icon size={20} />
                </div>
                <div className="pillar-score-badge">
                  <strong>{pillar.score}%</strong>
                  <span>Weight: {pillar.weight}</span>
                </div>
              </div>

              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.summary}</p>

              <div className="pillar-progress-bar">
                <div className="pillar-progress-fill" style={{ width: `${pillar.score}%` }} />
              </div>

              <div className="pillar-metrics-list">
                {pillar.metrics.map((m, i) => (
                  <div key={i} className="pillar-metric-item">
                    <span>{m.label}</span>
                    <strong>{m.val}</strong>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="link-button pillar-action-btn"
                onClick={() => navigate(pillar.actionRoute)}
              >
                <span>{pillar.actionLabel}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

