import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Service from '@/lib/models/Service';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch all active services and extract their pricing plans
    const services = await Service.find({ isActive: true })
      .populate('branchId', 'name')
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

    return NextResponse.json(
      { success: true, data: allPricingPlans },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}
