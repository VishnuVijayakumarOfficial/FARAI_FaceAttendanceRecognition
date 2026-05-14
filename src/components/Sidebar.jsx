import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { signOut } = useAuth();

  const navItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Overview', path: '/admin/dashboard' },
    { icon: <Users size={22} />, label: 'Employees', path: '/admin/dashboard/employees' },
    { icon: <Clock size={22} />, label: 'Attendance', path: '/admin/dashboard/attendance' },
    { icon: <Settings size={22} />, label: 'Settings', path: '/admin/dashboard/settings' },
  ];

  return (
    <div className="w-72 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-20 font-outfit">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
          <ShieldCheck className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">NexWork</h2>
          <p className="text-[10px] text-primary-600 font-bold tracking-widest uppercase">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-primary-50 text-primary-600 font-bold' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
            `}
          >
            {item.icon}
            <span className="font-bold">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-bold"
        >
          <LogOut size={22} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
