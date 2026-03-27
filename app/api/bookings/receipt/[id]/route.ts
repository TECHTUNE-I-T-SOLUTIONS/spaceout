import { NextRequest } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Dummy function to fetch booking by ID (replace with real DB/API call)
async function getBookingById(id: string) {
  // Replace with real data source
  return {
    id,
    spaceName: 'Conference Room',
    location: 'Tanke, Ilorin',
    branchId: { name: 'Main Branch', location: 'Tanke, Ilorin' },
    startDate: '2026-03-26T00:00:00.000Z',
    endDate: '2026-03-27T00:00:00.000Z',
    startTime: '13:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    selectedPlan: { planName: 'Day - Hourly Plan', planType: 'conference' },
    durationLabel: '2 days',
    price: 30000,
    notes: 'none, just make it cool',
  };
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  // Next.js app dir: params may be a promise
  const params = context.params && typeof context.params.then === 'function' ? await context.params : context.params;
  const id = params?.id || '';
  const booking = await getBookingById(id);

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  // Colors
  const blue = rgb(0, 0.4, 0.8);
  const lightGray = rgb(0.95, 0.95, 0.95);

  // Header bar (off-white or black)
  // To use off-white:
  // const headerColor = rgb(0.98, 0.98, 0.98);
  // To use black:
  const headerColor = rgb(0, 0, 0);
  page.drawRectangle({ x: 0, y: 800, width: 595, height: 42, color: headerColor });

  // Logo
  const logoPath = path.join(process.cwd(), 'public', 'logo-dark.png');
  let logoBytes = null;
  try {
    logoBytes = fs.readFileSync(logoPath);
    const pngImage = await pdfDoc.embedPng(logoBytes);
    page.drawImage(pngImage, { x: 30, y: 805, width: 32, height: 32 });
  } catch {}

  // Company name/email
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('SpaceOut Workstation', { x: 75, y: 825, size: 18, font, color: rgb(1,1,1) });
  page.drawText('info@spaceoutworkstation.com', { x: 75, y: 810, size: 11, font: fontReg, color: rgb(1,1,1) });

  // Title
  page.drawText('Booking Receipt', { x: 40, y: 770, size: 16, font, color: headerColor });

  // Details
  let y = 740;
  const line = (label: string, value: any, opts = {}) => {
    const safeValue = (value === undefined || value === null) ? '' : String(value);
    page.drawText(label, { x: 40, y, size: 12, font, color: rgb(0,0,0), ...opts });
    page.drawText(safeValue, { x: 200, y, size: 12, font: fontReg, color: rgb(0,0,0), ...opts });
    y -= 22;
  };
  line('Booking ID:', booking.id);
  line('Space:', booking.spaceName);
  line('Location:', booking.location);
  if (booking.branchId) line('Branch:', `${booking.branchId.name} (${booking.branchId.location})`);
  line('Date:', booking.startDate && booking.endDate ? `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()} at ${booking.startTime || ''}` : '');
  line('Status:', booking.status);
  line('Payment Status:', booking.paymentStatus);
  line('Plan:', booking.selectedPlan?.planName || '');
  line('Plan Type:', booking.selectedPlan?.planType || '');
  line('Duration:', booking.durationLabel);
  // Add extra space after duration
  y -= 16;

  // Price - styled with top padding in rectangle
  const rectX = 40;
  const rectY = y - 22;
  const rectWidth = 200;
  const rectHeight = 40; // increased for more padding
  const rectPaddingTop = 8;
  page.drawRectangle({ x: rectX, y: rectY, width: rectWidth, height: rectHeight, color: lightGray, borderColor: blue, borderWidth: 1 });
  page.drawText('TOTAL', { x: rectX, y: rectY + rectHeight - rectPaddingTop - 12, size: 12, font, color: blue });
  page.drawText(`NGN ${booking.price ? booking.price.toLocaleString() : '0'}`, { x: rectX + 60, y: rectY + rectHeight - rectPaddingTop - 12, size: 18, font, color: blue });
  y -= rectHeight + 8;

  // Notes
  page.drawText('Notes:', { x: 40, y, size: 12, font, color: rgb(0,0,0) });
  page.drawText(booking.notes || 'None', { x: 100, y, size: 12, font: fontReg, color: rgb(0,0,0) });
  y -= 30;

  // Footer
  page.drawText('Thank you for choosing SpaceOut Workstation!', { x: 40, y: 60, size: 11, font: fontReg, color: blue });

  const pdfBytes = await pdfDoc.save();
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=receipt-${booking.id}.pdf`,
    },
  });
}
