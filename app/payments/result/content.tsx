'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function PaymentResultContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>(
    'loading'
  );
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setVerificationStatus('failed');
      setError('No payment reference provided');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setVerificationStatus('success');
          setPaymentData(data.payment);
          toast.success('Payment verified successfully!');
        } else {
          setVerificationStatus('failed');
          setError(data.error || 'Payment verification failed');
          toast.error(data.error || 'Payment verification failed');
        }
      } catch (err: any) {
        setVerificationStatus('failed');
        setError(err.message || 'Failed to verify payment');
        toast.error('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {verificationStatus === 'loading' && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-center text-gray-600">
                Verifying your payment...
              </p>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'success' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-900">Payment Successful!</CardTitle>
              <CardDescription className="text-green-800">
                Your membership has been activated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentData && (
                <div className="space-y-3 bg-white p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-semibold">
                      ₦{paymentData.amount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  {paymentData.membershipDays && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Membership Duration:</span>
                      <span className="font-semibold">
                        {paymentData.membershipDays} days
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-semibold text-green-600">
                      {paymentData.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">What's Next?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Access unlimited services</li>
                  <li>✓ Priority customer support</li>
                  <li>✓ Exclusive member features</li>
                  <li>✓ Early access to new offerings</li>
                </ul>
              </div>

              <div className="space-y-2 pt-4">
                <Link href="/user/dashboard" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                A confirmation email has been sent to your registered email address.
              </p>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'failed' && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-red-900">Payment Failed</CardTitle>
              <CardDescription className="text-red-800">
                {error || 'Unable to process your payment'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {error || 'Your payment could not be verified. Please try again or contact support.'}
                </p>
              </div>

              <div className="space-y-2">
                <Link href="/payments" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Try Again
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                If the problem persists, please contact our support team.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
