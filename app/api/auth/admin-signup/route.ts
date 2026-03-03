import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Admin from "@/lib/models/Admin";
import bcrypt from "bcryptjs";
import { sendAdminWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { firstName, lastName, email, password, role } = await req.json();

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate and normalize role
    const validRoles = ["admin", "superadmin"];
    const adminRole = role && validRoles.includes(role) ? role : "admin";

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate full name
    const fullName = `${firstName} ${lastName}`.trim();

    // Create new admin
    const newAdmin = new Admin({
      firstName,
      lastName,
      name: fullName,
      email,
      password: hashedPassword,
      role: adminRole,
      isEmailVerified: true, // Auto-verify admin emails
    });

    await newAdmin.save();

    // Send welcome email
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/auth/login`;
    await sendAdminWelcomeEmail(email, firstName, loginUrl);

    const response = NextResponse.json(
      { message: "Admin account created successfully" },
      { status: 201 }
    );

    // Set cookies for admin session (httpOnly for security)
    response.cookies.set('admin_email', newAdmin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('admin_id', newAdmin._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set('admin_role', newAdmin.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { message: "Failed to create admin account" },
      { status: 500 }
    );
  }
}
