import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  glow = false,
  onClick 
}) => {
  const baseClasses = glow ? 'glass-card-glow' : 'glass-card';
  
  return (
    <motion.div
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
