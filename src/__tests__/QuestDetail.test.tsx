// src/__tests__/QuestDetail.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuestDetail from '@/pages/QuestDetail';
import { useQuest } from '@/contexts/QuestContext';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/contexts/QuestContext');
vi.mock('@/contexts/AuthContext');
vi.mock('@/components/Header');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  ArrowLeft: () => <span>ArrowLeftIcon</span>,
  MapPin: () => <span>MapPinIcon</span>,
  HelpCircle: () => <span>HelpCircleIcon</span>,
  CheckCircle: () => <span>CheckCircleIcon</span>,
  XCircle: () => <span>XCircleIcon</span>,
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

// Mock Header component
vi.mock('@/components/Header', () => ({
  default: () => <div>Header Component</div>,
}));

import { useParams, useNavigate } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('QuestDetail', () => {
  const mockNavigate = vi.fn();
  const mockStartQuest = vi.fn();
  const mockCompleteLocationQuest = vi.fn();
  const mockSubmitQuizAnswers = vi.fn();
  const mockRefreshQuests = vi.fn();

  const mockQuest = {
    id: 'quest1',
    title: 'Test Quest',
    description: 'Test Quest 1',
    building: 'Test Building',
    rewardPoints: 100,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    quiz: true,
    type: 'Location',
    difficulty: 'Medium',
    estimatedTime: '30 min',
    location: 'Test Location',
    requirements: ['Requirement 1', 'Requirement 2'],
    requiredQuests: [],
    position: { lat: -26.1915, lng: 28.0309 },
    questions: [],
    passingScore: 70,
    allowRetries: true,
    shuffleQuestions: false,
    points: 100,
    quizQuestions: []
  };

  const mockUserProgress = {
    completedQuests: [],
    inProgressQuests: {},
    activeQuestId: null,
    totalPoints: 0,
    completedQuestDetails: {},
    collectibles: [],
    quizProgress: {
      quest1: {
        currentQuestion: 0,
        answers: [-1],
        score: 0,
        completed: false,
        startedAt: new Date(),
        timeSpent: 0
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as vi.Mock).mockReturnValue({ user: { uid: 'user123' } });
    (useQuest as vi.Mock).mockReturnValue({
      quests: [mockQuest],
      userProgress: mockUserProgress,
      startQuest: mockStartQuest,
      completeLocationQuest: mockCompleteLocationQuest,
      submitQuizAnswers: mockSubmitQuizAnswers,
      refreshQuests: mockRefreshQuests,
    });
    (useParams as vi.Mock).mockReturnValue({ questId: 'quest1' });
    (useNavigate as vi.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------- Quiz Quest Features ----------
  describe('Quiz Quest Features', () => {
    const quizQuest = {
      ...mockQuest,
      type: 'Challenge',
      quizQuestions: [
        {
          id: 'q1',
          text: "What is 2+2?",
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          points: 1
        }
      ]
    };

    const quizUserProgress = {
      ...mockUserProgress,
      inProgressQuests: { quest1: { startedAt: new Date(), status: 'in_progress' } },
      quizProgress: { quest1: { currentQuestion: 0, answers: [-1], score: 0, completed: false, startedAt: new Date(), timeSpent: 0 } }
    };

    beforeEach(() => {
      (useQuest as vi.Mock).mockReturnValue({
        quests: [quizQuest],
        userProgress: quizUserProgress,
        startQuest: mockStartQuest,
        completeLocationQuest: mockCompleteLocationQuest,
        submitQuizAnswers: mockSubmitQuizAnswers,
        refreshQuests: mockRefreshQuests,
      });
    });

    it('renders quiz questions for challenge quests', async () => {
      renderWithRouter(<QuestDetail />);
      expect(await screen.findByText('Quiz Challenge')).toBeInTheDocument();
      expect(await screen.findByText('1. What is 2+2?')).toBeInTheDocument();
      expect(await screen.findByText('3')).toBeInTheDocument();
      expect(await screen.findByText('4')).toBeInTheDocument();
      expect(await screen.findByText('5')).toBeInTheDocument();
      expect(await screen.findByText('6')).toBeInTheDocument();
    });

    it('enables submit button only when question is answered', async () => {
      renderWithRouter(<QuestDetail />);
      const submitButton = await screen.findByText('Submit Answers');
      expect(submitButton).toBeDisabled();

      const option = await screen.findByText('4');
      fireEvent.click(option);

      expect(submitButton).not.toBeDisabled();
    });

    it('submits quiz correctly and calls submitQuizAnswers', async () => {
      mockSubmitQuizAnswers.mockResolvedValue(true);
      renderWithRouter(<QuestDetail />);

      const option = await screen.findByText('4');
      fireEvent.click(option);

      const submitButton = screen.getByText('Submit Answers');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitQuizAnswers).toHaveBeenCalledWith('quest1', [1]);
      });
    });

    it('shows failure message when quiz answers are incorrect', async () => {
      mockSubmitQuizAnswers.mockResolvedValue(false);
      renderWithRouter(<QuestDetail />);

      const option = await screen.findByText('3');
      fireEvent.click(option);

      const submitButton = screen.getByText('Submit Answers');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/answers.*incorrect/i)).toBeInTheDocument();
      });
    });
  });
});
