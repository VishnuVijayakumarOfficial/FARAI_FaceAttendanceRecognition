import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Lock, Mail, ArrowLeft, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const EmployeeLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { signInAsDemo, signInManually } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInManually(email, password, 'employee');
      navigate('/employee/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light position-relative">
      <div className="position-absolute top-0 start-0 w-100 h-100 bg-primary bg-opacity-10"></div>
      
      <div className="container position-relative z-1" style={{ maxWidth: '450px' }}>
        <button 
          onClick={() => navigate('/')}
          className="btn btn-link text-decoration-none text-secondary d-flex align-items-center mb-4 p-0"
        >
          <ArrowLeft size={20} className="me-2" />
          Back to Selection
        </button>

        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle p-3 mb-3">
                <Users size={32} />
              </div>
              <h3 className="fw-bold mb-2">Employee Login</h3>
              <p className="text-secondary">Access your personal dashboard</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-bold">Work Email</label>
                <div className="position-relative">
                  <Mail className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control form-control-lg ps-5"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-bold">Password</label>
                <div className="position-relative">
                  <Lock className="position-absolute top-50 translate-middle-y ms-3 text-secondary" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control form-control-lg ps-5"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 mb-4 text-center small" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-100 mb-3 rounded-3"
              >
                {loading ? <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div> : 'Sign In to Portal'}
              </button>

              <button
                type="button"
                onClick={() => {
                  signInAsDemo('employee');
                  navigate('/employee/dashboard');
                }}
                className="btn btn-outline-secondary btn-lg w-100 rounded-3"
              >
                Try Demo Login
              </button>
            </form>
          </div>

          <div className="card-footer bg-light border-0 p-4 text-center">
            <p className="text-secondary small mb-0">
              Don't have an account? <span className="text-primary fw-bold" style={{cursor: 'pointer'}}>Contact Admin</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;




