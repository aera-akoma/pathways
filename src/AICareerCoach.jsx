import React, { useState, useRef, useEffect } from 'react';
import './styles.css';
import {
  MessageSquareText,
  Sparkles,
  Send,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  Target,
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight
} from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  {
    category: 'Interview',
    label: '🎯 Technical Mock Interview',
    prompt: 'Give me 3 commonly asked React & JavaScript interview questions for campus placements with model answers using the STAR method.'
  },
  {
    category: 'P-CARE',
    label: '📈 How to Reach 95+ P-CARE Score',
    prompt: 'Analyze my current profile and tell me the fastest way to raise my P-CARE readiness score above 90.'
  },
  {
    category: 'Resume',
    label: '📝 Bullet Point Polisher',
    prompt: 'How do I transform a generic resume bullet point into an impactful, metric-driven statement for software engineering recruiters?'
  },
  {
    category: 'Placements',
    label: '💼 Campus Placement Strategy',
    prompt: 'What are campus hiring managers at TCS, Infosys, and tech startups looking for in an undergraduate IT student in 2026?'
  },
  {
    category: 'Projects',
    label: '💡 Final Year Project Ideas',
    prompt: 'Suggest 3 impressive full-stack project concepts that would make my GitHub profile stand out to recruiters.'
  },
  {
    category: 'Roadmap',
    label: '🧭 DSA & Coding Roadmap',
    prompt: 'Give me a structured 4-week study plan to master core Data Structures & Algorithms for technical coding assessments.'
  }
];

