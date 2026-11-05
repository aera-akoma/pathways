import { DEVELOPER_CREDITS } from './developerCredits.js';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, ArrowRight, Menu, X, Compass, Layers3, BookOpen, Check, Mail, Download, GraduationCap } from 'lucide-react';
import { PUBLIC_MEDIA } from './publicMedia';
import { CONTACT_EMAIL, PUBLIC_LINKS, PATHWAY_FEATURES, PRIVACY_SECTIONS } from './publicSiteContent';
import './public-site.css';

const LinkButton = ({ href, children, light = false }) => <a className={`ps-button${light ? ' ps-button-light' : ''}`} href={href}>{children}<ArrowUpRight size={18} aria-hidden="true" /></a>;
const Eyebrow = ({ children }) => <p className="ps-eyebrow"><span />{children}</p>;
const Photo = ({ src, alt, className = '', eager = false }) => <img className={className} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />;

function CampusTour() {
  const container = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ps-video-wrap" ref={container}>
      <video autoPlay muted controls playsInline poster={PUBLIC_MEDIA.videoPoster} aria-label="Podar College campus tour" src={visible ? PUBLIC_MEDIA.video : undefined}>
        <a href={PUBLIC_MEDIA.video}>Download the college tour</a>
      </video>
    </div>
  );
}

function Home() {
  return <>
    <section className="ps-hero">
      <div className="ps-hero-copy"><Eyebrow>Learning today. Possibilities tomorrow.</Eyebrow><h1>Your potential.<br />A world of <em>possibilities.</em></h1><p>A place to explore what interests you, build real skills and shape a future that feels like your own.</p><div className="ps-actions"><LinkButton href="/why-us" light>Find your pathway</LinkButton><a className="ps-text-link" href="/about">Get to know us <ArrowRight size={17} /></a></div><div className="ps-hero-note"><Compass size={23} /><span>Explore. Learn. Create.<br /><strong>Grow one step at a time.</strong></span></div></div>
      <div className="ps-hero-visual"><Photo src={PUBLIC_MEDIA.hero} alt="Seth G.B. Podar College, Nawalgarh" className="ps-main-photo" eager /><div className="ps-photo-label"><span className="ps-small-star">✳</span><span>Big ideas begin<br /><strong>with a little curiosity.</strong></span></div><Photo src={PUBLIC_MEDIA.campus} alt="Podar College Nawalgarh alumni meet" className="ps-inset-photo" /></div>
    </section>
    <div className="ps-belief-strip"><span>Designed around your next step</span><span><Compass size={18} />Explore your interests</span><span><BookOpen size={18} />Build your skills</span><span><Layers3 size={18} />Show your progress</span></div>
    <section className="ps-section ps-intro"><div><Eyebrow>A journey that belongs to you</Eyebrow><h2>There’s more than<br />one way <em>forward.</em></h2></div><div><p className="ps-large-copy">Your future doesn’t have to start with all the answers. It can start with a question, an interest or an idea.</p><p>Podar Pathways brings exploration, learning and a record of your achievements into one connected space. Discover something new, put it into practice and see how far you’ve come.</p><a className="ps-inline-link" href="/about">Our approach <ArrowUpRight size={18} /></a></div></section>
    <section className="ps-section ps-features"><div className="ps-section-top"><div><Eyebrow>From curiosity to capability</Eyebrow><h2>Small steps.<br /><em>Meaningful progress.</em></h2></div><p>Tools to help you move from “what could I do?” to “here’s what I’m building.”</p></div><div className="ps-feature-grid">{PATHWAY_FEATURES.map(f => <article key={f.number}><span className="ps-feature-number">{f.number} /</span><h3>{f.title}</h3><p>{f.text}</p><ArrowUpRight size={25} aria-hidden="true" /></article>)}</div></section>
    <section className="ps-story"><div className="ps-story-photo"><Photo src={PUBLIC_MEDIA.collaboration} alt="Students meeting recruiters at an Axis Bank placement event at Podar College Nawalgarh" /></div><div className="ps-story-copy"><Eyebrow>Space to try. Room to grow.</Eyebrow><h2>Turn what you learn<br />into what you <em>can do.</em></h2><p>Learning becomes more personal when you make something with it. Bring your projects, learning milestones and certificates together, so your journey is more than a list of courses.</p><ul className="ps-check-list"><li><Check size={18} />Explore courses published on the platform</li><li><Check size={18} />Develop projects and a portfolio of your work</li><li><Check size={18} />Build your digital career passport</li></ul><LinkButton href="/why-us">Explore the possibilities</LinkButton></div></section>
    <section className="ps-section ps-film">
      <div>
        <Eyebrow>Podar College, Nawalgarh</Eyebrow>
        <h2>Explore <em>the college.</em></h2>
        <p>Take a video tour of Seth G.B. Podar College in Nawalgarh.</p>
      </div>
      <CampusTour />
    </section>
    <PublicCallout />
  </>;
}

