import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmployeeAttendance = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const init = async () => {
      setLoadingData(true);

      const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .single();
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
  }, []);

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

  const getInitials = (name) => {
    if (!name) return '?';
    return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isWithinTimeRange = () => {
    if (!employeeInfo?.attendance_start_time || !employeeInfo?.attendance_end_time) return false;
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = employeeInfo.attendance_start_time.split(':').map(Number);
    const [eh, em] = employeeInfo.attendance_end_time.split(':').map(Number);
    return current >= sh * 60 + sm && current <= eh * 60 + em;
  };

  // ── Register Face ─────────────────────────────────────────────────────────
  const handleRegisterFace = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    setRegistering(true);
    setRegisterError(null);

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      if (!descriptor) throw new Error('No face detected. Look directly at the camera and try again.');

      // Capture face as a small 200x200 thumbnail to keep storage small
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = videoRef.current.videoWidth || 640;
      srcCanvas.height = videoRef.current.videoHeight || 480;
      srcCanvas.getContext('2d').drawImage(videoRef.current, 0, 0, srcCanvas.width, srcCanvas.height);

      // Crop to square from center and resize to 200x200
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 200;
      thumbCanvas.height = 200;
      const ctx = thumbCanvas.getContext('2d');
      const side = Math.min(srcCanvas.width, srcCanvas.height);
      const offsetX = (srcCanvas.width - side) / 2;
      const offsetY = (srcCanvas.height - side) / 2;
      ctx.drawImage(srcCanvas, offsetX, offsetY, side, side, 0, 0, 200, 200);
      const faceImage = thumbCanvas.toDataURL('image/jpeg', 0.7);

      console.log('[FaceReg] Saving descriptor + image for user:', user.id);
      console.log('[FaceReg] Image size (chars):', faceImage.length);

      const { data: updateData, error: updateError } = await supabase
        .from('employees')
        .update({
          face_descriptor: Array.from(descriptor),
          face_image: faceImage
        })
        .eq('id', user.id)
        .select();

      console.log('[FaceReg] Update result:', updateData, updateError);
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

  // ── Mark Attendance ───────────────────────────────────────────────────────
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-outfit">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} />
          <p className="text-slate-500 font-bold">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const faceRegistered = !!(employeeInfo?.face_descriptor);
  const withinWindow = isWithinTimeRange();
  const initials = getInitials(employeeInfo?.name);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-outfit">
      <div className="max-w-5xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-bold mb-8 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        {/* ── Employee Profile Header ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar: registered face or initials */}
            <div className="flex-shrink-0">
              {employeeInfo?.face_image ? (
                <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border-4 border-emerald-200 shadow-xl">
                  <img
                    src={employeeInfo.face_image}
                    alt={employeeInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/20">
                  <span className="text-3xl font-black text-white">{initials}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-black text-primary-500 uppercase tracking-widest mb-1">Employee Identity Center</p>
              <h1 className="text-3xl font-black text-slate-900 mb-1">{employeeInfo?.name}</h1>
              <p className="text-slate-400 font-bold text-sm">
                {employeeInfo?.designation} &bull; {employeeInfo?.department} &bull; #{employeeInfo?.employee_id}
              </p>

              {/* Status pills */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  faceRegistered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <ScanFace size={12} />
                  {faceRegistered ? 'Face Registered' : 'Face Not Registered'}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  alreadyMarked ? 'bg-emerald-100 text-emerald-700' : withinWindow ? 'bg-primary-100 text-primary-700' : 'bg-rose-100 text-rose-600'
                }`}>
                  <Clock size={12} />
                  {alreadyMarked ? 'Present Today' : withinWindow ? 'Window Open' : 'Window Closed'}
                </span>
              </div>
            </div>

            {/* Time Window */}
            <div className={`flex-shrink-0 p-4 rounded-2xl text-center border ${
              withinWindow ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Shift Window</p>
              <p className="font-black text-slate-800 text-lg">{employeeInfo?.attendance_start_time}</p>
              <p className="text-xs text-slate-400 font-bold my-0.5">to</p>
              <p className="font-black text-slate-800 text-lg">{employeeInfo?.attendance_end_time}</p>
            </div>
          </div>
        </div>

        {/* Models error */}
        {modelsError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-600">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">AI models failed to load. Please refresh the page.</p>
          </div>
        )}

        {/* ── Step Flow Indicator ── */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm flex-1 justify-center border-2 transition-all ${
            faceRegistered
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
              : 'bg-white text-primary-600 border-primary-300'
          }`}>
            <ScanFace size={18} />
            Step 1: Register Face
            {faceRegistered && <CheckCircle size={16} />}
          </div>
          <div className={`w-10 h-0.5 flex-shrink-0 ${faceRegistered ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm flex-1 justify-center border-2 transition-all ${
            attendSuccess || alreadyMarked
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
              : faceRegistered && withinWindow
                ? 'bg-white text-emerald-600 border-emerald-300'
                : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
            {faceRegistered ? <Unlock size={18} /> : <Lock size={18} />}
            Step 2: Mark Attendance
            {(attendSuccess || alreadyMarked) && <CheckCircle size={16} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Camera Feed ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <Camera size={20} className="text-primary-500" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800">Live Camera</p>
                    <p className="text-xs text-slate-400 font-medium">Keep your face in the circle</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-black text-emerald-600">LIVE</span>
                </div>
              </div>

              {/* Video */}
              <div className="relative aspect-video bg-slate-900">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-52 rounded-full border-4 border-white/50 border-dashed shadow-lg"></div>
                </div>

                {/* Initials watermark when no video */}
                {!modelsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center mx-auto mb-3 shadow-xl">
                        <span className="text-3xl font-black text-white">{initials}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/70">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs font-bold">Loading AI...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration success overlay */}
                {registerSuccess && (
                  <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="bg-white p-5 rounded-full shadow-2xl">
                      <CheckCircle size={50} className="text-emerald-500" />
                    </div>
                    <p className="font-black text-white text-xl drop-shadow-lg">Face Registered!</p>
                  </div>
                )}

                {/* Attendance success overlay */}
                {attendSuccess && (
                  <div className="absolute inset-0 bg-primary-500/30 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="bg-white p-5 rounded-full shadow-2xl">
                      <UserCheck size={50} className="text-primary-500" />
                    </div>
                    <p className="font-black text-white text-xl drop-shadow-lg">Attendance Marked!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Action Panels ── */}
          <div className="space-y-6">

            {/* ── STEP 1: Register Face ── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  faceRegistered ? 'bg-emerald-500 text-white' : 'bg-primary-500 text-white'
                }`}>1</div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Register Your Face</h2>
                  <p className="text-xs text-slate-400 font-medium">One-time setup to enable attendance</p>
                </div>
              </div>

              {/* Registered face preview with initials fallback */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-5">
                {employeeInfo?.face_image ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-md flex-shrink-0">
                    <img src={employeeInfo.face_image} alt="Registered" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-xl font-black text-white">{initials}</span>
                  </div>
                )}
                <div>
                  <p className="font-black text-slate-800">{employeeInfo?.name}</p>
                  <p className={`text-xs font-bold mt-0.5 ${faceRegistered ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {faceRegistered ? '✓ Face registered — can re-register anytime' : '⚠ No face data saved yet'}
                  </p>
                </div>
              </div>

              {registerError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-600">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-bold">{registerError}</p>
                </div>
              )}

              {registerSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-600">
                  <CheckCircle size={16} />
                  <p className="text-sm font-bold">Face registered! Step 2 is now unlocked.</p>
                </div>
              )}

              <button
                onClick={handleRegisterFace}
                disabled={!modelsLoaded || registering || registerSuccess}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 ${
                  !modelsLoaded || registering || registerSuccess
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : faceRegistered
                      ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg'
                      : 'btn-primary shadow-xl shadow-primary-500/25'
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

            {/* ── STEP 2: Mark Attendance ── */}
            <div className={`bg-white rounded-[2.5rem] border shadow-xl p-8 transition-all duration-300 ${
              !faceRegistered ? 'opacity-50 border-slate-100' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                  attendSuccess || alreadyMarked ? 'bg-emerald-500 text-white' : faceRegistered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>2</div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Mark Attendance</h2>
                  <p className="text-xs text-slate-400 font-medium">
                    {!faceRegistered
                      ? 'Complete Step 1 first'
                      : alreadyMarked
                        ? 'Already logged in today'
                        : withinWindow
                          ? 'Ready — window is open'
                          : `Window: ${employeeInfo?.attendance_start_time} – ${employeeInfo?.attendance_end_time}`}
                  </p>
                </div>
                {/* Lock / Unlock indicator */}
                {faceRegistered ? (
                  <Unlock size={16} className="ml-auto text-emerald-500" />
                ) : (
                  <Lock size={16} className="ml-auto text-slate-300" />
                )}
              </div>

              {alreadyMarked && !attendSuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700">
                  <CheckCircle size={20} />
                  <div>
                    <p className="font-black">Attendance already marked for today!</p>
                    <p className="text-xs text-emerald-600 mt-0.5">See you tomorrow 👋</p>
                  </div>
                </div>
              )}

              {attendError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-rose-600">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-bold">{attendError}</p>
                </div>
              )}

              {attendSuccess && (
                <div className="mb-4 p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center gap-2 text-primary-600">
                  <CheckCircle size={16} />
                  <p className="text-sm font-bold">Attendance marked! Redirecting...</p>
                </div>
              )}

              <button
                onClick={handleMarkAttendance}
                disabled={!faceRegistered || !modelsLoaded || verifying || attendSuccess || alreadyMarked || !withinWindow}
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 ${
                  faceRegistered && modelsLoaded && !verifying && !attendSuccess && !alreadyMarked && withinWindow
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/25'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;
