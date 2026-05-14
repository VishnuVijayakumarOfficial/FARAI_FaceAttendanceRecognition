import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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

// Data is now dynamic

const StatCard = ({ title, value, icon, trend, trendValue }) => (
  <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-2xl bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}%
      </div>
    </div>
    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
    <p className="text-3xl font-black text-slate-900">{value}</p>
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
    <div className="p-8 ml-72 bg-slate-50 min-h-screen font-outfit">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-xl font-bold mb-6 text-slate-800">Weekly Attendance Trend</h3>
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

        <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-xl font-bold mb-6 text-slate-800">Attendance by Department (Today)</h3>
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
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No department data available today</div>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold mb-6 text-slate-800">Recent Logins</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="pb-4">Employee</th>
                <th className="pb-4">Time</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentLogins.length > 0 ? recentLogins.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-5">
                    <span className="font-bold text-slate-800">{row.name}</span>
                  </td>
                  <td className="py-5 text-slate-500 font-medium">{row.time}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      row.status === 'Present' || row.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-5 text-right font-bold text-slate-400 text-sm">{row.method}</td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="py-8 text-center text-slate-400">No recent logins</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
