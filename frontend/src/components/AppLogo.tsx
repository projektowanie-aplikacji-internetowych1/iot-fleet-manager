import React from 'react';
import { Activity } from 'lucide-react';

interface AppLogoProps {
  size?: number;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 24 }) => {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <div className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full pointer-events-none"></div>
      <div className="relative bg-gradient-to-tr from-brand-indigo to-indigo-500 p-2 rounded-xl border border-indigo-400/30 text-white shadow-lg shadow-brand-indigo/20">
        <Activity size={size} className="animate-pulse" />
      </div>
    </div>
  );
};
