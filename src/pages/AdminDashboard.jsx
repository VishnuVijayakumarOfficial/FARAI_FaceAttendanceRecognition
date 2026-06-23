import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardOverview from './DashboardOverview';
import EmployeeManagement from './EmployeeManagement';
import AttendanceReports from './AttendanceReports';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const location = useLocation();
  
  // Dynamic title based on path
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'Dashboard Overview';
    if (path === '/admin/dashboard/employees') return 'Employee Management';
    if (path === '/admin/dashboard/attendance') return 'Attendance Reports';
    if (path === '/admin/dashboard/settings') return 'System Settings';
    return 'Admin Dashboard';
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.contentWrapper}>
        <TopBar title={getTitle()} />
        <main className={styles.mainArea}>
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="attendance" element={<AttendanceReports />} />
            <Route path="settings" element={<div className={styles.settingsPlaceholder}>Settings Page coming soon...</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
