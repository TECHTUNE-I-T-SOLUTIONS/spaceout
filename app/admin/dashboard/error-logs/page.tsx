'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Loader2, Trash2, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ErrorLogEntry {
  _id: string;
  route: string;
  error: string;
  statusCode: number;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  timestamp: string;
  createdAt: string;
}

export default function ErrorLogsPage() {
  const [errorLogs, setErrorLogs] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLogEntry | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });

  useEffect(() => {
    fetchErrorLogs();
  }, [page]);

  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/error-logs?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setErrorLogs(data.data);
        setPagination(data.pagination);
        toast.success('Error Logs Loaded', {
          description: `Fetched ${data.data.length} error logs.`,
        });
      } else {
        toast.error('Failed to Load Error Logs', {
          description: 'Unable to fetch error logs.',
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Error', {
        description: 'Failed to load error logs.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to delete all error logs? This action cannot be undone.')) return;

    try {
      setClearingLogs(true);
      const response = await fetch('/api/admin/error-logs', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setErrorLogs([]);
        setPagination({ total: 0, pages: 1, limit: 20 });
        setPage(1);
        toast.success('Logs Cleared', {
          description: data.message,
        });
      } else {
        toast.error('Failed to Clear Logs', {
          description: 'Unable to delete error logs.',
        });
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Error', {
        description: 'Failed to clear error logs.',
      });
    } finally {
      setClearingLogs(false);
    }
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 500) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
    if (statusCode >= 400) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Error Logs</h1>
        <Button
          variant="destructive"
          onClick={handleClearLogs}
          disabled={clearingLogs || errorLogs.length === 0}
          className="flex items-center gap-2"
        >
          {clearingLogs ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 size={18} />
              Clear All Logs
            </>
          )}
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading error logs...</p>
        </Card>
      ) : errorLogs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">No Error Logs</h2>
          <p className="text-muted-foreground">
            Great! No errors have been recorded in the system.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="p-4 text-left">Route</th>
                  <th className="p-4 text-left">Error</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {errorLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/50">
                    <td className="p-4 font-mono text-xs">{log.route}</td>
                    <td className="p-4 max-w-xs truncate text-muted-foreground">
                      {log.error}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusCodeColor(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {log.userId ? (
                        <div>
                          <p className="font-medium">{log.userId.name}</p>
                          <p className="text-xs text-muted-foreground">{log.userId.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()} at{' '}
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Details"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/30">
              <div className="text-sm text-muted-foreground">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Error Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Complete information about the error
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6 pr-4">
              {/* Error Information */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Error Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Route</Label>
                    <p className="text-sm font-mono font-semibold mt-1 break-all bg-background p-2 rounded border">
                      {selectedLog.route}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Error Message
                    </Label>
                    <div className="text-sm font-semibold mt-1 break-words bg-background p-3 rounded border max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {selectedLog.error}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Status Code
                      </Label>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusCodeColor(selectedLog.statusCode)}`}>
                          {selectedLog.statusCode}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">User</Label>
                      <p className="text-sm font-semibold mt-1">
                        {selectedLog.userId ? selectedLog.userId.name : 'System'}
                      </p>
                    </div>
                  </div>

                  {selectedLog.userId && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        User Email
                      </Label>
                      <p className="text-sm font-semibold mt-1 break-all">
                        {selectedLog.userId.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Timeline
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Occurred At
                    </Label>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(selectedLog.timestamp).toLocaleDateString()} at{' '}
                      {new Date(selectedLog.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      Logged At
                    </Label>
                    <p className="text-sm font-semibold mt-1">
                      {new Date(selectedLog.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedLog.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
