import React from 'react';
import { GlassCard } from '../components/GlassCard';

export const SettingsView: React.FC = () => {
  return (
    <div className="min-h-screen bg-midnight pt-6 pb-24 px-4">
      <h1 className="text-2xl font-bold mb-6 text-shadow-glow">Settings</h1>

      <div className="space-y-4">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Application Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Version</span>
              <span className="text-white font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mode</span>
              <span className="text-neon-teal font-semibold">Development (Mock)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Backend</span>
              <span className="text-green-400">● Connected</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Camera Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Flash</span>
              <input type="checkbox" className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-300">Auto-focus</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">About</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            IDP Mobile Application for intelligent document processing with Hyland integration.
            Capture documents, extract data, and view results in real-time.
          </p>
        </GlassCard>

        <button className="w-full btn-secondary">
          Clear All Documents
        </button>
      </div>
    </div>
  );
};
