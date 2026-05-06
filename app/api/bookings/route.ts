import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import mongoose, { Schema } from 'mongoose';
import dbConnect from '@/lib/db';
// Import the interface and schema directly
import { IBooking, BookingSchema } from '@/lib/models/Booking';
import Branch from '@/lib/models/Branch';
import Service from '@/lib/models/Service';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;
    const adminRole = cookieStore.get('admin_role')?.value;

    if (!session?.user && !adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session?.user as any)?.id || adminId;
    const userRole = (session?.user as any)?.role || adminRole;
    const branchId = (session?.user as any)?.branchId;

    await dbConnect();

    let query: any = {};

    if (userRole === 'user') {
      query.userId = userId;
    } else if (userRole === 'admin') {
      query.branchId = branchId;
    }

    const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
    const bookings = await BookingModel.find(query)
      .populate('userId', 'name email')
      .populate('serviceId', 'name category')
      .populate('branchId', 'name location')
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);

    await ErrorLog.create({
      route: '/api/bookings',
      error: error.message || 'Failed to fetch bookings',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Try next-auth session first
    let session = await getServerSession(authOptions) as any;
    let userId: string | undefined;
    let userRole: string | undefined;
    let branchId: string | undefined;

    if (session?.user) {
      userId = (session.user as any)?.id;
      userRole = (session.user as any)?.role;
      branchId = (session.user as any)?.branchId;
    } else {
      // Fallback to admin cookie auth used by admin dashboard
      const cookieStore = await cookies();
      const adminId = cookieStore.get('admin_id')?.value;
      const adminEmail = cookieStore.get('admin_email')?.value;

      if (!adminId || !adminEmail) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      await dbConnect();
      const Admin = (await import('@/lib/models/Admin')).default;
      const admin = await Admin.findById(adminId).select('isActive role branchId');
      if (!admin || !admin.isActive) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      userId = admin._id.toString();
      userRole = admin.role;
      branchId = admin.branchId?.toString();
    }

    await dbConnect();
    console.log('Database connected successfully');

    // Use imported BookingSchema and only define model if not already defined
    const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
    console.log('Booking model ready');
    console.log('Booking schema paths:', Object.keys(BookingModel.schema.paths));

    const {
      serviceId,
      startDate,
      endDate,
      startTime,
      endTime,
      selectedPlanId,
      notes
    } = await request.json();

    // Validation
    if (!serviceId || !startDate || !endDate || !selectedPlanId) {
      return NextResponse.json(
        { message: 'serviceId, startDate, endDate, and selectedPlanId are required' },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { message: 'Service not found' },
        { status: 404 }
      );
    }

    // Find the selected pricing plan
    const selectedPlan = service.pricingPlans.id(selectedPlanId);
    if (!selectedPlan) {
      return NextResponse.json(
        { message: 'Selected pricing plan not found' },
        { status: 404 }
      );
    }

    // Check if user has active membership for this specific service
    const User = (await import('@/lib/models/User')).default;
    const UserSubscription = (await import('@/lib/models/UserSubscription')).default;

    const user = await User.findById(userId);
    const activeSubscription = await UserSubscription.findOne({
      userId,
      serviceId,
      status: 'active',
      expiryDate: { $gt: new Date() }
    });

    const isMember = !!activeSubscription;

    // Calculate duration and price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let totalPrice = 0;
    let durationInHours = 0;

    // Check if times are provided for hourly calculation
    if (startTime && endTime) {
      // Calculate hourly rate
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${startDate}T${endTime}`);
      const hoursPerDay = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      durationInHours = hoursPerDay * durationInDays;

      const hourlyRate = isMember ? selectedPlan.memberPrice : selectedPlan.nonMemberPrice;
      totalPrice = hourlyRate * durationInHours;
    } else if (selectedPlan.durationInHours > 1) {
      // Daily rate
      const dailyRate = isMember ? selectedPlan.memberPrice : selectedPlan.nonMemberPrice;
      totalPrice = dailyRate * durationInDays;
    } else {
      // Flat rate or other plan types
      totalPrice = selectedPlan.flatPrice || 0;
    }

    console.log('Booking calculation:', {
      planType: selectedPlan.planType,
      durationInHours: selectedPlan.durationInHours,
      startTime,
      endTime,
      durationInDays,
      calculatedDurationInHours: durationInHours,
      totalPrice,
      isMember
    });

    const bookingData = {
      userId,
      branchId,
      serviceId,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      durationInDays,
      durationInHours,
      selectedPlan: {
        planName: selectedPlan.planName,
        planType: selectedPlan.planType,
        durationLabel: selectedPlan.durationLabel,
        memberPrice: selectedPlan.memberPrice,
        nonMemberPrice: selectedPlan.nonMemberPrice,
        flatPrice: selectedPlan.flatPrice,
      },
      isMember,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending',
      notes,
    };

    console.log('Booking data to save:', bookingData);

    let booking;
    try {
      booking = await BookingModel.create(bookingData);
      console.log('Booking created and saved successfully');
    } catch (createError) {
      console.error('Create failed, trying new() + save():', createError);
      booking = new BookingModel(bookingData);
      await booking.save();
      console.log('Booking created with new() + save() method');
    }

    console.log('Created booking object:', {
      id: booking._id,
      totalPrice: booking.totalPrice,
      totalPriceType: typeof booking.totalPrice,
      paymentStatus: booking.paymentStatus,
      startTime: booking.startTime,
      endTime: booking.endTime,
      allFields: Object.keys(booking.toObject())
    });

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: {
          ...booking.toObject(),
          id: booking._id.toString(),
          totalPrice: booking.totalPrice, // Explicitly include totalPrice
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);

    const session = await getServerSession(authOptions) as any;
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/bookings',
      error: error.message || 'Failed to create booking',
      statusCode: 500,
      userId,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!session?.user && !adminId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session?.user as any)?.role || cookieStore.get('admin_role')?.value;

    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { bookingId, status } = await request.json();
    const BookingModel = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

    if (!bookingId || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid bookingId or status' },
        { status: 400 }
      );
    }

    const booking = await BookingModel.findByIdAndUpdate(
      bookingId,
      { status },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Booking updated successfully', booking },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating booking:', error);

    const session = await getServerSession(authOptions) as any;
    const userId = (session?.user as any)?.id;

    await ErrorLog.create({
      route: '/api/bookings', 
      error: error.message || 'Failed to update booking',
      statusCode: 500,
      userId,
    });

    return NextResponse.json(
      { message: 'Failed to update booking' },
      { status: 500 }
    );
  }
}
