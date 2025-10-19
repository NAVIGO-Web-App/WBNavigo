import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface HelpButtonProps {
  onStartTutorial: () => void;
  onShowGuides: () => void;
}

const HelpButton: React.FC<HelpButtonProps> = ({ onStartTutorial, onShowGuides }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full w-12 h-12 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <HelpCircle className="w-6 h-6" />
        </Button>
        
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 z-50">
            <div className="bg-popover dark:bg-gray-800 rounded-lg shadow-lg p-2 space-y-2 min-w-[200px] border border-border">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm"
                onClick={onStartTutorial}
              >
                Start Tutorial
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-sm"
                onClick={onShowGuides}
              >
                Show Guides
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpButton;