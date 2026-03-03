'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PricingFixPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fix-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fix-pricing-token-12345',
        },
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        toast.success('Pricing fix completed!');
      } else {
        toast.error(data.message || 'Fix failed');
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to run fix');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-6">Pricing Fields Fix</h1>
          
          <p className="text-muted-foreground mb-6">
            This will update all existing pricing plans to include non-WiFi pricing fields.
          </p>

          <Button 
            onClick={runFix}
            disabled={isLoading}
            size="lg"
            className="mb-8"
          >
            {isLoading ? 'Running fix...' : 'Run Fix'}
          </Button>

          {result && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Results:</h2>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
