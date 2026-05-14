import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  Download,
  Search,
  Calendar,
  FileSpreadsheet,
  Loader2,
  UserCheck,
  UserX,
  ScanFace,
  Clock
} from 'lucide-react';

const AttendanceReports = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);

    // 1. Fetch all employees
    const { data: empData } = await supabase
      .from('employees')
      .select('id, name, employee_id, department, designation, face_image, face_descriptor')
      .order('name', { ascending: true });

    // 2. Fetch attendance for selected date
    const { data: attData } = await supabase
      .from('attendance')
      .select('employee_id, login_time, status')
      .eq('date', dateFilter);

    // Build a map: employee_id -> attendance record
    const map = {};
    if (attData) {
      attData.forEach(att => { map[att.employee_id] = att; });
    }

    setAllEmployees(empData || []);
    setAttendanceMap(map);
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    <div className="p-8 ml-72 bg-slate-50 min-h-screen font-outfit">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Attendance Reports</h2>
          <p className="text-slate-500 font-medium">Monitor and export daily attendance logs</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
        >
          <FileSpreadsheet size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <UserCheck size={28} className="text-primary-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Present</p>
            <p className="text-4xl font-black text-slate-900">{loading ? '...' : presentCount}</p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <UserX size={28} className="text-rose-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Absent</p>
            <p className="text-4xl font-black text-slate-900">{loading ? '...' : absentCount}</p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <ScanFace size={28} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Rate</p>
            <p className="text-4xl font-black text-slate-900">
              {loading || allEmployees.length === 0 ? '...' : `${Math.round((presentCount / allEmployees.length) * 100)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="date"
            className="input-field pl-12 bg-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className="input-field pl-12 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Present', 'Absent'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-5 py-3 rounded-xl font-black text-sm transition-all border ${
                statusFilter === s
                  ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">ID</th>
                <th className="px-8 py-5">Department</th>
                <th className="px-8 py-5">Login Time</th>
                <th className="px-8 py-5">Face AI</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin inline-block text-primary-500" size={32} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold italic">
                    No records found.
                  </td>
                </tr>
              ) : filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-all">
                  {/* Employee */}
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      {rec.face_image ? (
                        <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-primary-100 shadow-inner flex-shrink-0">
                          <img src={rec.face_image} alt={rec.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-primary-100 flex items-center justify-center font-black text-primary-600 text-lg flex-shrink-0">
                          {rec.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-800">{rec.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{rec.designation}</p>
                      </div>
                    </div>
                  </td>
                  {/* ID */}
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-500 text-sm">#{rec.employee_id}</span>
                  </td>
                  {/* Department */}
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-700">{rec.department}</span>
                  </td>
                  {/* Login Time */}
                  <td className="px-8 py-5">
                    {rec.login_time ? (
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Clock size={14} className="text-primary-500" />
                        {new Date(rec.login_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold text-sm">—</span>
                    )}
                  </td>
                  {/* Face AI */}
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      rec.face_descriptor ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                    }`}>
                      <ScanFace size={11} />
                      {rec.face_descriptor ? 'Registered' : 'Not Set'}
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      rec.status === 'Present'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-500'
                    }`}>
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
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {filtered.length} of {allEmployees.length} employees
            </p>
            <p className="text-xs font-bold text-slate-400">
              Date: {new Date(dateFilter).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
