export interface QuizState {
  currentQuestionIndex: number;
  userAnswers: number[];
  showResults: boolean;
  timeSpent: number;
  isSubmitting: boolean;
}

export interface QuizResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  passed: boolean;
}