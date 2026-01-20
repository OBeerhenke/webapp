import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDocuments } from '../hooks/useDocuments';

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { data: documents } = useDocuments();

  const activeCount = documents?.filter(
    (doc) => doc.status === 'processing' || doc.status === 'uploading'
  ).length || 0;

  const navItems = [
    {
      name: 'Camera',
      path: '/camera',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'text-neon-teal' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
    },
    {
      name: 'Tasks',
      path: '/tasks',
      badge: activeCount,
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'text-neon-teal' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'text-neon-teal' : 'text-gray-400'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass-card border-t border-white/10 rounded-t-3xl">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 px-6 py-2"
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-neon-teal/10 rounded-xl"
                    transition={{ type: 'spring', duration: 0.5 }}
                  />
                )}

                {/* Icon with badge */}
                <div className="relative z-10">
                  {item.icon(isActive)}
                  
                  {/* Badge for active count */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-neon-teal text-midnight text-xs font-bold rounded-full flex items-center justify-center"
                    >
                      {item.badge}
                    </motion.div>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`relative z-10 text-xs font-medium ${
                    isActive ? 'text-neon-teal' : 'text-gray-400'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
