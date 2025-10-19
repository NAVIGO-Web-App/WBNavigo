import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuest } from '@/contexts/QuestContext';
import QuizQuest from '@/components/QuizQuest';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { Quest } from '@/types/quest';

const QuizDetail: React.FC = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const { quests, resetQuiz, startQuiz } = useQuest();
  const searchParams = new URLSearchParams(window.location.search);
  const isRetry = searchParams.get('retry') === 'true';

  const quest = quests.find(q => q.id === questId) as Quest | undefined;

  if (!quest) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Quest not found.</p>
        </div>
      </div>
    );
  }

  // FIX: Check if this is actually a quiz quest
  if (quest.type !== "Quiz") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>This quest is not a quiz quest.</p>
          <Button onClick={() => navigate('/quests')} className="mt-4">
            Back to Quests
          </Button>
        </div>
      </div>
    );
  }

  // Handle quiz retry
  React.useEffect(() => {
    if (quest && isRetry) {
      const setupQuiz = async () => {
        await resetQuiz(quest.id);
        await startQuiz(quest.id);
      };
      setupQuiz();
    }
  }, [quest, isRetry, resetQuiz, startQuiz]);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/quests')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quests
        </Button>
        
        {isRetry ? (
          <div className="mb-4 bg-accent p-3 rounded-lg">
            <p className="text-accent-foreground">Starting new quiz attempt...</p>
          </div>
        ) : null}
        
        <QuizQuest key={`${quest.id}-${isRetry ? 'retry' : 'initial'}`} quest={quest} />
      </div>
    </div>
  );
};

export default QuizDetail;