function PublicCallout() { return <section className="ps-callout"><div><Eyebrow>Your next chapter starts with curiosity</Eyebrow><h2>Make room for<br /><em>what comes next.</em></h2></div><LinkButton href="/contact" light>Let’s connect</LinkButton></section>; }
function PageHero({ eyebrow, title, text }) { return <section className="ps-page-hero"><Eyebrow>{eyebrow}</Eyebrow><h1>{title}</h1><p>{text}</p></section>; }
function About() { return <><PageHero eyebrow="About Podar Pathways" title={<>Possibility begins<br />with <em>you.</em></>} text="A connected space for students to explore their interests, develop skills and make their learning visible." /><section className="ps-section ps-intro"><div><Eyebrow>Our purpose</Eyebrow><h2>Helping you find<br /><em>your way forward.</em></h2></div><div><p className="ps-large-copy">Choosing a direction is a process of discovery. We believe students need room to ask questions, try things and learn from doing.</p><p>Podar Pathways connects career exploration with practical learning tools. Students can explore published courses, organise projects, build a portfolio and keep a record of their progress in a digital career passport.</p><p>The platform supports the conversations students have with educators, counsellors and families. It gives those conversations a place to begin and a record to build on.</p></div></section><section className="ps-story"><div className="ps-story-photo"><Photo src={PUBLIC_MEDIA.collaboration} alt="Students meeting recruiters at an Axis Bank placement event at Podar College Nawalgarh" /></div><div className="ps-story-copy"><Eyebrow>What we value</Eyebrow><h2>Curiosity first.<br /><em>Progress always.</em></h2><div className="ps-values"><h3>Explore with an open mind</h3><p>Interests evolve. Give yourself permission to discover more than one direction.</p><h3>Learn through making</h3><p>Projects turn learning into something you can explain, reflect on and share.</p><h3>Recognise the journey</h3><p>Keep your milestones together and notice the progress behind the finished work.</p></div></div></section><section className="ps-section ps-note"><GraduationCap size={32} /><div><h3>A platform that supports your decisions</h3><p>Career suggestions are guided and rule-based. P-CARE is a platform activity score, not a scientifically validated assessment or a promise of admission, employment or career outcomes.</p></div></section><PublicCallout /></>; }
function WhyUs() { return <><PageHero eyebrow="Why Podar Pathways" title={<>One journey.<br /><em>Connected possibilities.</em></>} text="Bring your interests, learning and achievements into the same conversation." /><section className="ps-section ps-reasons">{[{ title: 'Start with what interests you', text: 'Explore career directions and use guided prompts to reflect on your interests. The rule-based career coach offers a starting point for research and conversations with a counsellor.', icon: Compass },{ title: 'Give learning a direction', text: 'Browse administrator-published courses and use your roadmap to organise next steps. Some courses take you to an external provider; availability and requirements depend on that provider.', icon: BookOpen },{ title: 'Create evidence of your growth', text: 'Develop projects and portfolio entries that show what you have worked on. Bring your learning, résumé and achievements together through the digital career passport.', icon: Layers3 },{ title: 'Keep milestones together', text: 'Upload certificates and view their verification status where the platform provides it. Verification is a platform review status, not a guarantee from an external course provider.', icon: GraduationCap }].map(({title,text,icon:Icon},i)=><article key={title}><div className="ps-reason-icon"><Icon size={29}/></div><span className="ps-feature-number">0{i+1}</span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section><section className="ps-section ps-score-note"><Eyebrow>Perspective matters</Eyebrow><h2>Progress is personal.<br /><em>A score is only one view.</em></h2><p>Your P-CARE score reflects activity recorded in Podar Pathways. It can help you notice areas to explore, but it is not a scientifically validated measure of your potential or employability. Use it alongside your own reflection and guidance from people who know you.</p></section><PublicCallout /></>; }
function Contact() { const [name,setName]=useState('');const [email,setEmail]=useState('');const [topic,setTopic]=useState('General enquiry');const [message,setMessage]=useState('');function draft(e){e.preventDefault();window.location.href=`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Podar Pathways: ${topic}`)}&body=${encodeURIComponent(`Name: ${name}\nReply email: ${email}\n\n${message}`)}`;}return <><PageHero eyebrow="Contact us" title={<>A conversation can<br />open a <em>new door.</em></>} text="Have a question about the platform, your account or getting started? Get in touch." /><section className="ps-section ps-contact"><div><Eyebrow>Let’s connect</Eyebrow><h2>We’re a message<br /><em>away.</em></h2><p>For platform questions and account support, write to the email address below. Include the feature you were using and a clear description of your question.</p><a className="ps-contact-email" href={`mailto:${CONTACT_EMAIL}`}><Mail size={23}/>{CONTACT_EMAIL}<ArrowUpRight size={20}/></a><p className="ps-caption">Please don’t include passwords, one-time passwords or sensitive documents in your enquiry.</p></div><form onSubmit={draft} className="ps-contact-form"><h3>Start a conversation</h3><p>Fields marked * are required. This form prepares an email in your email app; it does not send from this website.</p><div className="ps-form-row"><label>Your name *<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" /></label><label>Your email *<input required maxLength={254} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" /></label></div><label>What can we help with?<select value={topic} onChange={e=>setTopic(e.target.value)}><option>General enquiry</option><option>Account and sign-in</option><option>Courses and learning</option><option>Projects and certificates</option><option>Privacy and account information</option></select></label><label>Your message *<textarea required maxLength={3000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} /></label><button className="ps-button" type="submit">Prepare email draft<ArrowUpRight size={18}/></button></form></section></>; }
function Privacy() { return <><PageHero eyebrow="Privacy policy" title={<>Your information.<br /><em>A clearer picture.</em></>} text="An overview of information used by Podar Pathways and the choices available to you." /><section className="ps-section ps-privacy"><aside><span>On this page</span>{PRIVACY_SECTIONS.map((s,i)=><a href={`#privacy-${i}`} key={s.title}>{s.title}</a>)}</aside><div>{PRIVACY_SECTIONS.map((s,i)=><section id={`privacy-${i}`} key={s.title}><span className="ps-feature-number">0{i+1}</span><h2>{s.title}</h2><p>{s.text}</p></section>)}<div className="ps-policy-contact"><Mail size={22}/><p>Privacy question?<br/><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></div></div></section></>; }

function DeveloperCredits() {
  return <div className="ps-credits-page">
    <section className="ps-credits-hero">
      <div className="ps-credits-hero-inner">
        <div>
          <Eyebrow>Developer Credits</Eyebrow>
          <h1>The <strong>Developer</strong> team behind <em>Podar Pathways.</em></h1>
          <p>Meet the supervisors and developers who guided and built the website, and the team who helped bring it together.</p>
        </div>
        <nav className="ps-credits-index" aria-label="Credits sections">
          <span>Meet the team</span>
          {DEVELOPER_CREDITS.map((group, index) => (
            <a key={group.title} href={'#credits-' + (index + 1)}>
              <span className="ps-credits-number">{String(index + 1).padStart(2, '0')}</span>
              {group.title}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </section>

    <div className="ps-credits-content">
      {DEVELOPER_CREDITS.map((group, index) => (
        <section className="ps-credits-section" id={'credits-' + (index + 1)} key={group.title}>
          <header className="ps-credits-section-heading">
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h2>{group.title}</h2>
          </header>
          {group.team ? (
            <div className="ps-credits-team">
              <div className="ps-credits-team-photo">
                {group.team.photo ? (
                  <Photo src={group.team.photo} alt={group.team.photoAlt} />
                ) : (
                  <p>Group photo coming soon</p>
                )}
              </div>
              <h3>Team members</h3>
              <ul className="ps-credits-team-members">
                {group.team.members.map((name, memberIndex) => (
                  <li key={memberIndex}>{name || `Team member ${memberIndex + 1}`}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="ps-credits-profiles">
              {group.people.map((person, personIndex) => (
                <article key={person.role} className="ps-credit-profile" data-portrait-side={
                  DEVELOPER_CREDITS.slice(0, index).reduce((count, previous) => count + (previous.people?.length ?? 0), personIndex) % 2 === 0 ? 'right' : 'left'
                }>
                  <div className="ps-credit-portrait">
                    {person.photo ? (
                      <Photo src={person.photo} alt={person.name || person.role} />
                    ) : (
                      <div className="ps-credit-placeholder" aria-hidden="true">
                        <span>{(person.name || person.role).trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="ps-credit-copy">
                    <p className="ps-credit-role">{person.role}</p>
                    <h3>{person.name || 'Name coming soon'}</h3>
                    <dl className="ps-credit-details">
                      <div><dt>Position</dt><dd>{person.position || person.role}</dd></div>
                      <div><dt>Project contribution</dt><dd>{person.contribution || 'Details coming soon.'}</dd></div>
                    </dl>
                    <div className="ps-credit-experience">
                      <h4>Project experience</h4>
                      <p>{person.experience || 'Project story coming soon.'}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  </div>;
}

export default function PublicSite({ page = 'home', dashboardHref }) {
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(() => { if (!menuOpen) return; const close = event => { if (event.key === 'Escape') { setMenuOpen(false); document.querySelector('.ps-menu-toggle')?.focus(); } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [menuOpen]);
  const pages={home:Home,about:About,'why-us':WhyUs,contact:Contact,privacy:Privacy,'developer-credits':DeveloperCredits}; const Content=pages[page]||Home;
  return <div className="public-site"><a href="#public-main" className="ps-skip">Skip to content</a><header className="ps-header"><a className="ps-brand" href="/" aria-label="Podar Pathways home"><img className="ps-brand-logo" src="/images/brand/pathways-logo.jpeg" alt="" width="44" height="44" /><span>PODAR<strong>PATHWAYS</strong></span></a><button className="ps-menu-toggle" aria-label={menuOpen?'Close navigation':'Open navigation'} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?<X/>:<Menu/>}</button><nav id="public-navigation" className={menuOpen?'ps-nav ps-nav-open':'ps-nav'} aria-label="Main navigation">{PUBLIC_LINKS.map(link=><a key={link.id} href={link.href} aria-current={page===link.id?'page':undefined}>{link.label}</a>)}<a className="ps-download" href="https://www.podarpathways.com/app.apk" download="podar-pathways.apk"><Download size={17} aria-hidden="true" />Download our app</a><a className="ps-login" href={dashboardHref || '/login'}>{dashboardHref ? 'Go to Dashboard' : 'Login / Sign up'} <ArrowUpRight size={16} aria-hidden="true" /></a></nav></header><main id="public-main" key={page}><Content/></main><footer className="ps-footer"><div className="ps-footer-top"><div><a className="ps-brand ps-brand-footer" href="/"><img className="ps-brand-logo" src="/images/brand/pathways-logo.jpeg" alt="" width="44" height="44" /><span>PODAR<strong>PATHWAYS</strong></span></a><p>Curiosity today.<br/>Possibilities for tomorrow.</p></div><div><span className="ps-footer-heading">Explore</span>{PUBLIC_LINKS.map(l=><a href={l.href} key={l.id}>{l.label}</a>)}<a href="/developer-credits" aria-current={page==='developer-credits'?'page':undefined}>Developer Credits</a></div><div><span className="ps-footer-heading">Get in touch</span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><p>Questions, ideas or a little guidance.<br/>Start a conversation with us.</p></div></div><div className="ps-footer-bottom"><span>© {new Date().getFullYear()} Podar Pathways</span><a href="/privacy-policy" aria-current={page==='privacy'?'page':undefined}>Privacy policy</a><span>Made for the journey ahead.</span></div></footer></div>;
}

