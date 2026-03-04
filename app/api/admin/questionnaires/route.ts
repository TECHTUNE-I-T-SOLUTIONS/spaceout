import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Questionnaire from '@/lib/models/Questionnaire';
import { cookies } from 'next/headers';
import Admin from '@/lib/models/Admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Fetch all questionnaires created by this admin
    const questionnaires = await Questionnaire.find({
      adminId: adminId,
    })
      .populate('questions')
      .sort({ createdAt: -1 });

    return NextResponse.json(questionnaires);
  } catch (error: any) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaires' },
      { status: 500 }
    );
  }
}
