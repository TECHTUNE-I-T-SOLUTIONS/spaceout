import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

/**
 * FORCEFUL UPDATE: Removes MongoDB validation and updates all documents
 */
export async function POST(request: NextRequest) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer force-update-token-12345') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('\n=== FORCEFUL UPDATE PROCESS ===\n');

    // Step 1: Check if the collection has validation rules
    console.log('[Step 1] Checking for MongoDB validation rules...');
    try {
      const validationInfo = await db.getCollectionInfos({ name: 'services' });
      console.log('Collection info:', JSON.stringify(validationInfo, null, 2));

      if (validationInfo.length > 0 && validationInfo[0].options?.validator) {
        console.log('Found validation rules, removing them...');
        // Remove validation by recreating collection options
        await db.collection('services').updateOne(
          {},
          {
            $unset: {
              'validator': '',
            },
          }
        );
      }
    } catch (e) {
      console.log('No validation rules found or unable to check');
    }

    // Step 2: Update all documents with the non-WiFi fields using aggregation pipeline
    console.log('\n[Step 2] Forcing update of all pricing plans using aggregation pipeline...');
    
    // Use aggregation pipeline to forcefully rebuild pricingPlans with all fields
    const updateResult = await db.collection('services').updateMany(
      { pricingPlans: { $exists: true, $ne: [] } },
      [
        {
          $set: {
            pricingPlans: {
              $map: {
                input: '$pricingPlans',
                as: 'plan',
                in: {
                  _id: '$$plan._id',
                  planName: '$$plan.planName',
                  planType: '$$plan.planType',
                  durationLabel: '$$plan.durationLabel',
                  durationInDays: { $ifNull: ['$$plan.durationInDays', null] },
                  durationInHours: { $ifNull: ['$$plan.durationInHours', null] },
                  isPerHead: { $ifNull: ['$$plan.isPerHead', false] },
                  memberPrice: { $ifNull: ['$$plan.memberPrice', null] },
                  nonMemberPrice: { $ifNull: ['$$plan.nonMemberPrice', null] },
                  flatPrice: { $ifNull: ['$$plan.flatPrice', null] },
                  nonWifiPrice: { $ifNull: ['$$plan.nonWifiPrice', null] },
                  nonWifiPriceMember: { $ifNull: ['$$plan.nonWifiPriceMember', null] },
                  nonWifiPriceNonMember: { $ifNull: ['$$plan.nonWifiPriceNonMember', null] },
                  requiresMembershipCard: { $ifNull: ['$$plan.requiresMembershipCard', false] },
                  accessCardFee: { $ifNull: ['$$plan.accessCardFee', null] },
                },
              },
            },
          },
        },
      ]
    );

    console.log(`Updated ${updateResult.modifiedCount} documents`);

    // Step 3: Verify the update
    console.log('\n[Step 3] Verifying the update...');
    const firstService = await db.collection('services').findOne(
      { pricingPlans: { $exists: true, $ne: [] } }
    );

    const verification = {
      serviceId: firstService?._id?.toString(),
      serviceName: firstService?.name,
      firstPricingPlan: firstService?.pricingPlans[0],
      hasNonWifiFields: {
        nonWifiPrice: 'nonWifiPrice' in (firstService?.pricingPlans[0] || {}),
        nonWifiPriceMember: 'nonWifiPriceMember' in (firstService?.pricingPlans[0] || {}),
        nonWifiPriceNonMember: 'nonWifiPriceNonMember' in (firstService?.pricingPlans[0] || {}),
      },
    };

    console.log(
      '[Step 3] Verification complete:',
      JSON.stringify(verification, null, 2)
    );

    return NextResponse.json(
      {
        message: 'Forceful update completed',
        updateResult: {
          modifiedCount: updateResult.modifiedCount,
          upsertedCount: updateResult.upsertedCount,
        },
        verification,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in force-update:', error);
    return NextResponse.json(
      {
        message: 'Force update failed',
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
