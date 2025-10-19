import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuest } from '@/contexts/QuestContext';
import { Quest } from '@/types/quest';
import QuestionDisplay from './QuestionDisplay';
import QuizResults from './QuizResults';
import { useNavigate } from 'react-router-dom';

interface QuizQuestProps {
  quest: Quest;
}

const QuizQuest: React.FC<QuizQuestProps> = ({ quest }) => {
  const { 
    quizProgress, 
    submitQuizAnswer, 
    completeQuiz, 
    startQuiz,
    activeQuiz,
    userProgress
  } = useQuest();
  
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [completionHandled, setCompletionHandled] = useState(false);
  const [shouldShowResults, setShouldShowResults] = useState(false);
  const [retryTriggered, setRetryTriggered] = useState(false); // 🚨 NEW: Track retry state

  // Handle both 'questions' and 'quizQuestions' field names
  const questions = quest.questions || (quest as any).quizQuestions || [];
  const hasQuestions = questions.length > 0;

  // Get progress from the correct location
  const progress = quizProgress?.[quest.id];

  console.log('🔍 Quiz Debug:', {
    questId: quest.id,
    hasQuestions,
    questionsCount: questions.length,
    progress: progress,
    activeQuiz: activeQuiz,
    isInitialized: isInitialized,
    completionHandled: completionHandled,
    shouldShowResults: shouldShowResults,
    retryTriggered: retryTriggered, // 🚨 NEW
    questCompleted: userProgress.completedQuests.includes(quest.id)
  });

  // 🚨 UPDATED: Initialize quiz with retry state handling
  useEffect(() => {
    if (hasQuestions && !progress && !isInitialized && !userProgress.completedQuests.includes(quest.id)) {
      console.log('🚀 Starting quiz initialization...');
      startQuiz(quest.id);
      setIsInitialized(true);
      setRetryTriggered(false); // 🚨 Reset retry state
    }
  }, [quest.id, progress, startQuiz, hasQuestions, isInitialized, userProgress.completedQuests]);

  // 🚨 UPDATED: Reset initialization when quest changes or retry is triggered
  useEffect(() => {
    setIsInitialized(false);
    setCompletionHandled(false);
    setShouldShowResults(false);
    setRetryTriggered(false);
  }, [quest.id]);

  // 🚨 UPDATED: Handle completion state with retry consideration
  useEffect(() => {
    // If retry was just triggered, don't show results
    if (retryTriggered) {
      console.log('🔄 Retry triggered, hiding results');
      setShouldShowResults(false);
      setCompletionHandled(false);
      return;
    }

    // Check if quest is completed in userProgress OR if progress is marked completed
    const isQuestCompleted = userProgress.completedQuests.includes(quest.id);
    const isProgressCompleted = progress?.completed;
    
    // Additional check: if we're submitting and have completionHandled, consider it completed
    const shouldShow = isQuestCompleted || isProgressCompleted || (isSubmitting && completionHandled);
    
    if (shouldShow && !shouldShowResults) {
      console.log('✅ Quiz completed detected', { 
        questCompleted: isQuestCompleted, 
        progressCompleted: isProgressCompleted,
        isSubmitting,
        completionHandled,
        retryTriggered
      });
      setShouldShowResults(true);
      setCompletionHandled(true);
    }
  }, [progress?.completed, completionHandled, userProgress.completedQuests, quest.id, isSubmitting, shouldShowResults, retryTriggered]);

  // 🚨 NEW: Listen for retry state changes
  useEffect(() => {
    if (progress && retryTriggered) {
      console.log('🔄 Retry progress detected, resetting retry state');
      setRetryTriggered(false);
      setShouldShowResults(false);
      setCompletionHandled(false);
    }
  }, [progress, retryTriggered]);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (!progress || progress.completed || userProgress.completedQuests.includes(quest.id)) {
      console.log('⏹️ Quiz completed, ignoring answer selection');
      return;
    }
    
    const currentQuestionIndex = progress.currentQuestion !== undefined 
      ? Math.min(progress.currentQuestion, questions.length - 1)
      : 0;

    console.log('✅ Answer selected:', { questionIndex: currentQuestionIndex, answerIndex });
    submitQuizAnswer(quest.id, currentQuestionIndex, answerIndex);
  }, [quest.id, progress, questions.length, submitQuizAnswer, userProgress.completedQuests]);

  const handleComplete = useCallback(async () => {
    if (isSubmitting || completionHandled || !progress || userProgress.completedQuests.includes(quest.id)) {
      console.log('⏹️ Already submitting or completed, skipping...');
      return;
    }

    console.log('🎯 Completing quiz...');
    setIsSubmitting(true);
    
    try {
      const success = await completeQuiz(quest.id);
      console.log('📊 Quiz completion result:', success);
      
      if (success) {
        console.log('✅ Quiz completed successfully');
        setShouldShowResults(true);
        setCompletionHandled(true);
      } else {
        console.log('❌ Quiz completion failed');
        // 🚨 FIXED: Even if failed, show results if no retries left
        const retryCount = progress.retryCount || 0;
        const maxRetries = quest.allowRetries ? 1 : 0;
        const hasRetriesLeft = retryCount < maxRetries;
        
        if (!hasRetriesLeft) {
          console.log('🔒 No retries left, showing results');
          setShouldShowResults(true);
          setCompletionHandled(true);
        }
      }
    } catch (error) {
      console.error('❌ Error completing quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [quest.id, completeQuiz, isSubmitting, completionHandled, progress, userProgress.completedQuests, quest.allowRetries]);

  // 🚨 UPDATED: Show results only when not in retry state
  if ((shouldShowResults || userProgress.completedQuests.includes(quest.id)) && !retryTriggered) {
    return <QuizResults quest={quest} />;
  }

  if (!hasQuestions) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No questions available for this quiz.</p>
          <Button 
            onClick={() => navigate('/quests')} 
            className="mt-4"
            variant="outline"
          >
            Back to Quests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 🚨 UPDATED: Better loading state that handles retry
  if (!progress || progress.currentQuestion === undefined) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{retryTriggered ? 'Resetting quiz...' : 'Creating quiz session...'}</p>
          <Button 
            onClick={() => navigate('/quests')} 
            className="mt-4"
            variant="outline"
          >
            Back to Quests
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Safe current question access
  const currentQuestionIndex = progress.currentQuestion !== undefined 
    ? Math.min(progress.currentQuestion, questions.length - 1)
    : 0;
  
  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Error: Question data not available.</p>
          <Button 
            onClick={() => navigate('/quests')} 
            className="mt-4"
            variant="outline"
          >
            Back to Quests
          </Button>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = progress.answers?.[currentQuestionIndex] ?? -1;
  const allQuestionsAnswered = progress.answers?.every(answer => answer !== -1) ?? false;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{quest.title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </CardTitle>
        <Progress value={progressPercentage} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          selectedAnswer={currentAnswer}
          onAnswerSelect={handleAnswerSelect}
        />
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleComplete}
              disabled={!allQuestionsAnswered || isSubmitting || completionHandled || userProgress.completedQuests.includes(quest.id)}
            >
              {isSubmitting ? "Submitting..." : 
               completionHandled ? "Completed!" : 
               userProgress.completedQuests.includes(quest.id) ? "Already Completed" : 
               "Complete Quiz"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Auto-advance to next question when answer is selected
                if (currentAnswer !== -1) {
                  const nextQuestionIndex = Math.min(currentQuestionIndex + 1, questions.length - 1);
                  // This will be handled by the answer selection
                }
              }}
              disabled={currentAnswer === -1}
            >
              Next Question
            </Button>
          )}
        </div>

        {/* Debug info */}
        <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
          <strong>Quiz Status:</strong><br/>
          - Current Question: {currentQuestionIndex + 1}<br/>
          - Answer Selected: {currentAnswer !== -1 ? 'Yes' : 'No'}<br/>
          - All Answered: {allQuestionsAnswered ? 'Yes' : 'No'}<br/>
          - Submitting: {isSubmitting ? 'Yes' : 'No'}<br/>
          - Completion Handled: {completionHandled ? 'Yes' : 'No'}<br/>
          - Show Results: {shouldShowResults ? 'Yes' : 'No'}<br/>
          - Quest Completed: {userProgress.completedQuests.includes(quest.id) ? 'Yes' : 'No'}<br/>
          - Retry Count: {progress.retryCount || 0}<br/>
          - Retry Triggered: {retryTriggered ? 'Yes' : 'No'} {/* 🚨 NEW */}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizQuest;