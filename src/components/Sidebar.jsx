import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { signOut } = useAuth();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin/dashboard' },
    { icon: <Users size={20} />, label: 'Employees', path: '/admin/dashboard/employees' },
    { icon: <Clock size={20} />, label: 'Attendance', path: '/admin/dashboard/attendance' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/dashboard/settings' },
  ];

  return (
    <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-2 text-white min-vh-100">
      <a href="/" className="d-flex align-items-center pb-3 mb-md-0 me-md-auto text-white text-decoration-none mt-3">
        <ShieldCheck className="text-success me-2" size={28} />
        <span className="fs-5 d-none d-sm-inline fw-bold">NexWork</span>
      </a>
      <p className="text-secondary small d-none d-sm-inline ms-4 mb-4">Admin Panel</p>
      
      <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start w-100" id="menu">
        {navItems.map((item) => (
          <li className="nav-item w-100 mb-2" key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/admin/dashboard'}
              className={({ isActive }) => `nav-link align-middle px-3 d-flex align-items-center text-white ${isActive ? 'bg-success' : ''}`}
            >
              {item.icon}
              <span className="ms-2 d-none d-sm-inline">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <hr className="w-100 text-secondary" />
      <div className="dropdown pb-4 w-100">
        <button
          onClick={signOut}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center justify-content-sm-start px-3"
        >
          <LogOut size={20} />
          <span className="ms-2 d-none d-sm-inline">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

