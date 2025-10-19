import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuest } from '@/contexts/QuestContext';

interface Position {
  lat: number;
  lng: number;
}

interface TutorialStep {
  title: string;
  description: string;
  action?: () => void;
  waitForAction?: boolean;
  completionCheck?: () => boolean;
}

export const useNavigoTutorial = (userPosition: Position | null = null, selectedQuest: any = null) => {
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);
  const { toast } = useToast();
  const { quests, userProgress } = useQuest();

  const location = useLocation();
  const navigate = useNavigate();

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Welcome to NAVIGO! 🎉",
      description: "Let's take a quick tour of how to use the app at Wits University. Click 'Next' to continue.",
    },
    {
      title: "Map & Quests �️",
      description: "The map shows all available quests on campus. Look for markers: 🟢 Completed, 🔵 In Progress, 🔴 Available.",
    },
    {
      title: "Quest Types 🎯",
      description: "There are Location quests (reach a spot) and Quiz quests (answer questions). Location quests complete automatically when you arrive!",
    },
    {
      title: "Quiz Quests 📝",
      description: "For quiz quests, take your time to answer carefully. Don't worry if you don't pass - you can always retry to improve your score!",
    },
    {
      title: "Navigation Tips 🧭",
      description: "Select a quest to see distance and directions. The app will guide you and notify when you're getting close!",
    },
    {
      title: "Help & Guides 💡",
      description: "Need help? Click the '?' button any time to view guides or restart this tutorial. You can find it in the bottom right corner.",
    },
    {
      title: "Points & Leaderboard 🏆",
      description: "Earn points by completing quests and quizzes. Check the leaderboard to see how you rank against other explorers!",
    }
  ];

  const startTutorial = () => {
    setTutorialActive(true);
    setCurrentStep(0);
    showCurrentStep();
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      showCurrentStep();
    } else {
      endTutorial();
    }
  };

  const showContextGuides = useCallback(() => {
    const pathname = location.pathname;
    const currentQuest = selectedQuest;
    const isInProgress = currentQuest && userProgress.inProgressQuests[currentQuest.id];
    const isCompleted = currentQuest && userProgress.completedQuests.includes(currentQuest.id);

    switch (pathname) {
      case '/map':
        if (currentQuest) {
          if (isCompleted) {
            toast({
              title: "Quest Completed! 🌟",
              description: "Try selecting another quest from the map or quest list to continue your adventure.",
              duration: 5000,
            });
          } else if (isInProgress) {
            toast({
              title: "Quest In Progress 🎯",
              description: "Follow the blue line on the map to reach your destination. The quest will complete automatically when you arrive!",
              duration: 5000,
            });
          } else {
            toast({
              title: "New Quest Selected 🗺️",
              description: "Click 'Start Quest' to begin this adventure. You'll see directions appear on the map.",
              duration: 5000,
            });
          }
        } else {
          toast({
            title: "Explore the Map! 🌍",
            description: "Click on any marker to view quest details. Red = Available, Blue = In Progress, Green = Completed.",
            duration: 5000,
          });
        }
        break;

      case '/quests':
        toast({
          title: "Quest List 📋",
          description: "Browse all available quests here. Filter by type or difficulty to find your next adventure!",
          duration: 5000,
        });
        break;

      case '/quests/${questId}':
        if (currentQuest?.type === "Quiz") {
          toast({
            title: "Quiz Time! 📝",
            description: "Take your time with the questions. You can retry the quiz if needed to improve your score.",
            duration: 5000,
          });
        }
        break;

      default:
        toast({
          title: "Need Help? 💡",
          description: "Click the tutorial button to learn how to use this page, or explore the map to find new quests!",
          duration: 5000,
        });
    }
  }, [location.pathname, selectedQuest, userProgress, toast]);

  const showCurrentStep = () => {
    const step = tutorialSteps[currentStep];
    
    // Execute step action if exists
    if (step.action) {
      step.action();
    }

    toast({
      title: step.title,
      description: step.description,
      action: currentStep < tutorialSteps.length - 1 ? (
        <button
          onClick={() => {
            if (step.waitForAction) {
              if (step.completionCheck && step.completionCheck()) {
                setStepCompleted(true);
                nextStep();
              } else {
                toast({
                  title: "Not quite there! 🎯",
                  description: "Complete the current step before moving on.",
                  duration: 3000,
                });
              }
            } else {
              nextStep();
            }
          }}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          {step.waitForAction ? "I've Done This" : "Next"}
        </button>
      ) : (
        <button
          onClick={endTutorial}
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Finish
        </button>
      ),
      duration: step.waitForAction ? 30000 : 10000,
    });
  };

  const endTutorial = () => {
    setTutorialActive(false);
    toast({
      title: "Tutorial Complete! 🎓",
      description: "You're ready to start exploring. Select a quest to begin!",
      duration: 5000,
    });
  };

  // Distance-based feedback
  useEffect(() => {
    if (!tutorialActive && userPosition && selectedQuest?.position) {
      const R = 6371000; // Earth's radius in meters
      const lat1 = userPosition.lat * Math.PI / 180;
      const lat2 = selectedQuest.position.lat * Math.PI / 180;
      const dLat = (selectedQuest.position.lat - userPosition.lat) * Math.PI / 180;
      const dLon = (selectedQuest.position.lng - userPosition.lng) * Math.PI / 180;
      
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      // Provide distance-based feedback
      if (distance <= 100 && distance > 50) {
        toast({
          title: "Getting Close! 🎯",
          description: "You're about 100 meters from your destination!",
          duration: 3000,
        });
      } else if (distance <= 50 && distance > 20) {
        toast({
          title: "Almost There! 🏃",
          description: "Just a few more steps!",
          duration: 3000,
        });
      }
    }
  }, [userPosition, selectedQuest, tutorialActive, toast]);

  // Monitor user progress through tutorial steps
  useEffect(() => {
    if (tutorialActive) {
      const activeStep = tutorialSteps[currentStep];
      if (activeStep?.waitForAction && activeStep?.completionCheck) {
        const checkInterval = setInterval(() => {
          if (activeStep.completionCheck!()) {
            setStepCompleted(true);
            nextStep();
            clearInterval(checkInterval);
          }
        }, 1000);

        return () => clearInterval(checkInterval);
      }
    }
  }, [tutorialActive, currentStep, nextStep, tutorialSteps]);

  return {
    startTutorial,
    tutorialActive,
    currentStep,
    nextStep,
    endTutorial,
    showContextGuides,
    stepCompleted,
  };
};