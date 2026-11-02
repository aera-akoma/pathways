import React, { useEffect, useRef, useState } from 'react';
import { needsProfileCompletion } from './validation.js';
export function ProfileCompletionPrompt({ session, student, activePage, navigate }) {
  const button = useRef(null);
  const [started, setStarted] = useState(false);
  const visible = session?.role === 'student' && needsProfileCompletion(student) && !(activePage === 'profile' && started);
  useEffect(() => {
    if (!visible) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    button.current?.focus();
    const trap = event => { if (event.key === 'Escape' || event.key === 'Tab') { event.preventDefault(); button.current?.focus(); } };
    document.addEventListener('keydown', trap, true);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', trap, true); previous?.focus?.(); };
  }, [visible]);
  if (!visible) return null;
  return <div className="profile-completion-overlay"><section role="dialog" aria-modal="true" aria-labelledby="complete-profile-title" aria-describedby="complete-profile-description" className="profile-completion-dialog"><span className="eyebrow">WELCOME TO PODAR PATHWAYS</span><h2 id="complete-profile-title">Complete your student profile</h2><p id="complete-profile-description">Add your mobile number and career goal to finish setting up your profile.</p><button ref={button} className="button primary" onClick={() => { setStarted(true); navigate('profile', { params: { tab: 'edit' } }); }}>Complete your profile</button></section></div>;
}
