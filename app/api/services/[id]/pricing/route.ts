import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { planIndex, planData } = body;

    console.log('[PUT /pricing] Received planData:', JSON.stringify(planData, null, 2));

    if (planIndex === undefined || !planData) {
      return NextResponse.json(
        { message: 'planIndex and planData are required' },
        { status: 400 }
      );
    }

    // Get the service and update the specific pricing plan
    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    if (planIndex < 0 || planIndex >= service.pricingPlans.length) {
      return NextResponse.json(
        { message: 'Invalid plan index' },
        { status: 400 }
      );
    }

    // Build the update object with explicit field paths using MongoDB dot notation
    const updateFields: any = {};
    
    // Map each field to its update path
    if (planData.planName !== undefined) updateFields[`pricingPlans.${planIndex}.planName`] = planData.planName;
    if (planData.planType !== undefined) updateFields[`pricingPlans.${planIndex}.planType`] = planData.planType;
    if (planData.durationLabel !== undefined) updateFields[`pricingPlans.${planIndex}.durationLabel`] = planData.durationLabel;
    if (planData.durationInDays !== undefined) updateFields[`pricingPlans.${planIndex}.durationInDays`] = planData.durationInDays;
    if (planData.durationInHours !== undefined) updateFields[`pricingPlans.${planIndex}.durationInHours`] = planData.durationInHours;
    if (planData.isPerHead !== undefined) updateFields[`pricingPlans.${planIndex}.isPerHead`] = planData.isPerHead;
    if (planData.memberPrice !== undefined) updateFields[`pricingPlans.${planIndex}.memberPrice`] = planData.memberPrice;
    if (planData.nonMemberPrice !== undefined) updateFields[`pricingPlans.${planIndex}.nonMemberPrice`] = planData.nonMemberPrice;
    if (planData.flatPrice !== undefined) updateFields[`pricingPlans.${planIndex}.flatPrice`] = planData.flatPrice;
    
    // CRITICAL: Always set non-WiFi fields, even if undefined, so they get saved
    updateFields[`pricingPlans.${planIndex}.nonWifiPrice`] = planData.nonWifiPrice;
    updateFields[`pricingPlans.${planIndex}.nonWifiPriceMember`] = planData.nonWifiPriceMember;
    updateFields[`pricingPlans.${planIndex}.nonWifiPriceNonMember`] = planData.nonWifiPriceNonMember;
    
    if (planData.requiresMembershipCard !== undefined) updateFields[`pricingPlans.${planIndex}.requiresMembershipCard`] = planData.requiresMembershipCard;
    if (planData.accessCardFee !== undefined) updateFields[`pricingPlans.${planIndex}.accessCardFee`] = planData.accessCardFee;

    console.log('[PUT /pricing] Update fields:', JSON.stringify(updateFields, null, 2));

    // Try aggregation pipeline approach to forcefully rebuild the plan
    const updateResult = await Service.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      [
        {
          $set: {
            pricingPlans: {
              $map: {
                input: '$pricingPlans',
                as: 'plan',
                in: {
                  $cond: [
                    { $eq: [{ $indexOfArray: ['$pricingPlans', '$$plan'] }, planIndex] },
                    {
                      // Update this specific plan with all fields explicitly
                      _id: '$$plan._id',
                      planName: planData.planName ?? '$$plan.planName',
                      planType: planData.planType ?? '$$plan.planType',
                      durationLabel: planData.durationLabel ?? '$$plan.durationLabel',
                      durationInDays: { $ifNull: [planData.durationInDays, '$$plan.durationInDays'] },
                      durationInHours: { $ifNull: [planData.durationInHours, '$$plan.durationInHours'] },
                      isPerHead: planData.isPerHead ?? { $ifNull: ['$$plan.isPerHead', false] },
                      memberPrice: { $ifNull: [planData.memberPrice, '$$plan.memberPrice'] },
                      nonMemberPrice: { $ifNull: [planData.nonMemberPrice, '$$plan.nonMemberPrice'] },
                      flatPrice: { $ifNull: [planData.flatPrice, '$$plan.flatPrice'] },
                      nonWifiPrice: { $ifNull: [planData.nonWifiPrice, '$$plan.nonWifiPrice'] },
                      nonWifiPriceMember: { $ifNull: [planData.nonWifiPriceMember, '$$plan.nonWifiPriceMember'] },
                      nonWifiPriceNonMember: { $ifNull: [planData.nonWifiPriceNonMember, '$$plan.nonWifiPriceNonMember'] },
                      requiresMembershipCard: planData.requiresMembershipCard ?? { $ifNull: ['$$plan.requiresMembershipCard', false] },
                      accessCardFee: { $ifNull: [planData.accessCardFee, '$$plan.accessCardFee'] },
                    },
                    // Keep other plans unchanged but ensure they have all fields
                    {
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
                  ],
                },
              },
            },
          },
        },
      ]
    );

    console.log('[PUT /pricing] Aggregation update result:', updateResult);

    // Fetch the updated document
    const updatedService = await Service.findById(id).populate('branchId').lean();

    console.log('[PUT /pricing] Saved pricing plan after update (via lean):', JSON.stringify(updatedService?.pricingPlans[planIndex], null, 2));

    // Also check directly in MongoDB to see what's actually stored
    const db = mongoose.connection.db;
    if (db) {
      const rawDoc = await db.collection('services').findOne({ _id: new mongoose.Types.ObjectId(id) });
      console.log('[PUT /pricing] Raw MongoDB document (plan at index):', JSON.stringify(rawDoc?.pricingPlans[planIndex], null, 2));
    }

    return NextResponse.json(updatedService, { status: 200 });
  } catch (error: any) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update pricing plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const body = await request.json();
    const { planIndex } = body;

    if (planIndex === undefined) {
      return NextResponse.json(
        { message: 'planIndex is required' },
        { status: 400 }
      );
    }

    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    if (planIndex < 0 || planIndex >= service.pricingPlans.length) {
      return NextResponse.json(
        { message: 'Invalid plan index' },
        { status: 400 }
      );
    }

    // Remove the pricing plan at the specified index
    service.pricingPlans.splice(planIndex, 1);

    await service.save();
    await service.populate('branchId');

    return NextResponse.json(service, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete pricing plan' },
      { status: 500 }
    );
  }
}
