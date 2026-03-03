'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuestionnaireResponder from '@/components/questionnaire-responder';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Question {
  _id: string;
  title: string;
  type: 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox';
  required: boolean;
  order: number;
  description?: string;
  options?: string[];
}

interface Questionnaire {
  _id: string;
  title: string;
  description?: string;
  status: 'published' | 'archived';
  totalResponses: number;
  questions: Question[];
  startDate: string;
  endDate?: string;
  isRequired: boolean;
  createdAt: string;
}

export default function UserQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [completedQuestionnaires, setCompletedQuestionnaires] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [responderOpen, setResponderOpen] = useState(false);

  useEffect(() => {
    fetchQuestionnaires();
    fetchCompletedQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/questionnaires');
      if (!res.ok) throw new Error('Failed to fetch questionnaires');

      const data = await res.json();
      setQuestionnaires(data);
    } catch (error: any) {
      console.error('Error fetching questionnaires:', error);
      toast.error('Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedQuestionnaires = async () => {
    try {
      const res = await fetch('/api/questionnaires/responses');
      if (!res.ok) throw new Error('Failed to fetch completed questionnaires');

      const data = await res.json();
      setCompletedQuestionnaires(data.map((r: any) => r.questionnaireId));
    } catch (error: any) {
      console.error('Error fetching completed questionnaires:', error);
    }
  };

  const handleOpenQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setResponderOpen(true);
  };

  const handleCompleteQuestionnaire = () => {
    if (selectedQuestionnaire) {
      setCompletedQuestionnaires([
        ...completedQuestionnaires,
        selectedQuestionnaire._id,
      ]);
    }
    setResponderOpen(false);
    fetchCompletedQuestionnaires();
  };

  const isCompleted = (questionnaireId: string) => {
    return completedQuestionnaires.includes(questionnaireId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Surveys</h1>
          <p className="text-gray-600 mt-2">
            Help us improve by completing our surveys
          </p>
        </div>

        {/* Questionnaires List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : questionnaires.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Surveys Available
              </h3>
              <p className="text-gray-600">Check back later for new surveys</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questionnaires.map((questionnaire) => {
              const completed = isCompleted(questionnaire._id);
              return (
                <Card
                  key={questionnaire._id}
                  className={`hover:shadow-lg transition-all ${
                    completed ? 'border-green-200' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">
                            {questionnaire.title}
                          </h3>
                          {completed ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          ) : questionnaire.isRequired ? (
                            <Badge className="bg-orange-500">Required</Badge>
                          ) : null}
                        </div>

                        {questionnaire.description && (
                          <p className="text-gray-600 mb-3">
                            {questionnaire.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {questionnaire.questions.length} question
                            {questionnaire.questions.length !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            ~{Math.ceil((questionnaire.questions.length * 0.5))} min
                          </div>
                          {questionnaire.endDate && (
                            <div className="flex items-center gap-1">
                              Expires{' '}
                              {formatDistanceToNow(
                                new Date(questionnaire.endDate),
                                { addSuffix: true }
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleOpenQuestionnaire(questionnaire)}
                        disabled={completed}
                        className="ml-4"
                        variant={completed ? 'outline' : 'default'}
                      >
                        {completed ? 'Completed' : 'Start Survey'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Completed Section */}
        {completedQuestionnaires.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-lg font-semibold mb-4">
              Thank you for completing {completedQuestionnaires.length} survey
              {completedQuestionnaires.length !== 1 ? 's' : ''}!
            </h2>
            <p className="text-gray-600">
              Your feedback helps us improve our services.
            </p>
          </div>
        )}
      </div>

      {/* Questionnaire Responder Modal */}
      {selectedQuestionnaire && (
        <QuestionnaireResponder
          questionnaire={selectedQuestionnaire}
          open={responderOpen}
          onOpenChange={setResponderOpen}
          onComplete={handleCompleteQuestionnaire}
        />
      )}
    </div>
  );
}
