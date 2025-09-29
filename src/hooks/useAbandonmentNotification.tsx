// src/hooks/useAbandonmentNotification.tsx
import { useEffect } from 'react';
import { useQuest } from '@/contexts/QuestContext';
import { toast } from 'react-toastify';

export const useAbandonmentNotification = () => {
  // Use try-catch to handle the case when context is not available yet
  let questContext;
  try {
    questContext = useQuest();
  } catch (error) {
    // Context not available yet, return early
    return;
  }

  const { activeQuest, checkAbandonment, setActiveQuest } = questContext;

  useEffect(() => {
    if (!activeQuest) return;

    const interval = setInterval(() => {
      if (checkAbandonment()) {
        toast.warning('Quest abandoned due to inactivity!', {
          position: "top-center",
          autoClose: 5000,
        });
        setActiveQuest(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeQuest, checkAbandonment, setActiveQuest]);
};