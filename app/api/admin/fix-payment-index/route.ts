import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const Payment = (await import('@/lib/models/Payment')).default;

    // Get the database connection
    const db = Payment.collection.conn.db;

    // List all indexes on the payments collection
    const indexes = await Payment.collection.listIndexes().toArray();
    console.log('Current indexes:', indexes);

    // Drop the problematic paymentReference index if it exists
    const paymentRefIndex = indexes.find(
      (idx: any) => idx.name === 'paymentReference_1'
    );

    if (paymentRefIndex) {
      console.log('Dropping paymentReference_1 index...');
      await Payment.collection.dropIndex('paymentReference_1');
      console.log('Index dropped successfully');
    }

    // Delete all documents with null paymentReference except one
    const nullPayments = await Payment.find({ paymentReference: null });
    console.log(`Found ${nullPayments.length} payments with null paymentReference`);

    if (nullPayments.length > 1) {
      // Keep the first one, delete the rest
      const idsToDelete = nullPayments.slice(1).map((p: any) => p._id);
      const result = await Payment.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`Deleted ${result.deletedCount} duplicate null paymentReference documents`);
    }

    // Update remaining null paymentReference records with unique values
    const remainingNulls = await Payment.find({ paymentReference: null });
    for (const payment of remainingNulls) {
      const uniqueRef = `SUB-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;
      payment.paymentReference = uniqueRef;
      await payment.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Database index fixed successfully',
        details: {
          indexDropped: paymentRefIndex ? 'paymentReference_1' : 'Not found',
          nullPaymentsCleanedUp: nullPayments.length > 1 ? nullPayments.length - 1 : 0,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fixing payment index:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fix database index',
      },
      { status: 500 }
    );
  }
}
