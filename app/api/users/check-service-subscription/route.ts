import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/db';

let authOptions: any;

interface CustomSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

async function getAuthOptions() {
  if (!authOptions) {
    authOptions = (await import('@/auth')).authOptions;
  }
  return authOptions;
}

export async function GET(request: NextRequest) {
  try {
    const options = await getAuthOptions();
    const session = (await getServerSession(options)) as CustomSession | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          hasActiveSubscription: false,
          subscription: null,
        },
        { status: 200 }
      );
    }

    // Get serviceId from query parameters
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const { default: UserSubscription } = await import('@/lib/models/UserSubscription');

    // Check if user has active subscription for this service
    const subscription = await UserSubscription.findOne({
      userId: session.user.id,
      serviceId: serviceId,
      status: 'active',
      expiryDate: { $gt: new Date() },
    }).lean();

    if (subscription) {
      return NextResponse.json(
        {
          hasActiveSubscription: true,
          subscription: {
            _id: subscription._id,
            planName: subscription.planName,
            serviceName: subscription.serviceName,
            expiryDate: subscription.expiryDate,
            isAccessCard: subscription.isAccessCard,
            price: subscription.price,
            purchaseDate: subscription.purchaseDate,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        hasActiveSubscription: false,
        subscription: null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error checking service subscription:', error);
    return NextResponse.json(
      {
        hasActiveSubscription: false,
        subscription: null,
        error: 'Failed to check subscription',
        message: error.message,
      },
      { status: 200 }
    );
  }
}
