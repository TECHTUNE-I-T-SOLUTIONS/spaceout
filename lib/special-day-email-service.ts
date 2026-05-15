import dbConnect from '@/lib/db';
import { sendEmail } from '@/lib/email';
import User from '@/lib/models/User';

export type SpecialDayKey =
  | 'new-year'
  | 'valentines-day'
  | 'international-womens-day'
  | 'easter-sunday'
  | 'good-friday'
  | 'easter-monday'
  | 'earth-day'
  | 'labour-day'
  | 'childrens-day'
  | 'democracy-day'
  | 'fathers-day'
  | 'independence-day'
  | 'world-mental-health-day'
  | 'christmas-eve'
  | 'christmas-day'
  | 'boxing-day'
  | 'new-years-eve'
  | 'ramadan-kareem'
  | 'eid-al-fitr'
  | 'eid-al-adha'
  | 'eid-milad-un-nabi';

export type SpecialDayKind = 'fixed' | 'movable' | 'lunar-variable';

export interface SpecialDayTemplate {
  key: SpecialDayKey;
  title: string;
  subject: string;
  kind: SpecialDayKind;
  month?: number;
  day?: number;
  notes?: string;
  serviceHighlights: string[];
  greeting: string;
  body: string;
  closing: string;
  match: (date: Date) => boolean;
}

export interface SpecialDayEmailBuildResult {
  subject: string;
  html: string;
  text: string;
  occasions: SpecialDayTemplate[];
}

export interface SendSpecialDayEmailsOptions {
  date?: Date;
  occasionKeys?: SpecialDayKey[];
}

const WEBSITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.spaceoutworkstation.com';
const ASSET_URL = process.env.NEXT_PUBLIC_ASSET_URL || `${WEBSITE_URL}/assets`;

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

function isSameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonthDay(date: Date, month: number, day: number) {
  return date.getMonth() + 1 === month && date.getDate() === day;
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, occurrence: number) {
  const firstDay = new Date(year, month, 1);
  const offset = (weekday - firstDay.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (occurrence - 1) * 7);
}

function getEasterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function formatDateLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function buildDefaultBody(template: SpecialDayTemplate) {
  const notes = template.notes
    ? `<p style="margin: 0 0 12px; color: #6b7280; font-size: 13px; line-height: 1.7;">${template.notes}</p>`
    : '';

  const highlights = template.serviceHighlights
    .map((item) => `<li style="margin-bottom: 8px;">${item}</li>`)
    .join('');

  return `
    <section style="margin-bottom: 24px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 16px; background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);">
      <h3 style="margin: 0 0 8px; color: #111827; font-size: 18px;">${template.title}</h3>
      <p style="margin: 0 0 12px; color: #374151; line-height: 1.7;">${template.greeting}</p>
      <p style="margin: 0 0 12px; color: #374151; line-height: 1.7;">${template.body}</p>
      ${notes}
      <div style="margin-top: 16px; padding: 14px 16px; background: #0f172a; color: #f8fafc; border-radius: 14px;">
        <p style="margin: 0 0 8px; font-weight: 700;">Why SpaceOut matters on days like this</p>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.7;">${highlights}</ul>
      </div>
      <p style="margin: 16px 0 0; color: #374151; line-height: 1.7;">${template.closing}</p>
    </section>
  `;
}

// Islamic holiday dates (estimates based on common observance; actual dates may vary by moon sighting)
export const islamicHolidayDates: Record<number, Partial<Record<SpecialDayKey, string>>> = {
  2026: {
    'ramadan-kareem': '2026-02-18',
    'eid-al-fitr': '2026-03-20',
    'eid-al-adha': '2026-05-27',
    'eid-milad-un-nabi': '2026-08-25',
  },
  2027: {
    'ramadan-kareem': '2027-02-08',
    'eid-al-fitr': '2027-03-09',
    'eid-al-adha': '2027-05-16',
    'eid-milad-un-nabi': '2027-08-14',
  },
  2028: {
    'ramadan-kareem': '2028-01-28',
    'eid-al-fitr': '2028-02-26',
    'eid-al-adha': '2028-05-05',
    'eid-milad-un-nabi': '2028-08-02',
  },
  2029: {
    'ramadan-kareem': '2029-01-16',
    'eid-al-fitr': '2029-02-14',
    'eid-al-adha': '2029-04-24',
    'eid-milad-un-nabi': '2029-07-23',
  },
  2030: {
    'ramadan-kareem': '2030-01-05',
    'eid-al-fitr': '2030-02-04',
    'eid-al-adha': '2030-04-13',
    'eid-milad-un-nabi': '2030-07-12',
  },
};

