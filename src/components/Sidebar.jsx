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
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const { signOut } = useAuth();

  const navItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Overview', path: '/admin/dashboard' },
    { icon: <Users size={22} />, label: 'Employees', path: '/admin/dashboard/employees' },
    { icon: <Clock size={22} />, label: 'Attendance', path: '/admin/dashboard/attendance' },
    { icon: <Settings size={22} />, label: 'Settings', path: '/admin/dashboard/settings' },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <ShieldCheck className={styles.icon} size={24} />
        </div>
        <div>
          <h2 className={styles.title}>NexWork</h2>
          <p className={styles.subtitle}>Admin Panel</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin/dashboard'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
          >
            {item.icon}
            <span className={styles.navItemText}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button
          onClick={signOut}
          className={styles.signOutBtn}
        >
          <LogOut size={22} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
