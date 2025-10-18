import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/quest';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionDisplayProps {
  question: QuizQuestion;
  questionNumber: number;
  selectedAnswer: number;
  onAnswerSelect: (answerIndex: number) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  selectedAnswer,
  onAnswerSelect
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Q{questionNumber}: {question.question}
      </h3>
      
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant={selectedAnswer === index ? "default" : "outline"}
            className="w-full justify-start h-auto py-3 px-4 text-left"
            onClick={() => onAnswerSelect(index)}
          >
            <div className="flex items-center space-x-3 w-full">
              {selectedAnswer === index ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="flex-1">{option}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuestionDisplay;