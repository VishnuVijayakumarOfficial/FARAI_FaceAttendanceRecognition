import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  User, 
  ArrowRight,
  TrendingUp,
  ScanFace,
  Camera,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import styles from './EmployeeDashboard.module.css';

const EmployeeDashboard = () => {
  const { user, signOut } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .single();

      setEmployeeInfo(empData);

      const { data: historyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      setHistory(historyData || []);
      setLoading(false);
    };

    fetchData();
  }, [user.id]);

  const isTodayMarked = () => {
    const today = new Date().toISOString().split('T')[0];
    return history.some(rec => rec.date === today);
  };

  const isFaceRegistered = () => !!(employeeInfo?.face_descriptor);

  const attendanceRate = () => {
    if (history.length === 0) return 0;
    const present = history.filter(r => r.status === 'Present').length;
    return Math.round((present / history.length) * 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className={styles.historyIcon} style={{ animation: 'spin 1s linear infinite', border: 'none', margin: '0 auto 1rem', background: 'transparent' }} size={48} />
          <p style={{ color: '#64748b', fontWeight: 'bold' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>

        {/* Top Navbar */}
        <nav className={styles.navbar}>
          <div className={styles.brandWrapper}>
            <div className={styles.brandIcon}>
              <ScanFace size={24} />
            </div>
            <div>
              <h1 className={styles.brandTitle}>FAR<span className={styles.brandHighlight}>AI</span></h1>
              <p className={styles.brandSubtitle}>Employee Portal</p>
            </div>
          </div>
          
          <div className={styles.navActions}>
            <button onClick={toggleTheme} className={styles.themeBtn}>
              {isDarkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} />}
            </button>
          </div>
        </nav>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerProfile}>
            {employeeInfo?.face_image ? (
              <div className={styles.avatarImgWrapper}>
                <img src={employeeInfo.face_image} alt={employeeInfo.name} className={styles.avatarImg} />
              </div>
            ) : (
              <div className={styles.avatarFallbackWrapper}>
                <User size={32} />
              </div>
            )}
            <div>
              <p className={styles.greetingText}>{getGreeting()},</p>
              <h1 className={styles.employeeName}>{employeeInfo?.name}</h1>
              <p className={styles.employeeInfo}>{employeeInfo?.designation} • {employeeInfo?.department}</p>
            </div>
          </div>
          <button onClick={signOut} className={styles.logoutBtn}>
            <LogOut size={24} />
          </button>
        </header>

        {/* Face Registration Warning Banner */}
        {!isFaceRegistered() && (
          <div className={styles.warningBanner}>
            <div className={styles.warningContent}>
              <div className={styles.warningIconWrapper}>
                <AlertTriangle size={24} className={styles.warningIcon} />
              </div>
              <div>
                <p className={styles.warningTitle}>Face Not Registered Yet</p>
                <p className={styles.warningDesc}>You need to register your face before marking attendance. Click the button to get started.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/employee/attendance?mode=register')}
              className={styles.warningActionBtn}
            >
              <Camera size={20} />
              Register Face
            </button>
          </div>
        )}

        <div className={styles.gridContainer}>
          {/* Left Column */}
          <div className={styles.leftColumn}>

            {/* Attendance Action Card */}
            <div className={styles.actionCard}>
              <h2 className={styles.actionCardTitle}>Daily Attendance</h2>
              <p className={styles.actionCardDesc}>Verify your identity with AI face scanning.</p>

              {isTodayMarked() ? (
                <div className={styles.markedStatus}>
                  <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem' }} />
                  <p className={styles.markedTitle}>Attendance Marked!</p>
                  <p className={styles.markedDesc}>Status: Present</p>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/employee/attendance?mode=attendance')}
                  className={styles.actionBtn}
                >
                  {isFaceRegistered() ? (
                    <>Verify &amp; Mark Now <ArrowRight size={22} /></>
                  ) : (
                    <><Camera size={22} /> Register Face &amp; Mark Attendance</>
                  )}
                </button>
              )}
            </div>

            {/* Face Registration Status Card */}
            <div className={styles.statusCard}>
              <h3 className={styles.statusCardTitle}>
                <ScanFace size={20} color="#10b981" />
                Face AI Status
              </h3>
              {isFaceRegistered() ? (
                <div>
                  <div className={styles.statusRow}>
                    {employeeInfo?.face_image ? (
                      <div className={styles.statusIconWrapper}>
                        <img src={employeeInfo.face_image} alt="Registered face" className={styles.statusIconImg} />
                      </div>
                    ) : (
                      <div className={styles.statusIconFallback}>
                        <ShieldCheck size={36} color="#10b981" />
                      </div>
                    )}
                    <div>
                      <p className={styles.statusGoodText}>Face Registered ✓</p>
                      <p className={styles.statusGoodSubtext}>Your biometric data is securely saved.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/employee/attendance?mode=register')}
                    className={styles.manageFaceBtn}
                  >
                    <ScanFace size={16} />
                    Manage Face Registration
                  </button>
                </div>
              ) : (
                <div className={styles.unregisteredWrapper}>
                  <div className={styles.unregisteredIconBox}>
                    <Camera size={32} color="#f59e0b" />
                  </div>
                  <p className={styles.unregisteredTitle}>No Face Registered</p>
                  <p className={styles.unregisteredSubtext}>Register your face to start marking attendance.</p>
                  <button
                    onClick={() => navigate('/employee/attendance?mode=register')}
                    className={styles.registerNowBtn}
                  >
                    <Camera size={16} />
                    Register Face Now
                  </button>
                </div>
              )}
            </div>

            {/* Work Schedule Card */}
            <div className={styles.scheduleCard}>
              <h3 className={styles.statusCardTitle}>
                <Clock size={20} color="#10b981" />
                Work Schedule
              </h3>
              <div>
                <div className={styles.scheduleRow}>
                  <span className={styles.scheduleLabel}>Shift Start</span>
                  <span className={styles.scheduleValue}>{employeeInfo?.attendance_start_time}</span>
                </div>
                <div className={styles.scheduleRow}>
                  <span className={styles.scheduleLabel}>Shift End</span>
                  <span className={styles.scheduleValue}>{employeeInfo?.attendance_end_time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Attendance History */}
          <div className={styles.rightColumn}>
            <div className={styles.historyCard}>
              <div className={styles.historyHeader}>
                <h3 className={styles.historyTitle}>Attendance History</h3>
                <div className={styles.ratePill}>
                  <TrendingUp size={16} />
                  {attendanceRate()}% Rate
                </div>
              </div>

              <div className={styles.historyList}>
                {history.length === 0 ? (
                  <div className={styles.historyEmpty}>
                    <Calendar size={48} color="#e2e8f0" style={{ margin: '0 auto 1rem' }} />
                    <p className={styles.historyEmptyText}>No attendance records yet.</p>
                    <p className={styles.historyEmptySub}>Your history will appear here after your first check-in.</p>
                  </div>
                ) : history.map((record) => (
                  <div key={record.id} className={styles.historyItem}>
                    <div className={styles.historyItemLeft}>
                      <div className={styles.historyIcon}>
                        <Calendar size={26} />
                      </div>
                      <div>
                        <p className={styles.historyDate}>
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className={styles.historyTime}>
                          <Clock size={14} />
                          Logged at: {new Date(record.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className={record.status === 'Present' ? styles.statusPillPresent : styles.statusPillAbsent}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
