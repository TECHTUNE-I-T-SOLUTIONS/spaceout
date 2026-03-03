import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/db';
import ErrorLog from '@/lib/models/ErrorLog';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'File type not allowed. Only images and PDFs are accepted' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'spaceout',
          public_id: `${Date.now()}-${file.name.split('.')[0]}`,
          quality: 'auto',
          fetch_format: 'auto',
        },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            
            await dbConnect().catch(() => {});
            
            await ErrorLog.create({
              route: '/api/upload',
              error: error.message || 'Cloudinary upload failed',
              statusCode: 500,
            }).catch((err) => console.error('Error logging error:', err));

            resolve(
              NextResponse.json(
                { message: 'File upload failed' },
                { status: 500 }
              )
            );
          } else if (result) {
            resolve(
              NextResponse.json(
                {
                  message: 'File uploaded successfully',
                  url: result.secure_url,
                  publicId: result.public_id,
                  fileName: file.name,
                  fileSize: file.size,
                  mimeType: file.type,
                },
                { status: 200 }
              )
            );
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    await dbConnect().catch(() => {});

    await ErrorLog.create({
      route: '/api/upload',
      error: error.message || 'File upload failed',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'File upload failed' },
      { status: 500 }
    );
  }
}
