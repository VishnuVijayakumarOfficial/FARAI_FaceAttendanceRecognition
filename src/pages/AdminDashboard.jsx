import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardOverview from './DashboardOverview';
import EmployeeManagement from './EmployeeManagement';
import AttendanceReports from './AttendanceReports';

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
    <div className="flex bg-slate-950 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar title={getTitle()} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="attendance" element={<AttendanceReports />} />
            <Route path="settings" element={<div className="p-8 ml-72">Settings Page coming soon...</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
