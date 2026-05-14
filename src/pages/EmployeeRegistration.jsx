import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadModels, getFaceDescriptor } from '../utils/faceApi';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmployeeRegistration = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const loaded = await loadModels();
      setModelsLoaded(loaded);
      if (loaded) startVideo();
    };
    init();
    
    return () => stopVideo();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => {
        console.error(err);
        setError("Camera access denied. Please enable camera permissions.");
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !modelsLoaded) return;
    
    setCapturing(true);
    setError(null);

    try {
      const descriptor = await getFaceDescriptor(videoRef.current);
      
      if (!descriptor) {
        throw new Error("No face detected. Please ensure your face is clearly visible.");
      }

      // Save to Supabase
      const { error: updateError } = await supabase
        .from('employees')
        .update({ face_descriptor: Array.from(descriptor) })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => navigate('/employee/dashboard'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-outfit">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Face Registration</h2>
          <p className="text-slate-500 font-medium">Capture your face data to enable secure attendance marking</p>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-2xl">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 mb-10 border border-slate-200 shadow-inner group">
            {!modelsLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10">
                <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                <p className="text-slate-400">Initializing AI models...</p>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover"
            />
            
            {success && (
              <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
                <div className="bg-slate-900 p-6 rounded-full shadow-2xl">
                  <CheckCircle size={60} className="text-emerald-500" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => startVideo()}
              className="px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-slate-600 shadow-sm"
            >
              <RefreshCw size={20} />
              Reset Camera
            </button>
            <button
              disabled={!modelsLoaded || capturing || success}
              onClick={handleCapture}
              className="flex-1 btn-primary py-4 text-lg font-black flex items-center justify-center gap-3"
            >
              {capturing ? (
                <>
                  <Loader2 className="animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera size={24} />
                  Capture Face Data
                </>
              )}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Lighting</p>
              <p className="text-sm font-bold text-slate-700">Bright</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Position</p>
              <p className="text-sm font-bold text-slate-700">Centered</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Glasses</p>
              <p className="text-sm font-bold text-slate-700">Remove</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistration;
