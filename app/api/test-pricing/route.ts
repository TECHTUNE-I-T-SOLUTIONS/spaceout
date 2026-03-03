import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

/**
 * TEST ENDPOINT: Validates that non-WiFi pricing fields can be saved and retrieved
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get the bearer token from the request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer test-pricing-token-12345') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find a service with pricing plans
    const service = await Service.findOne({ pricingPlans: { $exists: true, $ne: [] } });

    if (!service) {
      return NextResponse.json(
        { message: 'No services with pricing plans found' },
        { status: 404 }
      );
    }

    // Create a test plan with ALL fields including non-WiFi fields
    const testPlan = {
      planName: 'Test Plan - WiFi Fields',
      planType: 'workspace',
      durationLabel: 'Test',
      durationInDays: 1,
      isPerHead: false,
      memberPrice: 1000,
      nonMemberPrice: 1500,
      flatPrice: 2000,
      nonWifiPrice: 2500,
      nonWifiPriceMember: 800,
      nonWifiPriceNonMember: 1200,
      requiresMembershipCard: false,
    };

    // Use atomic $push to add the test plan
    const updatedService = await Service.findByIdAndUpdate(
      service._id,
      { $push: { pricingPlans: testPlan } },
      { new: true }
    );

    // Fetch the service again to verify ALL fields were saved
    const verifyService = await Service.findById(service._id);
    const savedPlan = verifyService?.pricingPlans[verifyService.pricingPlans.length - 1];

    const verification = {
      planSaved: !!savedPlan,
      fields: {
        planName: savedPlan?.planName === testPlan.planName,
        nonWifiPrice: savedPlan?.nonWifiPrice === testPlan.nonWifiPrice,
        nonWifiPriceMember: savedPlan?.nonWifiPriceMember === testPlan.nonWifiPriceMember,
        nonWifiPriceNonMember: savedPlan?.nonWifiPriceNonMember === testPlan.nonWifiPriceNonMember,
      },
      rawPlan: savedPlan,
    };

    // Check if all fields were actually saved (not undefined)
    const allFieldsSaved =
      savedPlan?.nonWifiPrice !== undefined &&
      savedPlan?.nonWifiPriceMember !== undefined &&
      savedPlan?.nonWifiPriceNonMember !== undefined;

    // Get the first plan from the original service for comparison
    const firstPlan = service.pricingPlans[0];

    return NextResponse.json(
      {
        message: allFieldsSaved ? 'Test passed! Fields are being saved correctly.' : 'Test failed! Some fields are missing.',
        success: allFieldsSaved,
        verification,
        existingPlan: {
          planName: firstPlan?.planName,
          hasNonWifiFields: {
            nonWifiPrice: firstPlan?.nonWifiPrice !== undefined,
            nonWifiPriceMember: firstPlan?.nonWifiPriceMember !== undefined,
            nonWifiPriceNonMember: firstPlan?.nonWifiPriceNonMember !== undefined,
          },
          rawData: firstPlan,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in test-pricing route:', error);
    return NextResponse.json(
      { message: 'Test failed', error: error.message },
      { status: 500 }
    );
  }
}
