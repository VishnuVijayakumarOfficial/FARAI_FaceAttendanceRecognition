import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
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

import { useAuth } from '../../../hooks/useAuth';

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
    <div className="">
      <div className="">
        <div>
          <h2 className="">Employee Directory</h2>
          <p className="">Manage and monitor your team member profiles</p>
        </div>
        <div className="">
          <button 
            onClick={fetchEmployees}
            className=""
            title="Refresh to see latest face registrations"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className=""
          >
            <UserPlus size={20} />
            Add New Employee
          </button>
        </div>
      </div>

      <div className="">
        <div className="">
          <Search className="" size={20} />
          <input
            type="text"
            placeholder="Search by name, ID or department..."
            className=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="">
          <Filter size={20} />
          <span>Filter List</span>
        </button>
      </div>

      <div className="">
        <div className="">
          <table className="">
            <thead className="">
              <tr>
                <th className="">Employee</th>
                <th className="">ID</th>
                <th className="">Department</th>
                <th className="">Time Slot</th>
                <th className="">Today's Status</th>
                <th className="">Face AI</th>
                <th className="">Actions</th>
              </tr>
            </thead>
            <tbody className="">
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="">
                    <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div>
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="">
                  <td className="">
                    <div className="">
                      {emp.face_image ? (
                        <img src={emp.face_image} alt={emp.name} className="" />
                      ) : (
                        <div className="">
                          {emp.name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="">{emp.name}</p>
                        <p className="">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="">
                    <span className="">#{emp.employee_id}</span>
                  </td>
                  <td className="">
                    <div>
                      <p className="">{emp.department}</p>
                      <p className="">{emp.designation}</p>
                    </div>
                  </td>
                  <td className="">
                    <div className="">
                       <Calendar size={14} className="" />
                       {emp.attendance_start_time} - {emp.attendance_end_time}
                    </div>
                  </td>
                  <td className="">
                    <div className={emp.todayStatus === 'Present' ? '' : ''}>
                      {emp.todayStatus === 'Present' ? 'Present Today' : 'Not Logged In'}
                    </div>
                  </td>
                  <td className="">
                    <div className={emp.face_descriptor ? '' : ''}>
                      <CheckCircle2 size={12} />
                      {emp.face_descriptor ? 'Face Logged' : 'Not Registered'}
                    </div>
                  </td>
                  <td className="">
                    <div className="">
                      <button onClick={() => handleEditEmployee(emp)} className=""><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className=""><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="">
          <div className="">
            <div className="">
              <h3 className="">{editingId ? 'Edit Employee' : 'Register New Employee'}</h3>
              <button 
                onClick={() => { 
                  setIsModalOpen(false); 
                  setEditingId(null); 
                  setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); 
                }} 
                className=""
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="">
              <div className="">
                <div className="">
                  <label className="">Full Name</label>
                  <input required className="" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                </div>
                <div className="">
                  <label className="">Employee ID</label>
                  <input required className="" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} placeholder="EMP-001" />
                </div>
                <div className="">
                  <label className="">Work Email</label>
                  <input required type="email" className="" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@company.com" />
                </div>
                <div className="">
                  <label className="">Department</label>
                  <select 
                    className="" 
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
                <div className="">
                  <label className="">Temporary Password</label>
                  <input required type="password" title="This password must be used to create the auth user manually" className="" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                </div>
                <div className="">
                  <label className="">Attendance Start Time</label>
                  <input type="time" className="" value={formData.attendance_start_time} onChange={(e) => setFormData({...formData, attendance_start_time: e.target.value})} />
                </div>
                <div className="">
                  <label className="">Attendance End Time</label>
                  <input type="time" className="" value={formData.attendance_end_time} onChange={(e) => setFormData({...formData, attendance_end_time: e.target.value})} />
                </div>
              </div>
              <p className="">
                * The employee can immediately log in to the portal using this email and password.
              </p>
              <div className="">
                <button 
                  type="button" 
                  onClick={() => { 
                    setIsModalOpen(false); 
                    setEditingId(null); 
                    setFormData({ name: '', email: '', employee_id: '', department: '', designation: '', password: '', attendance_start_time: '09:00', attendance_end_time: '10:00' }); 
                  }} 
                  className=""
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="">
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





