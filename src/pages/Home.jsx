import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { 
  UserCog, 
  Users, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Monitor,
  Smartphone,
  Cloud,
  BarChart3,
  Lock,
  Menu
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.animate-up', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
      });

      gsap.from('.animate-fade', {
        opacity: 0,
        duration: 1.2,
        delay: 0.5,
        ease: 'power2.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: <Lock className="text-primary-600" />, title: "Secure & Encrypted", desc: "Your data is protected with bank-level encryption." },
    { icon: <Zap className="text-primary-600" />, title: "Instant Verification", desc: "Real-time face recognition in under 1 second." },
    { icon: <Cloud className="text-primary-600" />, title: "Cloud Based", desc: "Access your data anywhere, anytime, securely." },
    { icon: <BarChart3 className="text-primary-600" />, title: "Smart Analytics", desc: "Advanced insights and reports for better decisions." }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden font-outfit">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight">FAR AI</h1>
            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Face Recognition</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#" className="text-primary-600 border-b-2 border-primary-500 pb-1">Home</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Features</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Dashboard</a>
          <a href="#" className="hover:text-primary-500 transition-colors">Pricing</a>
          <a href="#" className="hover:text-primary-500 transition-colors">About Us</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[11px] font-bold text-slate-400 border border-slate-100 rounded-full px-3 py-1 bg-slate-50">
            <ShieldCheck size={14} className="text-primary-500" />
            SECURE & ENCRYPTED
          </div>
          <button 
            onClick={() => navigate('/admin/login')}
            className="px-5 py-2 text-sm font-bold text-primary-600 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
          >
            Login
          </button>
          <button className="px-5 py-2 text-sm font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all hidden sm:block">
            Get Started
          </button>
          <button className="lg:hidden text-slate-600">
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-16 py-16 md:py-24 grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="animate-up inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Zap size={14} />
            Next-Gen AI Attendance System
          </div>
          <h1 className="animate-up text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight text-slate-900">
            Face Attendance <br />
            <span className="text-primary-500">Recognition</span> with AI
          </h1>
          <p className="animate-up text-slate-500 text-lg md:text-xl max-w-lg leading-relaxed">
            Secure, fast, and intelligent employee management powered by advanced facial recognition technology.
          </p>
          <div className="animate-up flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => navigate('/admin/login')}
              className="px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold text-lg hover:bg-primary-600 shadow-xl shadow-primary-500/25 flex items-center gap-3 transition-all active:scale-95"
            >
              <ShieldCheck size={22} />
              Login as Admin
              <ArrowRight size={20} className="ml-1 opacity-70" />
            </button>
            <button 
              onClick={() => navigate('/employee/login')}
              className="px-8 py-4 border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:border-primary-500 hover:text-primary-600 bg-white transition-all active:scale-95 flex items-center gap-3"
            >
              <Users size={22} />
              Login as Employee
            </button>
          </div>
        </div>

        <div className="animate-fade relative">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl card-shadow border border-slate-100 flex flex-col md:flex-row gap-8 items-center">
            <div className="relative w-full md:w-64 aspect-square rounded-[2rem] overflow-hidden group">
              <img src="/face-scan.png" alt="Face Recognition" className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-4 border-primary-500/30 m-6 rounded-2xl">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl"></div>
                <div className="absolute left-0 right-0 h-0.5 bg-primary-500/50 shadow-[0_0_15px_#10b981] animate-scan"></div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary-500 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                <CheckCircle2 size={14} />
                Verified
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left flex-1">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Welcome Back!</p>
              <h3 className="text-3xl font-bold text-slate-800">John Doe</h3>
              <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                <CheckCircle2 size={16} />
                Check-in Successful
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-2xl font-black text-slate-900">09:30 AM</p>
                <p className="text-sm text-slate-400 font-medium">May 20, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Grid */}
      <section className="px-6 md:px-16 py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
          {/* Admin Portal Card */}
          <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 bg-primary-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary-500/20 group-hover:rotate-6 transition-transform">
                <UserCog size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3">Admin Portal</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Manage employees, schedules, and monitor real-time attendance reports.</p>
              </div>
              <ul className="space-y-3">
                {['Employee Management', 'Attendance Reports', 'Schedule Management', 'Analytics Dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <CheckCircle2 size={18} className="text-primary-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/admin/login')}
                className="inline-flex items-center gap-2 text-primary-600 font-bold hover:gap-4 transition-all pt-4"
              >
                Go to Admin Portal <ArrowRight size={20} />
              </button>
            </div>
            <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 feature-dot w-20 h-20 opacity-40"></div>
               <h4 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Dashboard Overview</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-primary-600 font-black text-xl">128</p>
                    <p className="text-[10px] font-bold text-slate-400">Employees</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-primary-600 font-black text-xl">96%</p>
                    <p className="text-[10px] font-bold text-slate-400">Attendance</p>
                  </div>
               </div>
               <div className="pt-4 h-32 flex items-end gap-1">
                  {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary-500/10 rounded-t-lg relative group cursor-pointer">
                       <div className="absolute bottom-0 left-0 right-0 bg-primary-500 rounded-t-lg transition-all" style={{ height: `${h}%` }}></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Employee Portal Card */}
          <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row gap-10 hover:shadow-2xl transition-all duration-500 group">
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 bg-primary-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary-500/20 group-hover:-rotate-6 transition-transform">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-3">Employee Portal</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Register your face and mark your daily attendance with a single look.</p>
              </div>
              <ul className="space-y-3">
                {['Face Registration', 'Quick Check-in/Check-out', 'Attendance History', 'Personal Dashboard'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <CheckCircle2 size={18} className="text-primary-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => navigate('/employee/login')}
                className="inline-flex items-center gap-2 text-primary-600 font-bold hover:gap-4 transition-all pt-4"
              >
                Go to Employee Portal <ArrowRight size={20} />
              </button>
            </div>
            <div className="flex-1 flex justify-center items-center">
               <div className="relative w-48 aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-slate-800 rounded-b-2xl z-10"></div>
                  <img src="/mobile-app.png" alt="Mobile App" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-primary-500/10 flex flex-col items-center justify-center p-4">
                     <div className="w-24 h-24 border-2 border-dashed border-primary-500 rounded-full animate-spin-slow flex items-center justify-center mb-4">
                        <div className="w-20 h-20 bg-primary-500/20 rounded-full"></div>
                     </div>
                     <p className="text-[10px] text-white font-bold tracking-widest uppercase animate-pulse">Scanning...</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="px-6 md:px-16 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 rounded-2xl bg-primary-50 flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-1">{f.title}</h5>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
