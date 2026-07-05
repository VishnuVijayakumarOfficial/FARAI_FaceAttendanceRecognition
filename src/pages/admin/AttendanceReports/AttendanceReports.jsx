import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

import { useAuth } from '../../../hooks/useAuth';

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
    <div className="">

      {/* Header */}
      <div className="">
        <div>
          <h2 className="">Attendance Reports</h2>
          <p className="">Monitor and export daily attendance logs</p>
        </div>
        <button
          onClick={exportCSV}
          className=""
        >
          <i className="bi bi-filespreadsheet" style={{fontSize: '20px'}} ></i>
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="">
        <div className="">
          <div className="">
            <i className="bi bi-person-check" style={{fontSize: '28px'}} ></i>
          </div>
          <div>
            <p className="">Present</p>
            <p className="">{loading ? '...' : presentCount}</p>
          </div>
        </div>
        <div className="">
          <div className="">
            <i className="bi bi-userx" style={{fontSize: '28px'}} ></i>
          </div>
          <div>
            <p className="">Absent</p>
            <p className="">{loading ? '...' : absentCount}</p>
          </div>
        </div>
        <div className="">
          <div className="">
            <i className="bi bi-scanface" style={{fontSize: '28px'}} ></i>
          </div>
          <div>
            <p className="">Attendance Rate</p>
            <p className="">
              {loading || allEmployees.length === 0 ? '...' : `${Math.round((presentCount / allEmployees.length) * 100)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="">
        <div className="">
          <i className="bi bi-calendar" style={{fontSize: '18px'}} ></i>
          <input
            type="date"
            className=""
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="">
          <i className="bi bi-search" style={{fontSize: '18px'}} ></i>
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="">
          {['All', 'Present', 'Absent'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className=" ${statusFilter === s ? '' : ''}"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="">
        <div className="">
          <table className="">
            <thead className="">
              <tr>
                <th className="">Employee</th>
                <th className="">ID</th>
                <th className="">Department</th>
                <th className="">Login Time</th>
                <th className="">Face AI</th>
                <th className="">Status</th>
              </tr>
            </thead>
            <tbody className="">
              {loading ? (
                <tr>
                  <td colSpan="6" className="">
                    <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="">
                    No records found.
                  </td>
                </tr>
              ) : filtered.map((rec) => (
                <tr key={rec.id} className="">
                  {/* Employee */}
                  <td className="">
                    <div className="">
                      {rec.face_image ? (
                        <img src={rec.face_image} alt={rec.name} className="" />
                      ) : (
                        <div className="">
                          {rec.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="">{rec.name}</p>
                        <p className="">{rec.designation}</p>
                      </div>
                    </div>
                  </td>
                  {/* ID */}
                  <td className="">
                    <span className="">#{rec.employee_id}</span>
                  </td>
                  {/* Department */}
                  <td className="">
                    <span className="">{rec.department}</span>
                  </td>
                  {/* Login Time */}
                  <td className="">
                    {rec.login_time ? (
                      <div className="">
                        <i className="bi bi-clock" style={{fontSize: '14px'}} ></i>
                        {new Date(rec.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <span className="">—</span>
                    )}
                  </td>
                  {/* Face AI */}
                  <td className="">
                    <div className={rec.face_descriptor ? '' : ''}>
                      <i className="bi bi-scanface" style={{fontSize: '11px'}} ></i>
                      {rec.face_descriptor ? 'Registered' : 'Not Set'}
                    </div>
                  </td>
                  {/* Status */}
                  <td className="">
                    <span className={rec.status === 'Present' ? '' : ''}>
                      {rec.status === 'Present' ? <i className="bi bi-person-check" style={{fontSize: '11px'}} ></i> : <i className="bi bi-userx" style={{fontSize: '11px'}} ></i>}
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
          <div className="">
            <p className="">
              Showing {filtered.length} of {allEmployees.length} employees
            </p>
            <p className="">
              Date: {new Date(dateFilter).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;





