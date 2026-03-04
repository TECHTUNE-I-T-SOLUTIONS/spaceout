'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type QuestionType = 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox' | 'text' | 'email' | 'number' | 'date';

interface ConditionalRule {
  questionId?: string;
  condition: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
}

interface QuestionOption {
  label: string;
  value: string;
  helpText?: string;
}

interface Question {
  _id?: string;
  title: string;
  type: QuestionType;
  description?: string;
  helpText?: string;
  options?: QuestionOption[];
  required: boolean;
  order: number;
  placeholder?: string;
  defaultValue?: string;
  randomizeOptions?: boolean;
  showNumbers?: boolean;
  minRating?: number;
  maxRating?: number;
  minRatingLabel?: string;
  maxRatingLabel?: string;
  conditionalLogic?: ConditionalRule[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customError?: string;
  };
}

interface QuestionnaireBuilderProps {
  onQuestionnaireCreated?: () => void;
  editingQuestionnaire?: Questionnaire | null;
  onEditClose?: () => void;
  showBuilder?: boolean;
  setShowBuilder?: (show: boolean) => void;
  managingQuestionsId?: string | null;
  setManagingQuestionsId?: (id: string | null) => void;
}

interface Questionnaire {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  isRequired: boolean;
  showOnCheckIn: boolean;
  status: 'draft' | 'published';
  questions?: any[];
  adminId?: string;
  totalResponses?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function QuestionnaireBuilder({ 
  onQuestionnaireCreated,
  editingQuestionnaire,
  onEditClose,
  showBuilder,
  setShowBuilder,
  managingQuestionsId,
  setManagingQuestionsId
}: QuestionnaireBuilderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Created questionnaires
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<Questionnaire | null>(null);

  // Initialize editing questionnaire
  useEffect(() => {
    if (editingQuestionnaire) {
      setCurrentQuestionnaire(editingQuestionnaire);
      setTitle(editingQuestionnaire.title);
      setDescription(editingQuestionnaire.description || '');
      setStartDate(editingQuestionnaire.startDate ? new Date(editingQuestionnaire.startDate).toISOString().split('T')[0] : '');
      setEndDate(editingQuestionnaire.endDate ? new Date(editingQuestionnaire.endDate).toISOString().split('T')[0] : '');
      setIsRequired(editingQuestionnaire.isRequired);
      setShowOnCheckIn(editingQuestionnaire.showOnCheckIn);
      setQuestions(editingQuestionnaire.questions || []);
      setIsEditingDetails(true);
      if (showBuilder) {
        setOpen(true);
      }
    }
  }, [editingQuestionnaire, showBuilder]);

  // Handle managing questions
  useEffect(() => {
    if (managingQuestionsId) {
      const fetchAndOpenQuestionnaire = async () => {
        try {
          setLoading(true);
          
          // Try to find in editingQuestionnaire or currentQuestionnaire first
          if (editingQuestionnaire && editingQuestionnaire._id === managingQuestionsId) {
            setCurrentQuestionnaire(editingQuestionnaire);
            setSelectedQuestionnaire(editingQuestionnaire._id);
            setQuestions(editingQuestionnaire.questions || []);
            setShowQuestionModal(true);
            return;
          }
          
          if (currentQuestionnaire && currentQuestionnaire._id === managingQuestionsId) {
            setSelectedQuestionnaire(currentQuestionnaire._id);
            setQuestions(currentQuestionnaire.questions || []);
            setShowQuestionModal(true);
            return;
          }
          
          // If not found, fetch it
          const res = await fetch(`/api/admin/questionnaires/${managingQuestionsId}`);
          if (!res.ok) throw new Error('Failed to fetch questionnaire');
          
          const questionnaire = await res.json();
          setCurrentQuestionnaire(questionnaire);
          setSelectedQuestionnaire(questionnaire._id);
          setQuestions(questionnaire.questions || []);
          setShowQuestionModal(true);
        } catch (error: any) {
          console.error('Error fetching questionnaire:', error);
          toast.error('Failed to load questionnaire');
          setManagingQuestionsId?.(null);
        } finally {
          setLoading(false);
        }
      };
      
      fetchAndOpenQuestionnaire();
    }
  }, [managingQuestionsId]);

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
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState<Question>({
    title: '',
    type: 'multiple_choice',
    description: '',
    helpText: '',
    placeholder: '',
    options: [],
    required: true,
    order: 1,
    randomizeOptions: false,
    showNumbers: false,
    minRating: 1,
    maxRating: 5,
    minRatingLabel: '',
    maxRatingLabel: '',
    conditionalLogic: [],
    validation: {},
  });
  const [currentOption, setCurrentOption] = useState({ label: '', value: '', helpText: '' });
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const handleCreateQuestionnaire = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      const url = isEditingDetails && currentQuestionnaire 
        ? `/api/admin/questionnaires/${currentQuestionnaire._id}`
        : '/api/admin/questionnaires';
      
      const method = isEditingDetails ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
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

      if (!res.ok) throw new Error(`Failed to ${isEditingDetails ? 'update' : 'create'} questionnaire`);

      const questionnaire = await res.json();
      
      if (isEditingDetails) {
        // Close dialog after edit
        setOpen(false);
        setIsEditingDetails(false);
        setCurrentQuestionnaire(null);
        toast.success('Questionnaire updated!');
        
        // Reset form
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setIsRequired(true);
        setShowOnCheckIn(false);
        
        // Call callbacks
        onQuestionnaireCreated?.();
        onEditClose?.();
        setShowBuilder?.(false);
      } else {
        // Set as current and open questions modal for new questionnaire
        setCurrentQuestionnaire(questionnaire);
        setSelectedQuestionnaire(questionnaire._id);
        setQuestions([]);
        setShowQuestionModal(true);
        toast.success('Questionnaire created! Now add questions.');
        
        // Reset form
        setTitle('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setIsRequired(true);
        setShowOnCheckIn(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || `Failed to ${isEditingDetails ? 'update' : 'create'} questionnaire`);
    } finally {
      setLoading(false);
    }
  };

  const resetQuestionForm = () => {
    setNewQuestion({
      title: '',
      type: 'multiple_choice',
      description: '',
      helpText: '',
      placeholder: '',
      options: [],
      required: true,
      order: questions.length + 1,
      randomizeOptions: false,
      showNumbers: false,
      minRating: 1,
      maxRating: 5,
      minRatingLabel: '',
      maxRatingLabel: '',
      conditionalLogic: [],
      validation: {},
    });
    setCurrentOption({ label: '', value: '', helpText: '' });
    setEditingQuestionIndex(null);
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

    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = {
        ...newQuestion,
        order: editingQuestionIndex + 1,
      };
      setQuestions(updated);
      setEditingQuestionIndex(null);
      toast.success('Question updated!');
    } else {
      const question = {
        ...newQuestion,
        order: questions.length + 1,
      };
      setQuestions([...questions, question]);
      toast.success('Question added!');
    }

    resetQuestionForm();
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated.map((q, i) => ({ ...q, order: i + 1 })));
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setNewQuestion(questions[index]);
    setShowQuestionModal(true);
  };

  const handleAddOption = () => {
    if (!currentOption.label.trim()) {
      toast.error('Please enter an option label');
      return;
    }

    const optionValue = currentOption.value || currentOption.label;
    setNewQuestion({
      ...newQuestion,
      options: [
        ...(newQuestion.options || []),
        { label: currentOption.label, value: optionValue, helpText: currentOption.helpText },
      ],
    });
    setCurrentOption({ label: '', value: '', helpText: '' });
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
          `/api/admin/questionnaires/${selectedQuestionnaire}/questions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question),
          }
        );

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to add question');
        }
      }

      toast.success(`${questions.length} questions added!`);
      setQuestions([]);
      setShowQuestionModal(false);
      setCurrentQuestionnaire(null);
      setSelectedQuestionnaire(null);
      setManagingQuestionsId?.(null);
      
      onQuestionnaireCreated?.();
    } catch (error: any) {
      console.error('Error saving questions:', error);
      toast.error(error.message || 'Failed to save questions');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestionnaire = (questionnaire: Questionnaire) => {
    setTitle(questionnaire.title);
    setDescription(questionnaire.description);
    setStartDate(questionnaire.startDate);
    setEndDate(questionnaire.endDate || '');
    setIsRequired(questionnaire.isRequired);
    setShowOnCheckIn(questionnaire.showOnCheckIn);
    setCurrentQuestionnaire(questionnaire);
    setIsEditingDetails(true);
    setOpen(true);
  };

  const handleCloseQuestionnaire = () => {
    setShowQuestionModal(false);
    setCurrentQuestionnaire(null);
    setSelectedQuestionnaire(null);
    setQuestions([]);
  };

  return (
    <>
      {/* Create/Edit Questionnaire Dialog */}
      <Dialog 
        open={open || showBuilder} 
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            setIsEditingDetails(false);
            setTitle('');
            setDescription('');
            setStartDate('');
            setEndDate('');
            setIsRequired(true);
            setShowOnCheckIn(false);
            setCurrentQuestionnaire(null);
            setShowBuilder?.(false);
            onEditClose?.();
          }
          setOpen(newOpen);
        }}
      >
        <DialogTrigger asChild>
          <Button>Create Questionnaire</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingDetails ? 'Edit Questionnaire Details' : 'Create New Questionnaire'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
                rows={2}
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
              {isEditingDetails ? 'Update Questionnaire' : 'Create Questionnaire'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Questions Dialog */}
      <Dialog 
        open={showQuestionModal} 
        onOpenChange={(newOpen) => {
          setShowQuestionModal(newOpen);
          if (!newOpen) {
            setManagingQuestionsId?.(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentQuestionnaire && `${currentQuestionnaire.title} - Manage Questions`}
            </DialogTitle>
          </DialogHeader>

          {currentQuestionnaire && (
            <div className="space-y-4">
              <Tabs defaultValue="add-question" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="add-question">Add Question</TabsTrigger>
                  <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                  <TabsTrigger value="options">Options</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                </TabsList>

                {/* Add Question Tab */}
                <TabsContent value="add-question" className="space-y-4">
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
                        <SelectItem value="checkbox">Checkbox (Multiple)</SelectItem>
                        <SelectItem value="dropdown">Dropdown</SelectItem>
                        <SelectItem value="rating">Rating (1-5)</SelectItem>
                        <SelectItem value="open_ended">Open Ended</SelectItem>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="placeholder">Placeholder Text</Label>
                    <Input
                      id="placeholder"
                      placeholder="e.g., Type your answer here..."
                      value={newQuestion.placeholder}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, placeholder: e.target.value })
                      }
                    />
                  </div>

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
                    <Label htmlFor="required">Required*</Label>
                  </div>
                </TabsContent>

                {/* View Questions Tab */}
                <TabsContent value="questions" className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No questions added yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Add the first question using the "Add Question" tab</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-900 border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                Q{idx + 1}. {q.title}
                              </p>
                              {q.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{q.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditQuestion(idx)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveQuestion(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded w-fit">
                            Type: {q.type}
                            {q.required && ' (Required)'}
                          </p>
                          {q.options && q.options.length > 0 && (
                            <div className="text-xs space-y-1 mt-2">
                              <p className="font-medium text-gray-700 dark:text-gray-300">Options:</p>
                              {q.options.map((opt, oi) => (
                                <p key={oi} className="text-gray-600 dark:text-gray-400 ml-2">
                                  • {opt.label}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Options Tab */}
                {(newQuestion.type === 'multiple_choice' ||
                  newQuestion.type === 'dropdown' ||
                  newQuestion.type === 'checkbox' ||
                  newQuestion.type === 'rating') && (
                  <TabsContent value="options" className="space-y-4">
                    {newQuestion.type === 'rating' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Min Rating</Label>
                            <Input
                              type="number"
                              min="1"
                              value={newQuestion.minRating}
                              onChange={(e) =>
                                setNewQuestion({
                                  ...newQuestion,
                                  minRating: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Max Rating</Label>
                            <Input
                              type="number"
                              min="1"
                              value={newQuestion.maxRating}
                              onChange={(e) =>
                                setNewQuestion({
                                  ...newQuestion,
                                  maxRating: parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Min Label</Label>
                          <Input
                            placeholder="e.g., Very Unsatisfied"
                            value={newQuestion.minRatingLabel}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                minRatingLabel: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Max Label</Label>
                          <Input
                            placeholder="e.g., Very Satisfied"
                            value={newQuestion.maxRatingLabel}
                            onChange={(e) =>
                              setNewQuestion({
                                ...newQuestion,
                                maxRatingLabel: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label>Add Options</Label>
                          <div className="space-y-2 mb-3">
                            <Input
                              placeholder="Option label"
                              value={currentOption.label}
                              onChange={(e) =>
                                setCurrentOption({
                                  ...currentOption,
                                  label: e.target.value,
                                })
                              }
                            />
                            <Input
                              placeholder="Option value (optional)"
                              value={currentOption.value}
                              onChange={(e) =>
                                setCurrentOption({
                                  ...currentOption,
                                  value: e.target.value,
                                })
                              }
                            />
                            <Textarea
                              placeholder="Help text for this option (optional)"
                              value={currentOption.helpText}
                              onChange={(e) =>
                                setCurrentOption({
                                  ...currentOption,
                                  helpText: e.target.value,
                                })
                              }
                              rows={2}
                            />
                            <Button size="sm" onClick={handleAddOption} className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(newQuestion.options || []).map((option, i) => (
                            <div
                              key={i}
                              className="bg-white dark:bg-gray-900 p-3 rounded border space-y-1"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{option.label}</p>
                                  {option.value !== option.label && (
                                    <p className="text-xs text-gray-500">Value: {option.value}</p>
                                  )}
                                  {option.helpText && (
                                    <p className="text-xs text-gray-500 italic">
                                      Help: {option.helpText}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveOption(i)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                )}

                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <Label htmlFor="helpText">Help Text</Label>
                    <Textarea
                      id="helpText"
                      placeholder="Additional help text for respondents..."
                      value={newQuestion.helpText}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, helpText: e.target.value })
                      }
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="defaultValue">Default Value</Label>
                    <Input
                      id="defaultValue"
                      placeholder="Pre-fill answer"
                      value={newQuestion.defaultValue}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, defaultValue: e.target.value })
                      }
                    />
                  </div>

                  {(newQuestion.type === 'multiple_choice' ||
                    newQuestion.type === 'dropdown' ||
                    newQuestion.type === 'checkbox') && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="randomize"
                          checked={newQuestion.randomizeOptions}
                          onCheckedChange={(checked) =>
                            setNewQuestion({
                              ...newQuestion,
                              randomizeOptions: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="randomize">Randomize Options</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="showNumbers"
                          checked={newQuestion.showNumbers}
                          onCheckedChange={(checked) =>
                            setNewQuestion({
                              ...newQuestion,
                              showNumbers: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="showNumbers">Show Numbers</Label>
                      </div>
                    </>
                  )}

                  <div>
                    <Label className="mb-3 block">Conditional Logic</Label>
                    <Card className="p-3 bg-white dark:bg-gray-900 text-sm">
                      <p className="text-gray-500 mb-2">
                        This question will only show if conditions are met. (Feature for future enhancement)
                      </p>
                      <Button size="sm" disabled className="opacity-50">
                        Add Condition
                      </Button>
                    </Card>
                  </div>
                </TabsContent>

                {/* Validation Tab */}
                <TabsContent value="validation" className="space-y-4">
                  {(newQuestion.type === 'text' || newQuestion.type === 'open_ended') && (
                    <>
                      <div>
                        <Label>Min Length</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newQuestion.validation?.minLength || ''}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              validation: {
                                ...newQuestion.validation,
                                minLength: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max Length</Label>
                        <Input
                          type="number"
                          min="0"
                          value={newQuestion.validation?.maxLength || ''}
                          onChange={(e) =>
                            setNewQuestion({
                              ...newQuestion,
                              validation: {
                                ...newQuestion.validation,
                                maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Custom Validation Pattern (regex)</Label>
                    <Input
                      placeholder="e.g., ^[0-9]{10}$"
                      value={newQuestion.validation?.pattern || ''}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          validation: {
                            ...newQuestion.validation,
                            pattern: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Custom Error Message</Label>
                    <Input
                      placeholder="Message to show if validation fails"
                      value={newQuestion.validation?.customError || ''}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          validation: {
                            ...newQuestion.validation,
                            customError: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleAddQuestion} className="flex-1">
                  {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                </Button>
                <Button
                  onClick={() => {
                    resetQuestionForm();
                    if (editingQuestionIndex === null) {
                      setShowQuestionModal(false);
                    }
                    setEditingQuestionIndex(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  {editingQuestionIndex !== null ? 'Cancel Edit' : 'Cancel'}
                </Button>
              </div>

              {questions.length > 0 && (
                <div className="border-t pt-4 mt-6">
                  <Button 
                    onClick={handleSaveQuestions} 
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save All Questions ({questions.length})
                  </Button>
                  <Button 
                    onClick={handleCloseQuestionnaire}
                    variant="ghost"
                    className="w-full mt-2"
                  >
                    Close Without Saving
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
