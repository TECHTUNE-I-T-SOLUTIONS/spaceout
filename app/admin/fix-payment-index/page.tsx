'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function FixPaymentIndexPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFixIndex = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/fix-payment-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix index');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-white mb-4">🔧 Fix Payment Index</h1>
          <p className="text-slate-300 mb-6">
            This page will drop the problematic <code className="bg-slate-700 px-2 py-1 rounded text-sm">paymentReference_1</code> index and clean up duplicate null values from the database.
          </p>

          <Button
            onClick={handleFixIndex}
            disabled={loading}
            className="w-full mb-4"
            size="lg"
          >
            {loading ? 'Fixing...' : 'Fix Database Index'}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-green-950/30 border border-green-900/50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-400 mb-2">Success! ✓</h3>
                  <p className="text-green-300 text-sm mb-3">{result.message}</p>
                  <div className="text-xs text-green-300 space-y-1">
                    <p>Index Dropped: {result.details.indexDropped}</p>
                    <p>Duplicate Records Cleaned: {result.details.nullPaymentsCleanedUp}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-400 mb-2">Error</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
