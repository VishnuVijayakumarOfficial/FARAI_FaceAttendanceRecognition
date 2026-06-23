import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  Calendar,
  FileSpreadsheet,
  Loader2,
  UserCheck,
  UserX,
  ScanFace,
  Clock,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import styles from './EmployeeReports.module.css';

const EmployeeReports = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data: empData } = await supabase
          .from('employees')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (user.id !== 'demo-user-id' && !empData) {
          signOut();
          navigate('/?error=deactivated#login-section');
          return;
        }

        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error fetching attendance history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchHistory();
    }
  }, [user?.id, user.id, navigate, signOut]);

  // Apply filters
  const filteredRecords = history.filter(rec => {
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    
    let matchesDateRange = true;
    if (startDate) {
      matchesDateRange = matchesDateRange && rec.date >= startDate;
    }
    if (endDate) {
      matchesDateRange = matchesDateRange && rec.date <= endDate;
    }
    
    return matchesStatus && matchesDateRange;
  });

  const presentCount = history.filter(r => r.status === 'Present').length;
  const absentCount = history.filter(r => r.status === 'Absent').length;
  const totalCount = history.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const exportCSV = () => {
    const headers = ['Date', 'Login Time', 'Status', 'Method'];
    const rows = filteredRecords.map(r => [
      r.date,
      r.login_time ? new Date(r.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
      r.status,
      'Face ID'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_attendance_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          
          <button onClick={toggleTheme} className={styles.themeBtn}>
            {isDarkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} />}
          </button>
        </nav>

        {/* Back Button */}
        <button onClick={() => navigate('/employee/dashboard')} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Header */}
        <div className={styles.headerWrapper}>
          <div>
            <h2 className={styles.pageTitle}>My Attendance Records</h2>
            <p className={styles.pageSubtitle}>View, filter, and download your personal attendance history</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className={`${styles.exportBtn} ${filteredRecords.length === 0 ? styles.exportBtnDisabled : ''}`}
          >
            <FileSpreadsheet size={20} />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.iconPresent}>
              <UserCheck size={28} />
            </div>
            <div>
              <p className={styles.statLabel}>Present Days</p>
              <p className={styles.statValue}>{loading ? '...' : presentCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.iconAbsent}>
              <UserX size={28} />
            </div>
            <div>
              <p className={styles.statLabel}>Absent Days</p>
              <p className={styles.statValue}>{loading ? '...' : absentCount}</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.iconRate}>
              <ScanFace size={28} />
            </div>
            <div>
              <p className={styles.statLabel}>Attendance Rate</p>
              <p className={styles.statValue}>{loading ? '...' : `${attendanceRate}%`}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersWrapper}>
          <div className={styles.filterGroup}>
            <Calendar className={styles.filterIcon} size={18} />
            <input
              type="date"
              className={styles.inputField}
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <Calendar className={styles.filterIcon} size={18} />
            <input
              type="date"
              className={styles.inputField}
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.statusButtonGroup}>
            {['All', 'Present', 'Absent'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`${styles.statusBtn} ${statusFilter === s ? styles.statusBtnActive : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Login Time</th>
                  <th className={styles.th}>Verification Method</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {loading ? (
                  <tr>
                    <td colSpan="4" className={styles.tdEmpty}>
                      <Loader2 className="animate-spin inline-block text-primary-500" size={32} />
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.tdEmpty}>
                      No records found matching filters.
                    </td>
                  </tr>
                ) : filteredRecords.map((rec) => (
                  <tr key={rec.id} className={styles.tr}>
                    <td className={styles.td}>
                      <span className={styles.dateText}>
                        {new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {rec.login_time ? (
                        <div className={styles.loginTimeWrapper}>
                          <Clock size={14} className={styles.iconClock} />
                          {new Date(rec.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      ) : (
                        <span className={styles.timeEmpty}>—</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.pillReg}>
                        <ScanFace size={11} />
                        Face ID
                      </div>
                    </td>
                    <td className={styles.td}>
                      <span className={rec.status === 'Present' ? styles.pillPresent : styles.pillAbsent}>
                        {rec.status === 'Present' ? <UserCheck size={11} /> : <UserX size={11} />}
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className={styles.tableFooter}>
              <p className={styles.footerText}>
                Showing {filteredRecords.length} records
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeReports;
