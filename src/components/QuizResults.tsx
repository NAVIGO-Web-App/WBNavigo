import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuest } from '@/contexts/QuestContext';
import { Quest } from '@/types/quest';
import { CheckCircle, XCircle, Star, RotateCcw, ArrowLeft, Info, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface QuizResultsProps {
  quest: Quest;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quest }) => {
  // All hooks must be called unconditionally first
  const { getQuizResults, resetQuiz, userProgress, startQuiz } = useQuest();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [results, setResults] = useState(() => getQuizResults(quest.id));
  const [isRetrying, setIsRetrying] = useState(false);

  // 🚨 Get retry count and check if user can retry
  const progress = userProgress.quizProgress?.[quest.id];
  const retryCount = progress?.retryCount || 0;
  const maxRetries = quest.allowRetries ? 1 : 0;
  const canRetry = retryCount < maxRetries;
  
  // 🚨 Check if quest is completed (either passed or failed with no retries)
  const isQuestCompleted = userProgress.completedQuests.includes(quest.id);
  const isFailedFinal = !results?.passed && isQuestCompleted;

  // Update results when quest changes
  useEffect(() => {
    setResults(getQuizResults(quest.id));
  }, [quest.id, getQuizResults, userProgress.completedQuests]); // 🚨 Added dependency

  // Enhanced retry handling
  const handleRetry = async () => {
    if (!canRetry || isQuestCompleted) return;
    
    console.log('🔄 Starting quiz retry...');
    setIsRetrying(true);
    
    try {
      // Reset the quiz state
      await resetQuiz(quest.id);
      
      // Start a new quiz
      await startQuiz(quest.id);
      
      // Clear previous results from state
      setResults(null);
      
      // Force immediate re-render for quiz components
      window.dispatchEvent(new CustomEvent('quizRetry', { 
        detail: { 
          questId: quest.id,
          timestamp: Date.now() 
        } 
      }));
      
      // Navigate to the quiz page to ensure fresh state
      navigate(`/quests/${quest.id}?retry=true&t=${Date.now()}`);
    } catch (error) {
      console.error('Failed to retry quiz:', error);
      toast({
        title: "Error",
        description: "Failed to start quiz retry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // 🚨 Handle back to quests
  const handleBackToQuests = () => {
    navigate('/quests');
  };

  // 🚨 Conditional returns must come AFTER all hooks
  if (!results) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading results...</p>
          <Button 
            onClick={handleBackToQuests}
            variant="outline" 
            className="mt-4"
          >
            Back to Quests
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPerfectScore = results.correctAnswers === results.totalQuestions;

  // Use rewardPoints instead of points, with fallback
  const questPoints = quest.rewardPoints || quest.points || 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
          results.passed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
        }`}>
          {results.passed ? (
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          ) : isFailedFinal ? (
            <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <CardTitle className="mt-4">
          {results.passed ? 'Quiz Completed!' : 
           isFailedFinal ? 'Quest Completed (Failed)' : 'Quiz Failed'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 text-center">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{results.correctAnswers}/{results.totalQuestions}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{Math.round(results.score)}%</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
        </div>

        {results.passed && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-green-700 dark:text-green-300 font-semibold">
              🎉 You earned {questPoints} points!
            </div>
          </div>
        )}

        {isFailedFinal && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-orange-700 dark:text-orange-300 font-semibold">
              ⚠️ Quest marked as completed. No retries remaining.
            </div>
          </div>
        )}

        {isPerfectScore && (
          <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Star className="w-5 h-5" />
            <span className="font-semibold">Perfect Score! Amazing! 🌟</span>
          </div>
        )}

        {/* 🚨 Retry count display */}
        {quest.allowRetries && !results.passed && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-blue-700 dark:text-blue-300 text-sm">
              <strong>Retries:</strong> {retryCount} used of {maxRetries} available
              {!canRetry && (
                <div className={`mt-1 font-semibold ${
                  isFailedFinal ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isFailedFinal ? '🔒 Quest completed - no retries' : '❌ No retries left'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-4 space-y-3">
          {results.passed ? (
            <div className="space-y-3">
              <div className="text-green-600 dark:text-green-400 font-semibold">
                Congratulations! You passed the quiz.
              </div>
              <Button
                onClick={handleBackToQuests}
                className="w-full"
              >
                Back to Quests
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                You need {quest.passingScore || 70}% to pass. Your score: {Math.round(results.score)}%
              </div>
              
              {/* 🚨 UPDATED: Retry logic - goes directly to quiz */}
              {quest.allowRetries && !isFailedFinal ? (
                <div className="space-y-2">
                  {canRetry ? (
                    <>
                      <Button
                        onClick={handleRetry}
                        variant="default"
                        className="w-full"
                        disabled={isRetrying}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {isRetrying ? "Starting Quiz..." : `Retry Quiz Now (${maxRetries - retryCount} left)`}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Click to restart the quiz with new questions
                      </p>
                      <Button
                        onClick={handleBackToQuests}
                        variant="outline"
                        className="w-full"
                      >
                        Back to Quests
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <strong>No retries remaining!</strong> Quest will be marked as completed.
                      </div>
                      <Button
                        onClick={handleBackToQuests}
                        className="w-full"
                      >
                        Back to Quests
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {isFailedFinal && (
                    <div className="text-sm text-orange-600 dark:text-orange-400 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <strong>Quest Completed</strong> - You've used all retry attempts. Better luck next time!
                    </div>
                  )}
                  <Button
                    onClick={handleBackToQuests}
                    className="w-full"
                  >
                    Back to Quests
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time spent information */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-muted-foreground">
            {/* 🚨 FIX: Safe time display with fallback */}
            {results.timeSpent && !isNaN(results.timeSpent) ? (
              `Time spent: ${Math.floor(results.timeSpent / 60)}m ${results.timeSpent % 60}s`
            ) : (
              "Time spent: Not available"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizResults;