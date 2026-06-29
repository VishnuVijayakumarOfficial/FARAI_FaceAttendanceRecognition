import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import TopBar from '../../../components/TopBar';
import DashboardOverview from '../DashboardOverview/DashboardOverview';
import EmployeeManagement from '../EmployeeManagement/EmployeeManagement';
import AttendanceReports from '../AttendanceReports/AttendanceReports';

const AdminDashboard = () => {
  const location = useLocation();
    
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'Dashboard Overview';
    if (path === '/admin/dashboard/employees') return 'Employee Management';
    if (path === '/admin/dashboard/attendance') return 'Attendance Reports';
    if (path === '/admin/dashboard/settings') return 'System Settings';
    return 'Admin Dashboard';
  };

  return (
    <div className={`container-fluid p-0 min-vh-100 bg-light text-dark`}>
      <div className="row g-0 flex-nowrap min-vh-100">
        <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-dark">
          <Sidebar />
        </div>
        <div className="col d-flex flex-column min-vh-100">
          <TopBar title={getTitle()} />
          <main className="flex-grow-1 p-4 overflow-auto">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="attendance" element={<AttendanceReports />} />
              <Route path="settings" element={<div className="alert alert-info">Settings Page coming soon...</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;




