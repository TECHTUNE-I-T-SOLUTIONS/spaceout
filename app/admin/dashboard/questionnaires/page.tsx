'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionnaireBuilder } from '@/components/questionnaire-builder';
import { Loader2, BarChart3, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Questionnaire {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  startDate: string;
  endDate?: string;
  isRequired: boolean;
  showOnCheckIn: boolean;
  totalResponses: number;
  questions?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuestionnaires();
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

  const handleDeleteQuestionnaire = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/questionnaires/${deleteId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete questionnaire');

      setQuestionnaires((prev) => prev.filter((q) => q._id !== deleteId));
      setDeleteId(null);
      toast.success('Questionnaire deleted');
    } catch (error: any) {
      console.error('Error deleting questionnaire:', error);
      toast.error('Failed to delete questionnaire');
    } finally {
      setDeleting(false);
    }
  };

  const publishQuestionnaire = async (id: string) => {
    try {
      const res = await fetch(`/api/questionnaires/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!res.ok) throw new Error('Failed to publish');

      setQuestionnaires((prev) =>
        prev.map((q) => (q._id === id ? { ...q, status: 'published' } : q))
      );
      toast.success('Questionnaire published');
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish questionnaire');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Questionnaires</h1>
            <p className="text-gray-600 mt-2">Create and manage surveys for your users</p>
          </div>
          <QuestionnaireBuilder onQuestionnnaireCreated={fetchQuestionnaires} />
        </div>

        {/* Questionnaires List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : questionnaires.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questionnaires Yet</h3>
              <p className="text-gray-600">Create your first questionnaire to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {questionnaires.map((questionnaire) => (
              <Card key={questionnaire._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{questionnaire.title}</h3>
                        <Badge className={`${statusColor(questionnaire.status)} text-white`}>
                          {questionnaire.status}
                        </Badge>
                      </div>

                      {questionnaire.description && (
                        <p className="text-gray-600 mb-3">{questionnaire.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Questions</p>
                          <p className="font-semibold text-lg">
                            {questionnaire.questions?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Responses</p>
                          <p className="font-semibold text-lg">{questionnaire.totalResponses}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(questionnaire.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Type</p>
                          <p className="text-sm">
                            {questionnaire.isRequired ? 'Required' : 'Optional'}
                          </p>
                        </div>
                      </div>

                      {questionnaire.showOnCheckIn && (
                        <div className="mt-3 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          ✓ Shows on Check-In
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      {questionnaire.totalResponses > 0 && (
                        <Link href={`/admin/dashboard/questionnaires/${questionnaire._id}/analytics`}>
                          <Button size="sm" variant="outline" title="View analytics">
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}

                      {questionnaire.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => publishQuestionnaire(questionnaire._id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Publish
                        </Button>
                      )}

                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(questionnaire._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Questionnaire</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the questionnaire and all its responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestionnaire}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
