import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/lib/models/Branch';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;

    const branch = await Branch.findByIdAndDelete(id);

    if (!branch) {
      return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting branch:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
