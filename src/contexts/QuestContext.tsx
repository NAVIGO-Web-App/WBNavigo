import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';

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
    completedQuests: firestoreProgress.completedQuests,
    activeQuestId: firestoreProgress.activeQuestId,
    inProgressQuests: Object.fromEntries(
      Object.entries(firestoreProgress.inProgressQuests).map(([questId, progress]) => [
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
    inProgressQuests: {}
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

  const parseCoordinates = (coord: string): { lat: number; lng: number } => {
    const center = { lat: -26.1915, lng: 28.0309 };
    if (!coord) return center;
    
    try {
      const [latStr, lngStr] = coord.split(',');
      let lat = parseFloat(latStr.trim());
      let lng = parseFloat(lngStr.trim());
      
      if (lat > 0 && lat < 30) lat = -lat;
      if (lng < 0 && lng > -30) lng = Math.abs(lng);
      
      return isNaN(lat) || isNaN(lng) ? center : { lat, lng };
    } catch {
      return center;
    }
  };

  const mapFirebaseStatus = (firebaseStatus: string): "Available" | "In Progress" | "Completed" => {
    if (firebaseStatus === "active") return "Available";
    if (firebaseStatus === "in-progress") return "In Progress";
    if (firebaseStatus === "completed") return "Completed";
    return "Available";
  };

  const canStartQuest = (questId: string): boolean => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return false;

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
        
        // First, load user progress if user is logged in
        let currentUserProgress: AppUserProgress = {
        completedQuests: [],
        inProgressQuests: {},
        activeQuestId: null
        };

        if (user) {
        const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
        if (progressDoc.exists()) {
            const firestoreData = progressDoc.data() as FirestoreUserProgress;
            currentUserProgress = convertToAppUserProgress(firestoreData);
            
            setUserProgress(currentUserProgress);
            
            if (currentUserProgress.activeQuestId && currentUserProgress.inProgressQuests[currentUserProgress.activeQuestId]) {
            const questProgress = currentUserProgress.inProgressQuests[currentUserProgress.activeQuestId];
            setActiveQuestState({
                questId: currentUserProgress.activeQuestId,
                startedAt: questProgress.startedAt,
                lastActivity: new Date(),
                status: questProgress.paused ? "paused" : "active"
            });
            }
        } else {
            // Create initial progress document
            await setDoc(doc(db, 'userProgress', user.uid), currentUserProgress);
            setUserProgress(currentUserProgress);
        }
        }

        // Now load quests with the current user progress
        const snapshot = await getDocs(collection(db, 'quests'));
        
        console.log("🔍 Firestore quests snapshot:", snapshot.docs.length, "documents");
        snapshot.docs.forEach(doc => {
        console.log("📄 Quest document:", doc.id, doc.data());
        });
        
        const questsData: Quest[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("🔄 Mapping quest:", doc.id, data);
        
        // Determine status based on current user progress
        let status: "Available" | "In Progress" | "Completed";
        
        if (currentUserProgress.completedQuests.includes(doc.id)) {
            status = "Completed";
            console.log(`✅ Quest ${doc.id} is COMPLETED`);
        } else if (currentUserProgress.inProgressQuests[doc.id]) {
            status = "In Progress";
            console.log(`🔄 Quest ${doc.id} is IN PROGRESS`);
        } else {
            status = "Available";
            console.log(`📋 Quest ${doc.id} is AVAILABLE`);
        }

        // Helper to capitalize first letter
        const capitalizeFirst = (str: string) => 
            str ? str.charAt(0).toUpperCase() + str.slice(1) : "Unknown";

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
            position: data.position || { lat: -26.1915, lng: 28.0309 },
            quizQuestions: data.quizQuestions || [],
            requiredQuests: data.requiredQuests || []
        };
        });
        
        console.log("✅ Final quests data:", questsData);
        setQuests(questsData);

    } catch (error) {
        console.error('❌ Error fetching quests:', error);
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

    if (!canStartQuest(questId)) {
      return false;
    }

    await setActiveQuest(questId);
    return true;
  };

  const completeQuest = async (questId: string) => {
    if (!user) return;

    try {
      const { [questId]: _, ...remainingInProgress } = userProgress.inProgressQuests;
      
      const updatedProgress: AppUserProgress = {
        completedQuests: [...userProgress.completedQuests, questId],
        inProgressQuests: remainingInProgress,
        activeQuestId: userProgress.activeQuestId === questId ? null : userProgress.activeQuestId
      };

      const firestoreData = convertToFirestoreData(updatedProgress);
      await updateDoc(doc(db, 'userProgress', user.uid), firestoreData);
      setUserProgress(updatedProgress);

      if (userProgress.activeQuestId === questId) {
        setActiveQuestState(null);
      }

      const updatedQuests = quests.map(q => 
        q.id === questId ? { ...q, status: "Completed" as const } : q
      );
      setQuests(updatedQuests);
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const completeLocationQuest = (questId: string, userPosition: { lat: number; lng: number }): boolean => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.type !== "Location") return false;

    const distance = calculateDistance(
      userPosition.lat, userPosition.lng,
      quest.position.lat, quest.position.lng
    );

    const isAtLocation = distance <= COMPLETION_RADIUS;
    
    if (isAtLocation) {
      completeQuest(questId);
    }

    return isAtLocation;
  };

  const submitQuizAnswers = async (questId: string, answers: number[]): Promise<boolean> => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || !quest.quizQuestions) return false;

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
      userProgress,
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
      updateLastActivity
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