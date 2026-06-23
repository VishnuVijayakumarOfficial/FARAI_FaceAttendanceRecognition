import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadModels, getFaceDescriptor, compareFaces } from '../utils/faceApi';
import {
  Camera,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  ScanFace,
  UserCheck,
  RefreshCw,
  ArrowLeft,
  Lock,
  Unlock,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import styles from './EmployeeAttendance.module.css';

const EmployeeAttendance = () => {
  const { user, signOut } = useAuth();
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'auto';
  const { isDarkMode, toggleTheme } = useTheme();
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Face Registration state
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // Attendance state
  const [verifying, setVerifying] = useState(false);
  const [attendSuccess, setAttendSuccess] = useState(false);
  const [attendError, setAttendError] = useState(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        setRegisterError('Camera access denied. Please allow camera permissions and refresh.');
      });
  };

  const stopVideo = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingData(true);

      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (user.id !== 'demo-user-id' && !data) {
        signOut();
        navigate('/?error=deactivated#login-section');
        return;
      }

      setEmployeeInfo(data);

      const today = new Date().toISOString().split('T')[0];
      const { data: attData } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', user.id)
        .eq('date', today)
        .single();
      if (attData) setAlreadyMarked(true);

      setLoadingData(false);

      const loaded = await loadModels();
      setModelsLoaded(loaded);
      setModelsError(!loaded);
      if (loaded) startVideo();
    };

    init();
    return () => stopVideo();
  }, [user.id]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isWithinTimeRange = () => {
    if (!employeeInfo?.attendance_start_time || !employeeInfo?.attendance_end_time) return true;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = employeeInfo.attendance_start_time.split(':').map(Number);
    const [eh, em] = employeeInfo.attendance_end_time.split(':').map(Number);
    
    // Give a generous buffer: 4 hours before and 4 hours after shift
    const startMins = sh * 60 + sm - 240;
    const endMins = eh * 60 + em + 240;
    
    return current >= startMins && current <= endMins;
  };

  const handleRegisterFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setRegistering(true);
    setRegisterError(null);

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) throw new Error('No face detected. Look directly at the camera and try again.');

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = videoRef.current.videoWidth || 640;
      srcCanvas.height = videoRef.current.videoHeight || 480;
      srcCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, srcCanvas.width, srcCanvas.height);

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 200;
      thumbCanvas.height = 200;
      const ctx = thumbCanvas.getContext('2d');
      const side = Math.min(srcCanvas.width, srcCanvas.height);
      const offsetX = (srcCanvas.width - side) / 2;
      const offsetY = (srcCanvas.height - side) / 2;
      ctx.drawImage(srcCanvas, offsetX, offsetY, side, side, 0, 0, 200, 200);
      const faceImage = thumbCanvas.toDataURL('image/jpeg', 0.7);

      const { data: updateData, error: updateError } = await supabase
        .from('employees')
        .update({
          face_descriptor: Array.from(descriptor),
          face_image: faceImage
        })
        .eq('id', user.id)
        .select();

      if (updateError) throw new Error('Failed to save face data: ' + updateError.message);
      if (!updateData || updateData.length === 0) throw new Error('Update had no effect. Check if face_image and face_descriptor columns exist in your Supabase employees table.');

      setEmployeeInfo(prev => ({
        ...prev,
        face_descriptor: Array.from(descriptor),
        face_image: faceImage
      }));
      setRegisterSuccess(true);
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!videoRef.current || !modelsLoaded || !employeeInfo) return;
    setVerifying(true);
    setAttendError(null);

    try {
      if (!isWithinTimeRange()) {
        throw new Error(
          `Attendance window is ${employeeInfo.attendance_start_time} – ${employeeInfo.attendance_end_time}. You are outside this window.`
        );
      }

      const currentDescriptor = await getFaceDescriptor(videoRef.current);
      if (!currentDescriptor) throw new Error('Face not detected. Please look directly at the camera.');

      const isMatch = compareFaces(currentDescriptor, employeeInfo.face_descriptor);
      if (!isMatch) throw new Error('Face does not match your registered face. Please try again.');

      const { error: insertError } = await supabase
        .from('attendance')
        .insert([{
          employee_id: user.id,
          date: new Date().toISOString().split('T')[0],
          login_time: new Date().toISOString(),
          status: 'Present'
        }]);

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Attendance already marked for today!');
        throw insertError;
      }

      setAttendSuccess(true);
      setAlreadyMarked(true);
      setTimeout(() => navigate('/employee/dashboard'), 2500);
    } catch (err) {
      setAttendError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  if (loadingData) {
    return (
      <div className={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className={styles.loadingSpinner} size={48} />
          <p className={styles.loadingText}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const faceRegistered = !!(employeeInfo?.face_descriptor);
  const withinWindow = isWithinTimeRange();
  const initials = getInitials(employeeInfo?.name);

  const hideRegistrationStep = mode === 'attendance';
  const hideAttendanceStep = mode === 'register';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>

        {/* Top Navbar */}
        <nav className={styles.navbar}>
          <div className={styles.brandWrapper}>
            <div className={styles.brandIcon}>
              <ScanFace size={24} />
            </div>
            <div>
              <h1 className={styles.brandTitle}>FAR<span className={styles.brandHighlight}>AI</span></h1>
              <p className={styles.brandSubtitle}>Employee Portal</p>
            </div>
          </div>
          
          <button onClick={toggleTheme} className={styles.themeBtn}>
            {isDarkMode ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} />}
          </button>
        </nav>

        {/* Back Button */}
        <button onClick={() => navigate('/employee/dashboard')} className={styles.backBtn}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* Employee Profile Header */}
        <div className={styles.profileCard}>
          <div className={styles.profileFlex}>
            <div className={styles.avatarContainer}>
              {employeeInfo?.face_image ? (
                <div className={styles.avatarImage}>
                  <img src={employeeInfo.face_image} alt={employeeInfo.name} />
                </div>
              ) : (
                <div className={styles.avatarFallback}>
                  <span className={styles.avatarFallbackText}>{initials}</span>
                </div>
              )}
            </div>

            <div className={styles.profileInfo}>
              <p className={styles.profileLabel}>Employee Identity Center</p>
              <h1 className={styles.profileName}>{employeeInfo?.name}</h1>
              <p className={styles.profileDetails}>
                {employeeInfo?.designation} &bull; {employeeInfo?.department} &bull; #{employeeInfo?.employee_id}
              </p>

              <div className={styles.statusPills}>
                <span className={`${styles.pill} ${faceRegistered ? styles.pillSuccess : styles.pillWarning}`}>
                  <ScanFace size={12} />
                  {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                </span>
                {mode !== 'register' && (
                  <span className={`${styles.pill} ${alreadyMarked ? styles.pillSuccess : withinWindow ? styles.pillPrimary : styles.pillError}`}>
                    <Clock size={12} />
                    {alreadyMarked ? 'Present Today' : withinWindow ? 'Window Open' : 'Window Closed'}
                  </span>
                )}
              </div>
            </div>

            {mode !== 'register' && (
              <div className={`${styles.timeWindow} ${withinWindow ? styles.timeWindowOpen : ''}`}>
                <p className={styles.timeLabel}>Shift Window</p>
                <p className={styles.timeValue}>{employeeInfo?.attendance_start_time}</p>
                <p className={styles.timeTo}>to</p>
                <p className={styles.timeValue}>{employeeInfo?.attendance_end_time}</p>
              </div>
            )}
          </div>
        </div>

        {modelsError && (
          <div className={styles.errorBanner}>
            <AlertCircle size={20} />
            <p className={styles.errorText}>AI models failed to load. Please refresh the page.</p>
          </div>
        )}

        {/* Step Flow Indicator */}
        {!hideRegistrationStep && !hideAttendanceStep && (
          <div className={styles.stepsContainer}>
            <div className={`${styles.stepBox} ${faceRegistered ? styles.stepActive : styles.stepPending}`}>
              <ScanFace size={18} />
              Step 1: Register Face
              {faceRegistered && <CheckCircle size={16} />}
            </div>
            <div className={`${styles.stepLine} ${faceRegistered ? styles.stepLineActive : styles.stepLinePending}`} />
            <div className={`${styles.stepBox} ${
              attendSuccess || alreadyMarked
                ? styles.stepActive
                : faceRegistered && withinWindow
                  ? styles.stepPending
                  : styles.stepDisabled
            }`}>
              {faceRegistered ? <Unlock size={18} /> : <Lock size={18} />}
              Step 2: Mark Attendance
              {(attendSuccess || alreadyMarked) && <CheckCircle size={16} />}
            </div>
          </div>
        )}

        <div className={styles.mainGrid}>
          {/* LEFT: Camera Feed */}
          <div>
            <div className={styles.cameraCard}>
              <div className={styles.cameraHeader}>
                <div className={styles.cameraHeaderLeft}>
                  <div className={styles.cameraIconBox}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className={styles.cameraTitle}>Live Camera</p>
                    <p className={styles.cameraSub}>Keep your face in the circle</p>
                  </div>
                </div>
                <div className={styles.liveIndicator}>
                  <div className={styles.liveDot}></div>
                  <span className={styles.liveText}>LIVE</span>
                </div>
              </div>

              <div className={styles.videoContainer}>
                <video ref={videoRef} autoPlay muted playsInline className={styles.videoElement} />
                <div className={styles.guideOverlay}>
                  <div className={styles.guideCircle}></div>
                </div>

                {!modelsLoaded && (
                  <div className={styles.overlayPanel}>
                    <div className={styles.overlayFallbackBox}>
                      <span className={styles.overlayFallbackText}>{initials}</span>
                    </div>
                    <div className={styles.overlayStatusRow}>
                      <Loader2 size={14} className="animate-spin" />
                      <span className={styles.overlayStatusText}>Loading AI...</span>
                    </div>
                  </div>
                )}

                {registerSuccess && (
                  <div className={styles.successOverlay}>
                    <div className={styles.successIconBox}>
                      <CheckCircle size={50} />
                    </div>
                    <p className={styles.successText}>Face Registered!</p>
                  </div>
                )}

                {attendSuccess && (
                  <div className={styles.successOverlay}>
                    <div className={styles.successIconBox}>
                      <UserCheck size={50} />
                    </div>
                    <p className={styles.successText}>Attendance Marked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Action Panels */}
          <div className={styles.actionColumn}>

            {/* STEP 1 */}
            {!hideRegistrationStep && (
              <div className={styles.actionCard}>
                <div className={styles.actionHeader}>
                  {mode !== 'register' && (
                    <div className={`${styles.actionNumber} ${faceRegistered ? styles.actionNumberActive : styles.actionNumberActive}`}>
                      1
                    </div>
                  )}
                  <div>
                    <h2 className={styles.actionTitle}>Register Your Face</h2>
                    <p className={styles.actionSub}>One-time setup to enable attendance</p>
                  </div>
                </div>

                <div className={styles.previewBox}>
                  {employeeInfo?.face_image ? (
                    <div className={styles.previewImgBox}>
                      <img src={employeeInfo.face_image} alt="Registered" />
                    </div>
                  ) : (
                    <div className={styles.previewFallbackBox}>
                      <span className={styles.previewFallbackText}>{initials}</span>
                    </div>
                  )}
                  <div>
                    <p className={styles.previewName}>{employeeInfo?.name}</p>
                    <p className={faceRegistered ? styles.previewStatusGood : styles.previewStatusBad}>
                      {faceRegistered ? '✓ Face registered — can re-register anytime' : '⚠ No face data saved yet'}
                    </p>
                  </div>
                </div>

                {registerError && (
                  <div className={styles.alertError}>
                    <AlertCircle size={16} />
                    <p className={styles.alertErrorText}>{registerError}</p>
                  </div>
                )}

                {registerSuccess && (
                  <div className={styles.alertSuccess}>
                    <CheckCircle size={16} />
                    <p className={styles.alertSuccessText}>Face registered! Step 2 is now unlocked.</p>
                  </div>
                )}

                <button
                  onClick={handleRegisterFace}
                  disabled={!modelsLoaded || registering || registerSuccess}
                  className={`${styles.btnAction} ${
                    !modelsLoaded || registering || registerSuccess
                      ? styles.btnActionDisabled
                      : faceRegistered
                        ? styles.btnActionSecondary
                        : styles.btnActionPrimary
                  }`}
                >
                  {registering ? (
                    <><Loader2 size={20} className="animate-spin" /> Scanning Face...</>
                  ) : registerSuccess ? (
                    <><CheckCircle size={20} /> Registered Successfully!</>
                  ) : faceRegistered ? (
                    <><RefreshCw size={20} /> Re-Register Face</>
                  ) : (
                    <><Camera size={20} /> Register My Face</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {!hideAttendanceStep && (
              <div className={`${styles.actionCard} ${!faceRegistered ? styles.actionCardDisabled : ''}`}>
                <div className={styles.actionHeader}>
                  {mode !== 'attendance' && (
                    <div className={`${styles.actionNumber} ${
                      attendSuccess || alreadyMarked || faceRegistered ? styles.actionNumberActive : styles.actionNumberDisabled
                    }`}>
                      2
                    </div>
                  )}
                  <div>
                    <h2 className={styles.actionTitle}>Mark Attendance</h2>
                    <p className={styles.actionSub}>
                      {!faceRegistered
                        ? 'Complete Step 1 first'
                        : alreadyMarked
                          ? 'Already logged in today'
                          : withinWindow
                            ? 'Ready — window is open'
                            : `Window: ${employeeInfo?.attendance_start_time} – ${employeeInfo?.attendance_end_time}`}
                    </p>
                  </div>
                  {faceRegistered ? (
                    <Unlock size={16} className={styles.unlockIcon} />
                  ) : (
                    <Lock size={16} className={styles.lockIcon} />
                  )}
                </div>

                {alreadyMarked && !attendSuccess && (
                  <div className={styles.alertSuccess}>
                    <CheckCircle size={20} />
                    <div>
                      <p className={styles.alertSuccessText}>Attendance already marked for today!</p>
                      <p className={styles.alertSuccessSub}>See you tomorrow 👋</p>
                    </div>
                  </div>
                )}

                {attendError && (
                  <div className={styles.alertError}>
                    <AlertCircle size={16} />
                    <p className={styles.alertErrorText}>{attendError}</p>
                  </div>
                )}

                {attendSuccess && (
                  <div className={styles.alertSuccess}>
                    <CheckCircle size={16} />
                    <p className={styles.alertSuccessText}>Attendance marked! Redirecting...</p>
                  </div>
                )}

                <button
                  onClick={handleMarkAttendance}
                  disabled={!faceRegistered || !modelsLoaded || verifying || attendSuccess || alreadyMarked || !withinWindow}
                  className={`${styles.btnAction} ${
                    faceRegistered && modelsLoaded && !verifying && !attendSuccess && !alreadyMarked && withinWindow
                      ? styles.btnActionPrimary
                      : styles.btnActionDisabled
                  }`}
                >
                  {verifying ? (
                    <><Loader2 size={20} className="animate-spin" /> Verifying Face...</>
                  ) : attendSuccess || alreadyMarked ? (
                    <><CheckCircle size={20} /> Attendance Marked</>
                  ) : !faceRegistered ? (
                    <><Lock size={20} /> Register Face First (Step 1)</>
                  ) : !withinWindow ? (
                    <><Clock size={20} /> Outside Attendance Window</>
                  ) : (
                    <><UserCheck size={20} /> Verify &amp; Mark Present</>
                  )}
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
