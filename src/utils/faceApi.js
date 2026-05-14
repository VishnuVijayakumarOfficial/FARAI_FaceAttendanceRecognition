import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

export const loadModels = async () => {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log('Models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
};

export const getFaceDescriptor = async (videoElement) => {
  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection ? detection.descriptor : null;
};

export const compareFaces = (descriptor1, descriptor2, threshold = 0.6) => {
  if (!descriptor1 || !descriptor2) return false;
  
  // Convert JSON to Float32Array if needed
  const d1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(Object.values(descriptor1));
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(Object.values(descriptor2));
  
  const distance = faceapi.euclideanDistance(d1, d2);
  return distance < threshold;
};
