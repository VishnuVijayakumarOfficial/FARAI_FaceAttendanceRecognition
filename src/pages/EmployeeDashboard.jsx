import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { 
  Calendar, 
  CheckCircle2, 
  LogOut, 
  User, 
  TrendingUp, 
  ScanFace,
  Camera,
  Loader2,
  Sun,
  Moon,
  Edit,
  Check
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
      const { data: empData, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (user.id !== 'demo-user-id' && !empData) {
        signOut();
        navigate('/?error=deactivated#login-section');
        return;
      }

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

        {/* Unified Header */}
        <header className={styles.headerWrapper}>
          <div className={styles.headerTop}>
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
              <button onClick={signOut} className={styles.logoutBtn}>
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <div className={styles.headerBottom}>
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
        </header>



        {/* Face Registration Status Card - Top Level */}
        <div className={styles.topStatusCard}>
          <h3 className={styles.topStatusCardTitle}>Face Registration Status</h3>
          {isFaceRegistered() ? (
            <div className={styles.topStatusContent}>
              <div className={styles.topStatusLeft}>
                <div className={styles.concentricOuter}>
                  <div className={styles.concentricInner}>
                    <div className={styles.cameraBox}>
                      <Camera size={24} color="white" />
                    </div>
                    <div className={styles.smallCheckBadge}>
                      <Check size={14} strokeWidth={4} />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className={styles.topStatusGoodTitle}>
                    <CheckCircle2 size={20} className={styles.topStatusCheckIcon} />
                    Face Registered Successfully
                  </h4>
                  <p className={styles.topStatusGoodSubtext}>Your face is registered and ready for attendance verification.</p>
                  <p className={styles.topStatusDate}>
                    <Calendar size={14} className={styles.calendarIconGreen} /> Last updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/employee/attendance?mode=register')}
                className={styles.editFaceBtn}
              >
                <Edit size={16} />
                Edit Face
              </button>
            </div>
          ) : (
            <div className={styles.topStatusContent}>
              <div className={styles.topStatusLeft}>
                 <div className={styles.largeIconWrapperFallback}>
                   <Camera size={40} className={styles.largeIconCameraFallback} />
                 </div>
                 <div>
                   <h4 className={styles.topStatusBadTitle}>No Face Registered</h4>
                   <p className={styles.topStatusBadSubtext}>Register your face to start marking attendance.</p>
                 </div>
              </div>
              <button
                onClick={() => navigate('/employee/attendance?mode=register')}
                className={styles.registerFaceBtn}
              >
                <Camera size={16} />
                Register Face Now
              </button>
            </div>
          )}
        </div>

        <div className={styles.gridContainer}>
          {/* Left Column */}
          <div className={styles.leftColumn}>

            {/* Daily Attendance Action Card */}
            <div className={styles.dailyAttendanceCard}>
              <h2 className={styles.dailyAttendanceTitle}>Daily Attendance</h2>
              <p className={styles.dailyAttendanceDesc}>Mark your attendance using AI face recognition.</p>

              <div className={styles.todayStatusBox}>
                <div>
                  <p className={styles.todayStatusLabel}>Today's Status</p>
                  <div className={styles.todayStatusFlex}>
                    {isTodayMarked() ? (
                      <div className={styles.checkedInRow}>
                        <CheckCircle2 size={24} color="#10b981" />
                        <span className={styles.checkedInText}>Checked In</span>
                      </div>
                    ) : (
                      <span className={styles.notCheckedInText}>Not Checked In</span>
                    )}
                  </div>
                </div>
                <div className={styles.todayStatusTime}>
                  <p className={styles.timeBig}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className={styles.dateSmall}>{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>

              <button
                onClick={() => navigate(isFaceRegistered() ? '/employee/attendance?mode=attendance' : '/employee/attendance?mode=register')}
                className={styles.markAttendanceBtn}
              >
                <Camera size={18} />
                Mark Attendance
              </button>
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
                      <div className={record.status === 'Present' ? styles.historyIconPresent : styles.historyIconAbsent}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className={styles.historyDate}>
                          {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {new Date(record.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
                            <span className={styles.todayText}> (Today)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={record.status === 'Present' ? styles.statusPillPresent : styles.statusPillAbsent}>
                      {record.status === 'Present' ? '• Present' : '• Absent'}
                    </span>
                  </div>
                ))}
              </div>
              
              {history.length > 0 && (
                <div className={styles.historyFooter}>
                  <button className={styles.viewAllBtn} onClick={() => navigate('/employee/reports')}>
                    View All History &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
