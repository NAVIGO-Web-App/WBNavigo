import React from 'react';
import { useNavigoTutorial } from '@/hooks/useNavigoTutorial';
import HelpButton from './HelpButton';
import { useLocation } from 'react-router-dom';

export const HelpButtonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { startTutorial, showContextGuides } = useNavigoTutorial();

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[1000]">
        <HelpButton 
          onStartTutorial={startTutorial}
          onShowGuides={showContextGuides}
        />
      </div>
      {children}
    </>
  );
};