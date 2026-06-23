import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { loadModels, getFaceDescriptor } from '../utils/faceApi';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import styles from './EmployeeRegistration.module.css';

const EmployeeRegistration = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    const init = async () => {
      const loaded = await loadModels();
      setModelsLoaded(loaded);
      if (loaded) startVideo();
    };
    init();
    
    return () => stopVideo();
  }, []);

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
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Face Registration</h2>
          <p className={styles.subtitle}>Capture your face data to enable secure attendance marking</p>
        </div>

        <div className={styles.card}>
          <div className={styles.videoWrapper}>
            {!modelsLoaded && (
              <div className={styles.loadingOverlay}>
                <Loader2 className={styles.spinIcon} size={40} />
                <p className={styles.loadingText}>Initializing AI models...</p>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className={styles.video}
            />
            
            {success && (
              <div className={styles.successOverlay}>
                <div className={styles.successIconWrapper}>
                  <CheckCircle size={60} className={styles.successIcon} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={20} />
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <div className={styles.actions}>
            <button
              onClick={() => startVideo()}
              className={styles.resetBtn}
            >
              <RefreshCw size={20} />
              Reset Camera
            </button>
            <button
              disabled={!modelsLoaded || capturing || success}
              onClick={handleCapture}
              className={styles.captureBtn}
            >
              {capturing ? (
                <>
                  <Loader2 className={styles.spinIcon} />
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

          <div className={styles.guidelinesGrid}>
            <div className={styles.guidelineCard}>
              <p className={styles.guidelineLabel}>Lighting</p>
              <p className={styles.guidelineValue}>Bright</p>
            </div>
            <div className={styles.guidelineCard}>
              <p className={styles.guidelineLabel}>Position</p>
              <p className={styles.guidelineValue}>Centered</p>
            </div>
            <div className={styles.guidelineCard}>
              <p className={styles.guidelineLabel}>Glasses</p>
              <p className={styles.guidelineValue}>Remove</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegistration;