export function AICareerCoach({ student, notify, navigate }) {
  const studentName = student?.name ? student.name.split(' ')[0] : 'Student';
  const studentCourse = student?.course || 'Information Technology';
  const studentScore = student?.score || 78;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('podar_ai_coach_history');
      if (saved) return JSON.parse(saved);
    } catch {}

    return [
      {
        id: 'msg-welcome',
        from: 'bot',
        text: `Hello ${studentName}! 👋 I am your dedicated **Podar Pathways AI Career Coach**.\n\nI have reviewed your academic pathway for **${studentCourse}** (Current P-CARE Score: **${studentScore}/100**). Whether you want to practice technical mock interviews, optimize your resume for ATS screening, or build a personalized placement strategy, I'm here to help you succeed!\n\nWhat would you like to focus on today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('podar_ai_coach_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Generate intelligent contextual response
  const generateResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes('interview') || q.includes('question') || q.includes('mock')) {
      return `### 🎯 Technical & Placement Interview Preparation\n\nHere are 3 premier technical interview questions commonly asked by campus placement panels for **${studentCourse}** students:\n\n1. **React State & Performance:**\n   * **Question:** *What is the Virtual DOM diffing algorithm, and when would you use \`useMemo\` vs \`useCallback\`?*\n   * **Key Answer Point:** *Explain that \`useMemo\` caches the result of an expensive calculation, while \`useCallback\` caches a function reference between renders to prevent unnecessary child re-renders.*\n\n2. **Database Indexing & Queries:**\n   * **Question:** *How does a B-Tree index accelerate SQL query performance, and what is the trade-off during INSERT/UPDATE operations?*\n   * **Key Answer Point:** *Indexes speed up lookups from O(N) to O(log N), but require extra disk storage and incur slight write latency as tree pointers are rebalanced.*\n\n3. **Behavioral (STAR Method):**\n   * **Question:** *Tell me about a challenging bug you encountered in a project and how you solved it.*\n   * **Strategy:** **Situation** (college project) ➔ **Task** (auth token expired intermittently) ➔ **Action** (used Chrome DevTools Network tab & refreshed tokens) ➔ **Result** (zero session dropouts).`;
    }

    if (q.includes('score') || q.includes('p-care') || q.includes('boost') || q.includes('raise') || q.includes('95')) {
      return `### 📈 How to Accelerate Your P-CARE Score to 95+\n\nYour current readiness score is **${studentScore}/100**. Here is your actionable blueprint to cross 90+ before campus drives begin:\n\n1. **Verify Online Certifications (+12 to +18 points):**\n   * Submit Coursera, NPTEL, or Udemy completion certificates via the **Certificates** desk.\n   * Each faculty-verified credential awards **+12 points** to your institutional profile.\n\n2. **Publish a High-Impact Capstone (+10 points):**\n   * Showcase a completed GitHub project with a live demo link and README on the **Student Projects** showcase.\n   * Peer likes and faculty reviews boost your portfolio readiness.\n\n3. **ATS Resume Optimization (+8 points):**\n   * Use the **Resume Builder** tab to achieve an ATS compliance score over 85% by quantifying achievements.\n\n4. **Explore Active Opportunities:**\n   * Register for hackathons and inter-collegiate events via the **Opportunities** marketplace.`;
    }

    if (q.includes('resume') || q.includes('bullet') || q.includes('ats')) {
      return `### 📝 Engineering High-Impact Resume Bullet Points\n\nRecruiters at top companies spend an average of **6 seconds** scanning your resume. Use the **Google X-Y-Z formula**:\n\n> *“Accomplished [X], as measured by [Y], by doing [Z].”*\n\n#### ❌ Weak / Generic Bullets:\n* *Worked on a React website for college students.*\n* *Created database tables in MySQL for a project.*\n\n#### ✅ Strong, Recruiter-Ready Bullets:\n* **Architected full-stack career operating portal** using React and Node.js, facilitating placement workflows for **500+ undergraduate students**.\n* **Engineered secure 2FA authentication engine**, reducing unauthorized access risks by **99%** with automated OTP delivery and institutional audit logging.\n* **Optimized API query latency by 42%** through indexed SQLite foreign keys and responsive client caching.\n\n💡 *Head to the **Resume Builder** to run the real-time ATS audit!*`;
    }

    if (q.includes('project') || q.includes('idea') || q.includes('github') || q.includes('capstone')) {
      return `### 💡 3 High-Impact Project Ideas for Your Portfolio\n\nTo make your GitHub portfolio stand out from typical tutorial projects, build solutions that solve authentic real-world or campus challenges:\n\n1. **AI Automated Campus Placement Analytics Engine:**\n   * **Tech:** React, Python / FastAPI, Scikit-Learn / LangChain, PostgreSQL\n   * **Pitch:** Analyzes student resumes against job descriptions, identifying missing skills and generating tailored study roadmaps.\n\n2. **Decentralized Verifiable Credential Issuer:**\n   * **Tech:** Node.js, Cryptographic Signatures, React, Tailwind CSS\n   * **Pitch:** Enables colleges to issue tamper-proof digital certificates verifiable via unique cryptographic hashes and QR codes.\n\n3. **Real-Time Collaborative Code Interview Sandbox:**\n   * **Tech:** WebSockets, Monaco Editor, Docker container isolation\n   * **Pitch:** Interactive browser-based peer coding environment with real-time compilation and syntax highlighting.\n\n🚀 *Publish your completed project on **Student Projects** to collect endorsements!*`;
    }

    if (q.includes('placement') || q.includes('company') || q.includes('tcs') || q.includes('infosys') || q.includes('drive')) {
      return `### 💼 2026 Campus Placement & Corporate Drive Strategy\n\nCompanies visiting Sheth L.U.J. College for campus placements evaluate students across 3 core filters:\n\n1. **Aptitude & Logical Assessment (Elimination Round):**\n   * Speed in Quantitative Aptitude, Logical Reasoning, and Verbal Ability.\n   * Practice 20 questions daily on time-pressured mock sets.\n\n2. **Hands-On Coding Round:**\n   * 1-2 algorithmic coding challenges (Strings, Arrays, HashMaps, Two Pointers).\n   * Ensure you know how to write clean, syntactic code without IDE autocomplete.\n\n3. **Technical & HR Interview:**\n   * Thorough knowledge of every technology and library listed on your resume.\n   * Ability to explain your project architecture and database schema confidently.\n   * Professional demeanor, college attendance record, and proactive communication.`;
    }

    if (q.includes('dsa') || q.includes('roadmap') || q.includes('algorithm') || q.includes('leetcode')) {
      return `### 🧭 4-Week Structured DSA Mastery Plan\n\n* **Week 1: Linear Data Structures**\n  * Arrays, Two Pointers, Sliding Window, Prefix Sums\n  * Singly & Doubly Linked Lists, Stacks, Queues\n  * *Target:* 15 LeetCode Easy problems.\n\n* **Week 2: Trees & Recursion**\n  * Binary Trees, Tree Traversals (Inorder, Preorder, Postorder, BFS Level-Order)\n  * Binary Search Trees (BST validation, Insertion, Deletion)\n  * *Target:* 15 LeetCode Medium problems.\n\n* **Week 3: Graphs & Search**\n  * Graph Representations (Adjacency List/Matrix)\n  * Breadth-First Search (BFS) & Depth-First Search (DFS)\n  * *Target:* 10 LeetCode Medium problems.\n\n* **Week 4: Dynamic Programming & Placement Mocks**\n  * 1D DP (Fibonacci, Climbing Stairs, House Robber)\n  * Mock timed coding rounds on HackerRank or LeetCode Contest.`;
    }

    // Default friendly response
    return `### 💡 Recommendation for ${studentName}\n\nBased on your pathway in **${studentCourse}**, focusing on **visible, verifiable accomplishments** is the most effective strategy:\n\n1. Complete 1 project with a public GitHub repo and live URL.\n2. Earn and verify 1 certified credential (NPTEL, Coursera, Meta).\n3. Use the **Resume Builder** to audit your resume for ATS compliance.\n\nWould you like me to generate specific interview questions, review a project concept, or suggest a daily study routine?`;
  };

  const handleSend = (textToSend) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      from: 'me',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Realistic typing delay
    setTimeout(() => {
      const responseText = generateResponse(query);
      const botMsg = {
        id: `bot-${Date.now()}`,
        from: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClearHistory = () => {
    if (window.confirm('Reset conversation history with AI Career Coach?')) {
      const resetMsg = [
        {
          id: 'msg-welcome-fresh',
          from: 'bot',
          text: `Conversation reset. Ready whenever you are, ${studentName}! How can I help your career progression today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(resetMsg);
      try {
        localStorage.removeItem('podar_ai_coach_history');
      } catch {}
      notify?.('Chat history cleared.');
    }
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      notify?.('Copied advice to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Simple Markdown formatter for bold, headers, code
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="coach-msg-h3">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="coach-msg-h4">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="coach-msg-quote">{line.replace('> ', '')}</blockquote>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="coach-msg-li">
            <span dangerouslySetInnerHTML={{ __html: line.replace(/^[*|-]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`(.*?)`/g, '<code>$1</code>') }} />
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return (
        <p
          key={idx}
          className="coach-msg-p"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`(.*?)`/g, '<code>$1</code>')
          }}
        />
      );
    });
  };

  return (
    <div className="coach-page-wrapper">
      {/* 1. Page Header */}
      <div className="page-header">
        <div>
          <p className="eyebrow">AI CAREER COMPASS • INSTITUTIONAL ADVISOR</p>
          <h1>AI Career Coach</h1>
          <p>Instant, tailored guidance for interview preparation, ATS resumes, skills, and placement drives.</p>
        </div>

        <div className="coach-header-actions">
          <button
            type="button"
            className="button secondary"
            onClick={handleClearHistory}
            title="Reset conversation"
          >
            <RotateCcw size={15} />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Main Coach Layout */}
      <div className="coach-split-container">
        {/* LEFT SIDEBAR: QUICK PROMPT TILES */}
        <div className="coach-prompts-sidebar">
          <div className="panel coach-sidebar-card">
            <div className="panel-heading">
              <h2>
                <Lightbulb size={18} />
                <span>Instant Career Topics</span>
              </h2>
            </div>
            <p className="coach-sidebar-desc">
              Select any topic to ask your AI coach or type your custom question below:
            </p>

            <div className="coach-topic-chips-list">
              {PROMPT_SUGGESTIONS.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  className="coach-topic-pill"
                  onClick={() => handleSend(item.prompt)}
                >
                  <div className="topic-pill-top">
                    <span className="topic-category-tag">{item.category}</span>
                    <ArrowRight size={13} className="topic-arrow" />
                  </div>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>

            {/* Quick Links */}
            <div className="coach-quick-navs">
              <span className="quick-navs-title">Explore Pathways:</span>
              <div className="quick-navs-buttons">
                <button type="button" onClick={() => navigate('roadmap')}>
                  <Target size={13} /> Learning Roadmap
                </button>
                <button type="button" onClick={() => navigate('resume')}>
                  <Briefcase size={13} /> ATS Resume Builder
                </button>
                <button type="button" onClick={() => navigate('certificates')}>
                  <Award size={13} /> Verify Certificates
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: CHAT INTERFACE */}
        <div className="coach-chat-column">
          <div className="panel coach-chat-main-card">
            {/* Chat Header Status */}
            <div className="coach-chat-header">
              <div className="coach-avatar-badge">
                <Bot size={20} />
                <span className="coach-online-dot" />
              </div>
              <div className="coach-header-details">
                <strong>Podar Career AI</strong>
                <span>Contextual Career Advisor &bull; Sheth L.U.J. &amp; Sir M.V. College</span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="coach-message-stream">
              {messages.map((msg) => (
                <div key={msg.id} className={`coach-bubble-wrapper ${msg.from}`}>
                  <div className="coach-bubble-avatar">
                    {msg.from === 'bot' ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  <div className="coach-bubble-content">
                    <div className="coach-bubble-text">
                      {msg.from === 'bot' ? renderFormattedText(msg.text) : <p>{msg.text}</p>}
                    </div>

                    <div className="coach-bubble-footer">
                      <span className="coach-bubble-time">{msg.timestamp}</span>
                      {msg.from === 'bot' && (
                        <button
                          type="button"
                          className="coach-copy-btn"
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          title="Copy message"
                        >
                          {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="coach-bubble-wrapper bot">
                  <div className="coach-bubble-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="coach-bubble-content typing">
                    <div className="typing-indicator-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              className="coach-chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about placement interviews, projects, or how to raise your P-CARE score..."
                disabled={isTyping}
              />
              <button
                type="submit"
                className="button primary"
                disabled={isTyping || !inputVal.trim()}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

