import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import GalleryItem from '@/lib/models/Gallery';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import ErrorLog from '@/lib/models/ErrorLog';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    let query: any = { isActive: true };
    if (branchId) {
      query.branchId = branchId;
    }

    const galleryItems = await GalleryItem.find(query)
      .populate('branchId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(galleryItems);
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin session from cookies or NextAuth
    const adminRole = request.cookies.get('admin_role')?.value;
    let userRole = adminRole;
    
    if (!userRole) {
      const session = await getServerSession(authOptions) as any;
      if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      userRole = (session.user as any)?.role;
    }

    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { title, description, image, category, branchId } = await request.json();

    if (!title || !image || !branchId) {
      return NextResponse.json(
        { message: 'Title, image URL, and branch are required' },
        { status: 400 }
      );
    }

    const galleryItem = await GalleryItem.create({
      title,
      description: description || '',
      image,
      category: category || 'workspace',
      branchId,
      isActive: true,
    });

    return NextResponse.json(
      { message: 'Image added to gallery', item: galleryItem },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving image:', error);
    
    await ErrorLog.create({
      route: '/api/gallery',
      error: error.message || 'Failed to save image',
      statusCode: 500,
    }).catch(() => {});

    return NextResponse.json(
      { message: 'Failed to save image' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check for admin session
    const adminRole = request.cookies.get('admin_role')?.value;
    let userRole = adminRole;
    
    if (!userRole) {
      const session = await getServerSession(authOptions) as any;
      if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      userRole = (session.user as any)?.role;
    }

    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { itemId, title, description, category } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    const updatedItem = await GalleryItem.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { message: 'Gallery item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Gallery item updated', item: updatedItem }
    );
  } catch (error: any) {
    console.error('Error updating gallery item:', error);
    
    await ErrorLog.create({
      route: '/api/gallery',
      error: error.message || 'Failed to update gallery item',
      statusCode: 500,
    }).catch(() => {});

    return NextResponse.json(
      { message: 'Failed to update gallery item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check for admin session
    const adminRole = request.cookies.get('admin_role')?.value;
    let userRole = adminRole;
    
    if (!userRole) {
      const session = await getServerSession(authOptions) as any;
      if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      userRole = (session.user as any)?.role;
    }

    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    await dbConnect();

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { message: 'Item ID is required' },
        { status: 400 }
      );
    }

    const deletedItem = await GalleryItem.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return NextResponse.json(
        { message: 'Gallery item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Gallery item deleted successfully' }
    );
  } catch (error: any) {
    console.error('Error deleting gallery item:', error);
    
    await ErrorLog.create({
      route: '/api/gallery',
      error: error.message || 'Failed to delete gallery item',
      statusCode: 500,
    }).catch(() => {});

    return NextResponse.json(
      { message: 'Failed to delete gallery item' },
      { status: 500 }
    );
  }
}
