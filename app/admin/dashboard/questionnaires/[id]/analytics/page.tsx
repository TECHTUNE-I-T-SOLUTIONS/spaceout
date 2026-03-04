'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function QuestionnaireAnalyticsPage() {
  const params = useParams();
  const questionnaireId = params.id as string;
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/admin/questionnaires/${questionnaireId}/analytics`);
        if (!response.ok) throw new Error('Failed to fetch analytics');

        const data = await response.json();
        setAnalytics(data);
      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    if (questionnaireId) {
      fetchAnalytics();
    }
  }, [questionnaireId]);

  const handleExportCSV = () => {
    if (!analytics) return;

    let csv = 'Question,Type,Total Answered,Responses\n';

    analytics.questionAnalytics.forEach((q: any) => {
      let responses = '';

      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        responses = Object.entries(q.distribution)
          .map(([key, value]: [string, any]) => `${key} (${value})`)
          .join('; ');
      } else if (q.type === 'rating') {
        responses = `Average: ${q.avgRating?.toFixed(2)}`;
      } else if (q.type === 'open_ended') {
        responses = `(${q.responses?.length || 0} responses)`;
      }

      csv += `"${q.title}","${q.type}",${q.totalAnswered},"${responses}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questionnaire-analytics-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Analytics exported as CSV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Questionnaire Analytics</h1>
            <p className="text-gray-600 mt-2">Detailed response analysis and insights</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.totalResponses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.completionRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.questionAnalytics.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Analytics */}
        <div className="space-y-6">
          {analytics.questionAnalytics.map((question: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{question.title}</CardTitle>
                <CardDescription>
                  {question.type} • {question.totalAnswered} responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Multiple Choice / Dropdown */}
                {(question.type === 'multiple_choice' || question.type === 'dropdown') && (
                  <div className="space-y-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={Object.entries(question.distribution).map(
                            ([key, value]: [string, any]) => ({
                              name: key,
                              responses: value,
                            })
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="responses" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Distribution Table */}
                    <div className="space-y-2">
                      {Object.entries(question.distribution).map(
                        ([key, value]: [string, any]) => {
                          const percentage =
                            question.totalAnswered > 0
                              ? ((value / question.totalAnswered) * 100).toFixed(1)
                              : '0';
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm">{key}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gray-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-16 text-right">
                                  {value} ({percentage}%)
                                </span>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Rating */}
                {question.type === 'rating' && (
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold text-gray-600">
                        {question.avgRating?.toFixed(2)} / 5
                      </div>
                      <p className="text-gray-600">Average Rating</p>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <div key={rating} className="text-center">
                          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 font-semibold">
                            {rating}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">⭐</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Open Ended */}
                {question.type === 'open_ended' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">All Responses:</p>
                    {question.responses && question.responses.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {question.responses.map((response: string, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-200">
                            <p className="text-sm">{response}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No responses yet</p>
                    )}
                  </div>
                )}

                {/* Checkbox */}
                {question.type === 'checkbox' && (
                  <div className="space-y-2">
                    {Object.entries(question.distribution).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <span className="text-sm">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
