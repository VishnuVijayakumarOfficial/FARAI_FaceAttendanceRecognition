import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  ShieldCheck, CheckCircle2, Users, ScanFace,
  Lock, Database, BarChart3, Mail, EyeOff, ArrowRight, Sparkles, Sun, Moon, User, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Home.css';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const navigate = useNavigate();
  const { signInManually } = useAuth();
  const containerRef = useRef(null);
  
  const { isDarkMode, toggleTheme } = useTheme();

  // Login Form State
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
  const [error, setError] = useState(null);

  const phoneRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'deactivated') {
      setError('Your account has been deleted or deactivated by the admin.');
    }
    if (params.get('register') === 'admin' || window.location.hash === '#login-section' || params.get('error') === 'deactivated') {
      setTimeout(() => {
        const loginSection = document.getElementById('login-section');
        if (loginSection) loginSection.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  useGSAP(() => {
    // Hero Animations
    gsap.fromTo('.hero-badge', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.2 });
    gsap.fromTo('.title-main', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.4 });
    gsap.fromTo('.text-desc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 });
    gsap.fromTo('.feature-item', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 1 });
    
    // Laptop Animation
    gsap.fromTo('.laptop-wrapper', 
      { y: 40, opacity: 0 },
      { 
        y: 0, opacity: 1, duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: '.laptop-wrapper', start: 'top 85%' }
      }
    );
    
    gsap.fromTo('.laptop-lid', 
      { rotateX: -95 },
      {
        rotateX: 0, duration: 2.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: '.laptop-wrapper', start: 'top 80%' }
      }
    );

    gsap.fromTo('.live-overview-card', 
      { y: 100, opacity: 0 },
      { y: 40, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 1.5 }
    );
    
    gsap.to('.glow-blob', {
      rotation: 360, scale: 1.1, duration: 20, repeat: -1, yoyo: true, ease: 'none'
    });

    gsap.utils.toArray('.admin-mock-img, .graphic-img').forEach((img) => {
      gsap.fromTo(img, 
        { scale: 0.8, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: img, start: 'top 85%' }
        }
      );
    });

    gsap.utils.toArray('.scroll-section').forEach((section) => {
      gsap.fromTo(section, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%' }
        }
      );
    });

    gsap.fromTo('.stat-card', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: '.stats-grid', start: 'top 90%' }
      }
    );

    gsap.fromTo('.step-card', 
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.steps-grid', start: 'top 85%' }
      }
    );

    if (phoneRef.current) {
      gsap.fromTo(phoneRef.current, 
        { y: 100, rotationX: 10, rotationY: -10, scale: 0.9, opacity: 0 },
        { y: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, 
          duration: 1.5, ease: 'back.out(1.2)',
          scrollTrigger: { trigger: '#login-section', start: 'top 70%' }
        }
      );
    }
  }, { scope: containerRef });

  const handleToggleLogin = (type) => {
    if (loginType === type) return;
    setLoginType(type);
    setIsAdminRegister(false);
    
    if (phoneRef.current) {
      gsap.fromTo(phoneRef.current,
        { x: 300, rotationY: 45, rotationZ: 10, opacity: 0, scale: 0.9 },
        { x: 0, rotationY: 0, rotationZ: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.2)' }
      );
    }
  };

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
        alert('Registration successful! You can now log in.');
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
          // Navigate directly to dashboard, bypassing the dedicated register-face page
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
    <div className={isDarkMode ? 'dark' : ''}>
      <div ref={containerRef} className="home-wrapper">  
        
        {/* Background Ambient Glow */}
        <div className="ambient-glows">
          <div className="glow-blob glow-emerald"></div>
          <div className="glow-blob glow-blue"></div>
        </div>

        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-brand">
            <div className="nav-logo-icon">
              <ScanFace size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="nav-logo-text">
                FAR<span>AI</span>
              </h1>
              <p className="nav-logo-sub">Face Attendance Recognition</p>
            </div>
          </div>
          <div className="nav-actions">
            <button 
              onClick={toggleTheme} 
              className="btn-theme-toggle"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => scrollToLogin('employee')} className="btn-primary">
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="section-container hero-grid">
            
            {/* Left Content */}
            <div className="hero-content">
              <div className="hero-badge">
                <Sparkles size={14} className="animate-pulse" /> AI Powered Attendance
              </div>
              
              <h1 className="title-main">
                Smart Attendance <br /> 
                Powered by <span className="text-gradient">AI</span>
              </h1>
              
              <p className="text-desc">
                Automate your workforce tracking with advanced facial recognition technology for a smarter, secure, and frictionless workplace.
              </p>

              {/* Feature Bullets */}
              <div className="hero-features">
                {['Face Recognition AI', 'Secure Cloud Database', 'Employee Management', 'Real-time Analytics'].map((f, i) => (
                  <div key={i} className="feature-item">
                    <div className="feature-icon">
                      <CheckCircle2 size={14} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Floating Hero Graphic */}
            <div className="hero-graphic">
                <div className="graphic-center">
                  <img src="/admin.png" className="graphic-img" alt="Team Overview" />
                  <div className="graphic-gradient-overlay"></div>

                  {/* Live Overview Card */}
                  <div className="live-overview-card">
                    <div className="overview-header">
                      <div className="overview-title">
                        <div className="overview-icon">
                          <BarChart3 size={16} />
                        </div>
                        <p className="overview-title-text">Live Overview</p>
                      </div>
                      <span className="badge-live">Live</span>
                    </div>
                    <div className="overview-grid">
                      {[
                        { label: 'Present Today', val: '128', change: '+12.5%' },
                        { label: 'Late Entries', val: '16', change: '+6.7%' }
                      ].map((s, i) => (
                        <div key={i} className="overview-stat-box">
                          <p className="stat-box-label">{s.label}</p>
                          <p className="stat-box-val">{s.val}</p>
                          <p className="stat-box-inc">{s.change}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="section-container stats-section">
          <div className="stats-grid">
            {[
              { label: "Today's Attendance", val: "94%", inc: "+2.5% vs yesterday" },
              { label: "Active Employees", val: "1,240", inc: "+15 this month" },
              { label: "Processing Time", val: "<0.3s", inc: "Per face scan" }
            ].map((stat, i) => (
              <div key={i} className="stat-card">
                 <div className="stat-bg-icon">
                   <BarChart3 size={64} />
                 </div>
                 <div>
                   <p className="stat-label">{stat.label}</p>
                   <h3 className="stat-val">{stat.val}</h3>
                 </div>
                 <div>
                   <span className="stat-inc">{stat.inc}</span>
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* Seamless Integration */}
        <section className="workflow-section scroll-section">
          <div className="workflow-bg-line"></div>
          <div className="section-container">
            <div className="workflow-header">
              <p className="text-subtitle">Workflow</p>
              <h2 className="title-section">Seamless Integration</h2>
              <p className="text-desc workflow-desc">Get up and running in minutes with our streamlined three-step implementation process.</p>
            </div>
            
            <div className="steps-grid">
              {[
                { step: 1, icon: <ScanFace size={32} />, title: "Register Face", desc: "One-time secure 3D face mapping during onboarding." },
                { step: 2, icon: <Database size={32} />, title: "Secure Storage", desc: "Face template securely stored in the database." },
                { step: 3, icon: <CheckCircle2 size={32} />, title: "Instant Verify", desc: "Sub-second verification for seamless clock-in." },
              ].map((s, i) => (
                <div key={i} className="step-card">
                  <div className="step-number">{s.step}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Laptop Section - Admin Portal Overview */}
        <section className="laptop-section">
          <div className="laptop-header">
              <h2 className="title-section">Admin Dashboard</h2>
              <p className="text-desc laptop-desc-mod">Everything you need in one powerful interface.</p>
              <button onClick={() => scrollToLogin('admin')} className="btn-primary laptop-btn-mod">
                Access Admin Login <ArrowRight size={18} />
              </button>
          </div>

          <div className="laptop-wrapper">
              <div className="laptop-lid">
                <div className="laptop-screen">
                  <div className="mock-topbar">
                    <div className="mock-title"><ScanFace size={14}/> FAR AI Admin</div>
                    <div className="mock-dots">
                      <div className="mock-dot"></div>
                      <div className="mock-dot"></div>
                    </div>
                  </div>
                  <div className="mock-layout">
                    <div className="mock-sidebar">
                      {['Dashboard', 'Employees', 'Reports', 'Settings'].map((item, i) => (
                        <div key={i} className={`mock-nav-item ${i === 0 ? 'active' : ''}`}>{item}</div>
                      ))}
                    </div>
                    <div className="mock-content">
                      <div className="mock-cards">
                        {[1,2,3].map(i => (
                           <div key={i} className="mock-card">
                              <div className="mock-line-short"></div>
                              <div className="mock-line-long"></div>
                           </div>
                        ))}
                      </div>
                      <div className="mock-chart-area">
                         <div className="mock-chart">
                           {[40, 70, 45, 90, 65, 80, 50, 100].map((h, i) => (
                             <div key={i} className="mock-bar" style={{height: `${h}%`}}></div>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  <img src="/admin2.png" className="admin-mock-img" alt="Admin UI" />
                </div>
              </div>

              <div className="laptop-base">
                <div className="laptop-notch"></div>
              </div>
              <div className="laptop-bottom"></div>
          </div>
        </section>

        {/* Login Section */}
        <section id="login-section" className="login-section">
          <div className="login-card">
            <div className="login-grid">
              <div>
                <div className="hero-badge login-badge-mod">
                  <Lock size={14} /> Secure Access
                </div>
                <h2 className="title-section">Login to Dashboard</h2>
                <p className="text-desc login-desc-mod">Access your attendance records or manage your organization securely.</p>
                
                <div className="login-type-toggle">
                  <button 
                    onClick={() => handleToggleLogin('employee')}
                    className={`toggle-btn ${loginType === 'employee' ? 'active' : ''}`}
                  >
                    <Users size={18} /> Employee
                  </button>
                  <button 
                    onClick={() => handleToggleLogin('admin')}
                    className={`toggle-btn ${loginType === 'admin' ? 'active' : ''}`}
                  >
                    <ShieldCheck size={18} /> Admin
                  </button>
                </div>

                <p className="step-desc">
                  {loginType === 'admin' ? (
                    isAdminRegister ? (
                      <>Already an Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(false);}} className="login-register-link">Log In Here</a></>
                    ) : (
                      <>New Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(true);}} className="login-register-link">Register Here</a></>
                    )
                  ) : (
                    <>New Employee? <span className="login-contact-text">Contact your Admin to get registered.</span></>
                  )}
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="phone-container">
                <div ref={phoneRef} className="phone-mockup">
                  
                  <div className="dynamic-island">
                    <div className="island-cam"></div>
                    <div className="island-sensor"></div>
                  </div>

                  <div className="phone-content">
                    
                    <div className="phone-header-mod">
                      <div className="step-icon phone-icon-mod">
                        <ScanFace size={32} strokeWidth={1.5} />
                      </div>
                      <h3 className="step-title">{isAdminRegister ? 'Create Account' : 'Welcome Back'}</h3>
                      <p className="text-subtitle">{loginType} {isAdminRegister ? 'registration' : 'portal'}</p>
                    </div>

                    {error && (
                      <div className="login-error-banner">
                        <ShieldCheck size={16} /> {error}
                      </div>
                    )}
                    <form onSubmit={handleAuthAction}>
                      {isAdminRegister && (
                        <div className="login-form-group">
                          <User className="login-input-icon" size={18} />
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name" 
                            className="login-input"
                          />
                        </div>
                      )}
                      
                      <div className="login-form-group">
                        <Mail className="login-input-icon" size={18} />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address" 
                          className="login-input"
                        />
                      </div>
                      
                      <div className="login-form-group">
                        <Lock className="login-input-icon" size={18} />
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password" 
                          className="login-input"
                        />
                        <EyeOff className="login-input-icon login-eye-icon" size={18} />
                      </div>

                      {isAdminRegister && (
                        <div className="login-form-group">
                          <Lock className="login-input-icon" size={18} />
                          <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password" 
                            className="login-input"
                          />
                          <EyeOff className="login-input-icon login-eye-icon" size={18} />
                        </div>
                      )}

                      {!isAdminRegister && (
                        <div className="login-remember-row">
                          <label className="login-remember-label">
                            <div className="login-remember-checkbox"></div>
                            <span className="login-remember-text">Remember Me</span>
                          </label>
                          <a href="#" className="login-forgot-link">Forgot?</a>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="login-btn-submit"
                      >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (isAdminRegister ? 'Create Account' : 'Sign In Securely')}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <ScanFace size={24} /> <span>FAR<span>AI</span></span>
            </div>
            <p className="footer-text">
              © 2024 FAR AI. Crafted with precision for the modern enterprise.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Home;
