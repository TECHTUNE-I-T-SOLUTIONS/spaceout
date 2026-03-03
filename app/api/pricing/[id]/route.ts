import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Pricing from '@/lib/models/Pricing';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();
    const { id } = params;

    const pricing = await Pricing.findByIdAndDelete(id);

    if (!pricing) {
      return NextResponse.json({ message: 'Pricing plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pricing plan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete pricing plan' },
      { status: 500 }
    );
  }
}
