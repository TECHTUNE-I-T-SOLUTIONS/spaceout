'use client';

import { Suspense } from 'react';
import PaymentResultContent from './content';

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Loading...</p></div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
