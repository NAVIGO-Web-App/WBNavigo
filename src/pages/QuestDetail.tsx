import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import { useQuest } from '@/contexts/QuestContext';

const QuestDetail: React.FC = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const { quests, userProgress, startQuest, completeLocationQuest, submitQuizAnswers, refreshQuests } = useQuest();
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResult, setShowQuizResult] = useState<boolean | null>(null);

  const quest = quests.find(q => q.id === questId);
  const isCompleted = userProgress.completedQuests.includes(questId || '');
  const isInProgress = questId ? userProgress.inProgressQuests[questId] : false;

  useEffect(() => {
    // Get user location for location-based quests
    if (navigator.geolocation && quest?.type === "Location") {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPosition({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          });
        },
        (err) => {
          console.error('Error getting location:', err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [quest?.type]);

  useEffect(() => {
    if (questId && !quest) {
      refreshQuests();
    }
  }, [questId, quest]);

  // Auto-complete location quests when user is close enough
  useEffect(() => {
    if (quest?.type === "Location" && userPosition && isInProgress && !isCompleted) {
      const isAtLocation = completeLocationQuest(questId!, userPosition);
      if (isAtLocation) {
        handleCompleteQuest();
      }
    }
  }, [userPosition, quest?.type, isInProgress, isCompleted]);

  const handleStartQuest = async () => {
    if (questId) {
      await startQuest(questId);
    }
  };

  const handleCompleteQuest = async () => {
    if (questId) {
      // For quiz quests, completion is handled in submitQuiz
      if (quest?.type === "Location") {
        // Location quests are completed automatically above
      }
    }
  };

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = async () => {
    if (!questId || !quest?.quizQuestions) return;

    const success = await submitQuizAnswers(questId, quizAnswers);
    setShowQuizResult(success);

    if (success) {
      setTimeout(() => {
        navigate('/quests');
      }, 2000);
    }
  };

  if (!quest) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Quest not found</h1>
            <Button onClick={() => navigate('/quests')} className="mt-4">
              Back to Quests
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500";
      case "Medium": return "bg-yellow-500";
      case "Hard": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const isQuizComplete = quest.quizQuestions && 
    quizAnswers.length === quest.quizQuestions.length &&
    quizAnswers.every(answer => answer !== undefined);

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 text-foreground dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/quests')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quests
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{quest.title}</h1>
            <p className="text-muted-foreground">{quest.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {quest.type === "Location" ? (
                    <MapPin className="w-6 h-6 text-primary" />
                  ) : (
                    <HelpCircle className="w-6 h-6 text-primary" />
                  )}
                  <span>Quest Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{quest.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p>{quest.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Points:</span>
                    <p>{quest.points}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated Time:</span>
                    <p>{quest.estimatedTime}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{quest.type}</Badge>
                  </div>
                </div>

                {/* Location Quest Instructions */}
                {quest.type === "Location" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>Location Quest</span>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isCompleted 
                        ? "✅ Quest completed! You successfully reached the location."
                        : isInProgress
                        ? "📍 Go to the marked location on the map. This quest will complete automatically when you're within 50 meters."
                        : "Start the quest and go to the location shown on the map."
                      }
                    </p>
                  </div>
                )}

                {/* Quiz Quest */}
                {quest.type === "Challenge" && quest.quizQuestions && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4" />
                        <span>Quiz Challenge</span>
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Answer all questions correctly to complete this quest.
                      </p>
                    </div>

                    {quest.quizQuestions.map((question, qIndex) => (
                      <div key={question.id} className="space-y-2">
                        <h4 className="font-medium">{qIndex + 1}. {question.question}</h4>
                        <div className="space-y-1">
                          {question.options.map((option, oIndex) => (
                            <Button
                              key={oIndex}
                              variant={quizAnswers[qIndex] === oIndex ? "default" : "outline"}
                              className="w-full justify-start"
                              onClick={() => handleQuizAnswer(qIndex, oIndex)}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {!isCompleted && (
                      <Button 
                        onClick={submitQuiz} 
                        disabled={!isQuizComplete}
                        className="w-full"
                      >
                        Submit Answers
                      </Button>
                    )}

                    {showQuizResult !== null && (
                      <div className={`flex items-center space-x-2 p-3 rounded ${
                        showQuizResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {showQuizResult ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>
                          {showQuizResult 
                            ? 'All answers correct! Quest completed.' 
                            : 'Some answers are incorrect. Please try again.'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Start/Continue Button */}
                {!isInProgress && !isCompleted && (
                  <Button onClick={handleStartQuest} className="w-full" size="lg">
                    Start Quest
                  </Button>
                )}

                {/* Quest Completed */}
                {isCompleted && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                    <div className="text-green-600 dark:text-green-400 text-6xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold mb-2">Quest Completed!</h3>
                    <p className="text-muted-foreground mb-4">
                      You've earned {quest.points} points!
                    </p>
                    <Button onClick={() => navigate('/quests')}>
                      Back to Quests
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quest Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <Badge className={getDifficultyColor(quest.difficulty)}>
                    {quest.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={
                    isCompleted ? "bg-green-100 text-green-800" :
                    isInProgress ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Available"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points</span>
                  <span className="text-sm font-medium">{quest.points}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="text-sm">{quest.estimatedTime}</span>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {quest.requirements && quest.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {quest.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestDetail;