import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuest } from '@/contexts/QuestContext';
import { Quest } from '@/types/quest';
import { CheckCircle, XCircle, Star, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuizResultsProps {
  quest: Quest;
}

const QuizResults: React.FC<QuizResultsProps> = ({ quest }) => {
  // All hooks must be called unconditionally first
  const { getQuizResults, resetQuiz, userProgress } = useQuest();
  const navigate = useNavigate();
  const [results, setResults] = useState(() => getQuizResults(quest.id));
  const [isRetrying, setIsRetrying] = useState(false);

  // Update results when quest changes
  useEffect(() => {
    setResults(getQuizResults(quest.id));
  }, [quest.id, getQuizResults]);

  // 🚨 Handle retry quiz
  const handleRetry = () => {
    setIsRetrying(true);
    resetQuiz(quest.id);
    // The quiz will be re-initialized when we navigate back
    setTimeout(() => {
      setIsRetrying(false);
    }, 100);
  };

  // 🚨 Handle back to quests - MANUAL NAVIGATION ONLY
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
          ) : (
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          )}
        </div>
        <CardTitle className="mt-4">
          {results.passed ? 'Quiz Completed!' : 'Quiz Failed'}
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

        {isPerfectScore && (
          <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <Star className="w-5 h-5" />
            <span className="font-semibold">Perfect Score! Amazing! 🌟</span>
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
                You need {quest.passingScore || 70}% to pass.
              </div>
              {quest.allowRetries && (
                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full"
                    disabled={isRetrying}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isRetrying ? 'Resetting...' : 'Retry Quiz'}
                  </Button>
                  <Button
                    onClick={handleBackToQuests}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Quests
                  </Button>
                </div>
              )}
              {!quest.allowRetries && (
                <Button
                  onClick={handleBackToQuests}
                  className="w-full"
                >
                  Back to Quests
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Time spent information */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-muted-foreground">
            Time spent: {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizResults;