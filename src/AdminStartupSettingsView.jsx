import React, { useEffect, useState } from 'react';
import { requestJson } from './api.js';
import { isMainAdminAccount } from './AdminManageViews.jsx';

const OPTIONS = [
  { value: 'home', title: 'First page', description: 'Show the public Podar Pathways home page when someone opens the site.' },
  { value: 'login', title: 'Login page', description: 'Open the sign in page directly when someone visits the site.' },
];

export function AdminStartupSettingsView({ session, notify }) {
  const [selected, setSelected] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isMainAdmin = isMainAdminAccount(session?.admin || session);

  useEffect(() => {
    if (!isMainAdmin) { setLoading(false); return; }
    requestJson('/api/settings/start-page', { credentials: 'same-origin' })
      .then(data => setSelected(data.startupPage === 'login' ? 'login' : 'home'))
      .catch(error => notify?.(error.message || 'Could not load the site start page.'))
      .finally(() => setLoading(false));
  }, [isMainAdmin, notify]);

  const choose = async value => {
    setSaving(true);
    try {
      const data = await requestJson('/api/settings/start-page', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startupPage: value }),
      });
      setSelected(data.startupPage);
      notify?.(`Site start page set to ${value === 'login' ? 'Login page' : 'First page'} for everyone.`);
    } catch (error) {
      notify?.(error.message || 'Could not save the site start page.');
    } finally {
      setSaving(false);
    }
  };

  if (!isMainAdmin) return <div className="minimal-admin-container"><h2 className="minimal-admin-title">Restricted</h2><p className="minimal-admin-subtitle">Only the main administrator can change the site start page.</p></div>;

  return (
    <div className="minimal-admin-container">
      <div className="minimal-admin-header">
        <div>
          <h2 className="minimal-admin-title">Start Page</h2>
          <p className="minimal-admin-subtitle">Choose what all visitors see when they open Podar Pathways.</p>
        </div>
      </div>
      <div className="minimal-admin-panel" style={{ padding: 24, display: 'grid', gap: 12 }}>
        {OPTIONS.map(option => (
          <label key={option.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: 18, border: `1px solid ${selected === option.value ? '#2563eb' : '#e2e8f0'}`, borderRadius: 12, cursor: 'pointer', background: selected === option.value ? '#eff6ff' : '#fff' }}>
            <input type="radio" name="startup-page" value={option.value} checked={selected === option.value} onChange={() => choose(option.value)} disabled={loading || saving} style={{ marginTop: 4 }} />
            <span>
              <strong style={{ display: 'block', marginBottom: 5 }}>{option.title}</strong>
              <span style={{ color: '#64748b', fontSize: 14 }}>{option.description}</span>
            </span>
          </label>
        ))}
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>{loading ? 'Loading shared setting…' : saving ? 'Saving…' : 'This shared setting applies to all visitors.'}</p>
      </div>
    </div>
  );
}
