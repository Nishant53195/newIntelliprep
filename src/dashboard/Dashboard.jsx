import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firestoreDb } from '../firebase/firestore/config';
import useLoginStore from '../login/store/LoginStore';
import HomeFeedView from './views/HomeFeedView';
import SettingsView from './views/SettingsView';
import PrelimsPYQView from './views/PrelimsPYQView';
import MainsPYQView from './views/MainsPYQView';
import styles from './Dashboard.module.css';
import { db } from '../db/dexieDb';

export default function Dashboard() {
  const user = useLoginStore((state) => state.user);
  const setUserProfile = useLoginStore((state) => state.setUserProfile);
  const userProfile = useLoginStore((state) => state.userProfile);
  const logout = useLoginStore((state) => state.logout);

  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [dailyGoals, setDailyGoals] = useState([
    { id: 1, title: 'Study Ancient History', progress: '2 / 3 topics', completed: true },
    { id: 2, title: 'Solve 20 MCQs (Polity)', progress: '0 / 20', completed: false },
    { id: 3, title: 'Revise Environment Notes', progress: '0 / 1', completed: false }
  ]);

  const navigate = useNavigate();

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const navLinks = [
    { name: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Study Plan', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Syllabus', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Current Affairs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Prelims PYQs', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Mains PYQs', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Performance Analysis', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { name: 'Community', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Resources', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  const quickLinks = [
    { name: 'Subject Wise MCQs', targetNav: 'Prelims PYQs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2', color: '#2563eb' },
    { name: 'Previous Year Questions', targetNav: 'Prelims PYQs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5', color: '#10b981' },
    { name: 'Full Length Tests', targetNav: 'Performance Analysis', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: '#f59e0b' },
    { name: 'Current Affairs', targetNav: 'Current Affairs', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z', color: '#8b5cf6' },
    { name: 'NCERT Summary', targetNav: 'Resources', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13', color: '#ec4899' },
    { name: 'Important Notes', targetNav: 'Study Plan', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5', color: '#f43f5e' }
  ];

  // 1. Fetch User Profile (Dexie first, then Firestore fallback)[cite: 22]
  useEffect(() => {
    let isMounted = true;

    async function verifyAndFetchProfile() {
      if (!user?.uid) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const localData = await db.users.get(user.uid);
        if (isMounted && localData) {
          setProfileData(localData);
          setUserProfile(localData);
          setLoading(false);
          return;
        }

        const userDocRef = doc(firestoreDb, 'master_users', user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!isMounted) return;

        if (!docSnap.exists()) {
          navigate('/login', { replace: true });
        } else {
          const data = docSnap.data();
          await db.users.put(data);
          setProfileData(data);
          setUserProfile(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard profile:', error);
        if (isMounted) {
          navigate('/login', { replace: true });
        }
      }
    }

    verifyAndFetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user, navigate, setUserProfile]);

  // 2. Fetch full micro-syllabus hierarchy into Dexie
  useEffect(() => {
    let isMounted = true;

    async function syncEntireMasterSubjects() {
      try {
        const cachedCount = await db.master_gs_subjects.count();
        if (cachedCount > 0) {
          return; // Poora data pehle se Dexie me saved hai[cite: 24, 25]
        }

        // Pura subjects collection uthao
        const subjectsColRef = collection(firestoreDb, 'master_gs_subjects');
        const subjectsSnapshot = await getDocs(subjectsColRef);

        const completeSubjectsData = await Promise.all(
          subjectsSnapshot.docs.map(async (subjectDoc) => {
            const subjectData = subjectDoc.data();
            const subjectId = subjectDoc.id;

            // Is subject ke saare topics uthao[cite: 24]
            const topicsColRef = collection(firestoreDb, 'master_gs_subjects', subjectId, 'topics');
            const topicsSnapshot = await getDocs(topicsColRef);

            let totalSubtopicsCount = 0;

            // Har topic ke nested subtopics uthao[cite: 24]
            const topicsWithSubtopics = await Promise.all(
              topicsSnapshot.docs.map(async (topicDoc) => {
                const topicData = topicDoc.data();
                const topicId = topicDoc.id;

                const subtopicsColRef = collection(
                  firestoreDb,
                  'master_gs_subjects',
                  subjectId,
                  'topics',
                  topicId,
                  'subtopics'
                );
                const subtopicsSnapshot = await getDocs(subtopicsColRef);

                const subtopics = subtopicsSnapshot.docs.map((subDoc) => ({
                  id: subDoc.id,
                  ...subDoc.data(),
                }));

                totalSubtopicsCount += subtopics.length;

                return {
                  id: topicId,
                  ...topicData,
                  subtopicsCount: subtopics.length,
                  subtopics: subtopics, // <-- Pura subtopic data yahan array me store hai
                };
              })
            );

            return {
              id: subjectId,
              ...subjectData,
              name: subjectData.name || subjectId,
              paper: subjectData.paper || '',
              type: subjectData.type || '',
              totalTopics: topicsWithSubtopics.length,
              totalSubtopics: totalSubtopicsCount,
              topics: topicsWithSubtopics, // <-- Pura topic hierarchy yahan array me store hai
            };
          })
        );

        if (isMounted && completeSubjectsData.length > 0) {
          // Bulk put complete objects with topics & subtopics into Dexie[cite: 25]
          await db.master_gs_subjects.bulkPut(completeSubjectsData);
        }
      } catch (err) {
        console.error('Background full sync for master_gs_subjects failed:', err);
      }
    }

    syncEntireMasterSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleGoal = (id) => {
    setDailyGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal))
    );
  };

  const handleLogout = async () => {
    if (logout) await logout();
    navigate('/login', { replace: true });
  };

  const renderWorkspace = () => {
    switch (activeNav) {
      case 'Dashboard':
        return <HomeFeedView profile={userProfile || profileData} setActiveNav={setActiveNav} />;
      case 'Settings':
        return (
          <SettingsView
            user={user}
            userProfile={userProfile || profileData}
            setUserProfile={setUserProfile}
            setActiveNav={setActiveNav}
          />
        );

      case 'Prelims PYQs': // <-- Yeh case add karein
      return <PrelimsPYQView user={user} />;

      case 'Mains PYQs': // <-- Yeh case add karein
      return <MainsPYQView user={user} />;

      default:
        return (
          <div className={styles.workspaceScroll}>
            <div
              style={{
                background: '#0f1523',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '16px',
                padding: '2.5rem',
                textAlign: 'center',
                margin: 'auto 0'
              }}
            >
              <h2 style={{ color: '#f8fafc', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                {activeNav}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Module workspace is initialized. Ready to render component views.
              </p>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070a13',
          color: '#60a5fa',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid rgba(96, 165, 250, 0.2)',
            borderTopColor: '#60a5fa',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading your workspace...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {mobileMenuOpen && (
        <div className={styles.backdrop} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* 1. LEFT NAVIGATION */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brandHeader}>
          <div className={styles.brandBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <h2>IntelliPrep</h2>
            <span>Dream • Prepare • Achieve</span>
          </div>
          <button className={styles.mobileClose} onClick={() => setMobileMenuOpen(false)}>
            ✕
          </button>
        </div>

        <nav className={styles.navMenu}>
          {navLinks.map((item) => (
            <button
              key={item.name}
              className={`${styles.navItem} ${activeNav === item.name ? styles.navItemActive : ''}`}
              onClick={() => {
                setActiveNav(item.name);
                setMobileMenuOpen(false);
              }}
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 2. MIDDLE WORKSPACE */}
      <main className={styles.mainFeed}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.mobileHamburger} onClick={() => setMobileMenuOpen(true)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className={styles.searchBar}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search topics, subjects, questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.headerProfile}>
            <button className={styles.bellBtn} aria-label="Notifications">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className={styles.bellDot} />
            </button>

            <div style={{ position: 'relative' }}>
              <div
                className={styles.userProfilePill}
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                role="button"
                tabIndex={0}
              >
                <img
                  src={
                    user?.photoURL ||
                    profileData?.photoURL ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                  }
                  alt="Avatar"
                  className={styles.userAvatar}
                />
                <div className={styles.userMeta}>
                  <h4>{profileData?.displayName || userProfile?.displayName || user?.displayName || 'Aspirant'}</h4>
                </div>
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={styles.dropdownCarat}
                  style={{
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {profileDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    width: '160px',
                    padding: '6px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveNav('Settings');
                      setProfileDropdownOpen(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f87171',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      textAlign: 'left',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {renderWorkspace()}
      </main>

      {/* 3. RIGHT ANALYTICS SIDEBAR */}
      <aside className={styles.rightAnalytics}>
        <section className={styles.rightCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadTitle}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.iconBlue}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3>Your Progress</h3>
            </div>
            <button
              onClick={() => setActiveNav('Performance Analysis')}
              className={styles.linkHead}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              View Details &rarr;
            </button>
          </div>

          <div className={styles.progressGaugeWrapper}>
            <div className={styles.donutContainer}>
              <svg viewBox="0 0 100 100" className={styles.donutSvg}>
                <circle cx="50" cy="50" r="38" className={styles.donutBase} />
                <circle cx="50" cy="50" r="38" className={styles.donutBar} />
              </svg>
              <div className={styles.donutCore}>
                <h2>24%</h2>
                <span>Overall Progress</span>
              </div>
            </div>

            <div className={styles.donutLegend}>
              <div className={styles.legendEntry}>
                <span className={styles.legendDot} style={{ background: '#10b981' }} />
                <p>Completed</p>
                <strong>24%</strong>
              </div>
              <div className={styles.legendEntry}>
                <span className={styles.legendDot} style={{ background: '#f59e0b' }} />
                <p>In Progress</p>
                <strong>14%</strong>
              </div>
              <div className={styles.legendEntry}>
                <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
                <p>Not Started</p>
                <strong>62%</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.rightCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadTitle}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className={styles.iconRed}>
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <h3>Today's Goals</h3>
            </div>
            <span className={styles.dateBadge}>{formattedToday}</span>
          </div>

          <div className={styles.goalTaskList}>
            {dailyGoals.map((goal) => (
              <div
                key={goal.id}
                className={styles.goalTaskItem}
                onClick={() => toggleGoal(goal.id)}
                style={{ cursor: 'pointer' }}
              >
                {goal.completed ? (
                  <div className={styles.checkDone}>✓</div>
                ) : (
                  <div className={styles.checkUnchecked} />
                )}
                <div className={styles.goalMeta}>
                  <strong style={{ textDecoration: goal.completed ? 'line-through' : 'none', opacity: goal.completed ? 0.7 : 1 }}>
                    {goal.title}
                  </strong>
                  <span>{goal.progress}</span>
                </div>
              </div>
            ))}
          </div>

          <button className={styles.btnAddGoal} onClick={() => setActiveNav('Study Plan')}>
            + Add Goal
          </button>
        </section>

        <section className={styles.rightCard}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadTitle}>
              <svg fill="currentColor" viewBox="0 0 24 24" className={styles.iconYellow}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3>Quick Access</h3>
            </div>
          </div>

          <div className={styles.quickAccessMatrix}>
            {quickLinks.map((ql, idx) => (
              <div
                key={idx}
                className={styles.quickAccessTile}
                onClick={() => setActiveNav(ql.targetNav)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.quickTileIcon} style={{ color: ql.color, backgroundColor: `${ql.color}15` }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={ql.icon} />
                  </svg>
                </div>
                <span>{ql.name}</span>
                <svg className={styles.tileChevron} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.proverbQuoteBox}>
          <span className={styles.quoteDoubleMark}>“</span>
          <p>The best time to plant a tree was 20 years ago. The second best time is now.</p>
          <small>— Chinese Proverb</small>
        </div>
      </aside>
    </div>
  );
}