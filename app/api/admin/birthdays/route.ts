import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Admin from '@/lib/models/Admin';
import User from '@/lib/models/User';
import { cookies } from 'next/headers';

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return normalizeDate(nextDate);
}

function isSameMonthDay(left: Date, right: Date) {
  return left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function getNextBirthday(dateOfBirth: Date, referenceDate: Date) {
  const birthdayThisYear = new Date(
    referenceDate.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate()
  );

  if (birthdayThisYear < normalizeDate(referenceDate)) {
    return new Date(referenceDate.getFullYear() + 1, dateOfBirth.getMonth(), dateOfBirth.getDate());
  }

  return birthdayThisYear;
}

function getAge(dateOfBirth: Date, birthdayDate: Date) {
  return birthdayDate.getFullYear() - dateOfBirth.getFullYear();
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_id')?.value;

  if (!adminId) {
    return null;
  }

  await dbConnect();
  const admin = await Admin.findById(adminId);
  if (!admin) {
    return null;
  }

  return admin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized - admin not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(7, Math.min(parseInt(searchParams.get('days') || '30', 10) || 30, 365));
    const today = normalizeDate(new Date(searchParams.get('date') || new Date()));
    const reminderWindow = addDays(today, 7);

    const users = await User.find({
      role: 'user',
      email: { $exists: true, $ne: '' },
      dateOfBirth: { $exists: true, $ne: null },
    })
      .select('_id firstName lastName name email phone dateOfBirth membershipStatus membershipType hasMembership isActive createdAt')
      .lean()
      .exec();

    const normalizedUsers = users
      .map((user) => {
        const dateOfBirth = new Date(user.dateOfBirth);
        const nextBirthday = getNextBirthday(dateOfBirth, today);
        const daysUntilBirthday = Math.round((normalizeDate(nextBirthday).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const ageTurning = getAge(dateOfBirth, nextBirthday);

        return {
          ...user,
          dateOfBirth: dateOfBirth.toISOString(),
          nextBirthday: nextBirthday.toISOString(),
          daysUntilBirthday,
          ageTurning,
          isTodayBirthday: isSameMonthDay(dateOfBirth, today),
          isReminderDue: isSameMonthDay(dateOfBirth, reminderWindow),
        };
      })
      .sort((left, right) => left.daysUntilBirthday - right.daysUntilBirthday);

    const activeBirthdays = normalizedUsers.filter((user) => user.isTodayBirthday);
    const reminderDueBirthdays = normalizedUsers.filter((user) => user.isReminderDue);
    const upcomingBirthdays = normalizedUsers.filter(
      (user) => user.daysUntilBirthday > 0 && user.daysUntilBirthday <= days
    );

    return NextResponse.json({
      today: today.toISOString(),
      windowDays: days,
      allBirthdays: normalizedUsers,
      activeBirthdays,
      reminderDueBirthdays,
      upcomingBirthdays,
      totalBirthdayUsers: normalizedUsers.length,
    });
  } catch (error: any) {
    console.error('Error fetching birthdays:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch birthdays' },
      { status: 500 }
    );
  }
}