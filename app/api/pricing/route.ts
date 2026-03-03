import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';
import ErrorLog from '@/lib/models/ErrorLog';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // Fetch all services and extract their pricing plans
    let query: any = { isActive: true };

    if (branchId) {
      query.branchId = branchId;
    }

    const services = await Service.find(query)
      .populate('branchId', 'name location')
      .lean();

    // Flatten pricing plans from all services
    const allPricingPlans: any[] = [];
    services.forEach((service: any) => {
      if (service.pricingPlans && Array.isArray(service.pricingPlans)) {
        service.pricingPlans.forEach((plan: any, index: number) => {
          allPricingPlans.push({
            ...plan,
            serviceId: service._id,
            serviceName: service.name,
            planIndex: index,
          });
        });
      }
    });

    return NextResponse.json(allPricingPlans);
  } catch (error: any) {
    console.error('Error fetching pricing plans:', error);

    await ErrorLog.create({
      route: '/api/pricing',
      error: error.message || 'Failed to fetch pricing plans',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch pricing plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      serviceId,
      branchId,
      planName,
      planType,
      durationLabel,
      durationInHours,
      durationInDays,
      flatPrice,
      memberPrice,
      nonMemberPrice,
      nonWifiPrice,
      nonWifiPriceMember,
      nonWifiPriceNonMember,
      isPerHead,
      requiresMembershipCard,
      accessCardFee,
    } = body;

    // Validate required fields
    if (!serviceId || !branchId || !planName) {
      return NextResponse.json(
        { message: 'serviceId, branchId, and planName are required' },
        { status: 400 }
      );
    }

    // Create pricing plan object with ALL fields explicitly defined
    const pricingPlan: any = {
      planName: planName || '',
      planType: planType || 'workspace',
      durationLabel: durationLabel || 'Custom',
      durationInDays: durationInDays ? parseInt(durationInDays) : undefined,
      durationInHours: durationInHours ? parseInt(durationInHours) : undefined,
      isPerHead: isPerHead || false,
      memberPrice: memberPrice ? parseFloat(memberPrice) : undefined,
      nonMemberPrice: nonMemberPrice ? parseFloat(nonMemberPrice) : undefined,
      flatPrice: flatPrice ? parseFloat(flatPrice) : undefined,
      nonWifiPrice: nonWifiPrice ? parseFloat(nonWifiPrice) : undefined,
      nonWifiPriceMember: nonWifiPriceMember ? parseFloat(nonWifiPriceMember) : undefined,
      nonWifiPriceNonMember: nonWifiPriceNonMember ? parseFloat(nonWifiPriceNonMember) : undefined,
      requiresMembershipCard: requiresMembershipCard || false,
      accessCardFee: accessCardFee && requiresMembershipCard ? parseFloat(accessCardFee) : undefined,
    };

    // Update service with new pricing plan
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    // Add the pricing plan and save
    console.log('[POST /pricing] Adding pricing plan:', JSON.stringify(pricingPlan, null, 2));
    service.pricingPlans.push(pricingPlan);
    service.markModified('pricingPlans');
    const savedService = await service.save();
    
    console.log('[POST /pricing] Saved pricing plan (initial):', JSON.stringify(savedService.pricingPlans[savedService.pricingPlans.length - 1], null, 2));

    // Fetch fresh using lean() to get raw MongoDB data
    const updatedService = await Service.findById(serviceId).lean();
    const savedPlan = updatedService?.pricingPlans[updatedService.pricingPlans.length - 1];
    
    console.log('[POST /pricing] Saved pricing plan (via lean):', JSON.stringify(savedPlan, null, 2));

    // Check directly in MongoDB
    const db = mongoose.connection.db;
    if (db) {
      const rawDoc = await db.collection('services').findOne({ _id: new mongoose.Types.ObjectId(serviceId) });
      const lastPlan = rawDoc?.pricingPlans[rawDoc.pricingPlans.length - 1];
      console.log('[POST /pricing] Raw MongoDB document (last pricing plan):', JSON.stringify(lastPlan, null, 2));
    }

    if (!updatedService) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedService, { status: 201 });
  } catch (error: any) {
    console.error('Error creating pricing plan:', error);

    await ErrorLog.create({
      route: '/api/pricing',
      error: error.message || 'Failed to create pricing plan',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to create pricing plan',  error: error.message },
      { status: 500 }
    );
  }
}
