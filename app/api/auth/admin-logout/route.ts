import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { message: 'Admin logged out successfully' },
    { status: 200 }
  );

  // Clear admin session cookies
  response.cookies.delete('admin_email');
  response.cookies.delete('admin_id');
  response.cookies.delete('admin_role');

  return response;
}
