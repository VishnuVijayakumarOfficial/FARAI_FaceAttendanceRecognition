import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ShieldCheck, CheckCircle2, Users, ScanFace,
  Lock, Database, BarChart3, Mail, EyeOff, ArrowRight, Sparkles, Sun, Moon, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  const { signInManually } = useAuth();
  
  
  const [loginType, setLoginType] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('register') === 'admin' ? 'admin' : 'employee';
  });
  const [isAdminRegister, setIsAdminRegister] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('register') === 'admin';
  });
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'deactivated') {
      return 'Your account has been deleted or deactivated by the admin.';
    }
    return null;
  });

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (isAdminRegister) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      try {
        const tempId = crypto.randomUUID();
        const { error: adminError } = await supabase
          .from('admins')
          .insert([
            { id: tempId, name, email, password }
          ]);
        if (adminError) throw adminError;
        toast.success('Registration successful! You can now log in.');
        setIsAdminRegister(false);
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        await signInManually(email, password, loginType);
        if (loginType === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Invalid credentials');
      } finally {
        setLoading(false);
      }
    }
  };

  const scrollToLogin = (type = 'employee') => {
    setLoginType(type);
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-vh-100 d-flex flex-column bg-light text-dark`}>
      
      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg navbar-light bg-white shadow-sm py-3`}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <ScanFace size={28} className="text-success me-2" />
            <div>
              <h4 className="mb-0 fw-bold">FAR<span className="text-success">AI</span></h4>
            </div>
          </a>
          <div className="d-flex align-items-center">

            <button onClick={() => scrollToLogin('employee')} className="btn btn-success px-4 rounded-pill">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        {/* Hero Section */}
        <section className="container py-5 mt-4">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="d-inline-flex align-items-center badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 mb-4">
                <Sparkles size={14} className="me-2" /> AI Powered Attendance
              </div>
              <h1 className="display-4 fw-bold mb-4">
                Smart Attendance <br /> 
                Powered by <span className="text-success">AI</span>
              </h1>
              <p className="lead mb-5 text-secondary">
                Automate your workforce tracking with advanced facial recognition technology for a smarter, secure, and frictionless workplace.
              </p>
              
              <div className="row g-3">
                {['Face Recognition AI', 'Secure Cloud Database', 'Employee Management', 'Real-time Analytics'].map((f, i) => (
                  <div key={i} className="col-sm-6 d-flex align-items-center">
                    <CheckCircle2 size={20} className="text-success me-2" />
                    <span className="fw-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="col-lg-6 text-center">
              <img src="/admin.png" className="img-fluid rounded-4 shadow-lg" alt="Team Overview" />
            </div>
          </div>
        </section>

        {/* Login Section */}
        <section id="login-section" className={`py-5 bg-white`}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-8 col-lg-6">
                <div className={`card border-0 shadow-lg  rounded-4 overflow-hidden`}>
                  <div className="card-body p-4 p-md-5">
                    <div className="text-center mb-4">
                      <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle p-3 mb-3">
                        <Lock size={24} />
                      </div>
                      <h3 className="fw-bold mb-2">Login to Dashboard</h3>
                      <p className="text-secondary">Access your attendance records or manage your organization securely.</p>
                    </div>

                    <div className="d-flex justify-content-center mb-4">
                      <div className="btn-group" role="group">
                        <button 
                          onClick={() => setLoginType('employee')}
                          className={`btn ${loginType === 'employee' ? 'btn-success' : 'btn-outline-success'} px-4`}
                        >
                          <Users size={18} className="me-2" /> Employee
                        </button>
                        <button 
                          onClick={() => setLoginType('admin')}
                          className={`btn ${loginType === 'admin' ? 'btn-success' : 'btn-outline-success'} px-4`}
                        >
                          <ShieldCheck size={18} className="me-2" /> Admin
                        </button>
                      </div>
                    </div>

                    <div className="text-center mb-4">
                      {loginType === 'admin' ? (
                        isAdminRegister ? (
                          <p className="text-secondary">Already an Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(false);}} className="text-success text-decoration-none fw-medium">Log In Here</a></p>
                        ) : (
                          <p className="text-secondary">New Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(true);}} className="text-success text-decoration-none fw-medium">Register Here</a></p>
                        )
                      ) : (
                        <p className="text-secondary">New Employee? <span className="text-dark fw-medium">Contact your Admin to get registered.</span></p>
                      )}
                    </div>

                    {error && (
                      <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                        <ShieldCheck size={18} className="me-2" />
                        <div>{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleAuthAction}>
                      {isAdminRegister && (
                        <div className="mb-3 position-relative">
                          <User className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={18} />
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name" 
                            className={`form-control form-control-lg ps-5 `}
                          />
                        </div>
                      )}
                      
                      <div className="mb-3 position-relative">
                        <Mail className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={18} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address" 
                          className={`form-control form-control-lg ps-5 `}
                        />
                      </div>
                      
                      <div className="mb-4 position-relative">
                        <Lock className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={18} />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password" 
                          className={`form-control form-control-lg ps-5 `}
                        />
                      </div>

                      {isAdminRegister && (
                        <div className="mb-4 position-relative">
                          <Lock className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={18} />
                          <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password" 
                            className={`form-control form-control-lg ps-5 `}
                          />
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-success btn-lg w-100 rounded-pill shadow-sm d-flex justify-content-center align-items-center"
                      >
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : null}
                        {isAdminRegister ? 'Create Account' : 'Sign In Securely'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`py-4 mt-auto border-top `}>
        <div className="container text-center text-secondary">
          <div className="d-flex justify-content-center align-items-center mb-2">
            <ScanFace size={20} className="me-2" /> <span className="fw-bold text-dark">FAR<span className="text-success">AI</span></span>
          </div>
          <p className="mb-0 small">
            © 2024 FAR AI. Crafted with precision for the modern enterprise.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;


