// Base Quest Types
export type QuestType = "Location" | "Treasure" | "Challenge" | "Quiz" | "Timed" | "Multiplayer";
// FIX: Make sure QuestStatus matches what you're actually using
export type QuestStatus = 'active' | 'inactive' | 'in-progress' | 'completed' | 'expired' | 'failed' | 'Available' | 'In Progress' | 'Completed' | 'Expired' | 'Failed';
export type QuestDifficulty = "Easy" | "Medium" | "Hard";

// Quiz-specific Interfaces
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option (0-based)
  explanation?: string; // shown after answering
  points?: number; // points for this specific question
}

export interface QuizProgress {
  questId: string;
  currentQuestion: number;
  answers: number[]; // user's answers (-1 for unanswered)
  score: number;
  completed: boolean;
  startedAt: Date;
  timeSpent: number; // in seconds
}

export interface QuizResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  passed: boolean;
}

// Main Quest Interface
export interface Quest {
  id: string;
  title: string;
  description: string;
  building: string;
  rewardPoints: number;
  status: QuestStatus;
  createdAt: Date;
  updatedAt: Date;
  
  type: QuestType;
  difficulty: QuestDifficulty;
  estimatedTime: string;
  location: string;
  requirements: string[];
  requiredQuests: string[];
  position: { lat: number; lng: number };
  
  // 🚨 NEW: Quiz becomes optional and only available after location requirement
  hasQuiz?: boolean;
  questions?: QuizQuestion[];
  passingScore?: number;
  allowRetries?: boolean;
  shuffleQuestions?: boolean;
  
  // 🚨 NEW: Track location and quiz completion separately
  locationCompleted?: boolean;
  quizCompleted?: boolean;
  
  points?: number;
}

// User Progress Tracking
export interface UserQuestProgress {
  userId: string;
  completedQuests: string[];
  inProgressQuests: {
    questId: string;
    startedAt: Date;
    progress: number; // 0-100 percentage
    currentStep?: number;
  }[];
  earnedPoints: number;
  quizProgress: Record<string, QuizProgress>; // questId -> quiz progress
}

// Multiplayer Interfaces
export interface Team {
  id: string;
  name: string;
  members: string[]; // user IDs
  currentQuest?: string;
  createdAt: Date;
}

export interface CollaborationSession {
  id: string;
  questId: string;
  teamId: string;
  participants: string[];
  progress: number;
  startedAt: Date;
  lastActivity: Date;
}

// Keep your existing interfaces and add new ones
export interface QuestFormData {
  title: string;
  description: string;
  building: string;
  rewardPoints: number;
  status: 'active' | 'inactive';
  
  // NEW FIELDS FOR FORM
  type: QuestType;
  difficulty: QuestDifficulty;
  estimatedTime: string;
  location: string;
  requirements: string[];
  requiredQuests: string[];
  
  // Quiz-specific form fields
  questions?: QuizQuestion[];
  passingScore?: number;
  allowRetries?: boolean;
  shuffleQuestions?: boolean;
  
  // Timed quest form fields
  timeLimit?: number;
  startTime?: Date;
  endTime?: Date;
  timeBonus?: boolean;
  
  // Multiplayer form fields
  maxPlayers?: number;
  minPlayers?: number;
  teamRequired?: boolean;
  collaborationTasks?: string[];
}

export interface QuestFilters {
  searchQuery: string;
  statusFilter: 'all' | 'active' | 'inactive' | 'in-progress' | 'completed';
  buildingFilter: string;
  typeFilter: 'all' | QuestType;
  difficultyFilter: 'all' | QuestDifficulty;
}

// Sample quest data for reference
export const SAMPLE_QUIZ_QUEST: Partial<Quest> = {
  type: "Quiz",
  difficulty: "Medium",
  estimatedTime: "10-15 minutes",
  location: "Virtual",
  requirements: ["Basic campus knowledge"],
  requiredQuests: [],
  passingScore: 70,
  allowRetries: true,
  shuffleQuestions: true,
  questions: [
    {
      id: "q1",
      question: "In which year was our university founded?",
      options: ["1950", "1965", "1978", "1982"],
      correctAnswer: 1,
      explanation: "The university was established in 1965 with just three departments.",
      points: 10
    },
    {
      id: "q2", 
      question: "Who was the first chancellor of the university?",
      options: ["Dr. Robert Smith", "Dr. Elizabeth Wong", "Prof. James Wilson", "Dr. Maria Garcia"],
      correctAnswer: 1,
      explanation: "Dr. Elizabeth Wong served as the first chancellor from 1965 to 1978.",
      points: 10
    }
  ]
};