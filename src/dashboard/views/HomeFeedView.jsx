import React from 'react';
import styles from '../Dashboard.module.css';
import { and } from 'firebase/firestore';

export default function HomeFeedView({ profile, setActiveNav }) {
    if(profile.ongoingsubject1 !== null || profile.ongoingsubject2 !== null)
    {

      const subjectsCards = [
    { title: 'History', progress: '35%', fill: 35, topic: 'Modern India', count: '12 / 35 topics', badgeBg: '#fee2e2', badgeColor: '#dc2626', barColor: '#f87171' },
    { title: 'Polity', progress: '20%', fill: 20, topic: 'Indian Constitution', count: '8 / 40 topics', badgeBg: '#e0e7ff', badgeColor: '#4f46e5', barColor: '#818cf8' },
    { title: 'Economy', progress: '10%', fill: 10, topic: 'Indian Economy', count: '4 / 38 topics', badgeBg: '#dcfce7', badgeColor: '#16a34a', barColor: '#34d399' },
    { title: 'Environment', progress: '25%', fill: 25, topic: 'Ecology & Environment', count: '7 / 28 topics', badgeBg: '#cffafe', badgeColor: '#0891b2', barColor: '#22d3ee' }
  ];

  return (
    <div className={styles.workspaceScroll}>
      {/* Continue Learning Cards */}
      <section className={styles.feedBlock}>
        <div className={styles.feedBlockHeader}>
          <div className={styles.feedBlockTitle}>
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sectionIconBlue}>
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3>Continue Learning</h3>
          </div>
          <a
            href="#viewall"
            className={styles.linkViewAll}
            onClick={(e) => {
              e.preventDefault();
              if (setActiveNav) setActiveNav('Syllabus');
            }}
          >
            View All &rarr;
          </a>
        </div>

        <div className={styles.subjectsGrid}>
          {subjectsCards.map((sub, idx) => (
            <div key={idx} className={styles.whiteSubjectCard}>
              <div className={styles.subjectTop}>
                <div className={styles.subjectIconCircle} style={{ backgroundColor: sub.badgeBg, color: sub.badgeColor }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <h4>{sub.title}</h4>
              <span className={styles.subjectProgressText}>{sub.progress}</span>

              <div className={styles.subjectProgressBar}>
                <div
                  className={styles.subjectProgressFill}
                  style={{ width: `${sub.fill}%`, backgroundColor: sub.barColor }}
                />
              </div>

              <div className={styles.subjectMetaLine}>
                <strong>{sub.topic}</strong>
                <span>{sub.count}</span>
              </div>

              <button
                className={styles.btnSubjectContinue}
                onClick={() => {
                  if (setActiveNav) setActiveNav('Syllabus');
                }}
              >
                Continue &rarr;
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity List */}
      <section className={styles.feedBlock}>
        <div className={styles.feedBlockHeader}>
          <div className={styles.feedBlockTitle}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.sectionIconBlue}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <h3>Recent Activity</h3>
          </div>
          <a
            href="#viewall"
            className={styles.linkViewAll}
            onClick={(e) => {
              e.preventDefault();
              if (setActiveNav) setActiveNav('Performance Analysis');
            }}
          >
            View All &rarr;
          </a>
        </div>

        <div className={styles.activityFeed}>
          {/* Row 1: MCQ Practice */}
          <div className={styles.activityRow}>
            <div className={styles.activityIconBox} style={{ background: 'rgba(37,99,235,0.15)', color: '#3b82f6' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5" />
              </svg>
            </div>
            <div className={styles.activityInfo}>
              <strong>MCQ Practice</strong>
              <p>Indian Polity • 15 questions</p>
            </div>
            <span className={styles.activityTimestamp}>Today, 10:24 AM</span>
            <span className={styles.scorePillGreen}>78%</span>
            <svg className={styles.cardChevron} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Row 2: Concept Study */}
          <div className={styles.activityRow}>
            <div className={styles.activityIconBox} style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className={styles.activityInfo}>
              <strong>Concept Study</strong>
              <p>Economy • Fiscal Policy</p>
            </div>
            <span className={styles.activityTimestamp}>Yesterday, 08:15 PM</span>
            <svg className={styles.cardChevron} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Row 3: Mock Test */}
          <div className={styles.activityRow}>
            <div className={styles.activityIconBox} style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className={styles.activityInfo}>
              <strong>Mock Test</strong>
              <p>GS Paper 1 • 50 questions</p>
            </div>
            <span className={styles.activityTimestamp}>Yesterday, 05:32 PM</span>
            <span className={styles.scorePillPurple}>62%</span>
            <svg className={styles.cardChevron} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
else{

    return (
    <div className={styles.workspaceScroll}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 21, 35, 0.85) 0%, rgba(10, 14, 26, 0.95) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '18px',
          padding: '2.5rem 2rem',
          maxWidth: '680px',
          margin: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        {/* Warning Icon Badge */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div>
          <h2 style={{ color: '#f8fafc', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.3px', margin: '0 0 0.4rem 0' }}>
            Subject Selection Required
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: 0 }}>
            Configure your preparation track to unlock your workspace and test analytics.
          </p>
        </div>

        {/* Bullet Conditions */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '1.25rem 1.4rem',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.18)',
                color: '#60a5fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.74rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              1
            </span>
            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
              You must select at least <strong>one primary subject</strong> to start, and a <strong>secondary subject</strong> can also be chosen.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.18)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.74rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              2
            </span>
            <p style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
              Subjects chosen once cannot be altered and you will have to reset your full profile because <strong>DISCIPLINE</strong> is required for this preparation and <strong>A SUBJECT STARTED MEANS IT SHOULD BE FINISHED</strong>.
            </p>
          </div>
        </div>

        {/* Action Prompt & Settings Button */}
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
          Go to Settings to select your GS subjects and Optional Subject.
        </p>

        <button
          type="button"
          onClick={() => setActiveNav && setActiveNav('Settings')}
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '0.65rem 1.6rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Open Settings →
        </button>
      </div>
    </div>
  );

}
}