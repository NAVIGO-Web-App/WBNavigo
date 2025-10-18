import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, Timestamp, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "react-toastify";
// IMPORT FROM SHARED TYPES
import { 
  Quest, 
  QuizQuestion, 
  QuizProgress, 
  QuizResults, 
  QuestType, 
  QuestStatus, 
  QuestDifficulty 
} from '@/types/quest';

// KEEP ONLY the context-specific interfaces
export interface ActiveQuest {
  questId: string;
  startedAt: Date;
  lastActivity: Date;
  status: "active" | "paused";
  progress?: any;
}

// Separate interfaces for Firestore data and App data
interface Collectible {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  difficulty: string;
  obtainedAt?: Date;
  questId?: string;
}

export interface FirestoreUserProgress {
  completedQuests: string[];
  inProgressQuests: {
    [questId: string]: {
      startedAt: Timestamp | Date;
      quizAnswers?: number[];
      quizProgress?: QuizProgress;
      paused?: boolean;
    };
  };
  activeQuestId?: string | null;
  totalPoints: number;
  completedQuestDetails?: {
    [questId: string]: {
      points: number;
      completedAt: Date;
      title: string;
    };
  };
  collectibles?: Collectible[];
  quizProgress?: {
    [questId: string]: QuizProgress;
  };
}

export interface AppUserProgress {
  completedQuests: string[];
  inProgressQuests: {
    [questId: string]: {
      startedAt: Date;
      quizAnswers?: number[];
      quizProgress?: QuizProgress;
      paused?: boolean;
      // 🚨 NEW: Track location and quiz completion separately
      locationCompleted?: boolean;
      quizCompleted?: boolean;
    };
  };
  activeQuestId?: string | null;
  totalPoints: number;
  completedQuestDetails?: {
    [questId: string]: {
      points: number;
      completedAt: Date;
      title: string;
    };
  };
  collectibles?: Collectible[];
  quizProgress?: {
    [questId: string]: QuizProgress;
  };
}

interface QuestContextType {
  quests: Quest[];
  userProgress: AppUserProgress;
  activeQuest: ActiveQuest | null;
  loading: boolean;
  startQuest: (questId: string) => Promise<{ success: boolean; action: 'map' | 'quiz' | 'none' }>; // 🚨 Updated return type
  setActiveQuest: (questId: string | null) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  completeLocationQuest: (questId: string, userPosition: { lat: number; lng: number }) => boolean;
  submitQuizAnswers: (questId: string, answers: number[]) => Promise<boolean>;
  refreshQuests: () => Promise<void>;
  canStartQuest: (questId: string) => boolean;
  checkAbandonment: () => boolean;
  updateLastActivity: () => void;
  calculateTotalPoints: () => number;
  quizProgress?: {
    [questId: string]: QuizProgress;
  };
  
  // QUIZ METHODS
  startQuiz: (questId: string) => void;
  submitQuizAnswer: (questId: string, questionIndex: number, answerIndex: number) => void;
  completeQuiz: (questId: string) => Promise<boolean>;
  resetQuiz: (questId: string) => void;
  getQuizResults: (questId: string) => QuizResults | null;
  activeQuiz: string | null;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

// Helper function to convert Firestore data to app data
const convertFromFirestore = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  
  if (Array.isArray(data)) {
    return data.map(convertFromFirestore);
  }
  
  if (data && typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      result[key] = convertFromFirestore(data[key]);
    }
    return result;
  }
  
  return data;
};

// Helper function to convert app data to Firestore data
const convertToFirestoreData = (data: any): any => {
  if (data instanceof Date) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(convertToFirestoreData);
  }
  
  if (data && typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      if (data[key] !== undefined && data[key] !== null) {
        result[key] = convertToFirestoreData(data[key]);
      }
    }
    return result;
  }
  
  return data;
};

