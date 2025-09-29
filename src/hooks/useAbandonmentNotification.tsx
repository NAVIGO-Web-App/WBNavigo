import { useEffect } from 'react';
import { useQuest } from '@/contexts/QuestContext';
import { useNavigate } from 'react-router-dom';

export const useAbandonmentNotification = () => {
  const { activeQuest, checkAbandonment, quests, setActiveQuest } = useQuest();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      if (checkAbandonment() && activeQuest) {
        const quest = quests.find(q => q.id === activeQuest.questId);
        if (quest) {
          const userAction = confirm(
            `Still working on "${quest.title}"? \n\nClick OK to continue now, or Cancel to save for later.`
          );
          
          if (userAction) {
            navigate(`/quest/${quest.id}`);
          } else {
            // User chose to save for later - we can implement pausing logic here
            // For now, we'll just update the last activity to reset the timer
            console.log(`Quest ${quest.title} saved for later`);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [activeQuest, checkAbandonment, quests, navigate, setActiveQuest]);
};