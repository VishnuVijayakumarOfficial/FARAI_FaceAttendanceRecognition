import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';


const EmployeeDashboard = () => {
  const { user, signOut } = useAuth();
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (user.id !== 'demo-user-id' && !empData) {
        signOut();
        navigate('/?error=deactivated#login-section');
        return;
      }

      setEmployeeInfo(empData);

      const { data: historyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      setHistory(historyData || []);
      setLoading(false);
    };

    fetchData();
  }, [user.id, navigate, signOut]);

  const isTodayMarked = () => {
    const today = new Date().toISOString().split('T')[0];
    return history.some(rec => rec.date === today);
  };

  const isFaceRegistered = () => !!(employeeInfo?.face_descriptor);

  const attendanceRate = () => {
    if (history.length === 0) return 0;
    const present = history.filter(r => r.status === 'Present').length;
    return Math.round((present / history.length) * 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className={`min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light`}>
        <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div>
        <p className="text-secondary fw-bold">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 bg-light`}>
      <div className="container-fluid max-w-7xl mx-auto p-4">

        {/* Unified Header */}
        <header className={`card border-0 shadow-sm rounded-4 mb-4 bg-white`}>
          <div className="card-body p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div className="d-flex align-items-center">
                <i className="bi bi-scanface text-primary me-2" style={{fontSize: '24px'}} ></i>
                <div>
                  <h4 className="mb-0 fw-bold">FAR<span className="text-primary">AI</span></h4>
                  <small className="text-secondary">Employee Portal</small>
                </div>
              </div>
              
              <div>
                
                <button onClick={signOut} className="btn btn-outline-danger btn-sm p-2 rounded-circle">
                  <i className="bi bi-box-arrow-right" style={{fontSize: '16px'}} ></i>
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center mt-3">
              {employeeInfo?.face_image ? (
                <img src={employeeInfo.face_image} alt={employeeInfo.name} className="rounded-circle border border-4 border-light shadow-sm me-4" style={{width: '80px', height: '80px', objectFit: 'cover'}} />
              ) : (
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-4" style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-person" style={{fontSize: '32px'}} ></i>
                </div>
              )}
              <div>
                <p className="text-secondary mb-1">{getGreeting()},</p>
                <h2 className="fw-bold mb-1">{employeeInfo?.name}</h2>
                <p className="text-secondary mb-0">{employeeInfo?.designation} • {employeeInfo?.department}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Face Registration Status Card */}
        <div className={`card border-0 shadow-sm rounded-4 mb-4 bg-white`}>
          <div className="card-body p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between">
            {isFaceRegistered() ? (
              <>
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="position-relative me-4">
                    <div className="bg-success text-white rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm">
                      <i className="bi bi-camera" style={{fontSize: '24px'}} ></i>
                    </div>
                    <div className="position-absolute bottom-0 end-0 bg-white rounded-circle p-1 shadow-sm text-success">
                      <i className="bi bi-check" style={{fontSize: '14px'}}  strokeWidth={4}></i>
                    </div>
                  </div>
                  <div>
                    <h5 className="fw-bold text-success mb-1 d-flex align-items-center">
                      Face Registered Successfully
                    </h5>
                    <p className="text-secondary mb-1">Your face is registered and ready for attendance verification.</p>
                    <small className="text-muted d-flex align-items-center">
                      <i className="bi bi-calendar me-1" style={{fontSize: '14px'}} ></i> Last updated: {new Date().toLocaleDateString()}
                    </small>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/employee/attendance?mode=register')}
                  className="btn btn-outline-secondary"
                >
                  <i className="bi bi-pencil me-2" style={{fontSize: '16px'}} ></i>
                  Edit Face
                </button>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-4">
                    <i className="bi bi-camera" style={{fontSize: '32px'}} ></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1">No Face Registered</h5>
                    <p className="text-secondary mb-0">Register your face to start marking attendance.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/employee/attendance?mode=register')}
                  className="btn btn-primary"
                >
                  <i className="bi bi-camera me-2" style={{fontSize: '16px'}} ></i>
                  Register Face Now
                </button>
              </>
            )}
          </div>
        </div>

        <div className="row g-4">
          {/* Left Column */}
          <div className="col-lg-6">
            {/* Daily Attendance Action Card */}
            <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white`}>
              <div className="card-body p-4 d-flex flex-column">
                <h5 className="card-title fw-bold mb-1">Daily Attendance</h5>
                <p className="text-secondary mb-4">Mark your attendance using AI face recognition.</p>

                <div className={`p-4 rounded-4 mb-4 flex-grow-1 d-flex flex-column justify-content-center bg-light`}>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <p className="text-secondary mb-1">Today's Status</p>
                      {isTodayMarked() ? (
                        <h4 className="fw-bold text-success d-flex align-items-center mb-0">
                          <i className="bi bi-checkcircle2 me-2" style={{fontSize: '24px'}} ></i>
                          Checked In
                        </h4>
                      ) : (
                        <h4 className="fw-bold text-secondary mb-0">Not Checked In</h4>
                      )}
                    </div>
                    <div className="text-end">
                      <h4 className="fw-bold mb-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                      <p className="text-secondary mb-0">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(isFaceRegistered() ? '/employee/attendance?mode=attendance' : '/employee/attendance?mode=register')}
                    className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm"
                  >
                    <i className="bi bi-camera me-2" style={{fontSize: '20px'}} ></i>
                    Mark Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Attendance History */}
          <div className="col-lg-6">
            <div className={`card border-0 shadow-sm rounded-4 h-100 bg-white`}>
              <div className="card-body p-4 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title fw-bold mb-0">Attendance History</h5>
                  <div className="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center py-2 px-3 rounded-pill">
                    <i className="bi bi-trendingup me-1" style={{fontSize: '16px'}} ></i>
                    {attendanceRate()}% Rate
                  </div>
                </div>

                <div className="flex-grow-1 overflow-auto pe-2">
                  {history.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="bi bi-calendar text-secondary opacity-50 mb-3" style={{fontSize: '48px'}} ></i>
                      <h6 className="fw-bold text-secondary">No attendance records yet.</h6>
                      <p className="text-muted small">Your history will appear here after your first check-in.</p>
                    </div>
                  ) : history.map((record) => (
                    <div key={record.id} className="d-flex justify-content-between align-items-center py-3 border-bottom border-light">
                      <div className="d-flex align-items-center">
                        <div className={`p-2 rounded-3 me-3 ${record.status === 'Present' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                          <i className="bi bi-calendar" style={{fontSize: '20px'}} ></i>
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1">
                            {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {new Date(record.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0] && (
                              <span className="text-primary ms-1">(Today)</span>
                            )}
                          </h6>
                        </div>
                      </div>
                      <span className={`badge ${record.status === 'Present' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} rounded-pill`}>
                        • {record.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                {history.length > 0 && (
                  <button className="btn btn-link text-decoration-none text-primary fw-bold mt-3" onClick={() => navigate('/employee/reports')}>
                    View All History &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;




