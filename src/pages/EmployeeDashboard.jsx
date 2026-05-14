import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, signOut } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-outfit">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-bold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-outfit">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-5">
            {/* Avatar: show face image or initials */}
            {employeeInfo?.face_image ? (
              <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-primary-200 shadow-xl shadow-primary-500/20 flex-shrink-0">
                <img src={employeeInfo.face_image} alt={employeeInfo.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary-500 flex items-center justify-center shadow-xl shadow-primary-500/20 text-white flex-shrink-0">
                <User size={32} />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Welcome back,</p>
              <h1 className="text-3xl font-black text-slate-900">{employeeInfo?.name}</h1>
              <p className="text-slate-400 font-bold text-sm tracking-tight">{employeeInfo?.designation} • {employeeInfo?.department}</p>
            </div>
          </div>
          <button onClick={signOut} className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:shadow-md transition-all shadow-sm">
            <LogOut size={24} />
          </button>
        </header>

        {/* Face Registration Warning Banner */}
        {!isFaceRegistered() && (
          <div className="mb-10 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="font-black text-amber-800 text-lg">Face Not Registered Yet</p>
                <p className="text-amber-600 text-sm font-medium">You need to register your face before marking attendance. Click the button to get started.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/employee/attendance')}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 active:scale-95"
            >
              <Camera size={20} />
              Register Face
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">

            {/* Attendance Action Card */}
            <div className="p-10 rounded-[3rem] bg-primary-500 shadow-2xl shadow-primary-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h2 className="text-3xl font-black text-white mb-3">Daily Attendance</h2>
              <p className="text-primary-50 mb-8 font-medium">Verify your identity with AI face scanning.</p>

              {isTodayMarked() ? (
                <div className="bg-white/20 backdrop-blur-md rounded-[2rem] p-6 border border-white/30 text-white text-center">
                  <CheckCircle2 size={40} className="mx-auto mb-3" />
                  <p className="font-black text-xl">Attendance Marked!</p>
                  <p className="text-primary-100 text-sm mt-1">Status: Present</p>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/employee/attendance')}
                  disabled={!isFaceRegistered() && false /* allow both registration + attendance */}
                  className="w-full py-5 bg-white text-primary-600 rounded-[2rem] font-black text-lg hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 group"
                >
                  {isFaceRegistered() ? (
                    <>Verify &amp; Mark Now <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" /></>
                  ) : (
                    <><Camera size={22} /> Register Face &amp; Mark Attendance</>
                  )}
                </button>
              )}
            </div>

            {/* Face Registration Status Card */}
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <ScanFace size={20} className="text-primary-500" />
                Face AI Status
              </h3>
              {isFaceRegistered() ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Show registered face photo */}
                    {employeeInfo?.face_image ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md flex-shrink-0">
                        <img src={employeeInfo.face_image} alt="Registered face" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center border-2 border-emerald-200 flex-shrink-0">
                        <ShieldCheck size={36} className="text-emerald-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-black text-emerald-700">Face Registered ✓</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">Your biometric data is securely saved.</p>
                    </div>
                  </div>
                  {/* Always show button to go to registration page */}
                  <button
                    onClick={() => navigate('/employee/attendance')}
                    className="w-full py-3 bg-slate-800 text-white rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ScanFace size={16} />
                    Manage Face Registration
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center border-2 border-dashed border-amber-300 mx-auto mb-4">
                    <Camera size={32} className="text-amber-500" />
                  </div>
                  <p className="font-black text-slate-700 mb-1">No Face Registered</p>
                  <p className="text-xs text-slate-400 font-medium mb-4">Register your face to start marking attendance.</p>
                  <button
                    onClick={() => navigate('/employee/attendance')}
                    className="w-full py-3 bg-primary-500 text-white rounded-2xl font-black text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    Register Face Now
                  </button>
                </div>
              )}
            </div>

            {/* Work Schedule Card */}
            <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
                <Clock size={20} className="text-primary-500" />
                Work Schedule
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                  <span className="text-slate-500 font-bold">Shift Start</span>
                  <span className="font-black text-slate-900 text-lg">{employeeInfo?.attendance_start_time}</span>
                </div>
                <div className="flex justify-between items-center p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                  <span className="text-slate-500 font-bold">Shift End</span>
                  <span className="font-black text-slate-900 text-lg">{employeeInfo?.attendance_end_time}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Attendance History */}
          <div className="lg:col-span-2">
            <div className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black text-slate-800">Attendance History</h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-wider">
                  <TrendingUp size={16} />
                  {attendanceRate()}% Rate
                </div>
              </div>

              <div className="space-y-5">
                {history.length === 0 ? (
                  <div className="text-center py-20">
                    <Calendar size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold italic">No attendance records yet.</p>
                    <p className="text-slate-300 text-sm mt-1">Your history will appear here after your first check-in.</p>
                  </div>
                ) : history.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-primary-200 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary-500 shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-all">
                        <Calendar size={26} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                          <Clock size={14} />
                          Logged at: {new Date(record.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${
                      record.status === 'Present' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
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
