import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../hooks/useAuth';
import {
  Menu, ShieldCheck, CheckCircle2, Play, Users, ScanFace,
  Lock, Cloud, BarChart3, Mail, EyeOff, UserCog, CalendarDays, MoreHorizontal
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const navigate = useNavigate();
  const { signInManually } = useAuth();
  const containerRef = useRef(null);

  // Login Form State
  const [loginType, setLoginType] = useState('employee'); // 'employee' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const phoneRef = useRef(null);

  useGSAP(() => {
    // Hero Animations
    gsap.from('.hero-badge', { y: -20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.2 });
    gsap.from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 });
    gsap.from('.hero-desc', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 });
    gsap.from('.hero-buttons', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.8 });
    gsap.from('.hero-social', { opacity: 0, duration: 1, delay: 1 });
    
    // Laptop Animation
    gsap.from('.laptop-wrapper', { y: 40, opacity: 0, duration: 1, ease: 'power2.out', delay: 0.2 });
    
    // The lid starts closed (-90deg on X axis) and opens up
    gsap.from('.laptop-lid', {
      rotateX: -95,
      duration: 2.2,
      ease: 'power3.inOut',
      delay: 0.5
    });

    // Scroll Animations
    const sections = gsap.utils.toArray('.scroll-section');
    sections.forEach((section) => {
      gsap.from(section, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
        }
      });
    });

    // Staggered stats
    gsap.from('.stat-card', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.stats-container',
        start: 'top 90%'
      }
    });

    // Staggered steps
    gsap.from('.step-card', {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '.steps-container',
        start: 'top 85%'
      }
    });

    // Staggered features
    gsap.from('.feature-card', {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.features-container',
        start: 'top 85%'
      }
    });

    // Phone mockup initial reveal on scroll
    gsap.from(phoneRef.current, {
      y: 100,
      rotationX: 10,
      rotationY: -10,
      scale: 0.9,
      opacity: 0,
      duration: 1.5,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '#login-section',
        start: 'top 70%'
      }
    });
  }, { scope: containerRef });

  const handleToggleLogin = (type) => {
    if (loginType === type) return;
    setLoginType(type);
    
    // Animate phone from right with rotation
    gsap.fromTo(phoneRef.current,
      { x: 300, rotationY: 45, rotationZ: 10, opacity: 0, scale: 0.9 },
      { x: 0, rotationY: 0, rotationZ: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'back.out(1.2)' }
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInManually(email, password, loginType);
      navigate(loginType === 'admin' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const scrollToLogin = () => {
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-800 font-sans overflow-x-hidden relative selection:bg-green-500/30">
      {/* Dynamic Background Image */}
      <div 
        className="absolute top-0 right-0 w-full h-[800px] bg-no-repeat bg-right-top bg-contain opacity-40 pointer-events-none -z-10"
        style={{ backgroundImage: 'url(/bg.png)' }}
      ></div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-6 bg-transparent relative z-50">
        <div className="flex items-center gap-3">
          <div className="text-green-600">
            <ScanFace size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900">
              FAR <span className="text-green-600">AI</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-widest mt-0.5">Face Attendance Recognition</p>
          </div>
        </div>
        <button className="text-green-600 p-2 border border-green-100 rounded-lg hover:bg-green-50 transition-colors">
          <Menu size={24} />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="px-4 md:px-8 pt-6 pb-20 flex justify-center w-full relative z-10 perspective-[3000px]">
        <div className="laptop-wrapper relative w-full max-w-[1400px] flex flex-col items-center transform-style-3d mt-4 md:mt-10">
            
            {/* Laptop Lid (Screen) */}
            <div className="laptop-lid relative w-full md:w-[96%] aspect-[16/9] md:aspect-[16/8.5] bg-slate-900 rounded-t-3xl md:rounded-t-[2.5rem] border-[12px] md:border-[20px] lg:border-[28px] border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] overflow-hidden origin-bottom">
              
              {/* Screen Content */}
              <div className="absolute inset-0 bg-white flex flex-col md:flex-row items-center justify-between p-6 md:p-12 lg:p-20 overflow-hidden">
                 <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center opacity-30"></div>
                 
                 {/* Left Text Content */}
                 <div className="relative z-10 w-full md:w-[55%] space-y-6 text-left">
                    <div className="hero-badge inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-[10px] md:text-sm font-bold uppercase tracking-widest border border-green-100 shadow-sm">
                      AI Powered Attendance System
                    </div>
                    
                    <h1 className="hero-title text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] text-slate-900 tracking-tight">
                      Smart Attendance <br /> Powered by <span className="text-green-500">AI</span>
                    </h1>
                    
                    <p className="hero-desc text-slate-600 text-sm md:text-base lg:text-xl max-w-lg leading-relaxed font-medium">
                      Automate attendance with advanced face recognition technology for a smarter and secure workplace.
                    </p>
                    
                    <div className="hero-buttons flex flex-wrap gap-4 pt-6">
                      <button 
                        onClick={scrollToLogin}
                        className="px-6 md:px-10 py-3 md:py-5 bg-green-600 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:bg-green-700 shadow-[0_8px_30px_rgb(22,163,74,0.3)] transition-all flex items-center gap-2"
                      >
                        Get Started <span className="text-xl leading-none">→</span>
                      </button>
                      <button className="px-6 md:px-10 py-3 md:py-5 border-2 border-slate-200 text-slate-700 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg hover:border-green-600 hover:text-green-600 bg-white transition-all flex items-center gap-2">
                        Watch Demo <Play size={20} className="text-green-600 fill-green-600" />
                      </button>
                    </div>
                 </div>

                 {/* Right Face Scan Mockup */}
                 <div className="relative z-10 w-full md:w-[40%] flex justify-center md:justify-end mt-12 md:mt-0">
                   <div className="relative w-48 h-48 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full border-[8px] border-green-500/30 overflow-hidden shadow-2xl shadow-green-500/20">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop" className="w-full h-full object-cover" alt="Scan" />
                      <div className="absolute inset-0 border-[6px] border-green-400 rounded-full scale-90 animate-pulse"></div>
                   </div>
                   
                   {/* Floating Alert - Positioned lower to avoid overlap */}
                   <div className="absolute bottom-4 -left-2 md:bottom-10 md:-left-12 bg-white/95 backdrop-blur-md p-3 md:p-5 rounded-2xl shadow-2xl border border-slate-100 scale-90 md:scale-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <CheckCircle2 size={18} className="text-green-600 fill-green-100" />
                        <span className="text-xs md:text-sm font-bold text-slate-800">Face Recognized</span>
                      </div>
                      <p className="text-sm md:text-base font-bold text-green-600">John Doe</p>
                   </div>
                 </div>

              </div>
            </div>

            {/* Laptop Base (Keyboard) */}
            <div className="relative w-full h-6 md:h-10 bg-slate-300 rounded-b-[1.5rem] md:rounded-b-[2.5rem] shadow-2xl flex justify-center border-t border-slate-400 z-10">
              {/* Touchpad cutout */}
              <div className="w-24 md:w-40 h-1.5 md:h-2 bg-slate-400/50 rounded-b-lg"></div>
            </div>
            
            {/* Bottom shadow base */}
            <div className="w-[96%] h-3 md:h-5 bg-slate-400 rounded-b-[2rem] md:rounded-b-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)]"></div>

        </div>
      </section>

      {/* Stats Row */}
      <section className="stats-container px-6 md:px-16 pb-20 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { label: "Today Present", val: "128", inc: "+ 12.5%" },
          { label: "This Week", val: "856", inc: "+ 18.2%" },
          { label: "Total Employees", val: "1,240", inc: "+ 15.3%" }
        ].map((stat, i) => (
          <div key={i} className="stat-card bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden">
             <div>
               <p className="text-sm font-medium text-slate-500">{stat.label}</p>
               <h3 className="text-3xl font-bold text-green-600 mt-1">{stat.val}</h3>
             </div>
             <div className="flex items-center gap-2 mt-auto">
               <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{stat.inc}</span>
             </div>
             {/* Fake small chart */}
             <svg className="absolute bottom-4 right-4 w-24 h-8 text-green-400 opacity-50" viewBox="0 0 100 30" preserveAspectRatio="none">
               <path d="M0,25 L20,15 L40,20 L60,5 L80,10 L100,0" fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
             </svg>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="scroll-section px-6 md:px-16 py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Simple <span className="text-green-500">3</span> Steps Process</h2>
        </div>
        
        <div className="steps-container max-w-5xl mx-auto grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-green-200 -z-0"></div>

          {[
            { step: 1, icon: <ScanFace size={32} className="text-green-600" />, title: "Register Face", desc: "Employees register their face using webcam for secure identity." },
            { step: 2, icon: <UserCog size={32} className="text-green-600" />, title: "AI Verification", desc: "Our AI model verifies the face in real-time with high accuracy." },
            { step: 3, icon: <CheckCircle2 size={32} className="text-green-600" />, title: "Attendance Marked", desc: "Clock In / Clock Out recorded instantly in the system." },
          ].map((s, i) => (
            <div key={i} className="step-card bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative z-10 flex flex-col items-center">
              <div className="absolute -top-4 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-green-500/30">
                {s.step}
              </div>
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6 border border-green-100">
                {s.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="scroll-section px-6 md:px-16 py-24 bg-white">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Powerful Features for Modern Workplace</h2>
        </div>

        <div className="features-container max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <ScanFace />, title: "Face Recognition", desc: "AI-powered face detection and recognition using face-api.js in browser." },
            { icon: <Users />, title: "Employee Management", desc: "Add, update and manage employee records efficiently." },
            { icon: <CalendarDays />, title: "Shift Scheduling", desc: "Set shift timings, working hours and manage schedules easily." },
            { icon: <BarChart3 />, title: "Attendance Reports", desc: "View real-time attendance, daily logs and weekly analytics." },
            { icon: <Lock />, title: "Secure Authentication", desc: "Secure login and data protection with Supabase authentication." },
            { icon: <Cloud />, title: "Cloud Based", desc: "All data is securely stored in the cloud with real-time sync & backup." }
          ].map((f, i) => (
            <div key={i} className="feature-card p-6 rounded-3xl bg-white border border-slate-100 hover:border-green-200 shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all group flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-green-600 group-hover:bg-green-50 transition-colors flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-2">{f.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="scroll-section px-6 md:px-16 py-24 bg-slate-50 border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center mb-16 relative z-10">
          <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">Dashboard Preview</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Intuitive User Interface</h2>
        </div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 relative z-10">
          {/* Admin Dashboard Mock */}
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <ScanFace size={18} /> Admin Dashboard
              </div>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-500 mb-4">Overview</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {['Employees', 'Present', 'Absent', 'On Leave'].map((label, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${i === 1 ? 'text-green-500' : 'text-slate-800'}`}>
                    {[1240, 856, 128, 24][i]}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-40 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
               <svg className="w-full h-full text-green-500" viewBox="0 0 100 40" preserveAspectRatio="none">
                 <path d="M0,35 L10,25 L20,30 L30,15 L40,25 L50,10 L60,20 L70,5 L80,15 L90,0 L100,10 L100,40 L0,40 Z" fill="rgba(34, 197, 94, 0.1)" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
               </svg>
            </div>
          </div>

          {/* Employee Dashboard Mock */}
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
             <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <ScanFace size={18} /> Employee Dashboard
              </div>
              <MoreHorizontal size={20} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Welcome Back, John Doe 👋</h3>
            <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-16 h-16 rounded-xl object-cover" alt="Profile" />
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 mb-2">Today's Status</p>
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] text-slate-400">Clock In</p>
                     <p className="font-bold text-slate-800">09:15 AM</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-slate-400">Clock Out</p>
                     <p className="font-bold text-slate-800">--:-- --</p>
                   </div>
                </div>
              </div>
            </div>
            <button className="w-full py-3 bg-green-50 text-green-600 font-bold text-sm rounded-xl mb-6">Mark Clock Out</button>
            <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                   <span className="text-slate-500">May 20, 2024</span>
                   <span className="text-slate-800 font-medium">09:15 AM</span>
                   <span className="text-green-500 font-bold">Present</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Secure & Reliable */}
      <section className="scroll-section px-6 md:px-16 py-16 bg-white border-b border-slate-100 text-center">
        <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">Secure & Reliable</p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-12">Your Data is Safe With Us</h2>
        
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center md:justify-between gap-8">
          {[
            { icon: <ShieldCheck />, title: "Face Recognition", desc: "Advanced AI ensures only authorized access." },
            { icon: <Cloud />, title: "Cloud Database", desc: "Secure cloud storage with real-time backup." },
            { icon: <Lock />, title: "Secure Authentication", desc: "Supabase Auth protects your data and privacy." },
            { icon: <BarChart3 />, title: "Real-time Analytics", desc: "Get real-time insights and reports." },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center max-w-[180px]">
              <div className="text-green-500 mb-4">{item.icon}</div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrated Login Section */}
      <section id="login-section" className="px-6 md:px-16 py-24 bg-white relative">
        <div className="absolute inset-0 bg-green-500/5 mix-blend-multiply pointer-events-none"></div>
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          <div>
            <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">Get Started</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-10">Login to Your Account</h2>
            
            <div className="flex gap-4 mb-10">
              <button 
                onClick={() => handleToggleLogin('employee')}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                  loginType === 'employee' 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-green-200'
                }`}
              >
                <Users size={18} /> Employee Login
              </button>
              <button 
                onClick={() => handleToggleLogin('admin')}
                className={`flex-1 py-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                  loginType === 'admin' 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-green-200'
                }`}
              >
                <ShieldCheck size={18} /> Admin Login
              </button>
            </div>

            <p className="text-sm text-slate-500">
              New Employee? <a href="#" onClick={(e) => {e.preventDefault(); navigate('/employee/register');}} className="text-green-600 font-bold hover:underline">Register Here</a>
            </p>
          </div>

          <div ref={phoneRef} className="phone-mockup-container perspective-[2000px] flex justify-center lg:justify-end">
            <div className="relative bg-white w-full max-w-[360px] aspect-[9/19] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden flex flex-col">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-[1.2rem] z-50 flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-10 custom-scrollbar relative flex flex-col justify-center">
                <div className="absolute inset-0 bg-green-500/5 mix-blend-multiply pointer-events-none -z-10"></div>
                
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mx-auto mb-3 border border-green-100">
                    <ScanFace size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Welcome Back</h3>
                  <p className="text-xs text-slate-500 mt-1">Sign in to continue</p>
                </div>

                {error && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                    <ShieldCheck size={16} /> {error}
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email Address" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-green-500 focus:ring-2 ring-green-500/10 transition-all text-xs font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password" 
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-green-500 focus:ring-2 ring-green-500/10 transition-all text-xs font-medium"
                      />
                      <EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" size={18} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded text-green-600 focus:ring-green-500 border-slate-300" />
                      <span className="text-[10px] font-medium text-slate-600">Remember Me</span>
                    </label>
                    <a href="#" className="text-[10px] font-bold text-green-600 hover:underline">Forgot Password?</a>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-lg shadow-green-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <span className="animate-spin text-lg leading-none">◌</span> : 'Sign In'}
                  </button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                     <ShieldCheck size={12} className="text-green-500" /> Secure by Supabase
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50 border-t border-slate-100">
        © 2024 FAR AI - Face Attendance Recognition. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
