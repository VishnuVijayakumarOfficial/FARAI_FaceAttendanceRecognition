import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
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
import styles from './DashboardOverview.module.css';

const StatCard = ({ title, value, icon, trend, trendValue }) => (
  <div className={styles.statCard}>
    <div className={styles.statCardHeader}>
      <div className={styles.statIconWrapper}>
        {icon}
      </div>
      <div className={trend === 'up' ? styles.statTrendUp : styles.statTrendDown}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}%
      </div>
    </div>
    <h3 className={styles.statTitle}>{title}</h3>
    <p className={styles.statValue}>{value}</p>
  </div>
);


const DashboardOverview = () => {
  useAuth(); // keep provider active
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
        // 1. Get total employees
        const { count: total } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        // 2. Get present today
        const today = new Date().toISOString().split('T')[0];
        const { count: present } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'Present');

        const absent = (total || 0) - (present || 0);
        const avg = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : '0%';

        setStats({ total: total || 0, present: present || 0, absent, avg });

        // 3. Fetch weekly attendance (last 7 days)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 6);
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`*, employees(name, department)`)
          .gte('date', lastWeek.toISOString().split('T')[0])
          .order('login_time', { ascending: false });

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
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Employees" 
          value={loading ? '...' : stats.total} 
          icon={<Users size={24} />} 
          trend="up" 
          trendValue="12" 
        />
        <StatCard 
          title="Present Today" 
          value={loading ? '...' : stats.present} 
          icon={<UserCheck size={24} />} 
          trend="up" 
          trendValue="5" 
        />
        <StatCard 
          title="Absent Today" 
          value={loading ? '...' : stats.absent} 
          icon={<UserX size={24} />} 
          trend="down" 
          trendValue="2" 
        />
        <StatCard 
          title="Avg. Attendance" 
          value={loading ? '...' : stats.avg} 
          icon={<TrendingUp size={24} />} 
          trend="up" 
          trendValue="3.1" 
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height="85%">
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
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#10b981' }}
              />
              <Area type="monotone" dataKey="present" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Attendance by Department (Today)</h3>
          <ResponsiveContainer width="100%" height="85%">
            {deptData.length > 0 ? (
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dept" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            ) : (
              <div className={styles.noDataText}>No department data available today</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.tableCard}>
        <h3 className={styles.chartTitle}>Recent Logins</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>Time</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thRight}>Method</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {recentLogins.length > 0 ? recentLogins.map((row, i) => (
                <tr key={i} className={styles.tr}>
                  <td className={styles.td}>
                    <span className={styles.tdName}>{row.name}</span>
                  </td>
                  <td className={styles.tdTime}>{row.time}</td>
                  <td className={styles.td}>
                    <span className={row.status === 'Present' || row.status === 'On Time' ? styles.statusGood : styles.statusWarning}>
                      {row.status}
                    </span>
                  </td>
                  <td className={styles.tdMethod}>{row.method}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className={styles.emptyState}>No recent logins</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
