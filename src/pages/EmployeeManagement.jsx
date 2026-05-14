import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Mail, 
  Trash2, 
  Edit2, 
  MoreVertical, 
  Filter,
  UserPlus,
  Loader2,
  X,
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employee_id: '',
    department: '',
    designation: '',
    password: '',
    attendance_start_time: '09:00',
    attendance_end_time: '10:00'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    
    const { data: empData, error: empError } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    const { data: attData } = await supabase
      .from('attendance')
      .select('employee_id, status')
      .eq('date', today);

    if (!empError && empData) {
      const attendanceMap = {};
      if (attData) {
          attData.forEach(att => attendanceMap[att.employee_id] = att.status);
      }
      
      const merged = empData.map(emp => ({
          ...emp,
          todayStatus: attendanceMap[emp.id] || 'Absent'
      }));
      setEmployees(merged);
    }
    
    setLoading(false);
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (editingId) {
      const { data, error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', editingId);

      if (!error) {
        setIsModalOpen(false);
        fetchEmployees();
        setFormData({
          name: '', email: '', employee_id: '', department: '', designation: '', password: '',
          attendance_start_time: '09:00', attendance_end_time: '10:00'
        });
        setEditingId(null);
        alert('Employee record updated successfully!');
      } else {
        alert(`Error updating employee: ${error.message}`);
      }
    } else {
      const payload = {
        ...formData,
        id: crypto.randomUUID()
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchEmployees();
        setFormData({
          name: '', email: '', employee_id: '', department: '', designation: '', password: '',
          attendance_start_time: '09:00', attendance_end_time: '10:00'
        });
        alert('Employee record created successfully!');
      } else {
        alert(`Error creating employee: ${error.message}`);
      }
    }
    setLoading(false);
  };

  const handleEditEmployee = (emp) => {
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      employee_id: emp.employee_id || '',
      department: emp.department || '',
      designation: emp.designation || '',
      password: emp.password || '',
      attendance_start_time: emp.attendance_start_time || '09:00',
      attendance_end_time: emp.attendance_end_time || '10:00'
    });
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);

    // Explicitly delete associated attendance records first
    // to avoid orphaned data since we bypassed Supabase Auth constraints
    await supabase.from('attendance').delete().eq('employee_id', id);

    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      fetchEmployees();
    } else {
      alert(`Error deleting: ${error.message}`);
    }
    setLoading(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 ml-72 bg-slate-50 min-h-screen font-outfit">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-slate-500 font-medium">Manage and monitor your team member profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchEmployees}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh to see latest face registrations"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 px-8 py-3.5"
          >
            <UserPlus size={20} />
            Add New Employee
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className="input-field pl-12 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-6 py-3 rounded-xl border border-slate-200 bg-white flex items-center gap-2 hover:bg-slate-50 transition-colors font-bold text-slate-600 shadow-sm">
          <Filter size={20} />
          <span>Filter List</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Employee</th>
                <th className="px-8 py-5">ID</th>
                <th className="px-8 py-5">Department</th>
                <th className="px-8 py-5">Time Slot</th>
                <th className="px-8 py-5">Today's Status</th>
                <th className="px-8 py-5">Face AI</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin inline-block text-primary-500" size={32} />
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      {emp.face_image ? (
                        <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md flex-shrink-0">
                          <img src={emp.face_image} alt={emp.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center font-black text-white text-sm shadow-md flex-shrink-0">
                          {emp.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-400 font-medium">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-bold text-slate-500 text-sm">#{emp.employee_id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-slate-700 font-bold">{emp.department}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{emp.designation}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                       <Calendar size={14} className="text-primary-500" />
                       {emp.attendance_start_time} - {emp.attendance_end_time}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      emp.todayStatus === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {emp.todayStatus === 'Present' ? 'Present Today' : 'Not Logged In'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      emp.face_descriptor ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <CheckCircle2 size={12} />
                      {emp.face_descriptor ? 'Face Logged' : 'Not Registered'}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditEmployee(emp)} className="p-2.5 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 scale-100 animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-bold text-slate-900">{editingId ? 'Edit Employee' : 'Register New Employee'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); }} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                  <input required className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Employee ID</label>
                  <input required className="input-field" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} placeholder="EMP-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Work Email</label>
                  <input required type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@company.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Department</label>
                  <select className="input-field appearance-none bg-no-repeat bg-right-4" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")'}} value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                    <option value="">Select Department</option>
                    <option value="IT">IT & Engineering</option>
                    <option value="HR">Human Resources</option>
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Ops">Operations</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Temporary Password</label>
                  <input required type="password" title="This password must be used to create the auth user manually" className="input-field" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Attendance Start Time</label>
                  <input type="time" className="input-field" value={formData.attendance_start_time} onChange={(e) => setFormData({...formData, attendance_start_time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Attendance End Time</label>
                  <input type="time" className="input-field" value={formData.attendance_end_time} onChange={(e) => setFormData({...formData, attendance_end_time: e.target.value})} />
                </div>
              </div>
              <p className="mt-4 text-[11px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 italic">
                * After creating the employee here, you must manually create an account with this email/password in the Supabase Auth dashboard to enable login.
              </p>
              <div className="mt-12 flex gap-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); }} className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] btn-primary py-4 text-lg">{editingId ? 'Update Account' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
