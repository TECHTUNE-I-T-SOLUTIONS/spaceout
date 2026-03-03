import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';
import mongoose from 'mongoose';

/**
 * DEBUG ENDPOINT: Compare what's in MongoDB vs what Mongoose returns
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer debug-pricing-token-12345') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find a service with pricing plans
    const service = await Service.findOne({ pricingPlans: { $exists: true, $ne: [] } });

    if (!service) {
      return NextResponse.json({ message: 'No services found' }, { status: 404 });
    }

    const serviceId = service._id;
    const firstPlanIndex = 0;

    console.log('\n=== PRICING DEBUG REPORT ===');

    // 1. What does Mongoose return (with schema)
    console.log('\n[1] Mongoose with Schema:');
    const mongooseDoc = await Service.findById(serviceId);
    const mongoosePlan = mongooseDoc?.pricingPlans[firstPlanIndex];
    console.log(JSON.stringify(mongoosePlan, null, 2));

    // 2. What does Mongoose return with lean()
    console.log('\n[2] Mongoose with lean() (bypasses schema):');
    const leanDoc = await Service.findById(serviceId).lean();
    const leanPlan = leanDoc?.pricingPlans[firstPlanIndex];
    console.log(JSON.stringify(leanPlan, null, 2));

    // 3. What's actually in MongoDB
    console.log('\n[3] Raw MongoDB (direct query):');
    const db = mongoose.connection.db;
    let rawPlan = null;
    if (db) {
      const rawDoc = await db.collection('services').findOne({ _id: new mongoose.Types.ObjectId(serviceId) });
      rawPlan = rawDoc?.pricingPlans[firstPlanIndex];
      console.log(JSON.stringify(rawPlan, null, 2));
    }

    // Compare them
    console.log('\n=== COMPARISON ===');
    const comparison = {
      mongooseFields: mongoosePlan ? Object.keys(mongoosePlan || {}) : [],
      leanFields: leanPlan ? Object.keys(leanPlan || {}) : [],
      rawFields: rawPlan ? Object.keys(rawPlan || {}) : [],
      missingInMongoose: leanPlan && mongoosePlan
        ? Object.keys(leanPlan).filter(k => !(k in mongoosePlan))
        : [],
      missingInDatabase: rawPlan && leanPlan
        ? Object.keys(leanPlan).filter(k => !(k in rawPlan))
        : [],
    };

    console.log(JSON.stringify(comparison, null, 2));

    return NextResponse.json(
      {
        serviceId: service._id.toString(),
        serviceName: service.name,
        mongooseView: mongoosePlan,
        leanView: leanPlan,
        rawMongoDB: rawPlan,
        analysis: {
          mongooseFieldCount: comparison.mongooseFields.length,
          leanFieldCount: comparison.leanFields.length,
          rawFieldCount: comparison.rawFields.length,
          fieldsLostByMongoose: comparison.missingInMongoose,
          fieldsNotInDatabase: comparison.missingInDatabase,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in debug-pricing:', error);
    return NextResponse.json(
      { message: 'Debug failed', error: error.message },
      { status: 500 }
    );
  }
}
