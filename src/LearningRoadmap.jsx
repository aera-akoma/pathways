import React, { useState, useEffect, useMemo } from 'react';
import './styles.css';
import {
  Target,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
  Briefcase,
  Code,
  Check,
  Trophy,
  Layers,
  Award,
  Sparkles
} from 'lucide-react';

// =========================================================================
// PRE-DEFINED INDUSTRY CAREER TRACKS
// =========================================================================
const CAREER_TRACKS = {
  'Software Engineer': {
    id: 'swe',
    name: 'Software Engineer & Full-Stack Developer',
    description: 'Master core data structures, scalable frontend engineering, REST/GraphQL APIs, and production system architecture.',
    icon: Code,
    category: 'Engineering',
    timeline: '6 Months',
    milestones: [
      {
        id: 'swe-1',
        number: '01',
        title: 'Core Computer Science & Algorithmic Foundations',
        duration: 'Weeks 1–4',
        summary: 'Solidify fundamental data structures, memory layout, Big-O analysis, and problem-solving techniques.',
        skills: ['Data Structures', 'Algorithms', 'Time & Space Complexity', 'Recursion & Sorting'],
        checklist: [
          'Master Arrays, Hash Maps, Linked Lists, Stacks and Queues',
          'Practice Recursion, Binary Search, and Tree traversals',
          'Solve 35+ foundational LeetCode Easy & Medium problems',
          'Set up Git version control & professional GitHub profile'
        ],
        actionType: 'courses',
        actionLabel: 'Browse CS Foundations Courses',
        aiPrompt: 'How can I practice Data Structures & Algorithms effectively for technical interviews?'
      },
      {
        id: 'swe-2',
        number: '02',
        title: 'Modern Frontend & Component Architecture',
        duration: 'Weeks 5–10',
        summary: 'Build high-performance, accessible, responsive user interfaces with React, state management, and modern CSS.',
        skills: ['React 19', 'JavaScript ES6+', 'TypeScript', 'Tailwind CSS', 'State Management'],
        checklist: [
          'Master React hooks, component lifecycles, and re-rendering optimization',
          'Build responsive, mobile-friendly layouts with modern CSS / Tailwind',
          'Integrate asynchronous REST APIs with error handling & loading skeletons',
          'Implement client-side routing, URL synchronization, and lazy loading'
        ],
        actionType: 'projects',
        actionLabel: 'Build & Publish Frontend Project',
        aiPrompt: 'What are the best architecture patterns for building scalable React client applications?'
      },
      {
        id: 'swe-3',
        number: '03',
        title: 'Backend Systems & Database Architecture',
        duration: 'Weeks 11–16',
        summary: 'Design robust backend services, relational and document databases, authentication systems, and secure endpoints.',
        skills: ['Node.js', 'Express / FastAPI', 'PostgreSQL / MySQL', 'JWT Auth', 'REST APIs'],
        checklist: [
          'Design normalized relational database schemas with foreign keys and indexes',
          'Implement secure user authentication with password hashing and JWT sessions',
          'Create complete CRUD REST APIs with input validation and rate limiting',
          'Handle file uploads safely with server-side validation and storage'
        ],
        actionType: 'courses',
        actionLabel: 'Browse Backend & DB Courses',
        aiPrompt: 'Explain how to design scalable database schemas with proper indexing and relationship modeling.'
      },
      {
        id: 'swe-4',
        number: '04',
        title: 'Full-Stack Portfolio Capstone & Production Deployment',
        duration: 'Weeks 17–20',
        summary: 'Synthesize your skills into an end-to-end production web application with live demo, documentation, and automated tests.',
        skills: ['Full-Stack MERN', 'Docker', 'CI/CD Pipelines', 'Cloud Deployment', 'Testing'],
        checklist: [
          'Build a feature-complete web application solving a real campus or industry problem',
          'Deploy the production app with HTTPS, custom domain, and automated deployment',
          'Write a comprehensive README with architecture diagrams and API documentation',
          'Publish your project on Podar Pathways to collect peer likes & reviews'
        ],
        actionType: 'projects',
        actionLabel: 'Publish Capstone on Student Projects',
        aiPrompt: 'Review my project concept and give me suggestions to make it stand out to hiring managers.'
      },
      {
        id: 'swe-5',
        number: '05',
        title: 'Interview Readiness, System Design & Placement Applications',
        duration: 'Weeks 21–24',
        summary: 'Fine-tune your resume with measurable metrics, practice behavioral and technical mock interviews, and apply for opportunities.',
        skills: ['System Design', 'Mock Technical Interviews', 'ATS Resume', 'Portfolio Review'],
        checklist: [
          'Optimize resume with ATS keywords and action-driven project bullet points',
          'Complete 2 full mock technical interviews and 1 system design session',
          'Earn verified certifications for CS fundamentals and elected courses',
          'Apply to at least 5 campus placements or corporate internships'
        ],
        actionType: 'opportunities',
        actionLabel: 'Apply for Campus Placements & Internships',
        aiPrompt: 'Give me the top 10 technical interview questions asked for junior software engineering roles.'
      }
    ]
  },
  'AI & Data Science': {
    id: 'ai-ds',
    name: 'AI & Data Science Specialist',
    description: 'Master data analysis, exploratory statistics, machine learning models, neural networks, and generative AI applications.',
    icon: Sparkles,
    category: 'Data & AI',
    timeline: '6 Months',
    milestones: [
      {
        id: 'ai-1',
        number: '01',
        title: 'Mathematics, Statistics & Python Foundations',
        duration: 'Weeks 1–4',
        summary: 'Master Python syntax, NumPy vectors, Pandas dataframes, and statistical foundations for data science.',
        skills: ['Python 3', 'NumPy', 'Pandas', 'Descriptive Statistics', 'Linear Algebra'],
        checklist: [
          'Write clean, idiomatic Python with object-oriented and functional paradigms',
          'Clean, filter, and transform complex datasets using Pandas',
          'Understand probability distributions, hypothesis testing, and p-values',
          'Visualize patterns with Matplotlib, Seaborn, and interactive charts'
        ],
        actionType: 'courses',
        actionLabel: 'Browse Python & Data Courses',
        aiPrompt: 'What mathematical concepts should I focus on first for practical data science?'
      },
      {
        id: 'ai-2',
        number: '02',
        title: 'Exploratory Data Analysis & Feature Engineering',
        duration: 'Weeks 5–8',
        summary: 'Extract insights from raw real-world data, handle missing values, and engineer features for machine learning.',
        skills: ['Data Wrangling', 'Feature Engineering', 'SQL Queries', 'Data Storytelling'],
        checklist: [
          'Write complex SQL queries with joins, aggregates, and window functions',
          'Perform thorough EDA uncovering outliers, correlations, and distributions',
          'Scale, normalize, and encode categorical data with Scikit-Learn pipelines',
          'Publish a comprehensive Jupyter notebook analysis on GitHub'
        ],
        actionType: 'projects',
        actionLabel: 'Publish EDA Case Study',
        aiPrompt: 'How do I perform effective feature engineering on tabular datasets?'
      },
      {
        id: 'ai-3',
        number: '03',
        title: 'Machine Learning Algorithms & Predictive Modeling',
        duration: 'Weeks 9–14',
        summary: 'Train, evaluate, and tune supervised and unsupervised machine learning algorithms for real predictive tasks.',
        skills: ['Scikit-Learn', 'Regression', 'Classification', 'Clustering', 'Model Evaluation'],
        checklist: [
          'Build linear regression, logistic regression, decision trees, and random forests',
          'Implement cross-validation, hyperparameter tuning, and ROC-AUC metrics',
          'Apply unsupervised learning with K-Means and PCA dimensionality reduction',
          'Prevent model overfitting with regularisation and proper train/test splits'
        ],
        actionType: 'courses',
        actionLabel: 'Elect Machine Learning Course',
        aiPrompt: 'Explain how to prevent overfitting in machine learning models.'
      },
      {
        id: 'ai-4',
        number: '04',
        title: 'Deep Learning & Modern LLM Applications',
        duration: 'Weeks 15–20',
        summary: 'Explore neural networks with PyTorch, computer vision, natural language processing, and prompt engineering.',
        skills: ['PyTorch', 'Neural Networks', 'Hugging Face', 'Transformers', 'Prompt Engineering'],
        checklist: [
          'Understand neural network forward/backward propagation and loss functions',
          'Train a convolutional neural network for image classification',
          'Use pre-trained Hugging Face transformers for text classification and summarization',
          'Build a retrieval-augmented generation (RAG) prototype using embeddings and vector search'
        ],
        actionType: 'projects',
        actionLabel: 'Share AI Project on Feed',
        aiPrompt: 'How can I build a RAG chatbot using open source models and vector databases?'
      },
      {
        id: 'ai-5',
        number: '05',
        title: 'Model Deployment & Portfolio Showcase',
        duration: 'Weeks 21–24',
        summary: 'Deploy machine learning models via REST APIs with FastAPI, Streamlit interactive web apps, and apply to data roles.',
        skills: ['FastAPI', 'Streamlit', 'Docker', 'Model Serving', 'Portfolio Presentation'],
        checklist: [
          'Containerize a trained model with Docker and serve predictions via FastAPI',
          'Build an interactive dashboard on Streamlit for live demonstrations',
          'Complete a capstone data science presentation highlighting business impact',
          'Apply for Data Science & Machine Learning internships'
        ],
        actionType: 'opportunities',
        actionLabel: 'Explore Data Science Internships',
        aiPrompt: 'How do hiring managers evaluate a data science portfolio project?'
      }
    ]
  },
  'Mobile App Developer': {
    id: 'mobile',
    name: 'Mobile Application Engineer',
    description: 'Build native and cross-platform mobile apps using Flutter or React Native, device hardware integration, and store publishing.',
    icon: Layers,
    category: 'Mobile',
    timeline: '5 Months',
    milestones: [
      {
        id: 'mob-1',
        number: '01',
        title: 'Mobile Programming Foundations & Dart / Swift',
        duration: 'Weeks 1–4',
        summary: 'Master object-oriented programming, asynchronous paradigms, and mobile design principles.',
        skills: ['Dart / Kotlin', 'Async / Await', 'OOP', 'Mobile UI Guidelines'],
        checklist: [
          'Master language fundamentals, collections, null-safety, and streams',
          'Understand Android Material 3 and iOS Cupertino design patterns',
          'Set up development environment with Android Studio / Xcode emulators',
          'Build 3 simple native utility mini-apps'
        ],
        actionType: 'courses',
        actionLabel: 'Browse Mobile Dev Courses',
        aiPrompt: 'What are the main differences between Flutter and React Native for beginners?'
      },
      {
        id: 'mob-2',
        number: '02',
        title: 'State Management & Responsive Screen Layouts',
        duration: 'Weeks 5–8',
        summary: 'Construct complex reactive user interfaces with scalable state management architecture.',
        skills: ['Bloc / Riverpod', 'Navigation 2.0', 'Custom Animations', 'Responsive Layout'],
        checklist: [
          'Implement predictable state management with Bloc or Riverpod',
          'Design adaptive layouts supporting varied phone and tablet screens',
          'Create smooth touch interactions, gestures, and hero animations',
          'Implement deep-linking and hierarchical multi-screen navigation'
        ],
        actionType: 'projects',
        actionLabel: 'Build Mobile UI Showcase',
        aiPrompt: 'How should I structure state management in a large mobile application?'
      },
      {
        id: 'mob-3',
        number: '03',
        title: 'API Integration & Offline-First Storage',
        duration: 'Weeks 9–14',
        summary: 'Connect your mobile app to backend cloud services, local caching databases, and authentication.',
        skills: ['REST APIs', 'SQLite / Hive', 'Offline Caching', 'OAuth2 / JWT'],
        checklist: [
          'Fetch and synchronize network data with retry logic and error toasts',
          'Implement offline-first persistent storage using SQLite or Hive',
          'Manage user authentication tokens with secure encrypted keystore',
          'Optimize app startup time and image memory caching'
        ],
        actionType: 'courses',
        actionLabel: 'Explore Cloud & API Courses',
        aiPrompt: 'Explain how to design an offline-first mobile app that syncs data when reconnected.'
      },
      {
        id: 'mob-4',
        number: '04',
        title: 'Device Hardware & Hardware APIs',
        duration: 'Weeks 15–18',
        summary: 'Leverage device sensors, push notifications, camera, geolocation, and background tasks.',
        skills: ['Push Notifications', 'Camera & Media', 'Geolocation', 'Background Tasks'],
        checklist: [
          'Implement camera capture, gallery selection, and image compression',
          'Integrate push notifications via Firebase Cloud Messaging',
          'Access GPS location with permission handling on Android & iOS',
          'Package release APK / AAB bundles with signed keystores'
        ],
        actionType: 'projects',
        actionLabel: 'Share App Demo on Projects Feed',
        aiPrompt: 'How do I handle runtime permissions cleanly on Android and iOS?'
      },
      {
        id: 'mob-5',
        number: '05',
        title: 'Play Store Publishing & Job Applications',
        duration: 'Weeks 19–20',
        summary: 'Prepare store listings, privacy policies, automated testing, and apply to mobile engineering roles.',
        skills: ['Google Play Console', 'App Signing', 'Performance Profiling', 'Interviews'],
        checklist: [
          'Publish at least one working application to Google Play or GitHub releases',
          'Record a clean video demonstration demonstrating key user flows',
          'Prepare answers for mobile architecture and lifecycle interview questions',
          'Apply to matched mobile developer internship opportunities'
        ],
        actionType: 'opportunities',
        actionLabel: 'Apply for Mobile Internships',
        aiPrompt: 'What do tech companies look for when hiring junior mobile developers?'
      }
    ]
  },
  'Cloud & DevOps Engineer': {
    id: 'cloud',
    name: 'Cloud & DevOps Platform Engineer',
    description: 'Automate build pipelines, containerize microservices with Docker and Kubernetes, and manage cloud infrastructure.',
    icon: Briefcase,
    category: 'Infrastructure',
    timeline: '6 Months',
    milestones: [
      {
        id: 'cld-1',
        number: '01',
        title: 'Linux Systems Administration & Networking Fundamentals',
        duration: 'Weeks 1–4',
        summary: 'Learn Linux command line mastery, permissions, process management, and networking protocols.',
        skills: ['Linux Shell', 'Bash Scripting', 'TCP/IP', 'DNS & SSH', 'Security Hardening'],
        checklist: [
          'Master daily Linux administration (grep, awk, sed, systemd, journalctl)',
          'Write reusable Bash scripts for server automation and log rotation',
          'Understand OSI model, subnetting, firewalls, and reverse proxies (Nginx)',
          'Configure secure SSH keys and fail2ban intrusion prevention'
        ],
        actionType: 'courses',
        actionLabel: 'Browse Linux & Networking Courses',
        aiPrompt: 'What are the essential Linux commands and networking concepts every DevOps engineer must know?'
      },
      {
        id: 'cld-2',
        number: '02',
        title: 'Docker Containerization & Multi-Stage Builds',
        duration: 'Weeks 5–8',
        summary: 'Package applications into lightweight, reproducible containers with Docker and Docker Compose.',
        skills: ['Docker', 'Docker Compose', 'Multi-Stage Builds', 'Container Security'],
        checklist: [
          'Write optimized Dockerfiles minimizing layer size and build cache',
          'Orchestrate multi-container applications (frontend, backend, database) with Compose',
          'Manage persistent container volumes and bridge network configurations',
          'Scan containers for security vulnerabilities using tools like Trivy'
        ],
        actionType: 'projects',
        actionLabel: 'Publish Containerized Stack',
        aiPrompt: 'How do I optimize Docker image sizes for production web apps?'
      },
      {
        id: 'cld-3',
        number: '03',
        title: 'Cloud Infrastructure & AWS Core Services',
        duration: 'Weeks 9–14',
        summary: 'Deploy production infrastructure on AWS using EC2, S3, RDS, IAM, and VPC networking.',
        skills: ['AWS / GCP', 'Compute & Storage', 'VPC Networking', 'IAM Policies', 'CloudWatch'],
        checklist: [
          'Architect a secure VPC with public/private subnets and NAT gateways',
          'Deploy web services on scalable EC2 instances behind load balancers',
          'Configure S3 buckets with bucket policies and CDN acceleration (CloudFront)',
          'Implement least-privilege IAM roles and access key management'
        ],
        actionType: 'courses',
        actionLabel: 'Explore Cloud Certifications',
        aiPrompt: 'Explain how to design a highly available multi-tier web architecture on AWS.'
      },
      {
        id: 'cld-4',
        number: '04',
        title: 'Kubernetes Container Orchestration & Helm',
        duration: 'Weeks 15–19',
        summary: 'Manage container deployments at scale with Kubernetes clusters, ingress controllers, and Helm packages.',
        skills: ['Kubernetes', 'Pods & Deployments', 'Services & Ingress', 'Helm Charts'],
        checklist: [
          'Deploy and manage workloads using Kubernetes Deployments, ReplicaSets, and Services',
          'Configure ConfigMaps, Secrets, and persistent volume claims',
          'Set up Nginx Ingress with automated TLS/SSL certificate issuance',
          'Package application manifests into reusable Helm charts'
        ],
        actionType: 'projects',
        actionLabel: 'Share Kubernetes Lab Setup',
        aiPrompt: 'What is the role of Kubernetes ingress controllers and how do they route traffic?'
      },
      {
        id: 'cld-5',
        number: '05',
        title: 'CI/CD Pipelines, Infrastructure as Code & Observability',
        duration: 'Weeks 20–24',
        summary: 'Automate testing and deployment with GitHub Actions, provision cloud with Terraform, and monitor metrics.',
        skills: ['GitHub Actions', 'Terraform', 'Prometheus & Grafana', 'DevOps Careers'],
        checklist: [
          'Create automated GitHub Actions workflows for continuous integration and automated testing',
          'Write declarative Terraform manifests to provision cloud resources as code',
          'Set up Prometheus monitoring and Grafana dashboards for system metrics',
          'Apply for Cloud & DevOps Engineer internship openings'
        ],
        actionType: 'opportunities',
        actionLabel: 'Apply for Cloud Engineering Roles',
        aiPrompt: 'How should a junior DevOps engineer prepare for technical interviews?'
      }
    ]
  },
  'Cybersecurity Analyst': {
    id: 'sec',
    name: 'Cybersecurity Analyst & Ethical Hacker',
    description: 'Defend networks, detect vulnerabilities, understand OWASP web security, and prepare for industry certifications.',
    icon: Trophy,
    category: 'Security',
    timeline: '6 Months',
    milestones: [
      {
        id: 'sec-1',
        number: '01',
        title: 'Information Security & Network Defense Fundamentals',
        duration: 'Weeks 1–4',
        summary: 'Understand the CIA triad, cryptography, network protocols, and perimeter defense.',
        skills: ['CIA Triad', 'Wireshark', 'Cryptography', 'Network Defense', 'Security Policies'],
        checklist: [
          'Analyze live network packets using Wireshark to detect anomalies',
          'Understand symmetric/asymmetric encryption, hashing, and digital signatures',
          'Configure host-based firewalls, secure DNS, and VPN connections',
          'Learn risk management frameworks and security compliance standards'
        ],
        actionType: 'courses',
        actionLabel: 'Browse Cybersecurity Courses',
        aiPrompt: 'What are the best free platforms to learn cybersecurity from scratch?'
      },
      {
        id: 'sec-2',
        number: '02',
        title: 'Web Application Security & OWASP Top 10',
        duration: 'Weeks 5–10',
        summary: 'Identify and remediate critical web vulnerabilities like SQLi, XSS, CSRF, and authentication flaws.',
        skills: ['OWASP Top 10', 'Burp Suite', 'SQL Injection', 'Cross-Site Scripting (XSS)'],
        checklist: [
          'Practice penetration testing in controlled labs like PortSwigger Web Security Academy',
          'Intercept and modify HTTP traffic using Burp Suite proxy',
          'Demonstrate and remediate SQL injection, stored/reflected XSS, and IDOR vulnerabilities',
          'Document findings in professional vulnerability assessment reports'
        ],
        actionType: 'projects',
        actionLabel: 'Publish Security Audit Report',
        aiPrompt: 'Explain how to prevent Cross-Site Scripting (XSS) and SQL Injection in modern web apps.'
      },
      {
        id: 'sec-3',
        number: '03',
        title: 'SOC Operations, SIEM & Threat Hunting',
        duration: 'Weeks 11–16',
        summary: 'Monitor security operations center events, analyze log data, and investigate incidents.',
        skills: ['SIEM (Splunk / Elastic)', 'Log Analysis', 'Incident Response', 'Threat Intelligence'],
        checklist: [
          'Ingest and query security logs using Splunk or Elastic Security',
          'Identify signs of lateral movement, brute force attacks, and privilege escalation',
          'Formulate incident response playbooks following NIST guidelines',
          'Practice defensive challenges on Blue Team Labs or CyberDefenders'
        ],
        actionType: 'courses',
        actionLabel: 'Elect Network Security Course',
        aiPrompt: 'What does a day in the life of a Tier-1 SOC analyst look like?'
      },
      {
        id: 'sec-4',
        number: '04',
        title: 'Hands-on Labs, Capture The Flag (CTF) & Certifications',
        duration: 'Weeks 17–24',
        summary: 'Build proven hands-on credentials through CTF challenges and prepare for entry certifications.',
        skills: ['TryHackMe / HackTheBox', 'CompTIA Security+', 'CTF Competitions', 'Career Prep'],
        checklist: [
          'Complete top rooms on TryHackMe (Pre-Security and Junior Penetration Tester tracks)',
          'Participate in at least 2 online Capture the Flag (CTF) team competitions',
          'Prepare for industry certifications (CompTIA Security+ or Google Cybersecurity)',
          'Apply for SOC Analyst and Information Security internships'
        ],
        actionType: 'opportunities',
        actionLabel: 'View Cybersecurity Competitions',
        aiPrompt: 'How can I showcase my TryHackMe and CTF achievements on my resume?'
      }
    ]
  }
};

