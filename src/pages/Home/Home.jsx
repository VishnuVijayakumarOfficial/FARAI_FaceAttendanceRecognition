import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const Home = () => {
  const navigate = useNavigate();
  // GSAP Refs
  const ecoContainerRef = useRef(null);
  const textRef = useRef(null);
  const hero1Ref = useRef(null);
  const overlayRef = useRef(null);
  const detailsRef = useRef(null);

  const devicesSectionRef = useRef(null);
  const lapRef = useRef(null);
  const phoneRef = useRef(null);
  const tabRef = useRef(null);
  
  useGSAP(() => {
    if (ecoContainerRef.current) {
      gsap.set([textRef.current, hero1Ref.current, overlayRef.current], { transformOrigin: '50% 50%' });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ecoContainerRef.current,
          start: 'top top',
          end: 'bottom bottom', 
          scrub: true
        }
      });

      // 1. Fade out the top text & overlay
      tl.to(textRef.current, { y: -50, opacity: 0, duration: 1 }, 0)
        .to(overlayRef.current, { opacity: 0, duration: 1 }, 0)
      // 2. Center zoom hero1 massively so we "fly through" it (capped at 5x scale to prevent GPU crash)
        .to(hero1Ref.current, { scale: 5, opacity: 0, duration: 2, ease: 'power2.inOut' }, 0)
      // 3. Reveal details text
        .fromTo(detailsRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, 1);
    }

    // Device flying animation
    if (devicesSectionRef.current) {
      const deviceTl = gsap.timeline({
        scrollTrigger: {
          trigger: devicesSectionRef.current,
          start: 'top 80%',
          end: 'center center',
          scrub: 1,
        }
      });

      deviceTl
        .fromTo(lapRef.current, { y: 150, x: -50, opacity: 0, rotation: -15 }, { y: 0, x: 0, opacity: 1, rotation: 0, duration: 1 }, 0)
        .fromTo(phoneRef.current, { y: 200, x: 50, opacity: 0, rotation: 20 }, { y: 0, x: 0, opacity: 1, rotation: 10, duration: 1 }, 0.2)
        .fromTo(tabRef.current, { y: 250, opacity: 0, rotation: -10 }, { y: 0, opacity: 1, rotation: -5, duration: 1 }, 0.4);
    }
  }, { scope: devicesSectionRef });
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
    <div className={`min-vh-100 d-flex flex-column text-white position-relative bg-dark`}>
      {/* Animated Glassmorphism Background Elements */}
      <div className="glass-bg"></div>
      
      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg fixed-top py-3`} style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src="/EFCI.png" alt="EFCI Logo" style={{ height: '35px', objectFit: 'contain' }} className="me-2" />
          </a>
          <div className="d-flex align-items-center">

            <button onClick={() => scrollToLogin('employee')} className="btn btn-outline-light px-4 rounded-pill shadow-sm" style={{ fontWeight: 500, fontSize: '14px' }}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        {/* Native Sticky Wrapper for Hero Animation */}
        <div ref={ecoContainerRef} style={{ height: '300vh' }} className="position-relative w-100">
          <section className="position-sticky w-100 overflow-hidden vh-100 bg-black d-flex align-items-center justify-content-center" style={{ top: 0 }}>
            
            {/* Layer 1: Next-Gen Security Text (Bottom Layer, revealed when hero1 zooms) */}
            <div ref={detailsRef} className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center px-4" style={{ zIndex: 1 }}>
              <h2 className="display-2 fw-bold text-white mb-4" style={{ letterSpacing: '-1px' }}>
                Next-Gen <span className="text-gradient">Security</span>
              </h2>
              <p className="lead text-white-50 mx-auto" style={{ maxWidth: '800px', fontSize: '1.6rem', lineHeight: '1.8', textAlign: 'center' }}>
                Sub-second facial recognition mapping ensuring an automated, frictionless clock-in experience. Build the future of workforce management today.
              </p>
            </div>

            {/* Layer 2: Hero 1 Image (Middle Layer) */}
            <img ref={hero1Ref} src="/hero1.png" className="position-absolute w-100 h-100 object-fit-cover opacity-75" style={{ zIndex: 2 }} alt="Hero 1" />
            <div ref={overlayRef} className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50" style={{ zIndex: 3 }}></div>

            {/* Layer 3: Face Attendance Text (Top Layer) */}
            <div ref={textRef} className="position-relative text-center" style={{ zIndex: 4 }}>
              <h1 className="display-1 fw-bold text-white mb-4" style={{ letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                Face Attendance <br/><span className="text-gradient">Recognition</span>
              </h1>
            </div>
          </section>
        </div>

        {/* Section 3: Hero 2 */}
        <section className="position-relative overflow-hidden min-vh-100 d-flex align-items-center justify-content-center bg-black">
          <motion.img 
            initial={{ scale: 1 }}
            whileInView={{ scale: 1.05 }}
            transition={{ duration: 1.5 }}
            src="/hero2.png" className="position-absolute w-100 h-100 object-fit-cover z-0 opacity-75" alt="Hero 2" 
          />
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-50 z-1"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="position-relative z-2 text-center px-4"
          >
             <button onClick={() => scrollToLogin('employee')} className="btn btn-outline-light btn-lg px-5 rounded-pill shadow-sm glass-panel text-white border-white" style={{ fontWeight: 600, padding: '15px 30px' }}>
              Experience It Now
            </button>
          </motion.div>
        </section>

        {/* Workspace Management Section - Seamless */}
        <section className="position-relative z-1 overflow-hidden min-vh-100 d-flex align-items-center justify-content-center bg-black">
          <div className="position-absolute top-50 start-50 translate-middle w-100 h-100" style={{ zIndex: 0 }}>
             <img src="/workspace.png" className="w-100 h-100 object-fit-cover opacity-50" style={{ filter: 'blur(20px)' }} alt="Workspace Background" />
             <div className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-75"></div>
          </div>
          
          <div className="container position-relative z-2 py-5">
            <div className="row justify-content-center text-center">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="col-lg-10"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="d-inline-flex align-items-center badge glass-panel text-glow rounded-pill px-4 py-2 mb-4"
                >
                  <i className="bi bi-briefcase me-2" style={{fontSize: '16px'}} ></i> Complete Workforce Management
                </motion.div>
                <h2 className="display-2 fw-bold mb-4 text-white" style={{ letterSpacing: '-2px' }}>
                  Handle Employees with <br/><span className="text-gradient">Precision</span>
                </h2>
                <p className="lead mb-5 text-white-50 mx-auto" style={{ fontSize: '1.5rem', lineHeight: '1.6', maxWidth: '800px' }}>
                  A centralized workspace for administrators to effortlessly manage records, track shifts, and monitor daily attendance patterns in real-time.
                </p>
                <img src="/workspace.png" className="img-fluid rounded-4 shadow-lg border border-secondary border-opacity-25" style={{ transform: 'perspective(1000px) rotateX(5deg)' }} alt="Workspace Overview" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Floating Devices Section - Ecosystem */}
        <section ref={devicesSectionRef} className="position-relative z-1 overflow-hidden min-vh-100 d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(to bottom, #000000, #050505)' }}>
          <div className="position-absolute top-50 start-50 translate-middle rounded-circle" style={{ width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(0,0,0,0) 60%)', zIndex: 0 }}></div>
          
          <div className="container position-relative z-2 text-center h-100 d-flex flex-column justify-content-center py-5">
            <motion.div 
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-5"
            >
              <motion.div 
                className="d-inline-flex align-items-center badge glass-panel text-glow rounded-pill px-3 py-2 mb-4"
              >
                <i className="bi bi-laptop me-2" style={{fontSize: '14px'}} ></i> Cross-Device Ecosystem
              </motion.div>
              <h2 className="display-3 fw-bold text-white mb-3" style={{ letterSpacing: '-1px' }}>
                Access <span className="text-gradient">Anywhere</span>
              </h2>
              <p className="lead text-white-50 mx-auto mb-5" style={{ maxWidth: '600px' }}>
                Whether you are on a laptop, tablet, or smartphone, FARAI delivers a seamless, responsive experience.
              </p>
            </motion.div>
            
            <div className="position-relative w-100 d-flex justify-content-center align-items-center mt-5" style={{ height: '40vh' }}>
              <img ref={lapRef} src="/lap.png" className="position-absolute z-3 shadow-lg rounded-4" style={{ width: '55%' }} alt="Laptop App View" />
              <img ref={tabRef} src="/tab.png" className="position-absolute z-2 shadow-lg rounded-4" style={{ width: '35%', left: '10%' }} alt="Tablet App View" />
              <img ref={phoneRef} src="/phone.png" className="position-absolute z-3 shadow-lg rounded-4" style={{ width: '20%', right: '15%' }} alt="Phone App View" />
            </div>
          </div>
        </section>

        {/* Hero Section - AI Features */}
        <section className="position-relative z-1 overflow-hidden min-vh-100 d-flex align-items-center bg-black" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container py-5">
            <div className="row align-items-center">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="col-lg-6 mb-5 mb-lg-0"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="d-inline-flex align-items-center badge glass-panel text-glow rounded-pill px-3 py-2 mb-4"
                >
                  <i className="bi bi-sparkles me-2" style={{fontSize: '14px'}} ></i> AI Powered Attendance
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="display-3 fw-bold mb-4 text-white"
                  style={{ letterSpacing: '-1.5px' }}
                >
                  Smart Attendance <br /> 
                  <span className="text-gradient">Powered by AI</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="lead mb-5 text-white-50" 
                  style={{ fontSize: '1.3rem', lineHeight: '1.7' }}
                >
                  Automate your workforce tracking with advanced facial recognition technology for a smarter, secure, and frictionless workplace.
                </motion.p>
                
                <div className="row g-4">
                  {['Face Recognition AI', 'Secure Cloud Database', 'Employee Management', 'Real-time Analytics'].map((f, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                      viewport={{ once: true }}
                      key={i} 
                      className="col-sm-6 d-flex align-items-center"
                    >
                      <i className="bi bi-checkcircle2 text-glow me-3" style={{fontSize: '20px'}} ></i>
                      <span className="fw-medium text-white">{f}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, margin: "-100px" }}
                className="col-lg-6 text-center position-relative"
              >
                <div className="position-absolute top-50 start-50 translate-middle rounded-circle" style={{ width: '80%', height: '80%', background: 'rgba(0, 210, 255, 0.1)', filter: 'blur(100px)', zIndex: -1 }}></div>
                <img src="/admin.png" className="img-fluid rounded-4 shadow-lg border border-secondary border-opacity-25" alt="Team Overview" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Login Section - Seamless Culmination */}
        <section id="login-section" className="position-relative z-1 min-vh-100 d-flex align-items-center bg-black" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="position-absolute bottom-0 start-50 translate-middle-x w-100" style={{ height: '500px', background: 'radial-gradient(ellipse at bottom, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)', zIndex: 0 }}></div>
          <div className="container position-relative z-2 py-5">
            <div className="row justify-content-center">
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true, margin: "-50px" }}
                className="col-md-8 col-lg-5"
              >
                <div className={`card border-0 text-white overflow-hidden shadow-lg`} style={{ borderRadius: '24px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)' }}>
                  
                  <div className="card-body p-4 p-md-5 position-relative">
                    
                    <div className="text-center mb-5 position-relative z-1">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle p-4 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <i className="bi bi-person-bounding-box" style={{fontSize: '32px', color: '#fff'}} ></i>
                      </div>
                      <h3 className="fw-bold mb-2 text-white" style={{ letterSpacing: '-0.5px' }}>Welcome</h3>
                      <p className="text-white-50 small">Access your secure portal.</p>
                    </div>

                    <div className="d-flex justify-content-center mb-4 position-relative z-1">
                      <div className="btn-group p-1 rounded-pill w-100" role="group" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <button 
                          onClick={() => setLoginType('employee')}
                          className={`btn rounded-pill w-50 py-2 ${loginType === 'employee' ? 'btn-light text-black shadow' : 'btn-link text-white-50 text-decoration-none'}`}
                          style={{ border: 'none', transition: 'all 0.3s ease', fontWeight: loginType === 'employee' ? '600' : '400' }}
                        >
                          Employee
                        </button>
                        <button 
                          onClick={() => setLoginType('admin')}
                          className={`btn rounded-pill w-50 py-2 ${loginType === 'admin' ? 'btn-light text-black shadow' : 'btn-link text-white-50 text-decoration-none'}`}
                          style={{ border: 'none', transition: 'all 0.3s ease', fontWeight: loginType === 'admin' ? '600' : '400' }}
                        >
                          Administrator
                        </button>
                      </div>
                    </div>

                    <div className="text-center mb-4 position-relative z-1">
                      {loginType === 'admin' ? (
                        isAdminRegister ? (
                          <p className="text-white-50 small">Already an Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(false);}} className="text-info text-decoration-none fw-semibold">Log In Here</a></p>
                        ) : (
                          <p className="text-white-50 small">New Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(true);}} className="text-info text-decoration-none fw-semibold">Register Here</a></p>
                        )
                      ) : (
                        <p className="text-white-50 small">New Employee? <span className="text-light fw-medium">Contact your Admin to get registered.</span></p>
                      )}
                    </div>

                    {error && (
                      <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                        <i className="bi bi-shield-check me-2" style={{fontSize: '18px'}} ></i>
                        <div>{error}</div>
                      </div>
                    )}

                    <form onSubmit={handleAuthAction}>
                      {isAdminRegister && (
                        <div className="mb-3 position-relative">
                          <i className="bi bi-person position-absolute top-50 translate-middle-y ms-3 text-white-50" style={{fontSize: '18px'}} ></i>
                          <input 
                            type="text" 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name" 
                            className={`form-control form-control-lg ps-5 glass-input`}
                          />
                        </div>
                      )}
                      
                      <div className="mb-3 position-relative">
                        <i className="bi bi-envelope position-absolute top-50 translate-middle-y ms-3 text-white-50" style={{fontSize: '18px'}} ></i>
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address" 
                          className={`form-control form-control-lg ps-5 glass-input`}
                        />
                      </div>
                      
                      <div className="mb-4 position-relative">
                        <i className="bi bi-lock position-absolute top-50 translate-middle-y ms-3 text-white-50" style={{fontSize: '18px'}} ></i>
                        <input 
                          type="password" 
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password" 
                          className={`form-control form-control-lg ps-5 glass-input`}
                        />
                      </div>

                      {isAdminRegister && (
                        <div className="mb-4 position-relative">
                          <i className="bi bi-lock position-absolute top-50 translate-middle-y ms-3 text-white-50" style={{fontSize: '18px'}} ></i>
                          <input 
                            type="password" 
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password" 
                            className={`form-control form-control-lg ps-5 glass-input`}
                          />
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-light text-black btn-lg w-100 rounded-pill shadow-sm d-flex justify-content-center align-items-center mt-3"
                        style={{ fontWeight: '600' }}
                      >
                        {loading ? (
                          <div className="spinner-border spinner-border-sm text-dark me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : null}
                        {isAdminRegister ? 'Create Account' : 'Sign In Securely'}
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`py-4 mt-auto border-top border-secondary glass-panel position-relative z-1`}>
        <div className="container text-center text-white-50">
          <div className="d-flex justify-content-center align-items-center mb-3">
             <img src="/EFCI.png" alt="EFCI Logo" style={{ height: '40px', objectFit: 'contain' }} />
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


