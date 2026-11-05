import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { PublicApplication } from './PublicApplication.jsx';
import { ToastContainer } from './Toast.jsx';

const Workspace = lazy(() => import('./main.jsx'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Podar Pathways ErrorBoundary]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '560px', margin: '80px auto', textAlign: 'center', fontFamily: '-apple-system, sans-serif' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '36px 28px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px' }}>!</div>
            <h2 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '700' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the workspace.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '9px', fontWeight: '600', cursor: 'pointer', fontSize: '13.5px' }}
              >
                Reload Application
              </button>
              <button
                onClick={async () => { try { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok) throw new Error('Sign out failed'); localStorage.removeItem('podar-pathways-session'); window.location.reload(); } catch { window.alert('Unable to sign out. Please check your connection and try again.'); } }}
                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '9px', fontWeight: '600', cursor: 'pointer', fontSize: '13.5px' }}
              >
                Clear Cache & Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Suspense fallback={<main role="status" style={{ padding: 24 }}>Loading workspace…</main>}>
      <PublicApplication Workspace={Workspace} />
    </Suspense>
    <ToastContainer />
  </ErrorBoundary>
);
