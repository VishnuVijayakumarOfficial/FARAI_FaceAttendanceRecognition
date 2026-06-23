import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';

// Pages (will create these next)
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeRegistration from './pages/EmployeeRegistration';
import EmployeeAttendance from './pages/EmployeeAttendance';
import EmployeeDashboard from './pages/EmployeeDashboard';

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
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="app-container">
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
              path="/employee/register-face" 
              element={
                <ProtectedRoute allowedRole="employee">
                  <EmployeeRegistration />
                </ProtectedRoute>
              } 
            />
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

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