// =========================================================================
// MAIN COMPONENT: INTERACTIVE LEARNING ROADMAP
// =========================================================================
export function LearningRoadmap({ student, session, state, setState, notify, navigate }) {
  const currentStudent = student || state?.students?.[0] || {};
  const currentGoal = currentStudent.goal || 'Software Engineer';

  // Find matching track or default to Software Engineer
  const matchedTrackKey = useMemo(() => {
    const keys = Object.keys(CAREER_TRACKS);
    const found = keys.find(k =>
      currentGoal.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(currentGoal.toLowerCase())
    );
    return found || 'Software Engineer';
  }, [currentGoal]);

  const [selectedTrack, setSelectedTrack] = useState(matchedTrackKey);
  const activeTrack = CAREER_TRACKS[selectedTrack] || CAREER_TRACKS['Software Engineer'];

  // Storage key for student's roadmap checklist progress
  const storageKey = `podar-roadmap-progress-${currentStudent.id || 'default'}-${activeTrack.id}`;

  // Checked checklist items state: Set of item strings
  const [completedItems, setCompletedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Expanded milestone cards
  const [expandedCards, setExpandedCards] = useState({
    [`${activeTrack.id}-1`]: true,
    [`${activeTrack.id}-2`]: true
  });

  // Goal Selector Modal State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [pendingTrack, setPendingTrack] = useState(selectedTrack);
  const [customGoalInput, setCustomGoalInput] = useState(currentGoal);
  const [selectedTimeline, setSelectedTimeline] = useState('6 Months');

  const openGoalModal = () => {
    setPendingTrack(selectedTrack);
    setCustomGoalInput(currentGoal);
    setGoalModalOpen(true);
  };

  // Close modal on Escape
  useEffect(() => {
    if (!goalModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setGoalModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goalModalOpen]);

  // Sync state whenever active track changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`podar-roadmap-progress-${currentStudent.id || 'default'}-${activeTrack.id}`);
      setCompletedItems(saved ? JSON.parse(saved) : {});
    } catch {
      setCompletedItems({});
    }
  }, [activeTrack.id, currentStudent.id]);

  // Save checklist state to localStorage
  const toggleCheckItem = (milestoneId, itemIndex) => {
    const key = `${milestoneId}-${itemIndex}`;
    setCompletedItems(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Toggle card expansion
  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate stats
  const totalMilestones = activeTrack.milestones.length;
  let totalChecklistItems = 0;
  let checkedCount = 0;

  activeTrack.milestones.forEach(m => {
    (m.checklist || []).forEach((_, idx) => {
      totalChecklistItems++;
      if (completedItems[`${m.id}-${idx}`]) {
        checkedCount++;
      }
    });
  });

  const completionPercentage = totalChecklistItems > 0
    ? Math.round((checkedCount / totalChecklistItems) * 100)
    : 0;

  // Determine status of a milestone
  const getMilestoneStatus = (m) => {
    const items = m.checklist || [];
    if (items.length === 0) return 'upcoming';
    const done = items.filter((_, idx) => completedItems[`${m.id}-${idx}`]).length;
    if (done === items.length) return 'completed';
    if (done > 0) return 'in-progress';
    return 'upcoming';
  };

  // Save new career goal / apply track
  const handleApplyTrack = () => {
    const finalTrackKey = pendingTrack;
    if (CAREER_TRACKS[finalTrackKey]) {
      setSelectedTrack(finalTrackKey);
    }

    const trimmedCustom = (customGoalInput || '').trim();
    const goalTitleToSave = trimmedCustom || finalTrackKey;

    if (setState) {
      setState(prev => {
        const list = prev.students || [];
        return {
          ...prev,
          students: list.map(s => s.id === currentStudent.id ? { ...s, goal: goalTitleToSave } : s)
        };
      });
    }

    try {
      const sessionData = JSON.parse(localStorage.getItem('podar-pathways-session') || '{}');
      if (sessionData?.student) {
        sessionData.student.goal = goalTitleToSave;
        localStorage.setItem('podar-pathways-session', JSON.stringify(sessionData));
      }
    } catch (e) {}

    // Persist goal selection to backend database
    if (currentStudent?.id) {
      fetch(`/api/students/${currentStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalTitleToSave })
      }).catch(err => {
        console.warn('Could not persist student goal to backend:', err);
      });
    }

    setGoalModalOpen(false);
    notify?.(`Switched to track: ${finalTrackKey}`);
  };

  return (
    <div className="soc-roadmap-page">
      {/* 1. MINIMAL EXECUTIVE HEADER */}
      <div className="soc-roadmap-header">
        <div className="soc-roadmap-header-text">
          <h1 className="soc-roadmap-title">Learning Roadmap</h1>
          <p className="soc-roadmap-desc">
            Milestone progression and core technical competencies for <strong>{activeTrack.name}</strong>.
          </p>
        </div>

        <div className="soc-roadmap-header-actions">
          <button
            className="soc-roadmap-change-btn"
            onClick={openGoalModal}
            type="button"
          >
            <Target size={15} />
            <span>Change Track</span>
          </button>
        </div>
      </div>

      {/* 2. SLEEK PROGRESS SUMMARY BAR */}
      <div className="soc-roadmap-summary-card">
        <div className="soc-roadmap-summary-main">
          <div className="soc-roadmap-summary-meta">
            <span className="soc-roadmap-summary-title">{activeTrack.name}</span>
            <span className="soc-roadmap-summary-percent">
              {completionPercentage}% completed ({checkedCount}/{totalChecklistItems})
            </span>
          </div>
          <div className="soc-roadmap-progress-track">
            <div
              className="soc-roadmap-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="soc-roadmap-summary-stats">
          <div className="soc-metric-item">
            <span className="soc-metric-val">{totalMilestones}</span>
            <span className="soc-metric-lbl">Total Phases</span>
          </div>
          <div className="soc-metric-sep" />
          <div className="soc-metric-item">
            <span className="soc-metric-val">{activeTrack.timeline}</span>
            <span className="soc-metric-lbl">Estimated Duration</span>
          </div>
          <div className="soc-metric-sep" />
          <div className="soc-metric-item">
            <span className="soc-metric-val">
              {activeTrack.milestones.filter(m => getMilestoneStatus(m) === 'completed').length} / {totalMilestones}
            </span>
            <span className="soc-metric-lbl">Completed</span>
          </div>
        </div>
      </div>

      {/* 4. PROFESSIONAL CONNECTED TIMELINE */}
      <div className="soc-roadmap-timeline">
        {activeTrack.milestones.map((m, mIndex) => {
          const status = getMilestoneStatus(m);
          const isExpanded = !!expandedCards[m.id];
          const items = m.checklist || [];
          const completedCount = items.filter((_, idx) => completedItems[`${m.id}-${idx}`]).length;
          const isLast = mIndex === activeTrack.milestones.length - 1;

          return (
            <div
              key={m.id}
              className={`soc-timeline-row status-${status}`}
            >
              {/* Vertical Stepper Gutter */}
              <div className="soc-timeline-gutter">
                <div className={`soc-timeline-node ${status}`}>
                  {status === 'completed' ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <span>{mIndex + 1}</span>
                  )}
                </div>
                {!isLast && <div className="soc-timeline-connector" />}
              </div>

              {/* Milestone Card Content */}
              <div className={`soc-milestone-card ${status} ${isExpanded ? 'expanded' : ''}`}>
                <div
                  className="soc-milestone-header"
                  onClick={() => toggleCard(m.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleCard(m.id); }}
                >
                  <div className="soc-milestone-info">
                    <div className="soc-milestone-meta-row">
                      <span className="soc-phase-badge">Phase {m.number}</span>
                      <span className="soc-milestone-duration">
                        <Clock size={12} />
                        {m.duration}
                      </span>
                      {status === 'completed' && (
                        <span className="soc-status-tag completed">Completed</span>
                      )}
                      {status === 'in-progress' && (
                        <span className="soc-status-tag in-progress">
                          {completedCount} of {items.length} done
                        </span>
                      )}
                    </div>
                    <h3 className="soc-milestone-title">{m.title}</h3>
                    <p className="soc-milestone-summary">{m.summary}</p>
                  </div>

                  <div className="soc-milestone-toggle-btn">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="soc-milestone-body">
                    {/* Core Competencies */}
                    {m.skills && m.skills.length > 0 && (
                      <div className="soc-skills-wrap">
                        <span className="soc-skills-label">Core Competencies:</span>
                        <div className="soc-skills-list">
                          {m.skills.map(sk => (
                            <span key={sk} className="soc-skill-tag">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Interactive Action Checklist */}
                    <div className="soc-checklist-section">
                      <div className="soc-checklist-header">
                        <h4>Milestone Checklist</h4>
                        <span className="soc-checklist-count">
                          {completedCount} / {items.length} completed
                        </span>
                      </div>

                      <div className="soc-checklist-items">
                        {items.map((item, idx) => {
                          const isDone = !!completedItems[`${m.id}-${idx}`];
                          return (
                            <label
                              key={idx}
                              className={`soc-checklist-row ${isDone ? 'checked' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => toggleCheckItem(m.id, idx)}
                              />
                              <span className="soc-check-visual">
                                {isDone && <Check size={11} strokeWidth={3} />}
                              </span>
                              <span className="soc-checklist-text">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Focused Action Button */}
                    <div className="soc-milestone-actions">
                      <button
                        className="soc-roadmap-action-btn"
                        onClick={() => handleMilestoneAction(m)}
                        type="button"
                      >
                        {m.actionType === 'courses' && <BookOpen size={14} />}
                        {m.actionType === 'projects' && <Code size={14} />}
                        {m.actionType === 'opportunities' && <Briefcase size={14} />}
                        <span>{m.actionLabel}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MINIMAL UPDATE CAREER GOAL MODAL */}
      {goalModalOpen && (
        <div
          className="soc-roadmap-modal-backdrop"
          onClick={() => setGoalModalOpen(false)}
        >
          <div
            className="soc-roadmap-modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="soc-roadmap-modal-header">
              <div>
                <h3 className="soc-roadmap-modal-title">Change Career Track</h3>
                <p className="soc-roadmap-modal-subtitle">
                  Select your target engineering discipline to calibrate milestone pathways and competencies.
                </p>
              </div>
              <button
                className="soc-roadmap-modal-close"
                onClick={() => setGoalModalOpen(false)}
                type="button"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="soc-roadmap-modal-body">
              {/* Pre-defined tracks list */}
              <div className="soc-roadmap-tracks-list">
                {Object.keys(CAREER_TRACKS).map(trackKey => {
                  const track = CAREER_TRACKS[trackKey];
                  const IconComp = track.icon || Code;
                  const isSelected = pendingTrack === trackKey;

                  return (
                    <div
                      key={trackKey}
                      className={`soc-roadmap-track-tile ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setPendingTrack(trackKey);
                        setCustomGoalInput(trackKey);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setPendingTrack(trackKey);
                          setCustomGoalInput(trackKey);
                        }
                      }}
                    >
                      <div className="soc-roadmap-tile-icon-box">
                        <IconComp size={18} />
                      </div>
                      <div className="soc-roadmap-tile-info">
                        <div className="soc-roadmap-tile-top">
                          <strong className="soc-roadmap-tile-name">{trackKey}</strong>
                          <span className="soc-roadmap-tile-timeline">{track.timeline} · {track.milestones.length} Phases</span>
                        </div>
                        <p className="soc-roadmap-tile-desc">{track.description}</p>
                      </div>
                      <div className={`soc-roadmap-tile-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Ambition Input (Optional) */}
              <div className="soc-roadmap-custom-section">
                <label className="soc-roadmap-input-label">
                  <span>Custom Specialization (Optional)</span>
                  <input
                    type="text"
                    className="soc-roadmap-text-input"
                    placeholder="e.g. Full-Stack React & Node Engineer, Embedded Robotics..."
                    value={customGoalInput}
                    onChange={e => setCustomGoalInput(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="soc-roadmap-modal-footer">
              <button
                className="soc-roadmap-btn-cancel"
                onClick={() => setGoalModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="soc-roadmap-btn-save"
                onClick={handleApplyTrack}
                type="button"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Apply Track</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

