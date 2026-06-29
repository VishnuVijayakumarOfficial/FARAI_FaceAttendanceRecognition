import { useAuth } from '../hooks/useAuth';
import { Bell, Search, User, Sun, Moon } from 'lucide-react';

const TopBar = ({ title }) => {
  const { user } = useAuth();
  
  return (
    <div className={`navbar navbar-expand-lg px-4 py-3 border-bottom shadow-sm navbar-light bg-white`}>
      <h4 className="mb-0 fw-bold me-auto">{title || 'Dashboard'}</h4>

      <div className="d-flex align-items-center">
        <div className="input-group d-none d-md-flex me-3" style={{ width: '250px' }}>
          <span className={`input-group-text border-end-0 bg-transparent `}>
            <Search size={18} className="text-secondary" />
          </span>
          <input
            type="text"
            placeholder="Search anything..."
            className={`form-control border-start-0 ps-0 bg-transparent`}
          />
        </div>



        <button className="btn btn-link text-secondary p-2 me-3 position-relative">
          <Bell size={20} />
          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
            <span className="visually-hidden">New alerts</span>
          </span>
        </button>

        <div className="d-flex align-items-center ms-2 ps-3 border-start">
          <div className="d-none d-md-block text-end me-3">
            <p className="mb-0 fw-bold lh-1">{user?.email?.split('@')[0] || 'Admin'}</p>
            <small className="text-secondary">Super Admin</small>
          </div>
          <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
            <User size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

