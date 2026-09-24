import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import styles from '../css/AuthCard.module.css';
import useLoginStore from '../store/LoginStore';
import { handleGoogleLogin } from '../service/handleGoogleLogin';

const SLIDES = [
  {
    badge: 'Micro-Syllabus AI',
    title: 'Deconstruct the Civil Services Syllabus',
    desc: 'Targeted micro-topic tracking across GS 1–4 with spaced revision alerts.',
    stat: '1,400+ Topics Tagged',
  },
  {
    badge: 'Intelligent Mock Engine',
    title: 'High-Yield Prelims Pattern Analytics',
    desc: 'Multi-statement, pair-matching, and statement-reasoning drills.',
    stat: '30+ Question Patterns',
  },
  {
    badge: 'Strategic Retention',
    title: 'Adaptive Recall & Performance Heatmaps',
    desc: 'Turn static study hours into measurable retention scores.',
    stat: 'Real-time Readiness Score',
  },
];

export default function AuthCard() {
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  const setUser = useLoginStore((state) => state.setUser);
  const setUserProfile = useLoginStore((state) => state.setUserProfile);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.screenWrapper}>
      <div className={styles.auroraGlowOne} />
      <div className={styles.auroraGlowTwo} />
      <div className={styles.gridOverlay} />

      <div className={styles.glassContainer}>
        <aside className={styles.showcasePanel}>
          <div className={styles.topBar}>
            <div className={styles.brandMark}>
              <div className={styles.brandIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
              </div>
              <span className={styles.brandText}>
                Intelli<strong>Prep</strong>
              </span>
            </div>

            <span className={styles.badgeLive}>Civil Services CSE</span>
          </div>

          <div className={styles.slideBody}>
            <div key={activeSlide} className={styles.slideContent}>
              <span className={styles.categoryBadge}>{SLIDES[activeSlide].badge}</span>
              <h2>{SLIDES[activeSlide].title}</h2>
              <p>{SLIDES[activeSlide].desc}</p>
              
              <div className={styles.metricPill}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>{SLIDES[activeSlide].stat}</span>
              </div>
            </div>

            <div className={styles.paginationBar}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dash} ${i === activeSlide ? styles.dashActive : ''}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </aside>

        <main className={styles.authPanel}>
          <div className={styles.formContainer}>
            <div className={styles.header}>
              <div className={styles.sparkleTag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" />
                </svg>
                <span>AI-Assisted Learning</span>
              </div>
              <h1>Welcome to Intelliprep</h1>
              <p>Sign in with your Google identity to sync your syllabus matrix and test analytics.</p>
            </div>

            <div className={styles.actionBlock}>
              <button
                type="button"
                className={styles.googleButton}
                onClick={() => handleGoogleLogin({ navigate, setUser, setUserProfile })}
              >
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3h3.86c2.26-2.09 3.68-5.17 3.68-9.1z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z" />
                  <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.98-3.1z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.61l3.98 3.1c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className={styles.guaranteeTag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Zero spam • Encrypted local progress sync</span>
              </div>
            </div>

            <footer className={styles.footerNote}>
              Compliant with <a href="#privacy">Privacy Terms</a>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}