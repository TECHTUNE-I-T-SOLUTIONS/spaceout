import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '@/lib/db';
import ErrorLog from '@/lib/models/ErrorLog';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadFileToCloudinary(file: File, folderName: string = 'spaceout'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folderName,
        public_id: `${Date.now()}-${file.name.split('.')[0]}`,
        quality: 'auto',
        fetch_format: 'auto',
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        }
      }
    );

    file.arrayBuffer().then((bytes) => {
      uploadStream.end(Buffer.from(bytes));
    }).catch(reject);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Handle both single file and multiple files
    const passport = formData.get('passport') as File | null;
    const signature = formData.get('signature') as File | null;
    const file = formData.get('file') as File | null;

    // Support legacy single file upload
    if (file && !passport && !signature) {
      if (!file) {
        return NextResponse.json(
          { message: 'No file provided' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: 'File size exceeds 10MB limit' },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { message: 'File type not allowed. Only images and PDFs are accepted' },
          { status: 400 }
        );
      }

      try {
        const url = await uploadFileToCloudinary(file);
        return NextResponse.json(
          {
            message: 'File uploaded successfully',
            url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          },
          { status: 200 }
        );
      } catch (uploadError: any) {
        await dbConnect().catch(() => {});
        
        await ErrorLog.create({
          route: '/api/upload',
          error: uploadError.message || 'Cloudinary upload failed',
          statusCode: 500,
        }).catch((err) => console.error('Error logging error:', err));

        return NextResponse.json(
          { message: 'File upload failed' },
          { status: 500 }
        );
      }
    }

    // Handle multiple files (passport and signature for signup)
    if (passport || signature) {
      const uploadPromises: Promise<{ type: string; url: string } | null>[] = [];

      if (passport) {
        if (passport.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { message: 'Passport file size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        if (!ALLOWED_TYPES.includes(passport.type)) {
          return NextResponse.json(
            { message: 'Passport file type not allowed. Only images and PDFs are accepted' },
            { status: 400 }
          );
        }

        uploadPromises.push(
          uploadFileToCloudinary(passport, 'spaceout/passports')
            .then((url) => ({ type: 'passportUrl', url }))
            .catch(() => null)
        );
      }

      if (signature) {
        if (signature.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { message: 'Signature file size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        if (!ALLOWED_TYPES.includes(signature.type)) {
          return NextResponse.json(
            { message: 'Signature file type not allowed. Only images and PDFs are accepted' },
            { status: 400 }
          );
        }

        uploadPromises.push(
          uploadFileToCloudinary(signature, 'spaceout/signatures')
            .then((url) => ({ type: 'signatureUrl', url }))
            .catch(() => null)
        );
      }

      try {
        const results = await Promise.all(uploadPromises);
        const uploadedData: Record<string, string> = {
          message: 'Files uploaded successfully',
        };

        results.forEach((result) => {
          if (result) {
            uploadedData[result.type] = result.url;
          }
        });

        return NextResponse.json(uploadedData, { status: 200 });
      } catch (uploadError: any) {
        await dbConnect().catch(() => {});
        
        await ErrorLog.create({
          route: '/api/upload',
          error: uploadError.message || 'Cloudinary upload failed',
          statusCode: 500,
        }).catch((err) => console.error('Error logging error:', err));

        return NextResponse.json(
          { message: 'File upload failed' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: 'No files provided' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);

    await dbConnect().catch(() => {});

    await ErrorLog.create({
      route: '/api/upload',
      error: error.message || 'Upload failed',
      statusCode: 500,
    }).catch((err) => console.error('Error logging error:', err));

    return NextResponse.json(
      { message: 'File upload failed' },
      { status: 500 }
    );
  }
}
