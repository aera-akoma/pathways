import React, { useState } from 'react';
import './styles.css';
import {
  ShieldCheck,
  Award,
  QrCode,
  Share2,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Calendar,
  Building2,
  FileCheck,
  ArrowRight,
  Sparkles,
  UserCheck
} from 'lucide-react';

export function DigitalCareerPassport({ student, notify, navigate }) {
  const [copied, setCopied] = useState(false);
  const studentName = student?.name || 'Student Name';
  const studentCourse = student?.course || 'Bachelor of Science (Information Technology)';
  const studentSem = student?.semester ? `Semester ${student.semester}` : 'Semester 5';
  const studentScore = student?.score || 78;
  const studentId = student?.id || 'PP-2026-STU';
  const certCount = student?.certificates || 0;
  const projectCount = student?.projects || 0;

  const passportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/passport?student=${encodeURIComponent(studentId)}`
    : `https://podarpathways.com/passport?student=${encodeURIComponent(studentId)}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${studentName} - Digital Career Passport | Podar Pathways`,
        text: `View ${studentName}'s verified academic credentials and P-CARE employability score on Podar Pathways.`,
        url: passportUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(passportUrl).then(() => {
        setCopied(true);
        notify?.('Passport verification link copied to clipboard!');
        setTimeout(() => setCopied(false), 2400);
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="career-passport-page">
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">DIGITAL VERIFIABLE CREDENTIAL • INSTITUTIONAL PASSPORT</p>
          <h1>Digital Career Passport</h1>
          <p>Your authentic, tamper-proof academic identity certified by Sheth L.U.J. &amp; Sir M.V. College.</p>
        </div>

        <div className="passport-toolbar-actions">
          <button
            type="button"
            className="button secondary"
            onClick={handleShare}
            title="Share verified passport"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copied ? 'Link Copied' : 'Share Passport'}</span>
          </button>

          <button
            type="button"
            className="button primary"
            onClick={handlePrint}
            title="Print or save as PDF credential"
          >
            <Printer size={16} />
            <span>Print / Save Card</span>
          </button>
        </div>
      </div>

      {/* 2. Official Passport Card */}
      <div className="passport-main-card">
        {/* Card Header: College Brand */}
        <div className="passport-card-header">
          <div className="passport-header-brand">
            <img src="/pathways-logo.jpeg" alt="College Crest" className="passport-college-crest" />
            <div>
              <h3>SHETH L.U.J. &amp; SIR M.V. COLLEGE</h3>
              <p>OF ARTS, SCIENCE &amp; COMMERCE &bull; ANDHERI (E), MUMBAI</p>
              <span>OFFICIAL DIGITAL CAREER OPERATING SYSTEM &bull; PODAR PATHWAYS</span>
            </div>
          </div>
          <div className="passport-verified-stamp">
            <ShieldCheck size={18} />
            <span>AUTHENTICATED</span>
          </div>
        </div>

        {/* Golden Divider Ribbon */}
        <div className="passport-gold-bar" />

        {/* Card Body: Student Credentials */}
        <div className="passport-card-body">
          <div className="passport-profile-strip">
            <div className="passport-avatar-wrap">
              {student?.avatar ? (
                <img src={student.avatar} alt={studentName} className="passport-avatar-img" />
              ) : (
                <div className="passport-avatar-fallback">
                  {studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span className="passport-avatar-badge" title="Active Student">✓</span>
            </div>

            <div className="passport-info-grid">
              <div className="passport-info-item name-item">
                <span className="info-label">CANDIDATE NAME</span>
                <strong className="info-value">{studentName}</strong>
              </div>

              <div className="passport-info-item">
                <span className="info-label">DEGREE PROGRAM</span>
                <strong className="info-value">{studentCourse}</strong>
              </div>

              <div className="passport-info-item">
                <span className="info-label">CURRENT ACADEMIC TERM</span>
                <strong className="info-value">{studentSem}</strong>
              </div>

              <div className="passport-info-item">
                <span className="info-label">STUDENT CREDENTIAL ID</span>
                <strong className="info-value id-code">{studentId}</strong>
              </div>

              <div className="passport-info-item">
                <span className="info-label">ACADEMIC STATUS</span>
                <strong className="info-value status-active">Good Standing (Enrolled)</strong>
              </div>

              <div className="passport-info-item">
                <span className="info-label">ISSUE CYCLE</span>
                <strong className="info-value">2023 – 2026</strong>
              </div>
            </div>

            {/* QR Code Verification Simulation Box */}
            <div className="passport-qr-box">
              <div className="qr-sim-graphic">
                <QrCode size={80} style={{ color: '#0b192c' }} />
              </div>
              <small>Scan to verify authenticity</small>
              <span className="qr-hash-badge">HASH: {studentId.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Metric Tiles Strip */}
          <div className="passport-metrics-strip">
            <div className="passport-metric-tile">
              <div className="tile-icon-box blue">
                <GraduationCap size={20} />
              </div>
              <div>
                <strong>{studentScore}/100</strong>
                <span>P-CARE Readiness</span>
              </div>
            </div>

            <div className="passport-metric-tile">
              <div className="tile-icon-box green">
                <Award size={20} />
              </div>
              <div>
                <strong>{certCount} Verified</strong>
                <span>Certifications</span>
              </div>
            </div>

            <div className="passport-metric-tile">
              <div className="tile-icon-box orange">
                <FileCheck size={20} />
              </div>
              <div>
                <strong>{projectCount} Projects</strong>
                <span>Published Work</span>
              </div>
            </div>

            <div className="passport-metric-tile">
              <div className="tile-icon-box teal">
                <UserCheck size={20} />
              </div>
              <div>
                <strong>100% Validated</strong>
                <span>College Registry</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer: Institutional Seal */}
        <div className="passport-card-footer">
          <p>
            This verifiable digital passport confirms identity and academic standing under the authority of Sheth L.U.J. College Career Development &amp; Placement Cell.
          </p>
          <div className="footer-links-row">
            <span>Official Placement Registry</span>
            <span>&bull;</span>
            <span>Dr. Sarvepalli Radhakrishnan Marg, Mumbai</span>
          </div>
        </div>
      </div>

      {/* 3. Action Cards Grid */}
      <div className="passport-actions-grid">
        <div className="panel passport-action-card">
          <Award size={22} style={{ color: '#0d9488' }} />
          <h3>Boost Credential Count</h3>
          <p>Upload your external course certificates to earn faculty verified badges on your passport.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate('certificates')}
          >
            <span>Verify Certificates</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="panel passport-action-card">
          <Sparkles size={22} style={{ color: '#0284c7' }} />
          <h3>Publish Capstone Project</h3>
          <p>Add your web application, data science, or engineering project to your student portfolio.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate('projects')}
          >
            <span>Go to Projects</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="panel passport-action-card">
          <UserCheck size={22} style={{ color: '#7c3aed' }} />
          <h3>Edit Profile Details</h3>
          <p>Update your career goal, phone number, bio, or degree specialization in settings.</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate('profile')}
          >
            <span>Manage Profile</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
