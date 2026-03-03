'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Question {
  _id: string;
  title: string;
  type: 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox';
  description?: string;
  options?: string[];
  required: boolean;
  order: number;
}

interface Questionnaire {
  _id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface QuestionnaireResponderProps {
  questionnaire: Questionnaire;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function QuestionnaireResponder({
  questionnaire,
  open,
  onOpenChange,
  onComplete,
}: QuestionnaireResponderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const questions = questionnaire.questions || [];
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  // Handle different input types
  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [currentQuestion._id]: value,
    });
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    const current = answers[currentQuestion._id] || [];
    const updated = checked
      ? [...current, value]
      : current.filter((v: string) => v !== value);
    setAnswers({
      ...answers,
      [currentQuestion._id]: updated,
    });
  };

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion._id]) {
      toast.error('This question is required');
      return;
    }
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (currentQuestion.required && !answers[currentQuestion._id]) {
      toast.error('This question is required');
      return;
    }

    setLoading(true);
    try {
      // Format answers for API
      const formattedAnswers = questions.map((q) => ({
        questionId: q._id,
        type: q.type,
        answer: answers[q._id] || null,
      }));

      const res = await fetch('/api/questionnaires/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaireId: questionnaire._id,
          answers: formattedAnswers,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit response');

      toast.success('Thank you for completing the survey!');
      onOpenChange(false);
      setCurrentStep(0);
      setAnswers({});
      onComplete?.();
    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast.error(error.message || 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  const isLastStep = currentStep === questions.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{questionnaire.title}</DialogTitle>
        </DialogHeader>

        {questionnaire.description && (
          <p className="text-sm text-gray-600">{questionnaire.description}</p>
        )}

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>
              Question {currentStep + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question content */}
        {currentQuestion && (
          <div className="space-y-4 min-h-[300px]">
            <div>
              <Label className="text-base font-semibold">
                {currentQuestion.title}
                {currentQuestion.required && <span className="text-red-500"> *</span>}
              </Label>
              {currentQuestion.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            {/* Render different question types */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQuestion._id] || ''}
                  onValueChange={handleAnswer}
                >
                  {currentQuestion.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${i}`} />
                      <Label htmlFor={`option-${i}`} className="font-normal cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'open_ended' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  rows={4}
                />
              )}

              {currentQuestion.type === 'dropdown' && (
                <Select
                  value={answers[currentQuestion._id] || ''}
                  onValueChange={handleAnswer}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {currentQuestion.options?.map((option, i) => (
                      <SelectItem key={i} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {currentQuestion.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={
                        answers[currentQuestion._id] === rating
                          ? 'default'
                          : 'outline'
                      }
                      size="lg"
                      onClick={() => handleAnswer(rating)}
                      className="flex-1"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'checkbox' && (
                <div className="space-y-2">
                  {currentQuestion.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkbox-${i}`}
                        checked={
                          (answers[currentQuestion._id] || []).includes(option)
                        }
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(option, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`checkbox-${i}`}
                        className="font-normal cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
