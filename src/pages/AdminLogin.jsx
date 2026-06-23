import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
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
      await signInManually(email, password, 'admin');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.bgWrapper}>
        <div className={styles.bgBlur}></div>
      </div>

      <div className={styles.formWrapper}>
        <button 
          onClick={() => navigate('/')}
          className={styles.backButton}
        >
          <ArrowLeft size={20} className={styles.backIcon} />
          Back to Home
        </button>

        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <ShieldCheck size={32} />
            </div>
            <h2 className={styles.title}>Admin Login</h2>
            <p className={styles.subtitle}>Manage your organization workforce</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? <Loader2 className={styles.spinIcon} size={20} /> : 'Sign In to Dashboard'}
            </button>

            <button
              type="button"
              onClick={() => {
                signInAsDemo('admin');
                navigate('/admin/dashboard');
              }}
              className={styles.demoBtn}
            >
              Try Demo Login
            </button>
          </form>

          <div className={styles.footer}>
             <p className={styles.footerText}>
                Don't have an admin account? <button onClick={() => navigate('/?register=admin')} className={styles.footerLink}>Register Now</button>
             </p>
             <p className={styles.footerSecurity}>
                Secure SSL Encrypted Connection
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
