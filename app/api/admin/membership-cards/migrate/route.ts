import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

async function requireAdminCookie() {
  const cookieStore = await cookies();
  const adminId = cookieStore.get('admin_id')?.value;
  const adminRole = cookieStore.get('admin_role')?.value;
  return !!adminId && !!adminRole;
}

function generateUniqueCardNumber(existingNumbers: Set<string>): string {
  let cardNumber: string;
  do {
    cardNumber = `SP-OUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  } while (existingNumbers.has(cardNumber));
  existingNumbers.add(cardNumber);
  return cardNumber;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    // Find all users who don't have a card number yet
    const usersWithoutCard = await User.find({
      $or: [
        { cardNumber: { $exists: false } },
        { cardNumber: null },
        { cardNumber: '' },
        { cardNumber: 'SP-OUT-000000' },
      ],
    }).lean();

    const existingCardNumbers = new Set<string>();

    // Collect all existing non-migration card numbers to avoid collisions
    const allUsersWithCards = await User.find({
      cardNumber: { $exists: true, $nin: [null, '', 'SP-OUT-000000'] },
    }).lean();
    for (const u of allUsersWithCards) {
      if (u.cardNumber) existingCardNumbers.add(u.cardNumber);
    }

    const updates: Promise<any>[] = [];
    const assigned: { email: string; cardNumber: string }[] = [];

    for (const user of usersWithoutCard) {
      const cardNumber = generateUniqueCardNumber(existingCardNumbers);
      updates.push(
        User.findByIdAndUpdate(user._id, {
          $set: {
            cardNumber,
            cardIssuedAt: new Date(),
          },
        })
      );
      assigned.push({ email: user.email, cardNumber });
    }

    await Promise.all(updates);

    return NextResponse.json({
      message: `Migration complete: ${assigned.length} users assigned membership card numbers`,
      totalAssigned: assigned.length,
      users: assigned,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { message: 'Migration failed', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await requireAdminCookie())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const totalUsers = await User.countDocuments();
    const usersWithCard = await User.countDocuments({
      cardNumber: { $exists: true, $nin: [null, '', 'SP-OUT-000000'] },
    });
    const usersWithoutCard = totalUsers - usersWithCard;

    return NextResponse.json({
      totalUsers,
      usersWithCardNumber: usersWithCard,
      usersWithoutCardNumber: usersWithoutCard,
      needsMigration: usersWithoutCard > 0,
    });
  } catch (error: any) {
    console.error('Migration status error:', error);
    return NextResponse.json(
      { message: 'Failed to check migration status', error: error.message },
      { status: 500 }
    );
  }
}
