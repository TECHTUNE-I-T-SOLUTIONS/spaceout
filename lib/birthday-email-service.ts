import dbConnect from '@/lib/db';
import { sendEmail } from '@/lib/email';
import User from '@/lib/models/User';

export type BirthdayEmailKind = 'birthday-reminder' | 'birthday-day';

export interface BirthdayEmailPreview {
  kind: BirthdayEmailKind;
  subject: string;
  html: string;
  text: string;
}

export interface SendBirthdayEmailsOptions {
  date?: Date;
  dryRun?: boolean;
}

interface BirthdayCandidate {
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  dateOfBirth: Date;
  membershipStatus?: 'active' | 'inactive' | 'expired';
  membershipType?: 'annual' | 'monthly' | 'lifetime';
}

const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.spaceoutworkstation.com';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

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

function formatDateLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatBirthdayLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function getRecipientName(user: BirthdayCandidate) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'Valued Member';
}

function getAgeOnBirthday(dateOfBirth: Date, birthdayYear: number) {
  return birthdayYear - dateOfBirth.getFullYear();
}

function buildBirthdayEmail(
  user: BirthdayCandidate,
  kind: BirthdayEmailKind,
  referenceDate: Date,
  birthdayDate: Date
): BirthdayEmailPreview {
  const recipientName = getRecipientName(user);
  const age = getAgeOnBirthday(user.dateOfBirth, birthdayDate.getFullYear());
  const membershipLine =
    user.membershipStatus === 'active'
      ? 'As one of our active members, we are especially grateful to have you in the SpaceOut community.'
      : 'We are grateful to have you in the SpaceOut community and hope your day feels special from start to finish.';

  if (kind === 'birthday-reminder') {
    const subject = `Your SpaceOut birthday is coming up in 7 days, ${recipientName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
          <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
            <div style="padding: 28px 24px 16px; text-align: center; background: #111827; color: #ffffff;">
              <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75;">SpaceOut Birthday Countdown</p>
              <h1 style="margin: 10px 0 0; font-size: 28px; line-height: 1.2;">Your birthday is almost here</h1>
            </div>
            <div style="padding: 28px 24px; color: #111827;">
              <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">Hello ${recipientName},</p>
              <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">We wanted to send you an early celebration note. Your birthday is coming up on <strong>${formatBirthdayLabel(birthdayDate)}</strong>, and that means it is only about one week away.</p>
              <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">${membershipLine}</p>
              <div style="padding: 18px; border-radius: 16px; background: #eff6ff; border: 1px solid #bfdbfe; margin: 0 0 20px;">
                <p style="margin: 0 0 8px; font-weight: 700; color: #1d4ed8;">A little birthday note from SpaceOut</p>
                <p style="margin: 0; color: #1e3a8a; line-height: 1.8;">We hope the week ahead brings ease, good news, and a little extra joy. When the day arrives, we will send you another message with birthday wishes from the whole SpaceOut team.</p>
              </div>
              <ul style="margin: 0 0 20px 18px; color: #374151; line-height: 1.8; padding-left: 16px;">
                <li>Plan a focused work session in one of our calm spaces.</li>
                <li>Book a meeting room for a private celebration or business meeting.</li>
                <li>Enjoy a comfortable, polished environment for your special day.</li>
              </ul>
              <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">If you are planning to celebrate with colleagues, friends, or family, we would love to host you.</p>
              <p style="font-size: 16px; line-height: 1.8; margin: 0; font-weight: 700;">Warm regards,<br />The SpaceOut Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = [
      `Hello ${recipientName},`,
      `Your birthday is coming up on ${formatBirthdayLabel(birthdayDate)}. We wanted to send an early celebration note from SpaceOut.`,
      membershipLine,
      'We hope the week ahead brings ease, good news, and a little extra joy.',
      `When the day arrives, we will send you another birthday message from the SpaceOut team.`,
      `Explore our services: ${WEBSITE_URL}/services`,
      'Warm regards, The SpaceOut Team',
    ].join('\n\n');

    return { kind, subject, html, text };
  }

  const subject = `Happy Birthday, ${recipientName} — from SpaceOut`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
        <div style="max-width: 700px; margin: 0 auto; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
          <div style="padding: 28px 24px 16px; text-align: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
            <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.75;">SpaceOut Birthday Wishes</p>
            <h1 style="margin: 10px 0 0; font-size: 30px; line-height: 1.2;">Happy Birthday, ${recipientName}</h1>
            <p style="margin: 10px 0 0; font-size: 15px; opacity: 0.9;">${formatDateLabel(referenceDate)}</p>
          </div>
          <div style="padding: 28px 24px; color: #111827;">
            <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">Today, we are celebrating you and the energy you bring to the SpaceOut community.</p>
            <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">${membershipLine}</p>
            <div style="padding: 18px; border-radius: 16px; background: #fef3c7; border: 1px solid #fbbf24; margin: 0 0 20px;">
              <p style="margin: 0 0 8px; font-weight: 700; color: #b45309;">A special birthday note</p>
              <p style="margin: 0; color: #92400e; line-height: 1.8;">We hope your day is filled with peace, laughter, good company, and a moment to reflect on how far you have come. ${age > 0 ? `You are celebrating ${age} years of life this year, and that is worth honoring.` : 'We are honored to be part of your celebration today.'}</p>
            </div>
            <ul style="margin: 0 0 20px 18px; color: #374151; line-height: 1.8; padding-left: 16px;">
              <li>Take a break in a calm and comfortable environment.</li>
              <li>Host a private celebration, planning session, or meeting with style.</li>
              <li>Enjoy the polished hospitality that makes SpaceOut feel special.</li>
            </ul>
            <p style="font-size: 16px; line-height: 1.8; margin: 0 0 16px;">We are grateful to celebrate this day with you in spirit and hope the year ahead brings growth, health, and success.</p>
            <p style="font-size: 16px; line-height: 1.8; margin: 0; font-weight: 700;">Happy Birthday once again,<br />The SpaceOut Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Happy Birthday, ${recipientName}!`,
    `Today is your special day (${formatDateLabel(referenceDate)}). We are celebrating you and the energy you bring to the SpaceOut community.`,
    membershipLine,
    `${age > 0 ? `You are celebrating ${age} years of life this year.` : ''}`.trim(),
    'We hope your day is filled with peace, laughter, good company, and a moment to reflect on how far you have come.',
    `Explore our services: ${WEBSITE_URL}/services`,
    'Happy Birthday once again, The SpaceOut Team',
  ].filter(Boolean).join('\n\n');

  return { kind, subject, html, text };
}

