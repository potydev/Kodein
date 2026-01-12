import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, ArrowRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
}

interface QuizProps {
  quizzes: QuizQuestion[];
  onComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ quizzes, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const currentQuiz = quizzes[currentIndex];

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const checkAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    // Don't add to score here - we'll calculate it in nextQuestion
  };

  const nextQuestion = () => {
    if (selectedAnswer === null) return;
    
    // Calculate score for current question
    const currentQuestionScore = selectedAnswer === currentQuiz.correct_answer ? 1 : 0;
    const newScore = score + currentQuestionScore;
    
    if (currentIndex < quizzes.length - 1) {
      // Not last question - update score and move to next
      setScore(newScore);
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Last question - complete quiz with final score
      setFinalScore(newScore);
      setCompleted(true);
      onComplete(newScore);
    }
  };

  if (completed) {
    // Use stored finalScore instead of recalculating
    const percentage = Math.round((finalScore / quizzes.length) * 100);

    return (
      <div className="p-8 rounded-2xl glass text-center animate-slide-up">
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
          percentage >= 70 ? 'bg-success/20' : 'bg-warning/20'
        }`}>
          <Trophy className={`h-10 w-10 ${percentage >= 70 ? 'text-success' : 'text-warning'}`} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Quiz Selesai!</h3>
        <p className="text-4xl font-bold text-gradient mb-4">
          {finalScore}/{quizzes.length}
        </p>
        <p className="text-sm text-muted-foreground mb-2">
          Score: {finalScore} | Total: {quizzes.length}
        </p>
        <p className="text-muted-foreground mb-6">
          {percentage >= 70 
            ? 'Bagus sekali! Kamu menguasai materi ini.' 
            : 'Terus belajar untuk meningkatkan pemahamanmu.'}
        </p>
        <div className="w-full bg-muted rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all ${
              percentage >= 70 ? 'bg-success' : 'bg-warning'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{percentage}% benar</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl glass animate-slide-up">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          Pertanyaan {currentIndex + 1} dari {quizzes.length}
        </span>
        <span className="text-sm font-medium text-primary">
          Skor: {score}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-1.5 mb-8">
        <div 
          className="bg-gradient-primary h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h3 className="text-xl font-semibold mb-6">{currentQuiz.question}</h3>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuiz.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === currentQuiz.correct_answer;
          
          let optionClass = 'border-border/50 hover:border-primary/50 hover:bg-primary/5';
          if (showResult) {
            if (isCorrect) {
              optionClass = 'border-success bg-success/10';
            } else if (isSelected && !isCorrect) {
              optionClass = 'border-destructive bg-destructive/10';
            }
          } else if (isSelected) {
            optionClass = 'border-primary bg-primary/10';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                optionClass
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm',
                showResult && isCorrect ? 'bg-success text-success-foreground' :
                showResult && isSelected && !isCorrect ? 'bg-destructive text-destructive-foreground' :
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
              )}>
                {showResult && isCorrect ? <Check className="h-4 w-4" /> :
                 showResult && isSelected && !isCorrect ? <X className="h-4 w-4" /> :
                 String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && currentQuiz.explanation && (
        <div className="p-4 rounded-xl bg-muted/50 mb-6 animate-slide-up">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Penjelasan:</strong> {currentQuiz.explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!showResult ? (
          <Button 
            variant="hero" 
            onClick={checkAnswer}
            disabled={selectedAnswer === null}
          >
            Periksa Jawaban
          </Button>
        ) : (
          <Button variant="hero" onClick={nextQuestion}>
            {currentIndex < quizzes.length - 1 ? (
              <>
                Selanjutnya
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            ) : (
              'Lihat Hasil'
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