// Convert FirestoreUserProgress to AppUserProgress
const convertToAppUserProgress = (firestoreProgress: FirestoreUserProgress): AppUserProgress => {
  return {
    completedQuests: firestoreProgress.completedQuests || [],
    activeQuestId: firestoreProgress.activeQuestId || null,
    totalPoints: firestoreProgress.totalPoints || 0,
    completedQuestDetails: firestoreProgress.completedQuestDetails || {},
    collectibles: firestoreProgress.collectibles || [],
    quizProgress: firestoreProgress.quizProgress || {},
    inProgressQuests: Object.fromEntries(
      Object.entries(firestoreProgress.inProgressQuests || {}).map(([questId, progress]) => [
        questId,
        {
          ...progress,
          startedAt: progress.startedAt instanceof Timestamp ? progress.startedAt.toDate() : progress.startedAt
        }
      ])
    )
  };
};

export const QuestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userProgress, setUserProgress] = useState<AppUserProgress>({
    completedQuests: [],
    inProgressQuests: {},
    activeQuestId: null,
    totalPoints: 0,
    completedQuestDetails: {},
    collectibles: [],
    quizProgress: {}
  });
  const [activeQuest, setActiveQuestState] = useState<ActiveQuest | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const COMPLETION_RADIUS = 50;
  const ABANDONMENT_TIMEOUT = 15 * 60 * 1000;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Function to calculate total points from completed quests
  const calculateTotalPoints = useCallback((): number => {
    return userProgress.completedQuests.reduce((total, questId) => {
      const quest = quests.find(q => q.id === questId);
      return total + (quest?.rewardPoints || quest?.points || 0);
    }, 0);
  }, [userProgress.completedQuests, quests]);

  const parseQuestData = (doc: any, data: any, currentUserProgress: AppUserProgress): Quest => {
    // Handle both nested position and flat position data
    let position = { lat: -26.1915, lng: 28.0309 }; // Default center
    
    if (data.position) {
      position = data.position;
    } else if (data.lat !== undefined && data.lng !== undefined) {
      position = { lat: data.lat, lng: data.lng };
    }
    
    // Helper to capitalize first letter
    const capitalizeFirst = (str: string) => 
      str ? str.charAt(0).toUpperCase() + str.slice(1) : "Unknown";

    // Calculate status
    let status: QuestStatus = "active";
    const locationCompleted = currentUserProgress.inProgressQuests[doc.id]?.locationCompleted;
    
    if (currentUserProgress.completedQuests.includes(doc.id)) {
      status = "completed";
    } else if (locationCompleted && data.questions && data.questions.length > 0) {
      // 🚨 NEW: Location completed but quiz not taken yet
      status = "in-progress";
    } else if (currentUserProgress.inProgressQuests[doc.id]) {
      status = "in-progress";
    }
    

    // 🚨 FIX: Handle both 'quizQuestions' and 'questions' field names
    const questions = data.questions || data.quizQuestions || [];

    // Build the quest object with ALL required properties
    const quest: Quest = {
      id: doc.id,
      title: data.title || "Untitled Quest",
      description: data.description || "",
      building: data.building || "Unknown Building",
      rewardPoints: data.rewardPoints || data.points || 0,
      status: status,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      type: capitalizeFirst(data.type) as QuestType || "Location",
      difficulty: capitalizeFirst(data.difficulty) as QuestDifficulty || "Medium",
      estimatedTime: data.estimatedTime || "30 min",
      location: data.location || "Unknown Location",
      requirements: data.requirements || [],
      requiredQuests: data.requiredQuests || [],
      position: position,
      questions: questions, // 🚨 Now handles both field names
      passingScore: data.passingScore || 70,
      allowRetries: data.allowRetries !== undefined ? data.allowRetries : true,
      shuffleQuestions: data.shuffleQuestions !== undefined ? data.shuffleQuestions : false,
      points: data.points || data.rewardPoints || 0
    };

    return quest;
  };

  const canStartQuest = (questId: string): boolean => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return false;

    // Don't allow starting completed quests
    if (userProgress.completedQuests.includes(questId)) {
      return false;
    }

    if (quest.requiredQuests && quest.requiredQuests.length > 0) {
      const allRequiredCompleted = quest.requiredQuests.every(requiredId =>
        userProgress.completedQuests.includes(requiredId)
      );
      if (!allRequiredCompleted) return false;
    }

    return true;
  };

  // Quiz Methods
  const startQuiz = (questId: string) => {
    console.log('startQuiz called for:', questId);
    
    const quest = quests.find(q => q.id === questId);
    const questions = quest?.questions || (quest as any)?.quizQuestions || [];
    
    if (questions.length === 0) {
      console.error('No questions found for quiz:', questId);
      return;
    }

    const newProgress: QuizProgress = {
      questId,
      currentQuestion: 0,
      answers: new Array(questions.length).fill(-1),
      score: 0,
      completed: false,
      startedAt: new Date(),
      timeSpent: 0
    };

    console.log('Creating quiz progress:', newProgress);

    setUserProgress(prev => ({
      ...prev,
      quizProgress: {
        ...prev.quizProgress,
        [questId]: newProgress
      }
    }));
    
    setActiveQuiz(questId);
    console.log('Quiz started successfully for:', questId);
  };

  const submitQuizAnswer = (questId: string, questionIndex: number, answerIndex: number) => {
    setUserProgress(prev => {
      const progress = prev.quizProgress?.[questId];
      if (!progress || progress.completed) return prev;

      const newAnswers = [...progress.answers];
      newAnswers[questionIndex] = answerIndex;

      // Calculate new score
      const quest = quests.find(q => q.id === questId);
      let newScore = 0;
      if (quest?.questions) {
        quest.questions.forEach((question, idx) => {
          if (newAnswers[idx] === question.correctAnswer) {
            newScore += question.points || 1;
          }
        });
      }

      // 🚨 FIX: Only advance to next question if it exists
      const questions = quest?.questions || [];
      const nextQuestionIndex = questionIndex + 1;
      const shouldAdvance = nextQuestionIndex < questions.length;

      const newProgress: QuizProgress = {
        ...progress,
        answers: newAnswers,
        score: newScore,
        // 🚨 FIX: Don't advance beyond last question
        currentQuestion: shouldAdvance ? nextQuestionIndex : questionIndex,
        timeSpent: Math.floor((Date.now() - progress.startedAt.getTime()) / 1000)
      };

      return {
        ...prev,
        quizProgress: {
          ...prev.quizProgress,
          [questId]: newProgress
        }
      };
    });
  };

  const completeQuiz = async (questId: string): Promise<boolean> => {
    const progress = userProgress.quizProgress?.[questId];
    const quest = quests.find(q => q.id === questId);
    
    if (!progress || !quest?.questions) return false;

    const totalQuestions = quest.questions.length;
    const correctAnswers = progress.answers.reduce((count, answer, index) => {
      return count + (answer === quest.questions![index].correctAnswer ? 1 : 0);
    }, 0);
    
    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    const passingScore = quest.passingScore || 70;
    const passed = scorePercentage >= passingScore;

    // Update progress as completed
    setUserProgress(prev => ({
      ...prev,
      quizProgress: {
        ...prev.quizProgress,
        [questId]: {
          ...prev.quizProgress![questId],
          completed: true,
          score: scorePercentage,
          timeSpent: Math.floor((Date.now() - progress.startedAt.getTime()) / 1000)
        }
      }
    }));

    setActiveQuiz(null);

    // If passed, complete the quest (both location and quiz requirements are met)
    if (passed) {
      await completeQuest(questId);
      return true;
    }

    return false;
  };

  const resetQuiz = (questId: string) => {
    setUserProgress(prev => {
      const newQuizProgress = { ...prev.quizProgress };
      delete newQuizProgress[questId];
      
      return {
        ...prev,
        quizProgress: newQuizProgress
      };
    });
    setActiveQuiz(null);
  };

  const getQuizResults = (questId: string): QuizResults | null => {
    const progress = userProgress.quizProgress?.[questId];
    const quest = quests.find(q => q.id === questId);
    
    if (!progress || !quest?.questions) return null;

    const totalQuestions = quest.questions.length;
    const correctAnswers = progress.answers.reduce((count, answer, index) => {
      return count + (answer === quest.questions![index].correctAnswer ? 1 : 0);
    }, 0);
    
    const scorePercentage = (correctAnswers / totalQuestions) * 100;
    const passingScore = quest.passingScore || 70;

    return {
      score: scorePercentage,
      totalQuestions,
      correctAnswers,
      timeSpent: progress.timeSpent,
      passed: scorePercentage >= passingScore
    };
  };

  const refreshQuests = async () => {
    try {
      setLoading(true);
      
      // Load user progress FIRST
      let userProgressData: AppUserProgress = {
        completedQuests: [],
        inProgressQuests: {},
        activeQuestId: null,
        totalPoints: 0,
        completedQuestDetails: {},
        quizProgress: {}
      };

      if (user) {
        const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
        if (progressDoc.exists()) {
          const firestoreData = progressDoc.data() as FirestoreUserProgress;
          userProgressData = convertToAppUserProgress(firestoreData);
          
          // Calculate points if not present in Firestore
          if (userProgressData.totalPoints === undefined || userProgressData.totalPoints === null) {
            userProgressData.totalPoints = 0;
          }
          
          setUserProgress(userProgressData);
          
          if (userProgressData.activeQuestId && userProgressData.inProgressQuests[userProgressData.activeQuestId]) {
            const questProgress = userProgressData.inProgressQuests[userProgressData.activeQuestId];
            setActiveQuestState({
              questId: userProgressData.activeQuestId,
              startedAt: questProgress.startedAt,
              lastActivity: new Date(),
              status: questProgress.paused ? "paused" : "active"
            });
          }
        } else {
          // Initialize with points field
          const initialProgress: AppUserProgress = {
            completedQuests: [],
            inProgressQuests: {},
            activeQuestId: null,
            totalPoints: 0,
            completedQuestDetails: {},
            quizProgress: {}
          };
          await setDoc(doc(db, 'userProgress', user.uid), initialProgress);
          setUserProgress(initialProgress);
          userProgressData = initialProgress;
        }
      }

      // Now load quests with the user progress data
      const snapshot = await getDocs(collection(db, 'quests'));
      console.log("🔍 Firestore quests snapshot:", snapshot.docs.length, "documents");
      
      const questsData: Quest[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return parseQuestData(doc, data, userProgressData);
      });

      // 🚨 FIX: Ensure quest statuses are properly set based on user progress
      const updatedQuests = questsData.map(quest => {
        // If quest is in completedQuests, ensure status is "completed"
        if (userProgressData.completedQuests.includes(quest.id)) {
          return { ...quest, status: "completed" as QuestStatus };
        }
        // If quest is in inProgressQuests, ensure status is "in-progress"
        if (userProgressData.inProgressQuests[quest.id]) {
          return { ...quest, status: "in-progress" as QuestStatus };
        }
        return quest;
      });

      setQuests(updatedQuests);

      // Calculate total points based on completed quests
      if (userProgressData.totalPoints === 0) {
        const calculatedPoints = userProgressData.completedQuests.reduce((total, questId) => {
          const quest = updatedQuests.find(q => q.id === questId);
          return total + (quest?.rewardPoints || quest?.points || 0);
        }, 0);
        userProgressData.totalPoints = calculatedPoints;
        
        // Update user progress with calculated points
        if (user && calculatedPoints > 0) {
          await updateDoc(doc(db, 'userProgress', user.uid), {
            totalPoints: calculatedPoints
          });
        }
        setUserProgress(userProgressData);
      }

      console.log("💰 Points Summary:");
      console.log("- Completed quests:", userProgressData.completedQuests.length);
      console.log("- Current total points:", userProgressData.totalPoints);
      
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshQuests();
  }, [user]);

  const setActiveQuest = async (questId: string | null): Promise<void> => {
    if (!user) return;

    try {
      // Don't allow setting active quest for completed quests
      if (questId && userProgress.completedQuests.includes(questId)) {
        console.log("Cannot set active quest - quest already completed:", questId);
        return;
      }

      let updatedProgress: AppUserProgress;

      if (questId === null) {
        // Clear active quest
        updatedProgress = {
          ...userProgress,
          activeQuestId: null
        };
      } else {
        // Set new active quest
        updatedProgress = {
          ...userProgress,
          activeQuestId: questId,
          inProgressQuests: {
            ...userProgress.inProgressQuests,
            [questId]: {
              startedAt: new Date(),
              paused: false
            }
          }
        };
      }

      // Convert to Firestore-safe data
      const firestoreData = convertToFirestoreData(updatedProgress);
      
      await updateDoc(doc(db, 'userProgress', user.uid), firestoreData);
      setUserProgress(updatedProgress);
      
      if (questId === null) {
        setActiveQuestState(null);
      } else {
        setActiveQuestState({
          questId,
          startedAt: new Date(),
          lastActivity: new Date(),
          status: "active"
        });

        // Update local quests state
        const updatedQuests = quests.map(q => 
          q.id === questId ? { ...q, status: "in-progress" as QuestStatus } : q
        );
        setQuests(updatedQuests);
      }
    } catch (error) {
      console.error('Error setting active quest:', error);
    }
  };

  const startQuest = async (questId: string): Promise<{ success: boolean; action: 'map' | 'quiz' | 'none' }> => {
    if (!user) return { success: false, action: 'none' };

    // Don't allow starting completed quests
    if (userProgress.completedQuests.includes(questId)) {
      console.log("Cannot start quest - already completed:", questId);
      return { success: false, action: 'none' };
    }

    if (!canStartQuest(questId)) {
      return { success: false, action: 'none' };
    }

    const quest = quests.find(q => q.id === questId);
    
    // 🚨 NEW: For quests with quizzes, check if location is completed first
    if (quest?.hasQuiz && quest.questions && quest.questions.length > 0) {
      const locationCompleted = userProgress.inProgressQuests[questId]?.locationCompleted;
      
      if (!locationCompleted) {
        // Location not completed - set as active quest for map
        await setActiveQuest(questId);
        return { success: true, action: 'map' };
      } else {
        // Location completed - start the quiz
        startQuiz(questId);
        return { success: true, action: 'quiz' };
      }
    }

    // For regular location quests without quizzes
    await setActiveQuest(questId);
    return { success: true, action: 'map' };
  };

  const completeQuest = async (questId: string) => {
    if (!user) return;

    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) {
        console.error('Quest not found:', questId);
        return;
      }

      const { [questId]: _, ...remainingInProgress } = userProgress.inProgressQuests;
      
      // Calculate new total points
      const questPoints = quest.rewardPoints || quest.points || 0;
      const newTotalPoints = (userProgress.totalPoints || 0) + questPoints;

      const updatedProgress: AppUserProgress = {
        completedQuests: [...userProgress.completedQuests, questId],
        inProgressQuests: remainingInProgress,
        activeQuestId: userProgress.activeQuestId === questId ? null : userProgress.activeQuestId,
        totalPoints: newTotalPoints,
        completedQuestDetails: {
          ...userProgress.completedQuestDetails,
          [questId]: {
            points: questPoints,
            completedAt: new Date(),
            title: quest.title
          }
        },
        quizProgress: userProgress.quizProgress
      };

      // Award collectible based on quest difficulty
      if (quest.difficulty) {
        try {
          // Get all collectibles of matching difficulty
          const collectiblesRef = collection(db, 'collectibles');
          const q = query(collectiblesRef, where('difficulty', '==', quest.difficulty.toLowerCase()));
          const collectiblesSnapshot = await getDocs(q);
          
          if (!collectiblesSnapshot.empty) {
            // Select a random collectible from the matching difficulty
            const collectibles = collectiblesSnapshot.docs;
            const randomCollectible = collectibles[Math.floor(Math.random() * collectibles.length)];
            const collectibleData = randomCollectible.data();
            
            // Get current user progress to check for duplicates
            const userProgressRef = doc(db, 'userProgress', user.uid);
            const userProgressSnap = await getDoc(userProgressRef);
            const userData = userProgressSnap.data();
            const existingCollectibles = userData?.collectibles || [];

            // Check if user already has this collectible
            const hasCollectible = existingCollectibles.some(
              (c: any) => c.id === randomCollectible.id
            );

            // Only add if user doesn't have this collectible yet
            if (!hasCollectible) {
              await updateDoc(userProgressRef, {
                collectibles: arrayUnion({
                  id: randomCollectible.id,
                  name: collectibleData.name,
                  description: collectibleData.description,
                  iconUrl: collectibleData.iconUrl,
                  rarity: collectibleData.rarity,
                  difficulty: collectibleData.difficulty
                })
              });

              toast.success(`🏆 Awarded new collectible: ${collectibleData.name}`);
            } else {
              toast.info(`You already have the collectible: ${collectibleData.name}`);
            }
          }
        } catch (error) {
          toast.error('Error awarding collectible');
          console.error('Error awarding collectible:', error);
        }
      }

      const firestoreData = convertToFirestoreData(updatedProgress);
      await updateDoc(doc(db, 'userProgress', user.uid), firestoreData);
      setUserProgress(updatedProgress);

      if (userProgress.activeQuestId === questId) {
        setActiveQuestState(null);
      }

      // 🚨 FIX: Update local quests state to mark this quest as completed
      setQuests(prevQuests => 
        prevQuests.map(q => 
          q.id === questId 
            ? { ...q, status: "completed" as QuestStatus }
            : q
        )
      );

      console.log(`✅ Completed quest: ${quest.title} - +${questPoints} points (Total: ${newTotalPoints})`);

    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const completeLocationQuest = (questId: string, userPosition: { lat: number; lng: number }): boolean => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return false;

    // Don't complete already completed quests
    if (userProgress.completedQuests.includes(questId)) {
      return false;
    }

    const distance = calculateDistance(
      userPosition.lat, userPosition.lng,
      quest.position.lat, quest.position.lng
    );

    const isAtLocation = distance <= COMPLETION_RADIUS;
    
    if (isAtLocation) {
      // 🚨 FIX: Check if this quest has a quiz
      const hasQuiz = quest.questions && quest.questions.length > 0;
      
      if (!hasQuiz) {
        // Quest has no quiz - complete it immediately
        completeQuest(questId);
        return true;
      }
      
      // 🚨 FIX: Quest has quiz - only mark location as completed
      setUserProgress(prev => ({
        ...prev,
        inProgressQuests: {
          ...prev.inProgressQuests,
          [questId]: {
            ...prev.inProgressQuests[questId],
            locationCompleted: true,
            startedAt: prev.inProgressQuests[questId]?.startedAt || new Date()
          }
        }
      }));

      console.log(`📍 Location requirement completed for: ${quest.title}. Quiz is now available.`);
      return true;
    }

    return false;
  };
  const submitQuizAnswers = async (questId: string, answers: number[]): Promise<boolean> => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.questions) return false;

    // Don't submit answers for completed quests
    if (userProgress.completedQuests.includes(questId)) {
      return false;
    }

    const allCorrect = quest.questions.every((question, index) => 
      answers[index] === question.correctAnswer
    );

    if (allCorrect) {
      await completeQuest(questId);
    }

    return allCorrect;
  };

  const checkAbandonment = (): boolean => {
    if (!activeQuest || activeQuest.status === "paused") return false;
    
    const timeSinceLastActivity = Date.now() - activeQuest.lastActivity.getTime();
    return timeSinceLastActivity > ABANDONMENT_TIMEOUT;
  };

  const updateLastActivity = () => {
    if (activeQuest) {
      setActiveQuestState({
        ...activeQuest,
        lastActivity: new Date()
      });
    }
  };

  return (
    <QuestContext.Provider value={{
      quests,
      userProgress: {
        ...userProgress,
        totalPoints: userProgress.totalPoints >= 0 ? userProgress.totalPoints : calculateTotalPoints()
      },
      activeQuest,
      loading,
      startQuest,
      setActiveQuest,
      completeQuest,
      completeLocationQuest,
      submitQuizAnswers,
      refreshQuests,
      canStartQuest,
      checkAbandonment,
      updateLastActivity,
      calculateTotalPoints,
      // Quiz methods
      startQuiz,
      submitQuizAnswer,
      completeQuiz,
      resetQuiz,
      getQuizResults,
      activeQuiz,
      quizProgress: userProgress.quizProgress
    }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuest must be used within a QuestProvider');
  }
  return context;
};