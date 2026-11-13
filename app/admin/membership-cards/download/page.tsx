'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, QrCode, Calendar, User, Shield, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

function DownloadContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [cardData, setCardData] = useState<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/admin/membership-cards/download?userId=${userId}`)
      .then((res) => res.json())
      .then(async (data) => {
        setCardData(data);
        if (data.user?.name && data.user?.cardNumber) {
          try {
            const url = await QRCode.toDataURL(
              JSON.stringify({ name: data.user.name, cardNumber: data.user.cardNumber, verified: true }),
              { width: 120, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } }
            );
            setQrUrl(url);
          } catch {
            setQrUrl('');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const handleDownload = async () => {
    try {
      toast.info('Preparing card image...');

      const width = 1000;
      const height = Math.round(width / 1.586);
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const user = cardData.user;
      const subscription = cardData.subscription;

      // Top accent bar
      const barGrad = ctx.createLinearGradient(0, 0, width, 0);
      barGrad.addColorStop(0, '#1e293b');
      barGrad.addColorStop(1, '#475569');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, 0, width, Math.round(height * 0.04));

      let y = Math.round(height * 0.08);
      ctx.textBaseline = 'top';

      // Card Number row
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('SpaceOut', 40, y);
      if (user.cardNumber && user.cardNumber !== 'SP-OUT-000000') {
        ctx.fillStyle = '#f59e0b';
        roundRectCanvas(ctx, width - 160, y - 2, 136, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(user.cardNumber, width - 92, y + 4);
        ctx.textAlign = 'left';
      }
      y += 60;

      // Astronaut badge
      ctx.fillStyle = '#1e293b';
      roundRectCanvas(ctx, 40, y, 240, 44, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Now an Astronaut', 56, y + 12);
      y += 56;

      // Membership
      ctx.fillStyle = '#1e293b';
      roundRectCanvas(ctx, 40, y, width - 80, Math.round(height * 0.08), 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText(user.membershipType || subscription?.planName || 'Member', 56, y + 14);
      y += Math.round(height * 0.11);

      // Member Name
      ctx.fillStyle = '#ffffff';
      roundRectCanvas(ctx, 40, y, width - 80, Math.round(height * 0.06), 10);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(user.name || 'N/A', 56, y + 10);
      y += Math.round(height * 0.08);

      // QR + Status row
      // QR
      if (qrUrl) {
        const qrImg = document.createElement('img');
        await new Promise<void>((res, rej) => {
          qrImg.onload = () => res();
          qrImg.onerror = () => rej();
          qrImg.src = qrUrl;
        });
        ctx.drawImage(qrImg, 40, y, 80, 80);
      }

      // Status & Expiry
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText('Active', width - 40, y + 10);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '12px system-ui, sans-serif';
      const expiryStr = subscription?.expiryDate
        ? new Date(subscription.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : user.membershipExpiry
        ? new Date(user.membershipExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';
      ctx.fillText('Expires: ' + expiryStr, width - 40, y + 36);
      ctx.textAlign = 'left';

      // Footer
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('© SpaceOut', 40, height - 40);
      ctx.textAlign = 'right';
      ctx.fillText('Astronaut', width - 40, height - 40);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      link.download = `spaceout-card-${cardData?.user?.cardNumber || 'member'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  if (loading || !cardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading card...</div>
      </div>
    );
  }

  if (cardData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-500">{cardData.error}</div>
      </div>
    );
  }

  const user = cardData.user;
  const subscription = cardData.subscription;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Membership Card</h1>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Card
          </button>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Top accent bar */}
            <div className="h-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600" />

            <div className="p-6 md:p-8">
              {/* Card Number */}
              <div className="flex items-center justify-between mb-6">
                <div className="bg-slate-800 rounded-lg px-3 py-1.5">
                  <p className="text-xs font-bold text-white tracking-widest uppercase">SpaceOut</p>
                </div>
                {user.cardNumber && user.cardNumber !== 'SP-OUT-000000' && (
                  <div className="bg-amber-500 rounded-lg px-2 py-1">
                    <p className="text-xs font-mono font-bold text-white tracking-wider">{user.cardNumber}</p>
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✦</span>
                  </div>
                  <span className="text-sm font-black text-slate-800 tracking-[0.2em] uppercase">Now an Astronaut</span>
                </div>

                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1">Membership</p>
                  <h3 className="text-lg font-black text-white">{user.membershipType || subscription?.planName || 'Member'}</h3>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-1">Member Name</p>
                  <p className="text-lg font-bold text-slate-900">{user.name}</p>
                </div>
              </div>

              {/* QR + Status */}
              <div className="flex items-end justify-between gap-4">
                <div className="bg-white rounded-lg p-2 border-2 border-slate-200">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" className="w-14 h-14" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="text-right space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Status</p>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-black text-emerald-600 uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Valid Until</p>
                    <p className="text-sm font-bold text-slate-700">
                      {subscription?.expiryDate
                        ? new Date(subscription.expiryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : user.membershipExpiry
                        ? new Date(user.membershipExpiry).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  {subscription?.serviceName && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Service</p>
                      <p className="text-sm font-bold text-slate-700">{subscription.serviceName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <p className="text-gray-400 text-xs">© SpaceOut</p>
                <p className="text-slate-700 text-xs font-black tracking-widest uppercase">Astronaut</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCardDownloadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading card...</div>}>
      <DownloadContent />
    </Suspense>
  );
}

function roundRectCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
