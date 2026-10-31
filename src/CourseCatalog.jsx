import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Award,
  Upload,
  ExternalLink,
  X,
  ShieldCheck,
  Download,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Printer,
  Copy,
  Info,
  Clock,
  Sparkles,
  ArrowLeft,
  Calendar,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { INITIAL_CERTIFICATES, generateCertificateSVG } from './defaultCertificates.js';
import { CURATED_COURSES } from './curatedCourses.js';

const CERT_STORAGE_KEY = 'podar-pathways-certificates';

// Utility: Calculate course validity info
export function getCourseValidityInfo(validTill) {
  if (!validTill) {
    return {
      formatted: '31 Dec 2026',
      isExpired: false,
      isExpiringSoon: false,
      daysLeft: null
    };
  }

  const dateObj = new Date(validTill);
  if (isNaN(dateObj.getTime())) {
    return {
      formatted: String(validTill),
      isExpired: false,
      isExpiringSoon: false,
      daysLeft: null
    };
  }

  const formatted = dateObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const now = new Date();
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const diffTime = endOfDay.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = diffDays < 0;
  const isExpiringSoon = !isExpired && diffDays <= 30;

  return {
    formatted,
    isExpired,
    isExpiringSoon,
    daysLeft: diffDays
  };
}

// Utility: Canvas image compression for fast, reliable upload on mobile & desktop
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    // If SVG, read as text/dataURL directly
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
        const maxDim = 1600;
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
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        // Fallback to raw dataURL if image load fails
        resolve(e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CourseCatalog({
  courses = [],
  studentCourses = [],
  state,
  setState,
  session,
  student,
  notify,
  navigate,
  pageMode = 'courses' // 'courses' | 'certificates'
}) {
  const isCoursesOnly = pageMode === 'courses';
  const isAdmin = session?.role === 'admin';

  // Merge default courses with state courses and ensure validTill is present
  const allAvailableCourses = useMemo(() => {
    const existingMap = new Map((courses || []).map(c => [c.id, c]));
    const merged = (courses || []).map(c => {
      const match = CURATED_COURSES.find(cur => cur.id === c.id);
      return {
        ...match,
        ...c,
        validTill: c.validTill || c.deadline || c.valid_till || match?.validTill || '2026-12-31'
      };
    });
    CURATED_COURSES.forEach(curated => {
      if (!existingMap.has(curated.id)) {
        merged.push({
          ...curated,
          validTill: curated.validTill || '2026-12-31'
        });
      }
    });
    return merged;
  }, [courses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [openingCourseId, setOpeningCourseId] = useState('');

  // Certificate Data & State
  const [certificates, setCertificates] = useState(() => {
    try {
      const saved = localStorage.getItem(CERT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load certificates from localStorage:', e);
    }
    return INITIAL_CERTIFICATES;
  });

  // Google Photos Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showInfoPane, setShowInfoPane] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Touch Swipe coordinates for mobile gesture
  const touchStartRef = useRef(0);

  // Upload Modal States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    courseId: '',
    programTitle: '',
    credentialId: '',
    issueDate: new Date().toISOString().split('T')[0],
    fileData: '',
    fileName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // Certificates View Filtering & Sorting States
  const [certStatusFilter, setCertStatusFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'rejected'
  const [certCourseFilter, setCertCourseFilter] = useState('all');
  const [certSortOrder, setCertSortOrder] = useState('newest'); // 'newest' | 'course-az' | 'title-az'

  // Under review info modal state
  const [pendingInfoCert, setPendingInfoCert] = useState(null);

  const currentStudentId = student?.id || session?.id || 'student-demo';
  const currentStudentName = student?.name || session?.name || 'Student Demo';

  // Determine API base url dynamically (relative for unified PHP server)
  const apiBase = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.port === '5173') {
      return 'http://localhost:5000';
    }
    return '';
  }, []);

  // Sync certificates with backend / localStorage
  const fetchCertificates = async () => {
    try {
      const res = await fetch(`${apiBase}/api/certificates`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCertificates(data);
          try {
            localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {}
          return;
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCertificates();
  }, [apiBase]);

  const saveCertificates = (newList) => {
    setCertificates(newList);
    try {
      localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Open external course link
  const handleOpenCourse = async (course) => {
    setOpeningCourseId(course.id);
    try {
      if (setState) {
        const enrolledCourse = {
          ...course,
          enrolled: true,
          enrolled_at: new Date().toISOString()
        };

        setState(prev => ({
          ...prev,
          courses: (prev.courses || []).map(c => c.id === course.id ? enrolledCourse : c),
          studentCourses: [
            ...(prev.studentCourses || []).filter(c => c.id !== course.id),
            enrolledCourse
          ],
          students: (prev.students || []).map(s =>
            s.id === currentStudentId
              ? {
                  ...s,
                  enrolledCourses: [
                    ...(s.enrolledCourses || []).filter(c => c.id !== course.id),
                    enrolledCourse
                  ]
                }
              : s
          )
        }));
      }

      const destinationUrl = course.url || course.link || 'https://www.coursera.org';
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error(err);
      notify?.('Could not open external course website.');
    } finally {
      setTimeout(() => setOpeningCourseId(''), 400);
    }
  };

  // Open upload modal
  const handleOpenUploadModal = (course) => {
    setSelectedCourseForUpload(course);
    setUploadForm({
      courseId: course?.id || '',
      programTitle: course?.title || '',
      credentialId: '',
      issueDate: new Date().toISOString().split('T')[0],
      fileData: '',
      fileName: ''
    });
    setUploadModalOpen(true);
  };

  // File selection with mobile canvas compression
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    try {
      const compressedData = await compressImageFile(file);
      setUploadForm(prev => ({
        ...prev,
        fileData: compressedData,
        fileName: file.name
      }));
    } catch (err) {
      console.error('File compression error:', err);
      notify?.('Could not process this file. Please select a JPG or PNG image.');
    } finally {
      setCompressing(false);
    }
  };

  // Demo certificate generator
  const handleGenerateSampleCertificate = () => {
    const generated = generateCertificateSVG({
      studentName: currentStudentName,
      programTitle: uploadForm.programTitle || 'Professional Certification',
      credentialId: uploadForm.credentialId || `PODAR-${Date.now().toString().slice(-6)}`,
      issueDate: uploadForm.issueDate || new Date().toISOString().split('T')[0],
      verificationCode: `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`
    });

    setUploadForm(prev => ({
      ...prev,
      fileData: generated,
      fileName: `${(uploadForm.programTitle || 'certificate').toLowerCase().replace(/\s+/g, '-')}-verified.svg`,
      credentialId: prev.credentialId || `PODAR-${Date.now().toString().slice(-6)}`
    }));
    notify?.('Certificate generated! Ready to submit.');
  };

  // Submit certificate
  const handleSubmitCertificate = async (e) => {
    e.preventDefault();
    if (!uploadForm.programTitle.trim()) {
      notify?.('Please enter a course title.');
      return;
    }
    if (!uploadForm.fileData) {
      notify?.('Please upload an image file or generate a certificate.');
      return;
    }

    setUploading(true);

    // If admin is uploading, auto-verify; if student, pending (with option to demo-approve)
    const initialStatus = isAdmin ? 'verified' : 'pending';
    const verificationCode = `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`;

    const newCert = {
      id: `cert-${Date.now()}`,
      programId: uploadForm.courseId || null,
      programTitle: uploadForm.programTitle.trim(),
      studentId: currentStudentId,
      studentName: currentStudentName,
      studentDepartment: student?.course ? `${student.course} • Semester ${student.semester || 'V'}` : 'BCA • Semester V',
      course: student?.course || 'BCA',
      studentEmail: student?.email || session?.email || '',
      studentPhone: student?.phone || session?.phone || '',
      credentialId: uploadForm.credentialId.trim() || `CRED-${Math.floor(100000 + Math.random() * 900000)}`,
      issueDate: uploadForm.issueDate || new Date().toISOString().split('T')[0],
      fileData: uploadForm.fileData,
      fileName: uploadForm.fileName || 'certificate.jpg',
      status: initialStatus,
      verificationCode: initialStatus === 'verified' ? verificationCode : null,
      verifiedBy: initialStatus === 'verified' ? 'Podar Academic Board' : null,
      verifiedAt: initialStatus === 'verified' ? new Date().toISOString() : null,
      submittedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${apiBase}/api/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCert)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.certificate) {
          saveCertificates([data.certificate, ...certificates.filter(c => c.id !== data.certificate.id)]);
          notify?.('Certificate uploaded successfully! Submitted for verification.');
          setUploadModalOpen(false);
          setUploading(false);
          return;
        }
      }
    } catch (err) {}

    // Fallback save to local storage & state
    const updated = [newCert, ...certificates.filter(c => c.id !== newCert.id)];
    saveCertificates(updated);
    notify?.('Certificate uploaded successfully! Submitted for verification.');
    setUploadModalOpen(false);
    setUploading(false);
  };

  // Demo verify certificate (so users can test approving a certificate into the gallery)
  const handleApprovePendingCert = (cert) => {
    const verifiedCode = `PODAR-VERIF-${Math.floor(100000 + Math.random() * 900000)}`;
    const verifiedCert = {
      ...cert,
      status: 'verified',
      verificationCode: verifiedCode,
      verifiedBy: 'Podar Academic Board',
      verifiedAt: new Date().toISOString(),
      adminRemarks: 'Verified by college administrator.'
    };

    const updated = certificates.map(c => c.id === cert.id ? verifiedCert : c);
    saveCertificates(updated);

    if (setState) {
      setState(prev => ({
        ...prev,
        students: (prev.students || []).map(s => {
          if (s.id === cert.studentId) {
            return {
              ...s,
              certificates: (s.certificates || 0) + 1,
              score: Math.min(100, (Number(s.score) || 60) + 12)
            };
          }
          return s;
        })
      }));
    }

    notify?.(`Certificate for "${cert.programTitle}" has been verified! It is now visible in the Certificates Gallery.`);
    setPendingInfoCert(null);
  };

  // Check if student has submitted for this course
  const getStudentCertForCourse = (course) => {
    return certificates.find(c =>
      c.studentId === currentStudentId &&
      (c.programId === course.id || c.programTitle?.toLowerCase() === course.title?.toLowerCase())
    );
  };

  // Filter courses by search
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return allAvailableCourses;
    return allAvailableCourses.filter(c =>
      (c.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [allAvailableCourses, searchQuery]);

  // Certificate Stats & Counts
  const certStats = useMemo(() => {
    return {
      total: certificates.length,
      verified: certificates.filter(c => c.status === 'verified').length,
      pending: certificates.filter(c => c.status === 'pending').length,
      rejected: certificates.filter(c => c.status === 'rejected').length
    };
  }, [certificates]);

  // Unique Courses for Certificates Filter
  const certAvailableCourses = useMemo(() => {
    const set = new Set(['BCA', 'MCA', 'B.Sc IT', 'BBA', 'B.Com']);
    certificates.forEach(c => {
      const crs = c.course || c.studentCourse || c.studentDepartment;
      if (crs) set.add(crs);
    });
    return Array.from(set).filter(Boolean);
  }, [certificates]);

  // Filtered and Sorted Certificates
  const displayedGalleryCertificates = useMemo(() => {
    const list = certificates.filter(cert => {
      // Status filter
      if (certStatusFilter !== 'all' && cert.status !== certStatusFilter) return false;

      // Course filter
      if (certCourseFilter !== 'all') {
        const crs = (cert.course || cert.studentCourse || cert.studentDepartment || '').toLowerCase();
        if (crs !== certCourseFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const sName = (cert.studentName || '').toLowerCase();
        const pTitle = (cert.programTitle || '').toLowerCase();
        const credId = (cert.credentialId || '').toLowerCase();
        const vCode = (cert.verificationCode || '').toLowerCase();
        const issuer = (cert.issuer || '').toLowerCase();
        const crs = (cert.course || cert.studentCourse || cert.studentDepartment || '').toLowerCase();
        return sName.includes(q) || pTitle.includes(q) || credId.includes(q) || vCode.includes(q) || issuer.includes(q) || crs.includes(q);
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (certSortOrder === 'newest') {
        const dateA = new Date(a.submittedAt || a.issueDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.submittedAt || b.issueDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      }
      if (certSortOrder === 'course-az') {
        const crsA = a.course || a.studentCourse || a.studentDepartment || '';
        const crsB = b.course || b.studentCourse || b.studentDepartment || '';
        return crsA.localeCompare(crsB);
      }
      if (certSortOrder === 'title-az') {
        return (a.programTitle || '').localeCompare(b.programTitle || '');
      }
      return 0;
    });
  }, [certificates, certStatusFilter, certCourseFilter, searchQuery, certSortOrder]);

  // Gallery lightbox active cert
  const activeLightboxCert = lightboxIndex !== null ? displayedGalleryCertificates[lightboxIndex] : null;

  const handlePrevCert = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    } else if (lightboxIndex === 0) {
      setLightboxIndex(displayedGalleryCertificates.length - 1);
    }
  };

  const handleNextCert = () => {
    if (lightboxIndex !== null && lightboxIndex < displayedGalleryCertificates.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    } else if (lightboxIndex === displayedGalleryCertificates.length - 1) {
      setLightboxIndex(0);
    }
  };

  // Touch Swipe gesture handlers for mobile
  const handleTouchStart = (e) => {
    touchStartRef.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEndX;
    if (diff > 50) {
      handleNextCert(); // Swiped left -> next
    } else if (diff < -50) {
      handlePrevCert(); // Swiped right -> prev
    }
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrevCert();
      if (e.key === 'ArrowRight') handleNextCert();
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'i' || e.key === 'I') setShowInfoPane(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, displayedGalleryCertificates.length]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    notify?.('Verification code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Group certificates by Month/Year like Google Photos timeline
  const groupedTimeline = useMemo(() => {
    const groups = {};
    displayedGalleryCertificates.forEach(cert => {
      const dateStr = cert.issueDate || '2026-10-24';
      const dateObj = new Date(dateStr);
      const groupKey = isNaN(dateObj.getTime())
        ? 'October 2026'
        : dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(cert);
    });
    return groups;
  }, [displayedGalleryCertificates]);

  // Modal Renderers (Used across Courses & Certificates views)
  const renderUploadModal = () => {
    if (!uploadModalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setUploadModalOpen(false)}>
        <div className="modal-card minimal-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Upload Certificate</h3>
              <p className="modal-subtitle">
                {uploadForm.programTitle
                  ? <>Upload completion credential for <strong>{uploadForm.programTitle}</strong>.</>
                  : 'Submit certificate credential for administrator verification.'}
              </p>
            </div>
            <button
              type="button"
              className="icon-close-btn"
              onClick={() => setUploadModalOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitCertificate} className="modal-form">
            <label className="modal-field">
              <span className="field-label">Course / Credential Title *</span>
              {!selectedCourseForUpload && (
                <select
                  className="minimal-table-filter-select"
                  value={allAvailableCourses.some(c => c.title === uploadForm.programTitle) ? uploadForm.programTitle : ''}
                  onChange={e => {
                    const val = e.target.value;
                    const found = allAvailableCourses.find(c => c.title === val);
                    setUploadForm(prev => ({
                      ...prev,
                      programTitle: val,
                      courseId: found?.id || ''
                    }));
                  }}
                  style={{ marginBottom: '8px', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff', width: '100%' }}
                >
                  <option value="">-- Select from Curated Courses (or type below) --</option>
                  {allAvailableCourses.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                required
                placeholder="e.g. Meta Frontend Developer Professional Certificate"
                value={uploadForm.programTitle}
                onChange={e => setUploadForm({ ...uploadForm, programTitle: e.target.value })}
              />
            </label>

            <div className="modal-field-row">
              <label className="modal-field">
                <span className="field-label">Credential ID (Optional)</span>
                <input
                  type="text"
                  placeholder="e.g. CERT-2026-9810"
                  value={uploadForm.credentialId}
                  onChange={e => setUploadForm({ ...uploadForm, credentialId: e.target.value })}
                />
              </label>

              <label className="modal-field">
                <span className="field-label">Issue Date</span>
                <input
                  type="date"
                  value={uploadForm.issueDate}
                  onChange={e => setUploadForm({ ...uploadForm, issueDate: e.target.value })}
                />
              </label>
            </div>

            <div className="upload-dropzone-container">
              <span className="field-label">Certificate Document (JPG, PNG, WebP) *</span>

              {compressing ? (
                <div className="upload-compressing-box">
                  <Clock size={24} className="spin-icon" />
                  <span>Optimizing image for fast upload...</span>
                </div>
              ) : uploadForm.fileData ? (
                <div className="uploaded-preview-box">
                  <img src={uploadForm.fileData} alt="Certificate preview" className="preview-img" />
                  <div className="preview-info-bar">
                    <span className="preview-filename">{uploadForm.fileName || 'certificate.jpg'}</span>
                    <button
                      type="button"
                      className="button outline small"
                      onClick={() => setUploadForm({ ...uploadForm, fileData: '', fileName: '' })}
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="upload-dropzone">
                  <input
                    type="file"
                    id="cert-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                  <label htmlFor="cert-file-input" className="dropzone-label">
                    <Upload size={28} />
                    <strong className="dropzone-prompt">Choose photo or take camera picture</strong>
                    <span className="dropzone-hint">Supports all image formats • Automatically optimized</span>
                  </label>

                  <div className="demo-generator-box">
                    <span className="or-divider">OR</span>
                    <button
                      type="button"
                      className="button demo-gen-btn"
                      onClick={handleGenerateSampleCertificate}
                    >
                      <Sparkles size={14} />
                      <span>Generate SVG Certificate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setUploadModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={uploading || compressing || !uploadForm.programTitle || !uploadForm.fileData}
              >
                {uploading ? 'Uploading...' : 'Submit Certificate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderPendingInfoModal = () => {
    if (!pendingInfoCert) return null;
    return (
      <div className="modal-backdrop" onClick={() => setPendingInfoCert(null)}>
        <div className="modal-card minimal-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Certificate Under Review</h3>
              <p className="modal-subtitle">Submitted for college verification</p>
            </div>
            <button className="icon-close-btn" onClick={() => setPendingInfoCert(null)}>
              <X size={18} />
            </button>
          </div>

          <div className="pending-status-body">
            <div className="pending-info-row">
              <Clock size={20} color="#d97706" />
              <div>
                <strong>{pendingInfoCert.programTitle}</strong>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Submitted on {new Date(pendingInfoCert.submittedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {pendingInfoCert.fileData && (
              <div className="pending-preview-thumb">
                <img src={pendingInfoCert.fileData} alt="Pending preview" />
              </div>
            )}

            <div className="pending-note-box">
              <span>Your certificate document has been saved and is currently awaiting administrator verification.</span>
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button
                type="button"
                className="button outline"
                onClick={() => setPendingInfoCert(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => handleApprovePendingCert(pendingInfoCert)}
              >
                <Check size={14} />
                <span>Approve & Verify</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TAB 1: MINIMAL COURSE TAB (Banner Img + Course Name + Two Buttons)
  // =========================================================================
  if (isCoursesOnly) {
    return (
      <div className="minimal-course-container">
        {/* Minimal Header */}
        <div className="minimal-course-header">
          <div>
            <h1 className="minimal-page-title">Courses</h1>
            <p className="minimal-page-subtitle">Select a course to continue learning or upload your certificate.</p>
          </div>

          <div className="minimal-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
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

        {/* Minimal Course Cards: Banner Img + Course Name + Validity + Two Buttons */}
        <section className="minimal-course-grid">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => {
              const cert = getStudentCertForCourse(course);
              const isOpening = openingCourseId === course.id;
              const bannerImage = course.image || course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
              const validity = getCourseValidityInfo(course.validTill || course.deadline || course.valid_till);

              return (
                <article key={course.id} className="minimal-course-card">
                  {/* 1. Banner Image */}
                  <div className="minimal-course-banner">
                    <img
                      src={bannerImage}
                      alt={course.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="minimal-course-body">
                    {/* 2. Course Name */}
                    <div className="minimal-course-header-meta">
                      <h3 className="minimal-course-title">{course.title}</h3>
                    </div>

                    {/* 3. Two Buttons */}
                    <div className="minimal-course-actions">
                      {/* Button 1: Continue course (redirects to external site) */}
                      <button
                        className="button primary minimal-btn"
                        onClick={() => handleOpenCourse(course)}
                        disabled={isOpening}
                      >
                        <span>{isOpening ? 'Opening...' : course.enrolled ? 'Continue course' : 'Open course'}</span>
                        <ExternalLink size={14} />
                      </button>

                      {/* Button 2: Upload Certificate */}
                      {cert?.status === 'verified' ? (
                        <button
                          className="button outline minimal-btn verified"
                          onClick={() => {
                            const idx = onlyVerifiedCertificates.findIndex(c => c.id === cert.id);
                            setLightboxIndex(idx !== -1 ? idx : 0);
                          }}
                          title="View Verified Certificate"
                        >
                          <Award size={14} />
                          <span>View Certificate</span>
                        </button>
                      ) : cert?.status === 'pending' ? (
                        <button
                          className="button outline minimal-btn pending"
                          onClick={() => setPendingInfoCert(cert)}
                          title="Click to view submission status"
                        >
                          <Clock size={14} />
                          <span>Under Review</span>
                        </button>
                      ) : (
                        <button
                          className="button outline minimal-btn"
                          onClick={() => handleOpenUploadModal(course)}
                          title="Upload your certificate"
                        >
                          <Upload size={14} />
                          <span>Upload Certificate</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="minimal-empty-state">
              <BookOpen size={36} color="#94a3b8" />
              <h3>No courses found</h3>
              <p>Try searching with another keyword.</p>
            </div>
          )}
        </section>

        {/* Modals & Viewer */}
        {renderUploadModal()}
        {renderPendingInfoModal()}
        {activeLightboxCert && renderGooglePhotosViewer()}
      </div>
    );
  }

  // =========================================================================
  // TAB 2: CERTIFICATES TAB (Executive Minimalist Credential Hub)
  // =========================================================================
  return (
    <div className="minimal-admin-container gphotos-library-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      {/* 1. Header with Upload Certificate button */}
      <div className="minimal-admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <span className="minimal-admin-eyebrow">ACADEMIC & PROFESSIONAL CREDENTIALS</span>
          <h1 className="minimal-admin-title">Certificates & Credentials</h1>
          <p className="minimal-admin-subtitle">
            Upload course completion certificates, track administrator verification, and view accredited college credentials.
          </p>
        </div>

        <button
          type="button"
          className="minimal-btn-primary"
          onClick={() => handleOpenUploadModal(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={16} />
          <span>Upload Certificate</span>
        </button>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="minimal-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#f1f5f9', color: '#0f172a' }}>
            <Award size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Total Credentials</span>
            <strong className="minimal-stat-val">{certStats.total}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <ShieldCheck size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Verified</span>
            <strong className="minimal-stat-val" style={{ color: '#16a34a' }}>{certStats.verified}</strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Under Review</span>
            <strong className="minimal-stat-val" style={{ color: certStats.pending > 0 ? '#d97706' : '#0f172a' }}>
              {certStats.pending}
            </strong>
          </div>
        </div>

        <div className="minimal-stat-card">
          <div className="minimal-stat-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="minimal-stat-meta">
            <span className="minimal-stat-label">Needs Revision</span>
            <strong className="minimal-stat-val" style={{ color: certStats.rejected > 0 ? '#dc2626' : '#0f172a' }}>
              {certStats.rejected}
            </strong>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div className="minimal-admin-panel" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
          {/* Status Tabs */}
          <div className="admin-cert-tabs">
            <button
              type="button"
              className={`admin-cert-tab-btn ${certStatusFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setCertStatusFilter('all')}
            >
              <span>All</span>
              <span className="admin-cert-tab-badge">{certStats.total}</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${certStatusFilter === 'verified' ? 'is-active' : ''}`}
              onClick={() => setCertStatusFilter('verified')}
            >
              <span>Verified</span>
              <span className="admin-cert-tab-badge success">{certStats.verified}</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${certStatusFilter === 'pending' ? 'is-active' : ''}`}
              onClick={() => setCertStatusFilter('pending')}
            >
              <span>Under Review</span>
              <span className="admin-cert-tab-badge warning">{certStats.pending}</span>
            </button>
            <button
              type="button"
              className={`admin-cert-tab-btn ${certStatusFilter === 'rejected' ? 'is-active' : ''}`}
              onClick={() => setCertStatusFilter('rejected')}
            >
              <span>Needs Attention</span>
              <span className="admin-cert-tab-badge danger">{certStats.rejected}</span>
            </button>
          </div>

          {/* Course Filter, Sort Order & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <select
              className="minimal-table-filter-select"
              value={certCourseFilter}
              onChange={e => setCertCourseFilter(e.target.value)}
              title="Filter by course"
              style={{ minWidth: '130px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
            >
              <option value="all">All Courses</option>
              {certAvailableCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="minimal-table-filter-select"
              value={certSortOrder}
              onChange={e => setCertSortOrder(e.target.value)}
              title="Sort certificates"
              style={{ minWidth: '140px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', background: '#ffffff' }}
            >
              <option value="newest">Newest First</option>
              <option value="course-az">Course (A-Z)</option>
              <option value="title-az">Title (A-Z)</option>
            </select>

            <div className="minimal-search-box" style={{ maxWidth: '240px', width: '100%', margin: 0 }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
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

      {/* 4. Certificate Cards Grid */}
      <div className="gphotos-grid">
        {displayedGalleryCertificates.length > 0 ? (
          displayedGalleryCertificates.map(cert => {
            const isVerified = cert.status === 'verified';
            const isPending = cert.status === 'pending';
            const isRejected = cert.status === 'rejected';
            const globalIdx = displayedGalleryCertificates.findIndex(c => c.id === cert.id);
            const certCourse = cert.course || cert.studentCourse || cert.studentDepartment;

            return (
              <div
                key={cert.id}
                className={`gphotos-tile ${cert.status}`}
                style={{ borderRadius: '12px', overflow: 'hidden', border: isRejected ? '1px solid #fecaca' : isPending ? '1px solid #fde68a' : '1px solid #e2e8f0', background: '#ffffff' }}
                onClick={() => {
                  if (isPending) {
                    setPendingInfoCert(cert);
                  } else {
                    setLightboxIndex(globalIdx !== -1 ? globalIdx : 0);
                    setShowInfoPane(false);
                  }
                }}
              >
                <div className="gphotos-image-wrapper" style={{ position: 'relative', aspectRatio: '16/10', background: '#0f172a' }}>
                  {cert.fileData?.startsWith('data:image') ? (
                    <img
                      src={cert.fileData}
                      alt={`${cert.studentName} - ${cert.programTitle}`}
                      className="gphotos-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="gphotos-fallback-tile">
                      <Award size={36} color="#0d9488" />
                      <span>{cert.programTitle}</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3, pointerEvents: 'none' }}>
                    {certCourse ? (
                      <span style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' }}>
                        {certCourse}
                      </span>
                    ) : <span />}

                    {isVerified ? (
                      <span style={{ background: 'rgba(22, 163, 74, 0.92)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Verified
                      </span>
                    ) : isPending ? (
                      <span style={{ background: 'rgba(217, 119, 6, 0.92)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> Under Review
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(220, 38, 38, 0.92)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> Needs Revision
                      </span>
                    )}
                  </div>

                  {/* Bottom Gradient Title Overlay */}
                  <div className="gphotos-gradient-overlay">
                    <strong className="gphotos-tile-name">{cert.programTitle}</strong>
                    <span className="gphotos-tile-course">
                      {cert.studentName} {cert.verificationCode ? `• ${cert.verificationCode}` : ''}
                    </span>
                  </div>
                </div>

                {/* If Rejected: Show Admin Denial Remarks & Re-upload button */}
                {isRejected && (
                  <div
                    style={{ padding: '12px 14px', background: '#fef2f2', borderTop: '1px solid #fee2e2' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#991b1b', lineHeight: '1.45' }}>
                      <strong>Administrator Feedback:</strong><br />
                      {cert.adminRemarks || 'Document declined. Please re-upload a clear copy.'}
                    </p>
                    <button
                      type="button"
                      className="minimal-btn-primary"
                      style={{ fontSize: '12px', padding: '5px 12px', width: '100%', justifyContent: 'center' }}
                      onClick={() => handleOpenUploadModal({ id: cert.programId, title: cert.programTitle })}
                    >
                      <Upload size={12} /> Re-upload Certificate
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="gphotos-empty-state" style={{ gridColumn: '1 / -1', padding: '48px 20px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Award size={48} color="#94a3b8" />
            <h3 style={{ margin: '12px 0 6px 0', fontSize: '17px', color: '#0f172a' }}>No certificates found</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13.5px', color: '#64748b' }}>
              {certStatusFilter !== 'all' || certCourseFilter !== 'all' || searchQuery
                ? 'Try adjusting your status or course filters.'
                : 'Upload your first course completion certificate to get verified by administrators.'}
            </p>
            <button
              type="button"
              className="minimal-btn-primary"
              onClick={() => handleOpenUploadModal(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
            >
              <Upload size={15} />
              <span>Upload Certificate</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals & Viewer */}
      {renderUploadModal()}
      {renderPendingInfoModal()}
      {activeLightboxCert && renderGooglePhotosViewer()}
    </div>
  );

  // =========================================================================
  // GOOGLE PHOTOS VIEWER (Mobile-Optimized Fullscreen + Touch Swipe)
  // =========================================================================
  function renderGooglePhotosViewer() {
    if (!activeLightboxCert) return null;

    return (
      <div
        className="gphotos-viewer-backdrop"
        onClick={() => setLightboxIndex(null)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top Floating App Bar */}
        <div className="gphotos-viewer-topbar" onClick={e => e.stopPropagation()}>
          <div className="topbar-left">
            <button
              className="gphotos-icon-btn"
              onClick={() => setLightboxIndex(null)}
              title="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="topbar-meta">
              <span className="topbar-title">{activeLightboxCert.programTitle}</span>
              <span className="topbar-sub">
                {activeLightboxCert.studentName}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Download */}
            {activeLightboxCert.fileData && (
              <a
                href={activeLightboxCert.fileData}
                download={`${(activeLightboxCert.programTitle || 'certificate').toLowerCase().replace(/\s+/g, '-')}-${(activeLightboxCert.studentName || 'student').toLowerCase().replace(/\s+/g, '-')}.svg`}
                className="gphotos-icon-btn"
                target="_blank"
                rel="noreferrer"
                title="Download"
              >
                <Download size={19} />
              </a>
            )}

            {/* Print */}
            <button
              className="gphotos-icon-btn desktop-only-btn"
              onClick={() => window.print()}
              title="Print"
            >
              <Printer size={19} />
            </button>

            {/* Copy Verification Code */}
            <button
              className="gphotos-icon-btn"
              onClick={() => handleCopyCode(activeLightboxCert.verificationCode)}
              title="Copy Verification Code"
            >
              {copiedCode ? <Check size={19} color="#10b981" /> : <Copy size={19} />}
            </button>

            {/* Info Drawer Toggle */}
            <button
              className={`gphotos-icon-btn ${showInfoPane ? 'active' : ''}`}
              onClick={() => setShowInfoPane(prev => !prev)}
              title="Details"
            >
              <Info size={19} />
            </button>

            {/* Close */}
            <button
              className="gphotos-icon-btn"
              onClick={() => setLightboxIndex(null)}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Center Area: Photo + Prev/Next Controls + Info Panel */}
        <div className="gphotos-viewer-stage" onClick={e => e.stopPropagation()}>
          {/* Previous Arrow */}
          <button
            className="gphotos-nav-btn prev"
            onClick={handlePrevCert}
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Photo Canvas Container */}
          <div className="gphotos-canvas-area">
            {activeLightboxCert.fileData?.startsWith('data:image') ? (
              <img
                src={activeLightboxCert.fileData}
                alt={`${activeLightboxCert.studentName} Certificate`}
                className="gphotos-full-img"
              />
            ) : (
              <div className="gphotos-fallback-canvas">
                <Award size={56} color="#14b8a6" />
                <h2>{activeLightboxCert.programTitle}</h2>
                <p>Awarded to {activeLightboxCert.studentName}</p>
              </div>
            )}
          </div>

          {/* Next Arrow */}
          <button
            className="gphotos-nav-btn next"
            onClick={handleNextCert}
            title="Next (Right Arrow)"
          >
            <ChevronRight size={32} />
          </button>

          {/* Google Photos "Info" Details Sidebar Pane */}
          {showInfoPane && (
            <aside className="gphotos-info-pane">
              <div className="info-pane-header">
                <h3>Details</h3>
                <button className="gphotos-icon-btn small" onClick={() => setShowInfoPane(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="info-pane-content">
                <div className="info-status-card">
                  <ShieldCheck size={20} color="#059669" />
                  <div>
                    <strong>Verified Credential</strong>
                    <span>Validated by Podar Academic Board</span>
                  </div>
                </div>

                <div className="info-section">
                  <span className="info-label">PROGRAM TITLE</span>
                  <p className="info-value primary">{activeLightboxCert.programTitle}</p>
                </div>

                <div className="info-section">
                  <span className="info-label">RECIPIENT</span>
                  <div className="info-user-row">
                    <div className="info-avatar">
                      {activeLightboxCert.studentName?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div>
                      <strong className="info-user-name">{activeLightboxCert.studentName}</strong>
                      <span className="info-user-dept">
                        {activeLightboxCert.studentDepartment || 'BCA • Semester V'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <span className="info-label">VERIFICATION CODE</span>
                  <div className="info-code-box">
                    <code>{activeLightboxCert.verificationCode || 'PODAR-VERIF-78291'}</code>
                    <button
                      className="button outline small"
                      onClick={() => handleCopyCode(activeLightboxCert.verificationCode)}
                    >
                      {copiedCode ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="info-section">
                  <span className="info-label">CREDENTIAL ID</span>
                  <p className="info-value">{activeLightboxCert.credentialId || 'N/A'}</p>
                </div>

                <div className="info-section">
                  <span className="info-label">PARTNER / ISSUER</span>
                  <p className="info-value">{activeLightboxCert.issuer || 'Podar Pathways Alliance'}</p>
                </div>

                <div className="info-section">
                  <span className="info-label">DATE OF ISSUE</span>
                  <p className="info-value">
                    <Calendar size={14} style={{ display: 'inline', marginRight: 6 }} />
                    {activeLightboxCert.issueDate || 'October 2026'}
                  </p>
                </div>

                <div className="info-section">
                  <span className="info-label">AUTHENTICATED BY</span>
                  <p className="info-value">{activeLightboxCert.verifiedBy || 'Podar Pathways Academic Board'}</p>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Floating Bottom Navigation Strip */}
        <div className="gphotos-mobile-nav-bar" onClick={e => e.stopPropagation()}>
          <button className="mobile-nav-btn" onClick={handlePrevCert}>
            <ChevronLeft size={20} />
            <span>Prev</span>
          </button>
          <span className="mobile-nav-counter">
            {(lightboxIndex !== null ? lightboxIndex + 1 : 1)} / {displayedGalleryCertificates.length}
          </span>
          <button className="mobile-nav-btn" onClick={handleNextCert}>
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }
}
