import { useRef, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { loadModels, getFaceDescriptor, compareFaces } from '../../../utils/faceApi';

import { useAuth } from '../../../hooks/useAuth';

const EmployeeAttendance = () => {
  const { user, signOut } = useAuth();
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'auto';
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

      const { data } = await supabase
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
  }, [user.id, navigate, signOut]);

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
      <div className="">
        <div style={{ textAlign: 'center' }}>
          <i className="bi bi-arrow-clockwise" style={{fontSize: '48px'}} ></i>
          <p className="">Loading your profile...</p>
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
    <div className="">
      <div className="">

        {/* Top Navbar */}
        <nav className="">
          <div className="">
            <div className="">
              <i className="bi bi-scanface" style={{fontSize: '24px'}} ></i>
            </div>
            <div>
              <h1 className="">FAR<span className="">AI</span></h1>
              <p className="">Employee Portal</p>
            </div>
          </div>
          
          
        </nav>

        {/* Back Button */}
        <button onClick={() => navigate('/employee/dashboard')} className="">
          <i className="bi bi-arrow-left" style={{fontSize: '18px'}} ></i> Back to Dashboard
        </button>

        {/* Employee Profile Header */}
        <div className="">
          <div className="">
            <div className="">
              {employeeInfo?.face_image ? (
                <div className="">
                  <img src={employeeInfo.face_image} alt={employeeInfo.name} />
                </div>
              ) : (
                <div className="">
                  <span className="">{initials}</span>
                </div>
              )}
            </div>

            <div className="">
              <p className="">Employee Identity Center</p>
              <h1 className="">{employeeInfo?.name}</h1>
              <p className="">
                {employeeInfo?.designation} &bull; {employeeInfo?.department} &bull; #{employeeInfo?.employee_id}
              </p>

              <div className="">
                <span className=" ${faceRegistered ? '' : ''}">
                  <i className="bi bi-scanface" style={{fontSize: '12px'}} ></i>
                  {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                </span>
                {mode !== 'register' && (
                  <span className=" ${alreadyMarked ? '' : withinWindow ? '' : ''}">
                    <i className="bi bi-clock" style={{fontSize: '12px'}} ></i>
                    {alreadyMarked ? 'Present Today' : withinWindow ? 'Window Open' : 'Window Closed'}
                  </span>
                )}
              </div>
            </div>

            {mode !== 'register' && (
              <div className=" ${withinWindow ? '' : ''}">
                <p className="">Shift Window</p>
                <p className="">{employeeInfo?.attendance_start_time}</p>
                <p className="">to</p>
                <p className="">{employeeInfo?.attendance_end_time}</p>
              </div>
            )}
          </div>
        </div>

        {modelsError && (
          <div className="">
            <i className="bi bi-alertcircle" style={{fontSize: '20px'}} ></i>
            <p className="">AI models failed to load. Please refresh the page.</p>
          </div>
        )}

        {/* Step Flow Indicator */}
        {!hideRegistrationStep && !hideAttendanceStep && (
          <div className="">
            <div className=" ${faceRegistered ? '' : ''}">
              <i className="bi bi-scanface" style={{fontSize: '18px'}} ></i>
              Step 1: Register Face
              {faceRegistered && <i className="bi bi-check-circle" style={{fontSize: '16px'}} ></i>}
            </div>
            <div className=" ${faceRegistered ? '' : ''}" />
            <div className={`${''} ${
              attendSuccess || alreadyMarked
                ? ''
                : faceRegistered && withinWindow
                  ? ''
                  : ''
            }`}>
              {faceRegistered ? <i className="bi bi-unlock" style={{fontSize: '18px'}} ></i> : <i className="bi bi-lock" style={{fontSize: '18px'}} ></i>}
              Step 2: Mark Attendance
              {(attendSuccess || alreadyMarked) && <i className="bi bi-check-circle" style={{fontSize: '16px'}} ></i>}
            </div>
          </div>
        )}

        <div className="">
          {/* LEFT: Camera Feed */}
          <div>
            <div className="">
              <div className="">
                <div className="">
                  <div className="">
                    <i className="bi bi-camera" style={{fontSize: '20px'}} ></i>
                  </div>
                  <div>
                    <p className="">Live Camera</p>
                    <p className="">Keep your face in the circle</p>
                  </div>
                </div>
                <div className="">
                  <div className=""></div>
                  <span className="">LIVE</span>
                </div>
              </div>

              <div className="">
                <video ref={videoRef} autoPlay muted playsInline className="" />
                <div className="">
                  <div className=""></div>
                </div>

                {!modelsLoaded && (
                  <div className="">
                    <div className="">
                      <span className="">{initials}</span>
                    </div>
                    <div className="">
                      <div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div>
                      <span className="">Loading AI...</span>
                    </div>
                  </div>
                )}

                {registerSuccess && (
                  <div className="">
                    <div className="">
                      <i className="bi bi-check-circle" style={{fontSize: '50px'}} ></i>
                    </div>
                    <p className="">Face Registered!</p>
                  </div>
                )}

                {attendSuccess && (
                  <div className="">
                    <div className="">
                      <i className="bi bi-person-check" style={{fontSize: '50px'}} ></i>
                    </div>
                    <p className="">Attendance Marked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Action Panels */}
          <div className="">

            {/* STEP 1 */}
            {!hideRegistrationStep && (
              <div className="">
                <div className="">
                  {mode !== 'register' && (
                    <div className=" ${faceRegistered ? '' : ''}">
                      1
                    </div>
                  )}
                  <div>
                    <h2 className="">Register Your Face</h2>
                    <p className="">One-time setup to enable attendance</p>
                  </div>
                </div>

                <div className="">
                  {employeeInfo?.face_image ? (
                    <div className="">
                      <img src={employeeInfo.face_image} alt="Registered" />
                    </div>
                  ) : (
                    <div className="">
                      <span className="">{initials}</span>
                    </div>
                  )}
                  <div>
                    <p className="">{employeeInfo?.name}</p>
                    <p className={faceRegistered ? '' : ''}>
                      {faceRegistered ? '✓ Face registered — can re-register anytime' : '⚠ No face data saved yet'}
                    </p>
                  </div>
                </div>

                {registerError && (
                  <div className="">
                    <i className="bi bi-alertcircle" style={{fontSize: '16px'}} ></i>
                    <p className="">{registerError}</p>
                  </div>
                )}

                {registerSuccess && (
                  <div className="">
                    <i className="bi bi-check-circle" style={{fontSize: '16px'}} ></i>
                    <p className="">Face registered! Step 2 is now unlocked.</p>
                  </div>
                )}

                <button
                  onClick={handleRegisterFace}
                  disabled={!modelsLoaded || registering || registerSuccess}
                  className={`${''} ${
                    !modelsLoaded || registering || registerSuccess
                      ? ''
                      : faceRegistered
                        ? ''
                        : ''
                  }`}
                >
                  {registering ? (
                    <><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div> Scanning Face...</>
                  ) : registerSuccess ? (
                    <><i className="bi bi-check-circle" style={{fontSize: '20px'}} ></i> Registered Successfully!</>
                  ) : faceRegistered ? (
                    <><i className="bi bi-refreshcw" style={{fontSize: '20px'}} ></i> Re-Register Face</>
                  ) : (
                    <><i className="bi bi-camera" style={{fontSize: '20px'}} ></i> Register My Face</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {!hideAttendanceStep && (
              <div className=" ${!faceRegistered ? '' : ''}">
                <div className="">
                  {mode !== 'attendance' && (
                    <div className={`${''} ${
                      attendSuccess || alreadyMarked || faceRegistered ? '' : ''
                    }`}>
                      2
                    </div>
                  )}
                  <div>
                    <h2 className="">Mark Attendance</h2>
                    <p className="">
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
                    <i className="bi bi-unlock" style={{fontSize: '16px'}} ></i>
                  ) : (
                    <i className="bi bi-lock" style={{fontSize: '16px'}} ></i>
                  )}
                </div>

                {alreadyMarked && !attendSuccess && (
                  <div className="">
                    <i className="bi bi-check-circle" style={{fontSize: '20px'}} ></i>
                    <div>
                      <p className="">Attendance already marked for today!</p>
                      <p className="">See you tomorrow 👋</p>
                    </div>
                  </div>
                )}

                {attendError && (
                  <div className="">
                    <i className="bi bi-alertcircle" style={{fontSize: '16px'}} ></i>
                    <p className="">{attendError}</p>
                  </div>
                )}

                {attendSuccess && (
                  <div className="">
                    <i className="bi bi-check-circle" style={{fontSize: '16px'}} ></i>
                    <p className="">Attendance marked! Redirecting...</p>
                  </div>
                )}

                <button
                  onClick={handleMarkAttendance}
                  disabled={!faceRegistered || !modelsLoaded || verifying || attendSuccess || alreadyMarked || !withinWindow}
                  className={`${''} ${
                    faceRegistered && modelsLoaded && !verifying && !attendSuccess && !alreadyMarked && withinWindow
                      ? ''
                      : ''
                  }`}
                >
                  {verifying ? (
                    <><div className="spinner-border spinner-border-sm" role="status"><span className="visually-hidden">Loading...</span></div> Verifying Face...</>
                  ) : attendSuccess || alreadyMarked ? (
                    <><i className="bi bi-check-circle" style={{fontSize: '20px'}} ></i> Attendance Marked</>
                  ) : !faceRegistered ? (
                    <><i className="bi bi-lock" style={{fontSize: '20px'}} ></i> Register Face First (Step 1)</>
                  ) : !withinWindow ? (
                    <><i className="bi bi-clock" style={{fontSize: '20px'}} ></i> Outside Attendance Window</>
                  ) : (
                    <><i className="bi bi-person-check" style={{fontSize: '20px'}} ></i> Verify &amp; Mark Present</>
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





