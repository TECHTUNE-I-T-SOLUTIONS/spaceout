import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

/**
 * ONE-TIME FIX ROUTE: Updates all existing pricing plans to include non-WiFi fields
 * This is a temporary endpoint to migrate existing data
 * DELETE this route after running it once
 */
export async function POST(request: NextRequest) {
  try {
    // Security check - only allow from localhost or with a specific token
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer fix-pricing-token-12345') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find all services with pricing plans
    const services = await Service.find({ pricingPlans: { $exists: true, $ne: [] } });

    console.log(`Found ${services.length} services to update`);

    const results = [];

    for (const service of services) {
      try {
        const updates: any = { $set: {} };
        let hasChanges = false;

        // Check each pricing plan and add missing non-WiFi fields
        for (let i = 0; i < service.pricingPlans.length; i++) {
          const plan = service.pricingPlans[i];
          
          // If any non-WiFi field is missing, add all of them
          if (!plan.nonWifiPrice || !plan.nonWifiPriceMember || !plan.nonWifiPriceNonMember) {
            // Set the fields to the values they already have or null if not present
            updates.$set[`pricingPlans.${i}.nonWifiPrice`] = plan.nonWifiPrice || null;
            updates.$set[`pricingPlans.${i}.nonWifiPriceMember`] = plan.nonWifiPriceMember || null;
            updates.$set[`pricingPlans.${i}.nonWifiPriceNonMember`] = plan.nonWifiPriceNonMember || null;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          // Use atomic update with $set operator
          const updatedService = await Service.findByIdAndUpdate(
            service._id,
            updates,
            { new: true }
          );

          const firstPlan = updatedService?.pricingPlans[0];
          
          results.push({
            serviceId: service._id,
            serviceName: service.name,
            planCount: service.pricingPlans.length,
            updated: true,
            verification: {
              fieldsSaved: {
                nonWifiPrice: firstPlan?.nonWifiPrice !== undefined,
                nonWifiPriceMember: firstPlan?.nonWifiPriceMember !== undefined,
                nonWifiPriceNonMember: firstPlan?.nonWifiPriceNonMember !== undefined,
              },
              samplePlan: firstPlan ? {
                planName: firstPlan.planName,
                nonWifiPrice: firstPlan.nonWifiPrice,
                nonWifiPriceMember: firstPlan.nonWifiPriceMember,
                nonWifiPriceNonMember: firstPlan.nonWifiPriceNonMember,
              } : null,
            },
          });
          console.log(`✓ Updated service: ${service.name}`);
        }
      } catch (error: any) {
        console.error(`✗ Failed to update service ${service._id}:`, error.message);
        results.push({
          serviceId: service._id,
          serviceName: service.name,
          updated: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json(
      {
        message: 'Pricing plans update completed',
        totalServices: services.length,
        results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in fix-pricing route:', error);
    return NextResponse.json(
      { message: 'Fix failed', error: error.message },
      { status: 500 }
    );
  }
}
