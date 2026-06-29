import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const StatCard = ({ title, value, icon, trend, trendValue }) => (
  <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white`}>
    <div className="card-body p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className={`p-3 rounded-circle bg-opacity-10 bg-success text-success`}>
          {icon}
        </div>
        <div className={`badge ${trend === 'up' ? 'bg-success' : 'bg-danger'} bg-opacity-25 text-${trend === 'up' ? 'success' : 'danger'} rounded-pill px-2 py-1`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trendValue}%
        </div>
      </div>
      <h6 className="text-secondary mb-1">{title}</h6>
      <h3 className="fw-bold mb-0">{value}</h3>
    </div>
  </div>
);


const DashboardOverview = () => {
  const { user } = useAuth();
    const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    avg: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let totalQuery = supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });
        if (user && user.id !== 'demo-user-id') {
          totalQuery = totalQuery.eq('admin_id', user.id);
        }
        const { count: total } = await totalQuery;

        const today = new Date().toISOString().split('T')[0];
        let presentQuery = supabase
          .from('attendance')
          .select('*, employees!inner(admin_id)', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'Present');
        if (user && user.id !== 'demo-user-id') {
          presentQuery = presentQuery.eq('employees.admin_id', user.id);
        }
        const { count: present } = await presentQuery;

        const absent = (total || 0) - (present || 0);
        const avg = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';

        setStats({ total: total || 0, present: present || 0, absent, avg });

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 6);
        let attendanceQuery = supabase
          .from('attendance')
          .select(`*, employees!inner(name, department, admin_id)`)
          .gte('date', lastWeek.toISOString().split('T')[0])
          .order('login_time', { ascending: false });
        if (user && user.id !== 'demo-user-id') {
          attendanceQuery = attendanceQuery.eq('employees.admin_id', user.id);
        }
        const { data: attendanceData } = await attendanceQuery;

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekMap = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          weekMap[days[d.getDay()]] = { name: days[d.getDay()], present: 0, absent: total || 0 };
        }

        const deptMap = {};
        const recent = [];

        if (attendanceData) {
          attendanceData.forEach(att => {
            const dayName = days[new Date(att.date).getDay()];
            if (weekMap[dayName]) {
              weekMap[dayName].present += 1;
              weekMap[dayName].absent = Math.max(0, weekMap[dayName].absent - 1);
            }

            if (att.date === today && att.employees) {
              const dept = att.employees.department || 'Other';
              deptMap[dept] = (deptMap[dept] || 0) + 1;
            }

            if (recent.length < 5) {
              recent.push({
                name: att.employees?.name || 'Unknown',
                time: att.login_time
                  ? new Date(att.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '-',
                status: att.status || 'Present',
                method: 'Face ID'
              });
            }
          });
        }

        setWeeklyData(Object.values(weekMap));
        setDeptData(Object.keys(deptMap).map(k => ({ dept: k, count: deptMap[k] })));
        setRecentLogins(recent);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="container-fluid py-4">
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard 
            title="Total Employees" 
            value={loading ? '...' : stats.total} 
            icon={<Users size={24} />} 
            trend="up" 
            trendValue="12" 
            
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard 
            title="Present Today" 
            value={loading ? '...' : stats.present} 
            icon={<UserCheck size={24} />} 
            trend="up" 
            trendValue="5" 
            
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard 
            title="Absent Today" 
            value={loading ? '...' : stats.absent} 
            icon={<UserX size={24} />} 
            trend="down" 
            trendValue="2" 
            
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <StatCard 
            title="Avg. Attendance" 
            value={loading ? '...' : stats.avg} 
            icon={<TrendingUp size={24} />} 
            trend="up" 
            trendValue="3.1" 
            
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white`}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Weekly Attendance Trend</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white`}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Attendance by Department (Today)</h5>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {deptData.length > 0 ? (
                    <BarChart data={deptData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="dept" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-secondary">No department data available today</div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`card border-0 shadow-sm rounded-4 bg-white`}>
        <div className="card-body p-4">
          <h5 className="card-title fw-bold mb-4">Recent Logins</h5>
          <div className="table-responsive">
            <table className={`table table-hover align-middle mb-0 `}>
              <thead className="table-light">
                <tr>
                  <th className="border-0 rounded-start">Employee</th>
                  <th className="border-0">Time</th>
                  <th className="border-0">Status</th>
                  <th className="border-0 rounded-end">Method</th>
                </tr>
              </thead>
              <tbody>
                {recentLogins.length > 0 ? recentLogins.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <span className="fw-medium">{row.name}</span>
                    </td>
                    <td className="text-secondary">{row.time}</td>
                    <td>
                      <span className={`badge ${row.status === 'Present' || row.status === 'On Time' ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'} rounded-pill`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="text-secondary">{row.method}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="text-center py-4 text-secondary">No recent logins</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;