function getBirthdayCandidates(users: BirthdayCandidate[], referenceDate: Date) {
  const today = normalizeDate(referenceDate);
  const reminderDate = addDays(today, 7);

  const birthdayToday = users.filter((user) => isSameMonthDay(normalizeDate(new Date(user.dateOfBirth)), today));
  const birthdayReminder = users.filter((user) => isSameMonthDay(normalizeDate(new Date(user.dateOfBirth)), reminderDate));

  return { birthdayToday, birthdayReminder, today, reminderDate };
}

export async function sendBirthdayEmails({ date = new Date(), dryRun = false }: SendBirthdayEmailsOptions = {}) {
  await dbConnect();

  const users = await User.find({
    role: 'user',
    email: { $exists: true, $ne: '' },
    dateOfBirth: { $exists: true, $ne: null },
  })
    .select('email firstName lastName name dateOfBirth membershipStatus membershipType')
    .lean<BirthdayCandidate[]>()
    .exec();

  const { birthdayToday, birthdayReminder, today, reminderDate } = getBirthdayCandidates(users, date);

  const previews = [
    ...birthdayReminder.map((user) => ({
      recipient: getRecipientName(user),
      email: user.email,
      ...buildBirthdayEmail(user, 'birthday-reminder', today, reminderDate),
    })),
    ...birthdayToday.map((user) => ({
      recipient: getRecipientName(user),
      email: user.email,
      ...buildBirthdayEmail(user, 'birthday-day', today, today),
    })),
  ];

  if (previews.length === 0) {
    return {
      skipped: true,
      reminderCount: 0,
      birthdayCount: 0,
      sentCount: 0,
      userCount: users.length,
      previews: [],
    };
  }

  if (dryRun) {
    return {
      skipped: false,
      dryRun: true,
      reminderCount: birthdayReminder.length,
      birthdayCount: birthdayToday.length,
      sentCount: 0,
      userCount: users.length,
      previews: previews.slice(0, 5),
    };
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const user of birthdayReminder) {
    const emailContent = buildBirthdayEmail(user, 'birthday-reminder', today, reminderDate);
    const response = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (response.success) {
      sentCount += 1;
    } else {
      errors.push(`${user.email}: ${response.error}`);
    }
  }

  for (const user of birthdayToday) {
    const emailContent = buildBirthdayEmail(user, 'birthday-day', today, today);
    const response = await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (response.success) {
      sentCount += 1;
    } else {
      errors.push(`${user.email}: ${response.error}`);
    }
  }

  return {
    skipped: false,
    dryRun: false,
    reminderCount: birthdayReminder.length,
    birthdayCount: birthdayToday.length,
    sentCount,
    userCount: users.length,
    previews: previews.slice(0, 5),
    errors: errors.length > 0 ? errors : undefined,
  };
}