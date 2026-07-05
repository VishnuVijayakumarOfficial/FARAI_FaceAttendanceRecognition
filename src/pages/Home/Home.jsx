import { useState, useRef } from 'react';
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
  const textPart1Ref = useRef(null);
  const textPart2Ref = useRef(null);

  const devicesSectionRef = useRef(null);
  const lapRef = useRef(null);
  const phoneRef = useRef(null);
  const tabRef = useRef(null);
  
  useGSAP(() => {
    if (ecoContainerRef.current) {
      gsap.set([textRef.current, hero1Ref.current, overlayRef.current], { transformOrigin: '50% 50%' });

      // Set initial positions: Employee Face (top left) and Checkout In (bottom right)
      gsap.set(textPart1Ref.current, { x: "-25vw", y: "-15vh" });
      gsap.set(textPart2Ref.current, { x: "25vw", y: "15vh" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ecoContainerRef.current,
          start: 'top top',
          end: 'bottom bottom', 
          scrub: true
        }
      });

      // 0. Assemble text from corners to center
      tl.to(textPart1Ref.current, { x: 0, y: 0, duration: 1 }, 0)
        .to(textPart2Ref.current, { x: 0, y: 0, duration: 1 }, 0)
      // 1. Fade out the assembled text & overlay
        .to(textRef.current, { y: -50, opacity: 0, duration: 1 }, 1)
        .to(overlayRef.current, { opacity: 0, duration: 1 }, 1)
      // 2. Center zoom hero1 massively so we "fly through" it
        .to(hero1Ref.current, { scale: 5, opacity: 0, duration: 2, ease: 'power2.inOut' }, 1)
      // 3. Reveal details text
        .fromTo(detailsRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, 2);
    }

    // Device flying animation
    if (devicesSectionRef.current) {
      // Initialize xPercent so GSAP handles centering independently of x translations
      gsap.set([lapRef.current, tabRef.current, phoneRef.current], { xPercent: -50 });

      const deviceTl = gsap.timeline({
        scrollTrigger: {
          trigger: devicesSectionRef.current,
          start: 'top 80%',
          end: 'bottom -150%',
          scrub: 2.5,
        }
      });

      deviceTl
        // 0. Spread out in Ecosystem section
        .fromTo(lapRef.current, { y: 150, x: 0, opacity: 0, rotation: -15 }, { y: 0, x: 0, opacity: 1, rotation: 0, duration: 1 }, 0)
        .fromTo(phoneRef.current, { y: 200, x: "25vw", opacity: 0, rotation: 20 }, { y: 0, x: "25vw", opacity: 1, rotation: 10, duration: 1 }, 0.2)
        .fromTo(tabRef.current, { y: 250, x: "-25vw", opacity: 0, rotation: -10 }, { y: 0, x: "-25vw", opacity: 1, rotation: -5, duration: 1 }, 0.4)
        // 1. Move to AI Section (Right Side)
        .to(lapRef.current, { y: "90vh", x: "25vw", scale: 0.7, rotation: 5, duration: 2 }, 1)
        .to(phoneRef.current, { y: "100vh", x: "38vw", scale: 0.7, rotation: -5, duration: 2 }, 1)
        .to(tabRef.current, { y: "85vh", x: "12vw", scale: 0.7, rotation: 10, duration: 2 }, 1)
        // 2. Move to How It Works Section (Center Top) - STOPS HERE perfectly centered
        .to(lapRef.current, { y: "170vh", x: 0, scale: 0.45, rotation: 0, duration: 2 }, 3)
        .to(phoneRef.current, { y: "180vh", x: "15vw", scale: 0.45, rotation: 10, duration: 2 }, 3)
        .to(tabRef.current, { y: "175vh", x: "-15vw", scale: 0.45, rotation: -10, duration: 2 }, 3);
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
    <div className={`min-vh-100 d-flex flex-column  position-relative bg-transparent`}>
      {/* Animated Glassmorphism Background Elements */}
      
      
      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg fixed-top py-3`} style={{ background: 'rgba(78, 107, 69, 0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(244, 232, 208, 0.2)' }}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center" href="#">
            <img src="/EFCI.png" alt="EFCI Logo" style={{ height: '35px', objectFit: 'contain' }} className="me-2" />
          </a>
          <div className="d-flex align-items-center">

            <button onClick={() => scrollToLogin('employee')} className="btn px-4 rounded-pill shadow-sm" style={{ fontWeight: 600, fontSize: '14px', backgroundColor: '#F4E8D0', color: '#4E6B45', border: 'none' }}>
              Sign In
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow-1">
        {/* Native Sticky Wrapper for Hero Animation */}
        <div ref={ecoContainerRef} style={{ height: '300vh' }} className="position-relative w-100">
          <section className="theme-forest position-sticky w-100 overflow-hidden vh-100 d-flex align-items-center justify-content-center" style={{ top: 0 }}>
            
            {/* Layer 1: Future of Workforce Text (Bottom Layer, revealed when hero1 zooms) */}
            <div ref={detailsRef} className="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-center px-4" style={{ zIndex: 1 }}>
              <img src="/hero2.png" className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover" style={{ zIndex: -1, opacity: 0.5 }} alt="Hero 2 Background" />
              <h2 className="display-2 fw-bold  mb-4 position-relative" style={{ letterSpacing: '-1px' }}>
                Experience The <span className="text-gradient">Future</span>
              </h2>
              <p className="lead  mx-auto position-relative" style={{ maxWidth: '800px', fontSize: '1.6rem', lineHeight: '1.8', textAlign: 'center' }}>
                Seamless integration, unparalleled speed. Elevate your workspace with advanced AI technology.
              </p>
            </div>

            {/* Layer 2: Hero 1 Image (Middle Layer) */}
            <img ref={hero1Ref} src="/hero1.png" className="position-absolute w-100 h-100 object-fit-cover" style={{ zIndex: 2, opacity: 0.75 }} alt="Hero 1" />
            <div ref={overlayRef} className="position-absolute top-0 start-0 w-100 h-100" style={{ zIndex: 3, background: 'rgba(0,0,0,0.5)' }}></div>

            {/* Layer 3: Face Attendance Text (Top Layer) */}
            <div ref={textRef} className="position-relative w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ zIndex: 4, overflow: 'hidden' }}>
              <h1 className="display-1 fw-bold  mb-4" style={{ letterSpacing: '-2px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                <div ref={textPart1Ref} className="text-pop-up-top d-inline-block">Employee Face</div>
                <br/>
                <div ref={textPart2Ref} className="text-gradient text-pop-up-top d-inline-block">Checkout In</div>
              </h1>
            </div>
          </section>
        </div>



        {/* Floating Devices Section - Ecosystem */}
        <section ref={devicesSectionRef} className="theme-vanilla position-relative min-vh-100 d-flex align-items-center justify-content-center" style={{ zIndex: 10 }}>
          <div className="position-absolute top-50 start-50 translate-middle rounded-circle" style={{ width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(78, 107, 69, 0.1) 0%, rgba(244, 232, 208, 0) 60%)', zIndex: 0 }}></div>
          
          <div className="container position-relative z-2 text-center h-100 d-flex flex-column justify-content-center py-5">
            <motion.div 
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-5"
            >
              <motion.div 
                className="d-inline-flex align-items-center badge-elegant rounded-pill px-3 py-2 mb-4"
              >
                <i className="bi bi-laptop me-2" style={{fontSize: '14px'}} ></i> Cross-Device Ecosystem
              </motion.div>
              <h2 className="display-3 fw-bold  mb-3" style={{ letterSpacing: '-1px' }}>
                Access <span className="text-gradient">Anywhere</span>
              </h2>
              <p className="lead  mx-auto mb-5" style={{ maxWidth: '600px' }}>
                Whether you are on a laptop, tablet, or smartphone, FARAI delivers a seamless, responsive experience.
              </p>
            </motion.div>
            
            <div className="position-relative w-100 d-flex justify-content-center align-items-center mt-5" style={{ height: '40vh' }}>
              <img ref={lapRef} src="/lap.png" className="position-absolute z-3 shadow-lg rounded-4" style={{ width: '45%', left: '50%' }} alt="Laptop App View" />
              <img ref={tabRef} src="/tab.png" className="position-absolute z-2 shadow-lg rounded-4" style={{ width: '28%', left: '50%' }} alt="Tablet App View" />
              <img ref={phoneRef} src="/phone.png" className="position-absolute z-3 shadow-lg rounded-4" style={{ width: '15%', left: '50%' }} alt="Phone App View" />
            </div>
          </div>
        </section>

        {/* Hero Section - AI Features */}
        <section className="theme-forest position-relative overflow-hidden min-vh-100 d-flex align-items-center" style={{ zIndex: 5 }}>
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
                  className="d-inline-flex align-items-center badge-elegant rounded-pill px-3 py-2 mb-4"
                >
                  <i className="bi bi-sparkles me-2" style={{fontSize: '14px'}} ></i> AI Powered Attendance
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="display-3 fw-bold mb-4 "
                  style={{ letterSpacing: '-1.5px' }}
                >
                  Smart Attendance <br /> 
                  <span className="text-gradient">Powered by AI</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="lead mb-5 " 
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
                      <span className="fw-medium ">{f}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                className="col-lg-6 text-center position-relative d-none d-lg-block"
                style={{ minHeight: '400px' }}
              >
                {/* Reserved space for floating devices to land on the right side */}
                <div className="position-absolute top-50 start-50 translate-middle rounded-circle" style={{ width: '80%', height: '80%', background: 'rgba(0, 210, 255, 0.1)', filter: 'blur(100px)', zIndex: -1 }}></div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="theme-vanilla position-relative overflow-hidden min-vh-100 d-flex align-items-center" style={{ zIndex: 2 }}>
          <div className="container py-5">
            <div className="text-center mb-5" style={{ paddingTop: '180px' }}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="d-inline-flex align-items-center badge-elegant rounded-pill px-3 py-2 mb-4"
              >
                <i className="bi bi-info-circle me-2" style={{fontSize: '14px'}}></i> Application Usage
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="display-4 fw-bold  mb-3" style={{ letterSpacing: '-1px' }}
              >
                How FARAI <span className="text-gradient">Works</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="lead  mx-auto" style={{ maxWidth: '700px' }}
              >
                A simple, powerful workflow designed for both employees and administrators to streamline attendance tracking.
              </motion.p>
            </div>

            <div className="row g-4">
              {[
                {
                  icon: 'bi-person-plus',
                  title: '1. Registration & Setup',
                  desc: 'Administrators securely register employees into the system, capturing facial data directly into our encrypted cloud database.',
                  delay: 0.3
                },
                {
                  icon: 'bi-camera-video',
                  title: '2. Facial Clock-In',
                  desc: 'Employees simply approach the terminal or their device camera. The AI instantly recognizes and logs their attendance in sub-seconds.',
                  delay: 0.4
                },
                {
                  icon: 'bi-graph-up',
                  title: '3. Real-Time Tracking',
                  desc: 'Attendance logs, shifts, and hours worked are instantly updated and available for viewing on the employee dashboard.',
                  delay: 0.5
                },
                {
                  icon: 'bi-sliders',
                  title: '4. Admin Controls',
                  desc: 'Administrators get a bird\'s-eye view of all attendance data, with tools to generate reports, manage users, and configure settings.',
                  delay: 0.6
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: step.delay, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="col-md-6 col-lg-3"
                >
                  <div className="card h-100 bg-transparent border-0 glass-panel p-4" style={{ borderRadius: '20px' }}>
                    <div className="mb-4 d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <i className={`bi ${step.icon} `} style={{ fontSize: '24px' }}></i>
                    </div>
                    <h4 className="fw-bold  mb-3" style={{ fontSize: '1.25rem' }}>{step.title}</h4>
                    <p className=" mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="login-section" className="theme-vanilla position-relative min-vh-100 d-flex align-items-center py-5" style={{ zIndex: 1, backgroundColor: '#F4E8D0' }}>
          {/* Subtle leaves decoration */}
          <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ 
            backgroundImage: 'url("/hero2.png")', 
            backgroundSize: 'cover', 
            opacity: 0.1, 
            mixBlendMode: 'overlay', 
            zIndex: 0 
          }}></div>
          
          <div className="container position-relative z-2">
            <div className="row align-items-center g-5">
              
              {/* Left Column: Elegant Login Card */}
              <div className="col-lg-5">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="card card-login-elegant p-4 p-md-5"
                >
                  <div className="text-center mb-4">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: '64px', height: '64px', backgroundColor: '#4E6B45' }}>
                      <i className="bi bi-person-bounding-box" style={{ fontSize: '32px', color: '#FAF6EE' }}></i>
                    </div>
                    <h2 className="fw-bold mb-1" style={{ color: '#4E6B45', fontFamily: '"Playfair Display", serif', fontSize: '2rem' }}>
                      Employee Face
                    </h2>
                    <h2 className="fw-bold mb-3" style={{ color: '#4E6B45', fontFamily: '"Playfair Display", serif', fontSize: '2rem' }}>
                      Checkout In
                    </h2>
                    
                    {/* Decorative leaf icon */}
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(78, 107, 69, 0.3)' }}></div>
                      <i className="bi bi-flower1 mx-2" style={{ color: '#4E6B45', fontSize: '14px' }}></i>
                      <div style={{ width: '40px', height: '1px', backgroundColor: 'rgba(78, 107, 69, 0.3)' }}></div>
                    </div>
                    
                    <p className="small mb-0" style={{ color: '#4E6B45', opacity: 0.8 }}>
                      Secure AI-powered attendance with facial recognition.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="d-flex justify-content-center mb-4">
                    <div className="btn-group p-1 rounded-pill w-100" role="group" style={{ backgroundColor: '#EAE3D2' }}>
                      <button 
                        onClick={() => { setLoginType('employee'); setIsAdminRegister(false); }}
                        className={`btn rounded-pill w-50 py-2 ${loginType === 'employee' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                        style={{ border: 'none', transition: 'all 0.3s ease' }}
                      >
                        <i className="bi bi-person-fill me-2"></i>Employee
                      </button>
                      <button 
                        onClick={() => { setLoginType('admin'); }}
                        className={`btn rounded-pill w-50 py-2 ${loginType === 'admin' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                        style={{ border: 'none', transition: 'all 0.3s ease' }}
                      >
                        <i className="bi bi-shield-lock-fill me-2"></i>Administrator
                      </button>
                    </div>
                  </div>

                  {/* Toggle registration for admin */}
                  <div className="text-center mb-4">
                    {loginType === 'admin' ? (
                      isAdminRegister ? (
                        <p className="small mb-0" style={{ color: '#4E6B45' }}>Already an Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(false);}} className="fw-semibold text-decoration-underline" style={{ color: '#4E6B45' }}>Log In Here</a></p>
                      ) : (
                        <p className="small mb-0" style={{ color: '#4E6B45' }}>New Admin? <a href="#" onClick={(e) => {e.preventDefault(); setIsAdminRegister(true);}} className="fw-semibold text-decoration-underline" style={{ color: '#4E6B45' }}>Register Here</a></p>
                      )
                    ) : (
                      <p className="small mb-0" style={{ color: '#4E6B45' }}>New Employee? <span className="fw-medium">Contact your Admin to get registered.</span></p>
                    )}
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '12px', fontSize: '14px' }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleAuthAction}>
                    {isAdminRegister && (
                      <div className="mb-3 position-relative">
                        <i className="bi bi-person position-absolute top-50 translate-middle-y ms-3" style={{ fontSize: '18px', color: '#4E6B45', zIndex: 10 }}></i>
                        <input 
                          type="text" 
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name" 
                          className="form-control login-input-elegant"
                        />
                      </div>
                    )}
                    
                    <div className="mb-3 position-relative">
                      <i className="bi bi-envelope position-absolute top-50 translate-middle-y ms-3" style={{ fontSize: '18px', color: '#4E6B45', zIndex: 10 }}></i>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address" 
                        className="form-control login-input-elegant"
                      />
                    </div>
                    
                    <div className="mb-4 position-relative">
                      <i className="bi bi-lock position-absolute top-50 translate-middle-y ms-3" style={{ fontSize: '18px', color: '#4E6B45', zIndex: 10 }}></i>
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password" 
                        className="form-control login-input-elegant"
                      />
                    </div>

                    {isAdminRegister && (
                      <div className="mb-4 position-relative">
                        <i className="bi bi-lock position-absolute top-50 translate-middle-y ms-3" style={{ fontSize: '18px', color: '#4E6B45', zIndex: 10 }}></i>
                        <input 
                          type="password" 
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password" 
                          className="form-control login-input-elegant"
                        />
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '14px', color: '#4E6B45' }}>
                      <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="rememberMe" style={{ borderColor: '#4E6B45' }} />
                        <label className="form-check-label" htmlFor="rememberMe">Remember me</label>
                      </div>
                      <a href="#" className="fw-semibold text-decoration-none" style={{ color: '#4E6B45' }}>Forgot Password?</a>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="btn btn-green-elegant btn-lg w-100 py-3 d-flex justify-content-center align-items-center"
                    >
                      {loading ? (
                        <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      ) : <i className="bi bi-lock-fill me-2"></i>}
                      {isAdminRegister ? 'Create Account' : 'Sign In Securely'}
                    </button>

                    <div className="text-center my-3 text-muted small">— or —</div>

                    <button 
                      type="button"
                      onClick={() => navigate('/employee/attendance')}
                      className="btn btn-outline-green-elegant btn-lg w-100 py-3 d-flex justify-content-center align-items-center"
                    >
                      <i className="bi bi-camera-fill me-2"></i>Face Login • Scan Face
                    </button>
                  </form>
                </motion.div>
              </div>

              {/* Right Column: Premium Face Scan Illustration */}
              <div className="col-lg-7 d-none d-lg-block">
                <div className="position-relative d-flex justify-content-center align-items-center" style={{ height: '550px' }}>
                  
                  {/* Orbiting circles */}
                  <div className="orbit-line" style={{ width: '420px', height: '420px' }}></div>
                  <div className="orbit-line" style={{ width: '560px', height: '560px' }}></div>
                  
                  {/* Orbiting elements */}
                  {/* Top Left: AI Recognition */}
                  <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ top: '15%', left: '10%' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '50px', height: '50px', backgroundColor: '#FAF6EE', border: '1px solid rgba(78, 107, 69, 0.1)' }}>
                      <i className="bi bi-cpu" style={{ color: '#4E6B45', fontSize: '20px' }}></i>
                    </div>
                    <span className="small fw-semibold mt-2" style={{ color: '#4E6B45', fontSize: '11px' }}>AI Recognition</span>
                  </div>
                  
                  {/* Top Right: Cloud Sync */}
                  <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ top: '15%', right: '10%' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '50px', height: '50px', backgroundColor: '#FAF6EE', border: '1px solid rgba(78, 107, 69, 0.1)' }}>
                      <i className="bi bi-cloud-arrow-up" style={{ color: '#4E6B45', fontSize: '20px' }}></i>
                    </div>
                    <span className="small fw-semibold mt-2" style={{ color: '#4E6B45', fontSize: '11px' }}>Cloud Sync</span>
                  </div>
                  
                  {/* Bottom Left: Secure */}
                  <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ bottom: '15%', left: '10%' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '50px', height: '50px', backgroundColor: '#FAF6EE', border: '1px solid rgba(78, 107, 69, 0.1)' }}>
                      <i className="bi bi-shield-check" style={{ color: '#4E6B45', fontSize: '20px' }}></i>
                    </div>
                    <span className="small fw-semibold mt-2" style={{ color: '#4E6B45', fontSize: '11px' }}>Secure</span>
                  </div>
                  
                  {/* Bottom Right: Real Time */}
                  <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ bottom: '15%', right: '10%' }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '50px', height: '50px', backgroundColor: '#FAF6EE', border: '1px solid rgba(78, 107, 69, 0.1)' }}>
                      <i className="bi bi-clock-history" style={{ color: '#4E6B45', fontSize: '20px' }}></i>
                    </div>
                    <span className="small fw-semibold mt-2" style={{ color: '#4E6B45', fontSize: '11px' }}>Real Time</span>
                  </div>
                  
                  {/* Face Image Frame */}
                  <div className="position-relative scan-container rounded-4 shadow-lg" style={{ 
                    width: '280px', 
                    height: '340px', 
                    border: '8px solid #4E6B45',
                    boxShadow: '0 20px 50px rgba(78,107,69,0.3)'
                  }}>
                    {/* Laser line overlay */}
                    <div className="scan-line"></div>
                    
                    {/* Face Photo */}
                    <img 
                      src="/user_scan.png" 
                      alt="User Face Scanning" 
                      className="w-100 h-100 object-fit-cover"
                    />
                  </div>
                  
                  {/* Verified Card Float */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="position-absolute bg-white p-3 rounded-4 shadow d-flex align-items-center"
                    style={{ 
                      right: '12%', 
                      top: '35%', 
                      border: '1px solid rgba(0,0,0,0.05)',
                      zIndex: 10
                    }}
                  >
                    <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '20px' }}></i>
                    </div>
                    <div>
                      <div className="text-success small fw-bold">Verified</div>
                      <div className="text-muted small" style={{ fontSize: '10px' }}>Today's Check-In</div>
                      <div className="fw-bold" style={{ color: '#4E6B45', fontSize: '16px' }}>09:02 AM</div>
                      <div className="text-muted" style={{ fontSize: '9px' }}>Attendance Recorded</div>
                    </div>
                  </motion.div>
                  
                  {/* Bottom Stats Grid */}
                  <div className="position-absolute w-100 d-flex justify-content-center gap-3 px-4" style={{ bottom: '-5%' }}>
                    {[
                      { icon: 'bi-journal-check', text: 'Attendance Recorded' },
                      { icon: 'bi-patch-check', text: '98% Recognition' },
                      { icon: 'bi-graph-up-arrow', text: 'Real-time Analytics' },
                      { icon: 'bi-cloud-check', text: 'Cloud Synced' }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white px-3 py-2 rounded-3 shadow-sm d-flex align-items-center border" style={{ borderColor: 'rgba(78, 107, 69, 0.1)' }}>
                        <i className={`bi ${item.icon} me-2`} style={{ color: '#4E6B45', fontSize: '16px' }}></i>
                        <span className="small fw-semibold text-secondary" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>

            {/* Bottom Horizontal features banner */}
            <div className="row g-4 mt-5 pt-5 border-top" style={{ borderColor: 'rgba(78, 107, 69, 0.15)' }}>
              {[
                { icon: 'bi-shield-check', title: 'AI Powered', desc: 'Smart Recognition' },
                { icon: 'bi-lock', title: 'Secure Login', desc: 'Your data is protected' },
                { icon: 'bi-person-bounding-box', title: 'Face Recognition', desc: 'Accurate and fast' },
                { icon: 'bi-clock-history', title: 'Real-Time Attendance', desc: 'Updated instantly' }
              ].map((banner, idx) => (
                <div key={idx} className="col-md-3 col-sm-6 d-flex align-items-center">
                  <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: '45px', height: '45px', backgroundColor: 'rgba(78, 107, 69, 0.08)' }}>
                    <i className={`bi ${banner.icon}`} style={{ color: '#4E6B45', fontSize: '20px' }}></i>
                  </div>
                  <div>
                    <div className="fw-bold" style={{ color: '#4E6B45', fontSize: '14px' }}>{banner.title}</div>
                    <div className="text-secondary" style={{ fontSize: '11px' }}>{banner.desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      </main>

      <footer className="py-4 mt-auto border-top position-relative z-1 theme-vanilla" style={{ borderColor: 'rgba(78, 107, 69, 0.15) !important' }}>
        <div className="container text-center ">
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