export function getIslamicHolidayDate(
  year: number,
  holiday: 'ramadan-kareem' | 'eid-al-fitr' | 'eid-al-adha' | 'eid-milad-un-nabi'
) {
  const v = islamicHolidayDates[year]?.[holiday];
  if (!v) return null;
  const d = new Date(v + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  return normalizeDate(d);
}

export const SPECIAL_DAY_TEMPLATES: SpecialDayTemplate[] = [
  {
    key: 'new-year',
    title: 'New Year Celebration',
    subject: 'Happy New Year from SpaceOut',
    kind: 'fixed',
    month: 1,
    day: 1,
    serviceHighlights: [
      'Professional workspaces for focused planning sessions and fresh starts.',
      'Meeting rooms for strategy reviews, goal-setting, and team alignment.',
      'Reliable Wi-Fi, comfortable seating, and a calm atmosphere to help you begin the year with clarity.',
    ],
    greeting: 'Wishing you a brilliant New Year filled with growth, peace, and meaningful progress.',
    body: 'As a new year begins, SpaceOut is honored to remain your trusted partner for productive workdays, client meetings, learning sessions, and community connection. May this year bring you clarity, healthy routines, and excellent opportunities.',
    closing: 'We are excited to host your next productive chapter and continue supporting your journey throughout the year.',
    match: (date) => isSameMonthDay(date, 1, 1),
  },
  {
    key: 'valentines-day',
    title: 'Valentine\'s Day',
    subject: 'Warm Valentine\'s Day wishes from SpaceOut',
    kind: 'fixed',
    month: 2,
    day: 14,
    serviceHighlights: [
      'An inviting environment for meaningful meetings and thoughtful conversations.',
      'Private spaces that help teams, founders, and partners connect respectfully and productively.',
      'A premium hospitality experience that makes every visit feel intentional and valued.',
    ],
    greeting: 'Happy Valentine\'s Day to you and everyone you care about.',
    body: 'Today is a reminder to celebrate kindness, partnership, and the people who make each journey worthwhile. SpaceOut sends sincere appreciation to our community and wishes you joy, affection, and a day filled with warmth.',
    closing: 'We look forward to serving you with the same care and professionalism you bring to others.',
    match: (date) => isSameMonthDay(date, 2, 14),
  },
  {
    key: 'international-womens-day',
    title: 'International Women\'s Day',
    subject: 'Celebrating women in our SpaceOut community',
    kind: 'fixed',
    month: 3,
    day: 8,
    serviceHighlights: [
      'Safe, supportive, and professional environments for women to work and lead confidently.',
      'Flexible booking options for creators, executives, entrepreneurs, and growing teams.',
      'A brand that values inclusion, excellence, and the power of opportunity.',
    ],
    greeting: 'Happy International Women\'s Day to every remarkable woman in our community.',
    body: 'SpaceOut celebrates the leadership, resilience, creativity, and impact of women across every field. Today we honor the women who build businesses, support families, lead teams, and shape better communities with grace and strength.',
    closing: 'Thank you for inspiring progress, and for allowing us to support the spaces where that progress is built.',
    match: (date) => isSameMonthDay(date, 3, 8),
  },
  {
    key: 'easter-sunday',
    title: 'Easter Sunday',
    subject: 'Happy Easter from SpaceOut',
    kind: 'movable',
    serviceHighlights: [
      'Quiet spaces for reflection, planning, and gratitude-filled conversations.',
      'A calm environment for remote work, meetings, and community gatherings.',
      'Supportive service that helps you stay focused while enjoying the season.',
    ],
    greeting: 'Wishing you a joyful and peaceful Easter celebration.',
    body: 'May this season of hope and renewal bring fresh strength, renewed faith, and lasting peace to your home and work life. SpaceOut joins you in celebrating the beauty of new beginnings and the promise that comes with them.',
    closing: 'We hope the day leaves you refreshed and encouraged for the weeks ahead.',
    match: (date) => isSameCalendarDay(normalizeDate(date), normalizeDate(getEasterSunday(date.getFullYear()))),
  },
  {
    key: 'good-friday',
    title: 'Good Friday',
    subject: 'Thoughtful Good Friday wishes from SpaceOut',
    kind: 'movable',
    serviceHighlights: [
      'A respectful work environment for teams observing the day in reflection and peace.',
      'Private spaces that support quiet focus, prayer, and family time.',
      'A dependable place to pause, regroup, and return with clarity.',
    ],
    greeting: 'May this Good Friday bring peace, reflection, and grace to you and your loved ones.',
    body: 'As we observe this solemn day, we send heartfelt wishes for comfort, calm, and spiritual renewal. SpaceOut respects the meaning of the season and honors the quiet strength that comes with reflection.',
    closing: 'May the remainder of the season be filled with hope and restoration.',
    match: (date) => isSameCalendarDay(normalizeDate(date), new Date(getEasterSunday(date.getFullYear()).getTime() - 2 * 24 * 60 * 60 * 1000)),
  },
  {
    key: 'easter-monday',
    title: 'Easter Monday',
    subject: 'Happy Easter Monday from SpaceOut',
    kind: 'movable',
    serviceHighlights: [
      'A smooth return to work after the holiday with dependable amenities.',
      'Flexible desks and meeting rooms for teams easing back into the week.',
      'A polished workspace experience that helps you transition with ease.',
    ],
    greeting: 'Wishing you a pleasant and refreshing Easter Monday.',
    body: 'May today bring gentle momentum, light-hearted connection, and a productive start to the week. SpaceOut is here to help you move from celebration to execution with comfort and confidence.',
    closing: 'We are ready whenever you are, whether the day calls for focus, collaboration, or a well-earned pause.',
    match: (date) => isSameCalendarDay(normalizeDate(date), new Date(getEasterSunday(date.getFullYear()).getTime() + 24 * 60 * 60 * 1000)),
  },
  {
    key: 'earth-day',
    title: 'Earth Day',
    subject: 'Earth Day greetings from SpaceOut',
    kind: 'fixed',
    month: 4,
    day: 22,
    serviceHighlights: [
      'Shared workspaces that support more efficient use of resources and less waste.',
      'Modern hospitality that promotes mindful consumption and smarter operations.',
      'A community environment that encourages responsible, future-focused habits.',
    ],
    greeting: 'Happy Earth Day to everyone committed to a cleaner, healthier planet.',
    body: 'Today is a reminder that thoughtful choices matter. At SpaceOut, we value environments that help people work well while also encouraging better use of space, energy, and shared resources.',
    closing: 'Thank you for joining us in building a more responsible future, one workspace at a time.',
    match: (date) => isSameMonthDay(date, 4, 22),
  },
  {
    key: 'labour-day',
    title: 'Labour Day',
    subject: 'Happy Labour Day from SpaceOut',
    kind: 'fixed',
    month: 5,
    day: 1,
    serviceHighlights: [
      'A professional setting that honors the dignity of hard work.',
      'Spaces designed to help individuals and teams produce excellent results.',
      'Reliable service that lets your effort show up in the quality of your output.',
    ],
    greeting: 'Happy Labour Day to every builder, creator, operator, and problem-solver.',
    body: 'We celebrate the discipline and dedication that power real progress. SpaceOut recognizes the people behind every successful idea, and we are grateful to support your work with practical, polished, and dependable spaces.',
    closing: 'May your efforts continue to yield meaningful impact and well-earned success.',
    match: (date) => isSameMonthDay(date, 5, 1),
  },
  {
    key: 'childrens-day',
    title: 'Children\'s Day',
    subject: 'Happy Children\'s Day from SpaceOut',
    kind: 'fixed',
    month: 5,
    day: 27,
    serviceHighlights: [
      'A welcoming environment for family-focused events and educational programs.',
      'Rooms that can host workshops, children\'s activities, and community celebrations.',
      'A brand that values growth, learning, and the future of every family.',
    ],
    greeting: 'Warm Children\'s Day wishes to every child and every family celebrating today.',
    body: 'Children bring joy, imagination, and hope into every community. SpaceOut joins in celebrating the energy, curiosity, and promise they represent, while honoring the families and caregivers who nurture them each day.',
    closing: 'May today be filled with laughter, love, and memories that last.',
    match: (date) => isSameMonthDay(date, 5, 27),
  },
  {
    key: 'democracy-day',
    title: 'Democracy Day',
    subject: 'Happy Democracy Day from SpaceOut',
    kind: 'fixed',
    month: 6,
    day: 12,
    serviceHighlights: [
      'Spaces for meetings, planning sessions, and civic conversations.',
      'A professional setting that supports leadership, collaboration, and public-minded work.',
      'A community-first brand that values constructive participation and progress.',
    ],
    greeting: 'Happy Democracy Day to our community and to everyone contributing to a better society.',
    body: 'Today we celebrate the value of participation, shared responsibility, and the long work of building systems that serve people well. SpaceOut is proud to support the professionals, founders, teams, and organizations that help shape the future.',
    closing: 'May today inspire renewed commitment to service, integrity, and thoughtful leadership.',
    match: (date) => isSameMonthDay(date, 6, 12),
  },
  {
    key: 'fathers-day',
    title: 'Father\'s Day',
    subject: 'Happy Father\'s Day from SpaceOut',
    kind: 'movable',
    serviceHighlights: [
      'A thoughtful environment for fathers balancing work, family, and leadership.',
      'Flexible spaces for planning sessions, business calls, and quiet productivity.',
      'A dependable team that values consistency, care, and professionalism.',
    ],
    greeting: 'Happy Father\'s Day to every father, father figure, and mentor.',
    body: 'Today we celebrate the steady support, protection, wisdom, and encouragement that fathers and father figures bring to families and communities. Your presence matters, and your effort is seen and appreciated.',
    closing: 'May you be honored today and refreshed for the responsibilities you carry with strength.',
    match: (date) => isSameCalendarDay(normalizeDate(date), getNthWeekdayOfMonth(date.getFullYear(), 5, 0, 3)),
  },
  {
    key: 'independence-day',
    title: 'Nigeria Independence Day',
    subject: 'Happy Independence Day from SpaceOut',
    kind: 'fixed',
    month: 10,
    day: 1,
    serviceHighlights: [
      'A proud local brand serving creators, professionals, and businesses at home.',
      'A community-focused experience built around productivity and opportunity.',
      'A dependable workspace where ideas can grow into meaningful progress.',
    ],
    greeting: 'Happy Independence Day to our Nigerian community and all who celebrate with us.',
    body: 'SpaceOut joins in celebrating freedom, resilience, and the ongoing work of nation-building. May this day renew our commitment to excellence, service, and the shared future we continue to shape together.',
    closing: 'We are honored to support the people and businesses that drive that future forward.',
    match: (date) => isSameMonthDay(date, 10, 1),
  },
  {
    key: 'world-mental-health-day',
    title: 'World Mental Health Day',
    subject: 'World Mental Health Day greetings from SpaceOut',
    kind: 'fixed',
    month: 10,
    day: 10,
    serviceHighlights: [
      'Calm, uncluttered spaces that make it easier to focus and breathe.',
      'A professional environment that supports healthier work rhythms and better boundaries.',
      'A hospitality experience that values respect, comfort, and wellbeing.',
    ],
    greeting: 'Today, we honor the importance of mental health and emotional wellbeing.',
    body: 'SpaceOut believes good work begins with healthy people and sustainable routines. We encourage our community to rest well, ask for help when needed, and create environments that support both productivity and peace of mind.',
    closing: 'May you find balance, strength, and space to care for yourself and those around you.',
    match: (date) => isSameMonthDay(date, 10, 10),
  },
  {
    key: 'christmas-eve',
    title: 'Christmas Eve',
    subject: 'Warm Christmas Eve wishes from SpaceOut',
    kind: 'fixed',
    month: 12,
    day: 24,
    serviceHighlights: [
      'Convenient spaces for wrapping up the year with clarity and calm.',
      'Professional rooms for final check-ins, planning, and team appreciation.',
      'A welcoming atmosphere that helps people close the year gracefully.',
    ],
    greeting: 'Wishing you peace and joyful anticipation on Christmas Eve.',
    body: 'As the year draws toward its most reflective moments, we hope your evening is filled with warmth, gratitude, and the comfort of being surrounded by people who matter most.',
    closing: 'SpaceOut sends sincere appreciation for your trust and support throughout the year.',
    match: (date) => isSameMonthDay(date, 12, 24),
  },
  {
    key: 'christmas-day',
    title: 'Christmas Day',
    subject: 'Merry Christmas from SpaceOut',
    kind: 'fixed',
    month: 12,
    day: 25,
    serviceHighlights: [
      'Spaces that welcome rest, celebration, and meaningful connection.',
      'A brand voice that values kindness, gratitude, and generosity.',
      'Support for users who need a dependable base before the year closes out.',
    ],
    greeting: 'Merry Christmas to you and your loved ones.',
    body: 'May the joy of Christmas fill your home with peace, your heart with gratitude, and your season with memorable moments. We are grateful to be a part of your year and your journey.',
    closing: 'Thank you for allowing SpaceOut to serve your work, your plans, and your community.',
    match: (date) => isSameMonthDay(date, 12, 25),
  },
  {
    key: 'boxing-day',
    title: 'Boxing Day',
    subject: 'Happy Boxing Day from SpaceOut',
    kind: 'fixed',
    month: 12,
    day: 26,
    serviceHighlights: [
      'A comfortable place to regroup after the holiday rush.',
      'Spaces for post-holiday reflection, planning, and light collaboration.',
      'Reliable services that help you restart the week without friction.',
    ],
    greeting: 'Happy Boxing Day and best wishes for a calm, restorative day.',
    body: 'Whether you are resting, visiting loved ones, or preparing for what comes next, we hope today brings ease and a gentle rhythm. SpaceOut is here when you are ready to get moving again.',
    closing: 'May the day be peaceful, productive, and filled with gratitude.',
    match: (date) => isSameMonthDay(date, 12, 26),
  },
  {
    key: 'new-years-eve',
    title: 'New Year\'s Eve',
    subject: 'Warm New Year\'s Eve wishes from SpaceOut',
    kind: 'fixed',
    month: 12,
    day: 31,
    serviceHighlights: [
      'A polished space for year-end reviews, planning, and reflection.',
      'Meeting rooms that help teams close the year with clarity and confidence.',
      'A dependable professional environment for the final stretch of the year.',
    ],
    greeting: 'Wishing you a thoughtful and celebratory New Year\'s Eve.',
    body: 'As you prepare to step into a new year, may your reflections be proud, your heart be light, and your future feel full of possibility. SpaceOut appreciates every moment of your support this year.',
    closing: 'We look forward to welcoming you into the new year with the same professionalism and care.',
    match: (date) => isSameMonthDay(date, 12, 31),
  },
  {
    key: 'ramadan-kareem',
    title: 'Ramadan Kareem',
    subject: 'Ramadan Kareem from SpaceOut',
    kind: 'lunar-variable',
    notes: 'The date for Ramadan follows the lunar calendar and should be supplied from the yearly observance calendar before sending.',
    serviceHighlights: [
      'Quiet spaces for reflection, prayer, planning, and disciplined work.',
      'A respectful environment for teams observing fasting hours and adjusted routines.',
      'Flexible service that supports focus, dignity, and thoughtful hospitality.',
    ],
    greeting: 'Ramadan Kareem to everyone observing this holy month.',
    body: 'May this season bring spiritual growth, peace, discipline, mercy, and abundant blessings. SpaceOut honors the depth of this observance and sends sincere wishes for a meaningful and rewarding month.',
    closing: 'We wish you strength and ease throughout the days ahead.',
    match: (date) => {
      const d = getIslamicHolidayDate(date.getFullYear(), 'ramadan-kareem');
      return d ? isSameCalendarDay(d, normalizeDate(date)) : false;
    },
  },
  {
    key: 'eid-al-fitr',
    title: 'Eid al-Fitr',
    subject: 'Eid Mubarak from SpaceOut',
    kind: 'lunar-variable',
    notes: 'Eid al-Fitr is determined by moon sighting and should be supplied from the annual holiday calendar before automated sending.',
    serviceHighlights: [
      'A welcoming space for family meetings, friendly catch-ups, and shared celebrations.',
      'Professional support that helps businesses resume smoothly after the holiday.',
      'A community-first brand that values respect, gratitude, and consistency.',
    ],
    greeting: 'Eid Mubarak to you and your loved ones.',
    body: 'May this Eid bring joy to your home, peace to your heart, and blessings to every step ahead. SpaceOut joins you in celebrating the completion of a meaningful season with gratitude and happiness.',
    closing: 'We wish you a beautiful celebration filled with faith, love, and cherished company.',
    match: (date) => {
      const d = getIslamicHolidayDate(date.getFullYear(), 'eid-al-fitr');
      return d ? isSameCalendarDay(d, normalizeDate(date)) : false;
    },
  },
  {
    key: 'eid-al-adha',
    title: 'Eid al-Adha',
    subject: 'Warm Eid al-Adha wishes from SpaceOut',
    kind: 'lunar-variable',
    notes: 'Eid al-Adha follows the lunar calendar and should be scheduled from the yearly observance list before the cron job sends it.',
    serviceHighlights: [
      'Supportive spaces for family, community, and purposeful collaboration.',
      'A dependable workspace partner for the days before and after the holiday.',
      'A refined experience that respects faith, family, and shared celebration.',
    ],
    greeting: 'Eid Mubarak and warm greetings for a blessed celebration.',
    body: 'May this sacred occasion bring peace, generosity, and remembrance into your life and home. SpaceOut sends sincere wishes for a celebration filled with mercy, gratitude, and abundant blessings.',
    closing: 'We are grateful to serve you and to celebrate this special time with you in spirit.',
    match: (date) => {
      const d = getIslamicHolidayDate(date.getFullYear(), 'eid-al-adha');
      return d ? isSameCalendarDay(d, normalizeDate(date)) : false;
    },
  },
  {
    key: 'eid-milad-un-nabi',
    title: 'Eid Milad un-Nabi',
    subject: 'Peaceful Eid Milad un-Nabi wishes from SpaceOut',
    kind: 'lunar-variable',
    notes: 'The date for Eid Milad un-Nabi varies by local observance and should be provided from the annual holiday schedule.',
    serviceHighlights: [
      'A calm environment that supports reflection and community-minded work.',
      'Flexible professional space for teams and individuals observing the day.',
      'A thoughtful hospitality approach that respects faith and tradition.',
    ],
    greeting: 'Wishing you peace and blessings on Eid Milad un-Nabi.',
    body: 'May this day inspire reflection, compassion, and gratitude in your home and community. SpaceOut sends respectful and heartfelt wishes for a meaningful observance.',
    closing: 'May your day be filled with serenity, grace, and a renewed sense of purpose.',
    match: (date) => {
      const d = getIslamicHolidayDate(date.getFullYear(), 'eid-milad-un-nabi');
      return d ? isSameCalendarDay(d, normalizeDate(date)) : false;
    },
  },
];

export function getSpecialDayTemplatesForDate(date: Date, occasionKeys?: SpecialDayKey[]) {
  const normalizedDate = normalizeDate(date);
  const selectedTemplates = SPECIAL_DAY_TEMPLATES.filter((template) => {
    if (occasionKeys && occasionKeys.length > 0 && !occasionKeys.includes(template.key)) {
      return false;
    }

    return template.match(normalizedDate);
  });

  return selectedTemplates;
}

export function getManualSpecialDayTemplates(occasionKeys: SpecialDayKey[]) {
  return SPECIAL_DAY_TEMPLATES.filter((template) => occasionKeys.includes(template.key));
}

export function buildSpecialDayEmail(recipientName: string, occasions: SpecialDayTemplate[], date: Date = new Date()): SpecialDayEmailBuildResult {
  const safeName = recipientName || 'Valued Member';
  const title = occasions.length > 1
    ? occasions.map((occasion) => occasion.title).join(' and ')
    : occasions[0]?.title || 'Special Day';
  const subject = occasions.length > 1
    ? `Warm greetings from SpaceOut for ${title}`
    : occasions[0]?.subject || 'Warm greetings from SpaceOut';

  const sections = occasions.map((occasion) => buildDefaultBody(occasion)).join('');
  const assetLogo = `${ASSET_URL}/logo-dark.png`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0; padding:0; background:#0b1120; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width:720px; margin:0 auto; background:linear-gradient(180deg, #111827 0%, #f9fafb 22%, #ffffff 100%); padding:0 0 32px;">
          <div style="padding:28px 28px 18px; text-align:center; background:#0f172a; color:#f8fafc;">
            <img src="${assetLogo}" alt="SpaceOut" style="height:42px; margin-bottom:12px; object-fit:contain;" />
            <h1 style="margin:0; font-size:28px; letter-spacing:-0.02em;">SpaceOut</h1>
            <p style="margin:8px 0 0; color:#cbd5e1; font-size:14px;">Professional workspace solutions for modern teams and individuals</p>
          </div>

          <div style="padding:28px; background:#ffffff;">
            <p style="margin:0 0 10px; color:#0f172a; font-size:16px; font-weight:700;">Hello ${safeName},</p>
            <p style="margin:0 0 18px; color:#374151; line-height:1.8;">${formatDateLabel(date)} brings a special moment for our community, and we wanted to send you a thoughtful message directly from SpaceOut. We appreciate your presence on the platform and the trust you place in us.</p>
            ${sections}

            <div style="padding:18px; border-radius:16px; background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color:#f8fafc; margin-top:18px;">
              <h2 style="margin:0 0 10px; font-size:18px;">How SpaceOut supports your work and celebrations</h2>
              <ul style="margin:0; padding-left:18px; line-height:1.8; color:#e2e8f0;">
                <li>Flexible coworking and workspace solutions for productive days.</li>
                <li>Meeting rooms and private spaces for planning, conversations, and collaboration.</li>
                <li>Reliable internet, comfortable environments, and a polished experience for your guests and team.</li>
                <li>Support for bookings, memberships, events, and customer care whenever you need it.</li>
              </ul>
            </div>

            <div style="text-align:center; margin:24px 0 12px;">
              <a href="${WEBSITE_URL}/services" style="display:inline-block; padding:12px 24px; background:#111827; color:#ffffff; text-decoration:none; border-radius:999px; font-weight:700;">Explore Our Services</a>
            </div>

            <p style="margin:12px 0 0; color:#374151; line-height:1.8;">If you are planning a team meetup, private booking, or special gathering, SpaceOut is ready to help you create a polished and productive experience.</p>
            <p style="margin:16px 0 0; color:#111827; font-weight:700;">Warm regards,<br />The SpaceOut Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Hello ${safeName},`,
    `${formatDateLabel(date)} brings a special moment for our community, and we wanted to send you a thoughtful message directly from SpaceOut.`,
    ...occasions.map((occasion) => `${occasion.title}: ${occasion.greeting} ${occasion.body} ${occasion.closing}`),
    'SpaceOut continues to support your work with flexible workspaces, meeting rooms, reliable internet, and a professional experience for every visit.',
    `Explore our services: ${WEBSITE_URL}/services`,
    'Warm regards, The SpaceOut Team',
  ].join('\n\n');

  return { subject, html, text, occasions };
}

export async function sendSpecialDayEmails({ date = new Date(), occasionKeys }: SendSpecialDayEmailsOptions = {}) {
  await dbConnect();

  const matchingOccasions = occasionKeys && occasionKeys.length > 0
    ? getManualSpecialDayTemplates(occasionKeys)
    : getSpecialDayTemplatesForDate(date);

  if (matchingOccasions.length === 0) {
    return {
      sentCount: 0,
      userCount: 0,
      occasions: [],
      skipped: true,
    };
  }

  const users = await User.find({ role: 'user', isActive: true, email: { $exists: true, $ne: '' } })
    .select('email firstName lastName name')
    .lean()
    .exec();

  let sentCount = 0;
  const errors: string[] = [];

  for (const user of users) {
    const recipientName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || 'Valued Member';
    const emailContent = buildSpecialDayEmail(recipientName, matchingOccasions, date);

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
    sentCount,
    userCount: users.length,
    occasions: matchingOccasions.map((occasion) => ({
      key: occasion.key,
      title: occasion.title,
      subject: occasion.subject,
      kind: occasion.kind,
      notes: occasion.notes,
    })),
    errors: errors.length > 0 ? errors : undefined,
    skipped: false,
  };
}
