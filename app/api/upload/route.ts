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
      try {
        const uploadedData: Record<string, string> = {};

        // Upload passport first if provided
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

          console.log('[Upload] Uploading passport...');
          try {
            const passportUrl = await uploadFileToCloudinary(passport, 'spaceout/passports');
            uploadedData.passportUrl = passportUrl;
            console.log('[Upload] Passport uploaded successfully:', passportUrl);
          } catch (error: any) {
            console.error('[Upload] Passport upload failed:', error);
            throw new Error(`Passport upload failed: ${error.message}`);
          }
        }

        // Then upload signature if provided
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

          console.log('[Upload] Uploading signature...');
          try {
            const signatureUrl = await uploadFileToCloudinary(signature, 'spaceout/signatures');
            uploadedData.signatureUrl = signatureUrl;
            console.log('[Upload] Signature uploaded successfully:', signatureUrl);
          } catch (error: any) {
            console.error('[Upload] Signature upload failed:', error);
            throw new Error(`Signature upload failed: ${error.message}`);
          }
        }

        console.log('[Upload] All files uploaded successfully:', uploadedData);
        uploadedData.message = 'Files uploaded successfully';
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
