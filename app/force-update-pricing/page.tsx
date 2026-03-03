'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ForceUpdatePricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runForceUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/force-update-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer force-update-token-12345',
        },
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success('Force update completed! Check console for details.');
      } else {
        toast.error(data.message || 'Force update failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to run force update');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Force Update Pricing Fields</h1>
          
          <div className="space-y-4 mb-6">
            <p className="text-muted-foreground">
              This will forcefully update all documents in the services collection to include non-WiFi pricing fields.
            </p>
            <p className="text-sm text-amber-600">
              <strong>Warning:</strong> This operation bypasses Mongoose and directly modifies MongoDB. Use with caution.
            </p>
          </div>

          <Button 
            onClick={runForceUpdate}
            disabled={isLoading}
            size="lg"
            className="mb-8 bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Running force update...' : 'Run Force Update'}
          </Button>

          {result && (
            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-bold">Results:</h2>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-mono text-sm whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
