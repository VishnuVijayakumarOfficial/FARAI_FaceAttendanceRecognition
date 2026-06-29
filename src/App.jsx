import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home/Home';
import AdminLogin from './pages/admin/AdminLogin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import EmployeeLogin from './pages/employee/EmployeeLogin/EmployeeLogin';
import EmployeeAttendance from './pages/employee/EmployeeAttendance/EmployeeAttendance';
import EmployeeDashboard from './pages/employee/EmployeeDashboard/EmployeeDashboard';
import EmployeeReports from './pages/employee/EmployeeReports/EmployeeReports';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
          <div className="container-fluid p-0 m-0">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<Home />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin/dashboard/*" 
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Employee Routes */}
              <Route path="/employee/login" element={<EmployeeLogin />} />
              <Route 
                path="/employee/attendance" 
                element={
                  <ProtectedRoute allowedRole="employee">
                    <EmployeeAttendance />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employee/dashboard" 
                element={
                  <ProtectedRoute allowedRole="employee">
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/employee/reports" 
                element={
                  <ProtectedRoute allowedRole="employee">
                    <EmployeeReports />
                  </ProtectedRoute>
                } 
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
  );
}

export default App;

