import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, Timestamp, query, where, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "react-toastify";

export interface Quest {
  id: string;
  title: string;
  description: string;
  location: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  type: "Location" | "Treasure" | "Challenge";
  status: "Available" | "In Progress" | "Completed";
  estimatedTime: string;
  requirements?: string[];
  position: { lat: number; lng: number };
  quizQuestions?: QuizQuestion[];
  requiredQuests?: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

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
}

export interface AppUserProgress {
  completedQuests: string[];
  inProgressQuests: {
    [questId: string]: {
      startedAt: Date;
      quizAnswers?: number[];
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
}

interface QuestContextType {
  quests: Quest[];
  userProgress: AppUserProgress;
  activeQuest: ActiveQuest | null;
  loading: boolean;
  startQuest: (questId: string) => Promise<boolean>;
  setActiveQuest: (questId: string | null) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  completeLocationQuest: (questId: string, userPosition: { lat: number; lng: number }) => boolean;
  submitQuizAnswers: (questId: string, answers: number[]) => Promise<boolean>;
  refreshQuests: () => Promise<void>;
  canStartQuest: (questId: string) => boolean;
  checkAbandonment: () => boolean;
  updateLastActivity: () => void;
  calculateTotalPoints: () => number;
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
    collectibles: []
  });
  const [activeQuest, setActiveQuestState] = useState<ActiveQuest | null>(null);
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
      return total + (quest?.points || 0);
    }, 0);
  }, [userProgress.completedQuests, quests]);

  // 🚨 CORRECT FIX: Calculate quest status based ONLY on user progress
  const calculateQuestStatus = useCallback((questId: string, currentUserProgress: AppUserProgress): "Available" | "In Progress" | "Completed" => {
    if (currentUserProgress.completedQuests.includes(questId)) {
      return "Completed";
    }
    if (currentUserProgress.inProgressQuests[questId]) {
      return "In Progress";
    }
    return "Available";
  }, []);

  const parseQuestData = (doc: any, data: any, currentUserProgress: AppUserProgress): Quest => {
    // Handle both nested position and flat position data
    let position = { lat: -26.1915, lng: 28.0309 }; // Default center
    
    if (data.position) {
      // Has nested position object
      position = data.position;
    } else if (data.lat !== undefined && data.lng !== undefined) {
      // Has flat lat/lng fields (from admin)
      position = { lat: data.lat, lng: data.lng };
    }
    
    // Helper to capitalize first letter
    const capitalizeFirst = (str: string) => 
      str ? str.charAt(0).toUpperCase() + str.slice(1) : "Unknown";

    // 🚨 CORRECT: Calculate status based on current user progress
    const status = calculateQuestStatus(doc.id, currentUserProgress);

    return {
      id: doc.id,
      title: data.title || "Untitled Quest",
      description: data.description || "",
      location: data.location || "Unknown Location",
      difficulty: capitalizeFirst(data.difficulty) as "Easy" | "Medium" | "Hard" || "Medium",
      points: data.points || 0,
      type: capitalizeFirst(data.type) as "Location" | "Treasure" | "Challenge" || "Location",
      status: status,
      estimatedTime: data.estimatedTime || "30 min",
      requirements: data.requirements || [],
      position: position,
      quizQuestions: data.quizQuestions || [],
      requiredQuests: data.requiredQuests || []
    };
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

  const refreshQuests = async () => {
    try {
      setLoading(true);
      
      // Load user progress FIRST
      let userProgressData: AppUserProgress = {
        completedQuests: [],
        inProgressQuests: {},
        activeQuestId: null,
        totalPoints: 0,
        completedQuestDetails: {}
      };

      if (user) {
        const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
        if (progressDoc.exists()) {
          const firestoreData = progressDoc.data() as FirestoreUserProgress;
          userProgressData = convertToAppUserProgress(firestoreData);
          
          // Calculate points if not present in Firestore
          if (userProgressData.totalPoints === undefined || userProgressData.totalPoints === null) {
            // We'll calculate this after we load quests
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
            completedQuestDetails: {}
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

      // Calculate total points based on completed quests
      if (userProgressData.totalPoints === 0) {
        const calculatedPoints = userProgressData.completedQuests.reduce((total, questId) => {
          const quest = questsData.find(q => q.id === questId);
          return total + (quest?.points || 0);
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
      
      setQuests(questsData);

      console.log("💰 Points Summary:");
      console.log("- Completed quests:", userProgressData.completedQuests.length);
      console.log("- Current total points:", userProgressData.totalPoints);
      console.log("- Quest statuses:", questsData.map(q => `${q.title}: ${q.status}`));
      
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
          q.id === questId ? { ...q, status: "In Progress" as const } : q
        );
        setQuests(updatedQuests);
      }
    } catch (error) {
      console.error('Error setting active quest:', error);
    }
  };

  const startQuest = async (questId: string): Promise<boolean> => {
    if (!user) return false;

    // Don't allow starting completed quests
    if (userProgress.completedQuests.includes(questId)) {
      console.log("Cannot start quest - already completed:", questId);
      return false;
    }

    if (!canStartQuest(questId)) {
      return false;
    }

    await setActiveQuest(questId);
    return true;
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
      const questPoints = quest.points || 0;
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
        }
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

      // Update local quests state
      const updatedQuests = quests.map(q => 
        q.id === questId ? { ...q, status: "Completed" as const } : q
      );
      setQuests(updatedQuests);

      console.log(`✅ Completed quest: ${quest.title} - +${questPoints} points (Total: ${newTotalPoints})`);

    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const completeLocationQuest = (questId: string, userPosition: { lat: number; lng: number }): boolean => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.type !== "Location") return false;

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
      completeQuest(questId);
      return true;
    }

    return false;
  };

  const submitQuizAnswers = async (questId: string, answers: number[]): Promise<boolean> => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.quizQuestions) return false;

    // Don't submit answers for completed quests
    if (userProgress.completedQuests.includes(questId)) {
      return false;
    }

    const allCorrect = quest.quizQuestions.every((question, index) => 
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
      calculateTotalPoints
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