import React from 'react';
import { buildScoreSummary } from './pcareScoreModel.js';
import './styles.css';

export function PCareScoreBreakdown({ student }) {
  const summary = buildScoreSummary(student);
  return (
    <div className="pcare-reference-page">
      <header className="pcare-reference-heading">
        <p className="eyebrow">CAREER JOURNEY</p>
        <h1>P-CARE employability score</h1>
        <p>A living view of your academic and employability journey.</p>
      </header>
      <section className="pcare-reference-hero" aria-label="Employability score summary">
        <div className="pcare-reference-overall">
          <div className="pcare-reference-total"><span>OVERALL READINESS</span><strong>{summary.overall}</strong></div>
          <p>out of 100{summary.rank ? ` • Department rank #${summary.rank}` : ''}</p>
        </div>
        <div className="pcare-reference-bars">
          {summary.groups.map(group => (
            <div className="pcare-reference-category" key={group.title}>
              <div className="pcare-reference-bar-heading"><span>{group.title}</span><strong>{group.value === null ? '—' : `${group.value}%`}</strong></div>
              <div className="pcare-reference-track" role={group.value === null ? undefined : 'progressbar'} aria-label={group.title} aria-valuenow={group.value ?? undefined} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${group.value ?? 0}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
      <div className="pcare-reference-cards">
        {summary.groups.map(group => (
          <section className="pcare-reference-card" key={group.title}>
            <h2>{group.title}</h2>
            {group.metrics.map(metric => <p key={metric.label}>{metric.label} <strong>{metric.value === null ? '—' : `${metric.value}%`}</strong></p>)}
          </section>
        ))}
      </div>
      {summary.groups.some(group => group.value === null || group.metrics.some(metric => metric.value === null)) && <p className="pcare-reference-note">— Scores will appear when assessment data is available.</p>}
    </div>
  );
}
