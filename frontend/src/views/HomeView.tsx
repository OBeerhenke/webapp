import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';

export const HomeView: React.FC = () => {
  const navigate = useNavigate();

  const navigationCards = [
    {
      title: 'Capture Document',
      description: 'Take a photo of your document',
      icon: (
        <svg className="w-16 h-16 text-neon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      path: '/camera',
      gradient: 'from-neon-teal/20 to-neon-blue/20',
    },
    {
      title: 'View Tasks',
      description: 'Check your document processing queue',
      icon: (
        <svg className="w-16 h-16 text-neon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      path: '/tasks',
      gradient: 'from-neon-blue/20 to-purple-500/20',
    },
    {
      title: 'Settings',
      description: 'Configure app preferences',
      icon: (
        <svg className="w-16 h-16 text-neon-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      ),
      path: '/settings',
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-midnight pt-safe pb-24 px-4">
      {/* Header */}
      <div className="text-center mb-12 pt-8">
        <motion.h1
          className="text-5xl font-bold text-white mb-3 text-shadow-glow"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          IDP Mobile
        </motion.h1>
        <motion.p
          className="text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Intelligent Document Processing
        </motion.p>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-4 max-w-md mx-auto">
        {navigationCards.map((card, index) => (
          <motion.div
            key={card.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <GlassCard
              className={`p-8 cursor-pointer transition-all active:scale-95 hover:scale-[1.02] bg-gradient-to-br ${card.gradient}`}
              onClick={() => navigate(card.path)}
              glow
            >
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">{card.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                  <p className="text-sm text-gray-400">{card.description}</p>
                </div>
                <svg
                  className="w-6 h-6 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <motion.div
        className="mt-12 max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <GlassCard className="p-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-gray-400">Backend Connected</span>
            <span className="text-neon-teal font-semibold">● MOCK MODE</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
