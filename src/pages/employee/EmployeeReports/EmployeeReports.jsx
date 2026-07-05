import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';


const EmployeeReports = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
    
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
    <div className="">
      <div className="">
        
        {/* Top Navbar */}
        <nav className="">
          <div className="">
            <div className="">
              <i className="bi bi-scanface" style={{fontSize: '24px'}} ></i>
            </div>
            <div>
              <h1 className="">FAR<span className="">AI</span></h1>
              <p className="">Employee Portal</p>
            </div>
          </div>
          
          
        </nav>

        {/* Back Button */}
        <button onClick={() => navigate('/employee/dashboard')} className="">
          <i className="bi bi-arrow-left" style={{fontSize: '18px'}} ></i> Back to Dashboard
        </button>

        {/* Header */}
        <div className="">
          <div>
            <h2 className="">My Attendance Records</h2>
            <p className="">View, filter, and download your personal attendance history</p>
          </div>
          <button
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className=" ${filteredRecords.length === 0 ? '' : ''}"
          >
            <i className="bi bi-filespreadsheet" style={{fontSize: '20px'}} ></i>
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="">
          <div className="">
            <div className="">
              <i className="bi bi-person-check" style={{fontSize: '28px'}} ></i>
            </div>
            <div>
              <p className="">Present Days</p>
              <p className="">{loading ? '...' : presentCount}</p>
            </div>
          </div>
          <div className="">
            <div className="">
              <i className="bi bi-userx" style={{fontSize: '28px'}} ></i>
            </div>
            <div>
              <p className="">Absent Days</p>
              <p className="">{loading ? '...' : absentCount}</p>
            </div>
          </div>
          <div className="">
            <div className="">
              <i className="bi bi-scanface" style={{fontSize: '28px'}} ></i>
            </div>
            <div>
              <p className="">Attendance Rate</p>
              <p className="">{loading ? '...' : `${attendanceRate}%`}</p>
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
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="">
            <i className="bi bi-calendar" style={{fontSize: '18px'}} ></i>
            <input
              type="date"
              className=""
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
                  <th className="">Date</th>
                  <th className="">Login Time</th>
                  <th className="">Verification Method</th>
                  <th className="">Status</th>
                </tr>
              </thead>
              <tbody className="">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="">
                      <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="">
                      No records found matching filters.
                    </td>
                  </tr>
                ) : filteredRecords.map((rec) => (
                  <tr key={rec.id} className="">
                    <td className="">
                      <span className="">
                        {new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })}
                      </span>
                    </td>
                    <td className="">
                      {rec.login_time ? (
                        <div className="">
                          <i className="bi bi-clock" style={{fontSize: '14px'}} ></i>
                          {new Date(rec.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      ) : (
                        <span className="">—</span>
                      )}
                    </td>
                    <td className="">
                      <div className="">
                        <i className="bi bi-scanface" style={{fontSize: '11px'}} ></i>
                        Face ID
                      </div>
                    </td>
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
          {!loading && (
            <div className="">
              <p className="">
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





