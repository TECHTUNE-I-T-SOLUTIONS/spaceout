'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type QuestionType = 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox';

interface Question {
  title: string;
  type: QuestionType;
  description?: string;
  options?: string[];
  required: boolean;
  order: number;
}

interface QuestionnaireBuilderProps {
  onQuestionnnaireCreated?: () => void;
}

export function QuestionnaireBuilder({ onQuestionnnaireCreated }: QuestionnaireBuilderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state for new questionnaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [showOnCheckIn, setShowOnCheckIn] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string | null>(null);

  // Form state for new question
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState<Question>({
    title: '',
    type: 'multiple_choice',
    description: '',
    options: [],
    required: true,
    order: 1,
  });
  const [currentOption, setCurrentOption] = useState('');

  const handleCreateQuestionnaire = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : undefined,
          isRequired,
          showOnCheckIn,
        }),
      });

      if (!res.ok) throw new Error('Failed to create questionnaire');

      const questionnaire = await res.json();
      setSelectedQuestionnaire(questionnaire._id);
      setQuestions([]);

      // Reset form
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setIsRequired(true);
      setShowOnCheckIn(false);

      toast.success('Questionnaire created!');
    } catch (error: any) {
      console.error('Error creating questionnaire:', error);
      toast.error(error.message || 'Failed to create questionnaire');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.title.trim()) {
      toast.error('Please enter a question title');
      return;
    }

    if (
      (newQuestion.type === 'multiple_choice' || newQuestion.type === 'dropdown' || newQuestion.type === 'checkbox') &&
      (!newQuestion.options || newQuestion.options.length === 0)
    ) {
      toast.error('Please add at least one option');
      return;
    }

    const question = {
      ...newQuestion,
      order: questions.length + 1,
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      title: '',
      type: 'multiple_choice',
      description: '',
      options: [],
      required: true,
      order: questions.length + 2,
    });
    toast.success('Question added!');
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleAddOption = () => {
    if (!currentOption.trim()) return;

    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), currentOption],
    });
    setCurrentOption('');
  };

  const handleRemoveOption = (index: number) => {
    setNewQuestion({
      ...newQuestion,
      options: (newQuestion.options || []).filter((_, i) => i !== index),
    });
  };

  const handleSaveQuestions = async () => {
    if (!selectedQuestionnaire) {
      toast.error('Please select a questionnaire');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      for (const question of questions) {
        const res = await fetch(
          `/api/questionnaires/${selectedQuestionnaire}/questions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question),
          }
        );

        if (!res.ok) throw new Error('Failed to add question');
      }

      setQuestions([]);
      toast.success(`${questions.length} questions added!`);
      setOpen(false);
      onQuestionnnaireCreated?.();
    } catch (error: any) {
      console.error('Error saving questions:', error);
      toast.error(error.message || 'Failed to save questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Questionnaire</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Questionnaire</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Questionnaire Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questionnaire Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Customer Satisfaction Survey"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide context for respondents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={isRequired}
                    onCheckedChange={(checked) => setIsRequired(checked === true)}
                  />
                  <Label htmlFor="required">Required for users</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="checkIn"
                    checked={showOnCheckIn}
                    onCheckedChange={(checked) => setShowOnCheckIn(checked === true)}
                  />
                  <Label htmlFor="checkIn">Show on check-in</Label>
                </div>
              </div>

              <Button
                onClick={handleCreateQuestionnaire}
                disabled={loading || !title.trim()}
                className="w-full"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Questionnaire
              </Button>
            </CardContent>
          </Card>

          {/* Add Questions */}
          {selectedQuestionnaire && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Questions</CardTitle>
                <CardDescription>
                  Create the questions for this questionnaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="qTitle">Question Title *</Label>
                  <Input
                    id="qTitle"
                    placeholder="e.g., How satisfied are you with our service?"
                    value={newQuestion.title}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="qDesc">Description</Label>
                  <Textarea
                    id="qDesc"
                    placeholder="Additional context for this question..."
                    value={newQuestion.description}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="qType">Question Type *</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) =>
                      setNewQuestion({ ...newQuestion, type: value as QuestionType })
                    }
                  >
                    <SelectTrigger id="qType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="open_ended">Open Ended</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="checkbox">Checkbox (Multiple)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newQuestion.type === 'multiple_choice' ||
                  newQuestion.type === 'dropdown' ||
                  newQuestion.type === 'checkbox') && (
                  <div>
                    <Label>Options</Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Add an option..."
                        value={currentOption}
                        onChange={(e) => setCurrentOption(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                      />
                      <Button size="sm" onClick={handleAddOption}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(newQuestion.options || []).map((option, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded"
                        >
                          <span>{option}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveOption(i)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="required"
                    checked={newQuestion.required}
                    onCheckedChange={(checked) =>
                      setNewQuestion({
                        ...newQuestion,
                        required: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="required">Required</Label>
                </div>

                <Button onClick={handleAddQuestion} className="w-full">
                  Add Question
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Questions to Add ({questions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between bg-gray-50 p-3 rounded border"
                  >
                    <div>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-sm text-gray-500">
                        Type: {q.type} {q.required ? '(Required)' : ''}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <p className="text-sm text-gray-500">
                          Options: {q.options.join(', ')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveQuestion(i)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={handleSaveQuestions}
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save All Questions
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
