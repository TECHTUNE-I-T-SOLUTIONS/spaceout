import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Questionnaire from '@/lib/models/Questionnaire';
import { cookies } from 'next/headers';
import Admin from '@/lib/models/Admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const questionnaire = await Questionnaire.findById(id)
      .populate('questions');

    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Verify this admin owns the questionnaire
    if (questionnaire.adminId.toString() !== adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(questionnaire);
  } catch (error: any) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();

    // Get the current questionnaire to verify ownership
    const currentQuestionnaire = await Questionnaire.findById(id);
    if (!currentQuestionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Verify this admin owns the questionnaire
    if (currentQuestionnaire.adminId.toString() !== adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const questionnaire = await Questionnaire.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    ).populate('questions');

    return NextResponse.json(questionnaire);
  } catch (error: any) {
    console.error('Error updating questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to update questionnaire' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get('admin_id')?.value;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    // Verify admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get the current questionnaire to verify ownership
    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return NextResponse.json(
        { error: 'Questionnaire not found' },
        { status: 404 }
      );
    }

    // Verify this admin owns the questionnaire
    if (questionnaire.adminId.toString() !== adminId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Questionnaire.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to delete questionnaire' },
      { status: 500 }
    );
  }
}
