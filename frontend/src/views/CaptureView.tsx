import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'react-camera-pro';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadDocument } from '../hooks/useDocuments';

export const CaptureView: React.FC = () => {
  const camera = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const uploadMutation = useUploadDocument();
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!camera.current) return;

    try {
      setIsCapturing(true);
      setError(null);

      // Capture photo with maximum quality
      const photo = camera.current.takePhoto('jpeg', 1.0); // quality = 1.0 (max)

      // Show scanning animation (simulated)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Upload to backend
      await uploadMutation.mutateAsync(photo);

      // Navigate to tasks
      navigate('/tasks');
    } catch (err: any) {
      console.error('Capture error:', err);
      setError(err.message || 'Failed to capture document');
      setIsCapturing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please select an image or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Show scanning animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Upload to backend
      await uploadMutation.mutateAsync(base64);

      // Navigate to tasks
      navigate('/tasks');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-midnight">
      {/* Top navigation bar */}
      {!isCapturing && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <button
            onClick={() => navigate('/tasks')}
            className="glass-card p-2 rounded-lg hover:bg-midnight-lighter/50 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-white font-semibold text-lg">Capture Document</h1>
          
          <button
            onClick={() => navigate('/settings')}
            className="glass-card p-2 rounded-lg hover:bg-midnight-lighter/50 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Camera viewfinder */}
      <div className="absolute inset-0">
        <Camera
          ref={camera}
          aspectRatio="cover"
          facingMode="environment"
          numberOfCamerasCallback={(numberOfCameras) => console.log('Available cameras:', numberOfCameras)}
          videoSourceDeviceId={undefined}
          videoReadyCallback={() => {
            console.log('Camera ready');
            // Request highest quality video stream
            if (camera.current?.stream) {
              const videoTrack = camera.current.stream.getVideoTracks()[0];
              const capabilities = videoTrack.getCapabilities();
              console.log('Camera capabilities:', capabilities);
              
              if (capabilities.width && capabilities.height) {
                videoTrack.applyConstraints({
                  width: { ideal: capabilities.width.max || 1920 },
                  height: { ideal: capabilities.height.max || 1080 },
                  facingMode: 'environment'
                }).catch(err => console.warn('Could not apply constraints:', err));
              }
            }
          }}
          errorMessages={{
            noCameraAccessible: 'No camera device accessible. Please connect your camera or try a different browser.',
            permissionDenied: 'Permission denied. Please refresh and give camera permission.',
            switchCamera: 'It is not possible to switch camera to different one because there is only one video device accessible.',
            canvas: 'Canvas is not supported.',
          }}
        />
      </div>

      {/* Document alignment guide */}
      {!isCapturing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Darkened overlay */}
          <div className="absolute inset-0 bg-black/40" />
          
          {/* Guide rectangle */}
          <motion.div
            className="relative z-10 border-2 border-neon-teal rounded-xl"
            style={{
              width: '85%',
              maxWidth: '400px',
              aspectRatio: '8.5 / 11',
            }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(45, 212, 191, 0.3)',
                '0 0 30px rgba(45, 212, 191, 0.5)',
                '0 0 20px rgba(45, 212, 191, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Corner brackets */}
            {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
              <div
                key={corner}
                className={`absolute w-6 h-6 ${
                  corner.includes('top') ? '-top-0.5' : '-bottom-0.5'
                } ${corner.includes('left') ? '-left-0.5' : '-right-0.5'} ${
                  corner.includes('top')
                    ? corner.includes('left')
                      ? 'border-t-[3px] border-l-[3px] rounded-tl-xl'
                      : 'border-t-[3px] border-r-[3px] rounded-tr-xl'
                    : corner.includes('left')
                    ? 'border-b-[3px] border-l-[3px] rounded-bl-xl'
                    : 'border-b-[3px] border-r-[3px] rounded-br-xl'
                } border-neon-teal`}
              />
            ))}
          </motion.div>

          {/* Help text */}
          <div className="absolute bottom-48 text-center px-4 pointer-events-none">
            <p className="text-white text-sm font-medium drop-shadow-lg">
              Align document within the guide
            </p>
          </div>
        </div>
      )}

      {/* Scanning animation */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                className="w-64 h-1 bg-neon-teal mb-4"
                animate={{ y: [0, 200, 0] }}
                transition={{ duration: 1.5, repeat: 3 }}
              />
              <p className="text-neon-teal text-lg font-semibold">Scanning Document...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute top-4 left-4 right-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-md z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      {!isCapturing && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-6 pb-12">
          {/* Upload button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="glass-card p-4 rounded-full shadow-lg hover:bg-midnight-lighter/50 transition-colors"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-7 h-7 text-neon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </motion.button>

          {/* Hidden file input - use native camera for best quality */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Shutter button */}
          <motion.button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-neon-teal shadow-lg shadow-neon-glow/50"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-full h-full rounded-full border-4 border-midnight flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white" />
            </div>
          </motion.button>

          {/* Gallery button */}
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="glass-card p-4 rounded-full shadow-lg hover:bg-midnight-lighter/50 transition-colors"
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-7 h-7 text-neon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </motion.button>
        </div>
      )}
    </div>
  );
};
