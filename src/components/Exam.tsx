import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Timer, Send } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which of the following is a core principle of machine learning?",
    options: ["Data-driven learning", "Hard-coded rules", "Manual feature extraction", "Static data processing"],
    correctAnswer: 0,
  },
  {
    id: 2,
    text: "What does TensorFlow.js allow developers to do?",
    options: ["Run ML models in the browser", "Only train models on servers", "Build mobile apps only", "Manage databases"],
    correctAnswer: 0,
  },
  {
    id: 3,
    text: "In the context of AI proctoring, what is 'head pose estimation' used for?",
    options: ["Detecting looking away", "Measuring heart rate", "Identifying the user's name", "Counting the number of questions"],
    correctAnswer: 0,
  },
  {
    id: 4,
    text: "Which API is used to detect if a user switches browser tabs?",
    options: ["Page Visibility API", "Web Storage API", "Geolocation API", "History API"],
    correctAnswer: 0,
  },
  {
    id: 5,
    text: "What is the primary benefit of running AI models client-side?",
    options: ["Privacy and low latency", "Higher processing power", "Better data storage", "Easier debugging"],
    correctAnswer: 0,
  },
];

interface ExamProps {
  onComplete: (answers: Record<number, number>) => void;
  suspiciousScore: number;
}

export const Exam: React.FC<ExamProps> = ({ onComplete, suspiciousScore }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onComplete(answers);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete, answers]);

  const handleOptionSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [QUESTIONS[currentQuestionIndex].id]: optionIndex,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

  const getStatusColor = () => {
    if (suspiciousScore <= 2) return 'text-green-500';
    if (suspiciousScore <= 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusLabel = () => {
    if (suspiciousScore <= 2) return 'Focused';
    if (suspiciousScore <= 5) return 'Warning';
    return 'High Risk';
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-zinc-200 px-8 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">
            AI
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-800">Online Proctoring Exam</h1>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-full font-mono text-zinc-700">
            <Timer className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          
          <button
            onClick={() => onComplete(answers)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2 rounded-lg hover:bg-zinc-800 transition-colors font-medium shadow-lg shadow-zinc-200"
          >
            <Send className="w-4 h-4" />
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Exam Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-12 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-100">
            <motion.div 
              className="h-full bg-zinc-900"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>

          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">
              Question {currentQuestionIndex + 1} of {QUESTIONS.length}
            </span>
            <h2 className="text-3xl font-medium text-zinc-900 leading-tight">
              {currentQuestion.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-12">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`group flex items-center justify-between p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  answers[currentQuestion.id] === index
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg'
                    : 'border-zinc-100 bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <span className="text-lg font-medium">{option}</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  answers[currentQuestion.id] === index
                    ? 'border-white bg-white/20'
                    : 'border-zinc-200 group-hover:border-zinc-400'
                }`}>
                  {answers[currentQuestion.id] === index && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-8 py-3 rounded-lg border border-zinc-200 text-zinc-600 font-medium hover:bg-zinc-50 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            
            <button
              onClick={isLastQuestion ? () => onComplete(answers) : nextQuestion}
              className="px-10 py-3 rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200"
            >
              {isLastQuestion ? 'Finish Exam' : 'Next Question'}
            </button>
          </div>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="h-12 bg-white border-t border-zinc-200 px-8 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${getStatusColor()}`}>
          {suspiciousScore <= 2 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{getStatusLabel()}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-zinc-300" />
        <div className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
          Continuous AI Monitoring Active
        </div>
      </footer>
    </div>
  );
};
