import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  Calendar,
  FileSpreadsheet,
  Loader2,
  UserCheck,
  UserX,
  ScanFace,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import styles from './AttendanceReports.module.css';

const AttendanceReports = () => {
  const { user } = useAuth();
  const [allEmployees, setAllEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch all employees
      let empQuery = supabase
        .from('employees')
        .select('id, name, employee_id, department, designation, face_image, face_descriptor');
      if (user && user.id !== 'demo-user-id') {
        empQuery = empQuery.eq('admin_id', user.id);
      }
      const { data: empData } = await empQuery.order('name', { ascending: true });

      // 2. Fetch attendance for selected date
      let attQuery = supabase
        .from('attendance')
        .select('employee_id, login_time, status, employees!inner(admin_id)')
        .eq('date', dateFilter);
      if (user && user.id !== 'demo-user-id') {
        attQuery = attQuery.eq('employees.admin_id', user.id);
      }
      const { data: attData } = await attQuery;

      // Build a map: employee_id -> attendance record
      const map = {};
      if (attData) {
        attData.forEach(att => { map[att.employee_id] = att; });
      }

      setAllEmployees(empData || []);
      setAttendanceMap(map);
      setLoading(false);
    };

    fetchData();
  }, [dateFilter, user]);

  // Merge employees with attendance status
  const mergedRecords = allEmployees.map(emp => ({
    ...emp,
    attendance: attendanceMap[emp.id] || null,
    status: attendanceMap[emp.id] ? attendanceMap[emp.id].status : 'Absent',
    login_time: attendanceMap[emp.id]?.login_time || null,
  }));

  // Apply filters
  const filtered = mergedRecords.filter(rec => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const presentCount = mergedRecords.filter(r => r.status === 'Present').length;
  const absentCount = mergedRecords.filter(r => r.status === 'Absent').length;

  const exportCSV = () => {
    const headers = ['Name', 'Employee ID', 'Department', 'Status', 'Login Time'];
    const rows = filtered.map(r => [
      r.name,
      r.employee_id,
      r.department,
      r.status,
      r.login_time ? new Date(r.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${dateFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.pageContainer}>

      {/* Header */}
      <div className={styles.headerWrapper}>
        <div>
          <h2 className={styles.pageTitle}>Attendance Reports</h2>
          <p className={styles.pageSubtitle}>Monitor and export daily attendance logs</p>
        </div>
        <button
          onClick={exportCSV}
          className={styles.exportBtn}
        >
          <FileSpreadsheet size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.iconPresent}>
            <UserCheck size={28} />
          </div>
          <div>
            <p className={styles.statLabel}>Present</p>
            <p className={styles.statValue}>{loading ? '...' : presentCount}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.iconAbsent}>
            <UserX size={28} />
          </div>
          <div>
            <p className={styles.statLabel}>Absent</p>
            <p className={styles.statValue}>{loading ? '...' : absentCount}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.iconRate}>
            <ScanFace size={28} />
          </div>
          <div>
            <p className={styles.statLabel}>Attendance Rate</p>
            <p className={styles.statValue}>
              {loading || allEmployees.length === 0 ? '...' : `${Math.round((presentCount / allEmployees.length) * 100)}%`}
            </p>
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
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <Search className={styles.filterIcon} size={18} />
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className={styles.inputField}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Login Time</th>
                <th className={styles.th}>Face AI</th>
                <th className={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.tdEmpty}>
                    <Loader2 className="animate-spin inline-block text-primary-500" size={32} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.tdEmpty}>
                    No records found.
                  </td>
                </tr>
              ) : filtered.map((rec) => (
                <tr key={rec.id} className={styles.tr}>
                  {/* Employee */}
                  <td className={styles.td}>
                    <div className={styles.empWrapper}>
                      {rec.face_image ? (
                        <img src={rec.face_image} alt={rec.name} className={styles.avatarImg} />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {rec.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className={styles.empName}>{rec.name}</p>
                        <p className={styles.empDesig}>{rec.designation}</p>
                      </div>
                    </div>
                  </td>
                  {/* ID */}
                  <td className={styles.td}>
                    <span className={styles.tdId}>#{rec.employee_id}</span>
                  </td>
                  {/* Department */}
                  <td className={styles.td}>
                    <span className={styles.tdDept}>{rec.department}</span>
                  </td>
                  {/* Login Time */}
                  <td className={styles.td}>
                    {rec.login_time ? (
                      <div className={styles.loginTimeWrapper}>
                        <Clock size={14} className={styles.iconClock} />
                        {new Date(rec.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <span className={styles.timeEmpty}>—</span>
                    )}
                  </td>
                  {/* Face AI */}
                  <td className={styles.td}>
                    <div className={rec.face_descriptor ? styles.pillReg : styles.pillUnreg}>
                      <ScanFace size={11} />
                      {rec.face_descriptor ? 'Registered' : 'Not Set'}
                    </div>
                  </td>
                  {/* Status */}
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

        {/* Footer summary */}
        {!loading && (
          <div className={styles.tableFooter}>
            <p className={styles.footerText}>
              Showing {filtered.length} of {allEmployees.length} employees
            </p>
            <p className={styles.footerText}>
              Date: {new Date(dateFilter).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
