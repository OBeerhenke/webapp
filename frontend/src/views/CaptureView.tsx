import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadDocument } from '../hooks/useDocuments';

export const CaptureView: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const uploadMutation = useUploadDocument();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to backend
      await uploadMutation.mutateAsync(base64);

      // Navigate to tasks
      navigate('/tasks');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-midnight via-midnight-lighter to-midnight">
      {/* Top navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <button
          onClick={() => navigate('/tasks')}
          className="glass-card p-3 rounded-xl hover:bg-midnight-lighter/50 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white font-semibold text-lg">Capture Document</h1>
        
        <button
          onClick={() => navigate('/settings')}
          className="glass-card p-3 rounded-xl hover:bg-midnight-lighter/50 transition-colors"
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

      {/* Main content */}
      {!isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-32">
          {/* Document icon with animation */}
          <motion.div
            className="relative mb-8"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="absolute inset-0 bg-neon-teal/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <svg 
              className="w-32 h-32 text-neon-teal relative z-10" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M9 13h6m-6 4h6m-6-8h2" 
              />
            </svg>
          </motion.div>

          {/* Instructions */}
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl font-bold text-white">
              Ready to Capture
            </h2>
            <p className="text-gray-400 text-base max-w-sm mx-auto leading-relaxed">
              Tap the camera button below to take a photo of your document using your device's camera
            </p>
          </div>

          {/* Tips */}
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-neon-teal font-semibold text-sm uppercase tracking-wider">
              Tips for Best Results
            </h3>
            <div className="space-y-3">
              {[
                { icon: "☀️", text: "Use good lighting" },
                { icon: "📄", text: "Lay document flat" },
                { icon: "📏", text: "Fill the frame" },
                { icon: "🔍", text: "Keep text clear and sharp" }
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <span className="text-gray-300 text-sm">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Processing animation */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-24 h-24 border-4 border-neon-teal/30 border-t-neon-teal rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p
              className="text-white text-lg font-semibold mt-6"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Processing Document...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="absolute top-24 left-4 right-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl backdrop-blur-md z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-400 text-sm flex-1">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera button */}
      {!isProcessing && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-12">
          <motion.button
            onClick={handleCameraClick}
            className="relative group"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-neon-teal/30 rounded-full blur-2xl group-hover:bg-neon-teal/40 transition-colors" />
            
            {/* Button */}
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-neon-teal to-neon-purple shadow-2xl shadow-neon-glow/50 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </motion.button>
        </div>
      )}

      {/* Hidden file input for native camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
