import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Filter,
  UserPlus,
  Loader2,
  X,
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import styles from './EmployeeManagement.module.css';

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

  const fetchEmployees = async () => {
    setLoading(true);
    
    let query = supabase
      .from('employees')
      .select('*');

    if (user && user.id !== 'demo-user-id') {
      query = query.eq('admin_id', user.id);
    }

    const { data: empData, error: empError } = await query
      .order('created_at', { ascending: false });

    const today = new Date().toISOString().split('T')[0];
    let attQuery = supabase
      .from('attendance')
      .select('employee_id, status, employees!inner(admin_id)')
      .eq('date', today);

    if (user && user.id !== 'demo-user-id') {
      attQuery = attQuery.eq('employees.admin_id', user.id);
    }
    const { data: attData } = await attQuery;

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

  useEffect(() => {
    const init = async () => {
      await fetchEmployees();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (editingId) {
      const { error } = await supabase
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
        toast.success('Employee record updated successfully!');
      } else {
        toast.error(`Error updating employee: ${error.message}`);
      }
    } else {
      const payload = {
        ...formData,
        id: crypto.randomUUID(),
        admin_id: user && user.id !== 'demo-user-id' ? user.id : null
      };

      const { error } = await supabase
        .from('employees')
        .insert([payload]);

      if (!error) {
        setIsModalOpen(false);
        fetchEmployees();
        setFormData({
          name: '', email: '', employee_id: '', department: '', designation: '', password: '',
          attendance_start_time: '09:00', attendance_end_time: '10:00'
        });
        toast.success('Employee record created successfully!');
      } else {
        toast.error(`Error creating employee: ${error.message}`);
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
      toast.success('Employee deleted successfully!');
    } else {
      toast.error(`Error deleting: ${error.message}`);
    }
    setLoading(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerWrapper}>
        <div>
          <h2 className={styles.pageTitle}>Employee Directory</h2>
          <p className={styles.pageSubtitle}>Manage and monitor your team member profiles</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={fetchEmployees}
            className={styles.refreshBtn}
            title="Refresh to see latest face registrations"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className={styles.addBtn}
          >
            <UserPlus size={20} />
            Add New Employee
          </button>
        </div>
      </div>

      <div className={styles.controlsWrapper}>
        <div className={styles.searchGroup}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={20} />
          <span>Filter List</span>
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Employee</th>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Department</th>
                <th className={styles.th}>Time Slot</th>
                <th className={styles.th}>Today's Status</th>
                <th className={styles.th}>Face AI</th>
                <th className={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.tdEmpty}>
                    <Loader2 className="animate-spin inline-block" style={{ color: '#10b981' }} size={32} />
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.empWrapper}>
                      {emp.face_image ? (
                        <img src={emp.face_image} alt={emp.name} className={styles.avatarImg} />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {emp.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className={styles.empName}>{emp.name}</p>
                        <p className={styles.empEmail}>{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.idText}>#{emp.employee_id}</span>
                  </td>
                  <td className={styles.td}>
                    <div>
                      <p className={styles.deptText}>{emp.department}</p>
                      <p className={styles.desigText}>{emp.designation}</p>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.timeSlot}>
                       <Calendar size={14} className={styles.timeIcon} />
                       {emp.attendance_start_time} - {emp.attendance_end_time}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={emp.todayStatus === 'Present' ? styles.pillSuccess : styles.pillError}>
                      {emp.todayStatus === 'Present' ? 'Present Today' : 'Not Logged In'}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={emp.face_descriptor ? styles.pillSuccess : styles.pillError}>
                      <CheckCircle2 size={12} />
                      {emp.face_descriptor ? 'Face Logged' : 'Not Registered'}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionGroup}>
                      <button onClick={() => handleEditEmployee(emp)} className={styles.actionEdit}><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className={styles.actionDelete}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editingId ? 'Edit Employee' : 'Register New Employee'}</h3>
              <button 
                onClick={() => { 
                  setIsModalOpen(false); 
                  setEditingId(null); 
                  setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); 
                }} 
                className={styles.closeBtn}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className={styles.formContainer}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <input required className={styles.formInput} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Employee ID</label>
                  <input required className={styles.formInput} value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} placeholder="EMP-001" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Work Email</label>
                  <input required type="email" className={styles.formInput} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@company.com" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <select 
                    className={styles.formInput} 
                    style={{appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat'}} 
                    value={formData.department} 
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    <option value="IT">IT & Engineering</option>
                    <option value="HR">Human Resources</option>
                    <option value="Sales">Sales & Marketing</option>
                    <option value="Ops">Operations</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Temporary Password</label>
                  <input required type="password" title="This password must be used to create the auth user manually" className={styles.formInput} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Attendance Start Time</label>
                  <input type="time" className={styles.formInput} value={formData.attendance_start_time} onChange={(e) => setFormData({...formData, attendance_start_time: e.target.value})} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Attendance End Time</label>
                  <input type="time" className={styles.formInput} value={formData.attendance_end_time} onChange={(e) => setFormData({...formData, attendance_end_time: e.target.value})} />
                </div>
              </div>
              <p className={styles.warningNote}>
                * The employee can immediately log in to the portal using this email and password.
              </p>
              <div className={styles.formActions}>
                <button 
                  type="button" 
                  onClick={() => { 
                    setIsModalOpen(false); 
                    setEditingId(null); 
                    setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); 
                  }} 
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={styles.submitBtn}>
                  {editingId ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
