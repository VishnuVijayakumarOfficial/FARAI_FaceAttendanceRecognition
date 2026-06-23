import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ThemeProvider } from './context/ThemeProvider';
import { useAuth } from './hooks/useAuth';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeReports from './pages/EmployeeReports';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, role, loading } = useAuth();

  if (loading) return (
    <div className="app-loading-container">
      <div className="app-loading-spinner"></div>
    </div>
  );

  if (!user) return <Navigate to="/" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />;

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <div className="app-container">
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
    </ThemeProvider>
  );
}

export default App;
