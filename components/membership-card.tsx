'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Download, CreditCard, QrCode, Calendar, User, Shield, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

interface MembershipCardProps {
  userName: string;
  membershipType: string;
  cardNumber?: string;
  signature?: string;
  profileImage?: string;
  memberSince?: Date | string;
  membershipDate?: Date | string;
  expiryDate?: string;
  email?: string;
  onDownload?: () => void;
}

export function MembershipCard({
  userName,
  membershipType,
  cardNumber,
  signature,
  profileImage,
  memberSince,
  membershipDate,
  expiryDate,
  email,
  onDownload,
}: MembershipCardProps) {
  const { theme } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          name: userName,
          cardNumber: cardNumber || 'N/A',
          email: email || '',
          membership: membershipType,
          verified: true,
        });
        const url = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: {
            dark: '#1a1a2e',
            light: '#ffffff',
          },
        });
        setQrCodeUrl(url);
      } catch {
        setQrCodeUrl('');
      }
    };
    generateQR();
  }, [userName, cardNumber, email, membershipType]);

  const handleFlipClick = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleDownload = useCallback(async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    setIsFlipped(false);
    setTimeout(() => {
      window.print();
    }, 300);
  }, [onDownload]);

  const formattedDate = membershipDate
    ? typeof membershipDate === 'string'
      ? membershipDate
      : new Date(membershipDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

  const formattedExpiry = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  const formattedMemberSince = memberSince
    ? typeof memberSince === 'string'
      ? memberSince
      : new Date(memberSince).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
    : 'N/A';

  const displayCardNumber = cardNumber
    ? cardNumber.replace(/(.{4})/g, '$1-').replace(/-$/, '')
    : 'SP-OUT-000000';

  /**
   * Canvas-based card download — avoids html2canvas entirely so we never hit
   * the Turbopack "unsupported color function lab" console error.
   * Draws a professional membership card with background art, profile photo,
   * QR code, member details, and status indicators.
   */
  const downloadCardViaCanvas = useCallback(async () => {
    try {
      toast.info('Preparing your card image...');
      const width = 1000;
      const height = Math.round(width / 1.586);
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.scale(scale, scale);

      // Load background image
      const imageUrl = isFlipped ? '/card-back.webp' : '/card-front.webp';
      const bgImg = document.createElement('img');
      bgImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => reject(new Error('Failed to load card image'));
        bgImg.src = imageUrl;
      });
      ctx.drawImage(bgImg, 0, 0, width, height);

      // Dark overlay for readability
      ctx.fillStyle = isFlipped ? 'rgba(10, 10, 10, 0.5)' : 'rgba(10, 10, 10, 0.5)';
      ctx.fillRect(0, 0, width, height);

      // Helper: draw rounded rectangle path
      const rRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx!.beginPath();
        ctx!.moveTo(x + r, y);
        ctx!.lineTo(x + w - r, y);
        ctx!.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx!.lineTo(x + w, y + h - r);
        ctx!.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx!.lineTo(x + r, y + h);
        ctx!.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx!.lineTo(x, y + r);
        ctx!.quadraticCurveTo(x, y, x + r, y);
        ctx!.closePath();
      };

      // Helper: draw text with outline for readability on any background
      const drawText = (text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', outline = false) => {
        ctx!.textAlign = align;
        ctx!.font = font;
        ctx!.textBaseline = 'top';
        if (outline) {
          ctx!.strokeStyle = 'rgba(0,0,0,0.7)';
          ctx!.lineWidth = 3;
          ctx!.lineJoin = 'round';
          ctx!.strokeText(text, x, y);
        }
        ctx!.fillStyle = color;
        ctx!.fillText(text, x, y);
      };

      // Load profile image if available
      let profileImg: HTMLImageElement | null = null;
      if (profileImage) {
        profileImg = document.createElement('img');
        await new Promise<void>((resolve, reject) => {
          profileImg!.onload = () => resolve();
          profileImg!.onerror = () => reject(new Error('Failed to load profile image'));
          profileImg!.src = profileImage;
        }).catch(() => { profileImg = null; });
      }

      // Load QR code
      let qrImg: HTMLImageElement | null = null;
      if (qrCodeUrl) {
        qrImg = document.createElement('img');
        await new Promise<void>((resolve, reject) => {
          qrImg!.onload = () => resolve();
          qrImg!.onerror = () => reject(new Error('Failed to load QR code'));
          qrImg!.src = qrCodeUrl;
        }).catch(() => { qrImg = null; });
      }

      const side = isFlipped ? 'back' : 'front';

      if (side === 'front') {
        // ─── FRONT OF CARD ───

        // Top bar background
        rRect(0, 0, width, 56, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();

        // SpaceOut logo badge
        rRect(30, 14, 140, 32, 8);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        drawText('SpaceOut', 48, 22, 'bold 16px system-ui, sans-serif', '#ffffff', 'left', true);

        // Card number badge (top-right)
        if (displayCardNumber !== 'SP-OUT-000000') {
          rRect(width - 190, 14, 160, 32, 8);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          drawText(displayCardNumber, width - 110, 22, 'bold 13px monospace', '#ffffff', 'center', true);
        }

        // Profile picture (circular, left side)
        const photoX = 30;
        const photoY = 76;
        const photoSize = 84;
        const photoRadius = photoSize / 2;

        if (profileImg) {
          // Profile photo circle border
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX + photoRadius, photoY + photoRadius, photoRadius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          // Clip to circle and draw image
          ctx.save();
          ctx.beginPath();
          ctx.arc(photoX + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(profileImg, photoX, photoY, photoSize, photoSize);
          ctx.restore();
        } else {
          // Placeholder circle
          rRect(photoX, photoY, photoSize, photoSize, photoRadius);
          ctx.fillStyle = '#334155';
          ctx.fill();
          drawText(userName ? userName.charAt(0).toUpperCase() : '?', photoX + photoRadius, photoY + photoRadius - 14, 'bold 36px system-ui, sans-serif', '#94a3b8', 'center', true);
        }

        // Member info (right of photo)
        const infoX = photoX + photoSize + 20;
        let infoY = photoY + 10;

        // Name
        drawText(userName || 'SpaceOut Member', infoX, infoY, 'bold 22px system-ui, sans-serif', '#ffffff', 'left', true);
        infoY += 30;

        // Email
        drawText(email || 'N/A', infoX, infoY, '14px system-ui, sans-serif', 'rgba(255,255,255,0.8)', 'left', true);
        infoY += 20;

        // Card number below email
        if (displayCardNumber !== 'SP-OUT-000000') {
          drawText(displayCardNumber, infoX, infoY, '12px monospace', 'rgba(255,255,255,0.6)', 'left', true);
          infoY += 18;
        }

        // Status badge (online dot + Active)
        const statusDotX = infoX;
        const statusDotY = infoY + 4;
        ctx.beginPath();
        ctx.arc(statusDotX + 6, statusDotY + 6, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        drawText('Active', statusDotX + 18, infoY, 'bold 13px system-ui, sans-serif', '#22c55e', 'left');
        infoY += 24;

        // Membership type label
        drawText('Astronaut Member', infoX, infoY, 'bold 12px system-ui, sans-serif', 'rgba(245,158,11,0.9)', 'left', true);

        // ─── Middle: Info boxes ───
        const boxY = 190;
        const boxH = 72;
        const gap = 16;
        const boxW = (width - 60 - gap * 2) / 3;

        const boxes = [
          { label: 'PLAN', value: membershipType || 'Member', color: '#f59e0b' },
          { label: 'STATUS', value: 'Active', color: '#22c55e', dot: true },
          { label: 'EXPIRES', value: formattedExpiry, color: '#60a5fa' },
        ];

        boxes.forEach((box, i) => {
          const bx = 30 + i * (boxW + gap);

          // Box background
          rRect(bx, boxY, boxW, boxH, 12);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fill();

          // Border
          rRect(bx, boxY, boxW, boxH, 12);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Label
          drawText(box.label, bx + 14, boxY + 10, 'bold 10px system-ui, sans-serif', 'rgba(255,255,255,0.5)', 'left');

          // Value
          let valY = boxY + 30;
          if (box.dot) {
            // Status dot
            ctx.beginPath();
            ctx.arc(bx + 16, valY + 6, 4, 0, Math.PI * 2);
            ctx.fillStyle = box.color;
            ctx.fill();
            drawText(box.value, bx + 28, valY, 'bold 14px system-ui, sans-serif', box.color, 'left');
          } else {
            drawText(box.value, bx + 14, valY, 'bold 14px system-ui, sans-serif', '#ffffff', 'left', true);
          }
        });

        // ─── Bottom: QR Code + Astronaut badge ───
        const bottomY = 288;

        // QR Code (large, right side)
        const qrSize = 100;
        const qrX = width - 30 - qrSize;
        const qrY = bottomY + 10;

        // QR background
        rRect(qrX, qrY, qrSize + 12, qrSize + 12, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fill();

        if (qrImg) {
          ctx.save();
          rRect(qrX + 6, qrY + 6, qrSize, qrSize, 4);
          ctx.clip();
          ctx.drawImage(qrImg, qrX + 6, qrY + 6, qrSize, qrSize);
          ctx.restore();
        }

        // Left side bottom: Astronaut badge + Name
        const leftBottomX = 30;
        const leftBottomY = bottomY + 20;

        // Astronaut badge
        rRect(leftBottomX, leftBottomY, 200, 36, 10);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();
        drawText('Now an Astronaut', leftBottomX + 14, leftBottomY + 8, 'bold 13px system-ui, sans-serif', '#ffffff', 'left');

        // Member name
        drawText(userName || 'SpaceOut Member', leftBottomX, leftBottomY + 50, 'bold 20px system-ui, sans-serif', '#ffffff', 'left', true);

        // Footer
        drawText('© SpaceOut', 30, height - 36, '11px system-ui, sans-serif', 'rgba(255,255,255,0.4)');
        drawText('Astronaut', width - 30, height - 36, 'bold 11px system-ui, sans-serif', 'rgba(255,255,255,0.6)', 'right');
      } else {
        // ─── BACK OF CARD ───

        // Header bar
        rRect(0, 0, width, 56, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fill();

        // Header text
        drawText('Now an Astronaut', 30, 16, 'bold 16px system-ui, sans-serif', '#ffffff', 'left', true);
        if (displayCardNumber !== 'SP-OUT-000000') {
          drawText(displayCardNumber, width - 30, 20, '12px monospace', 'rgba(255,255,255,0.6)', 'right');
        }

        // Section title
        drawText('Member Details', 30, 76, 'bold 14px system-ui, sans-serif', 'rgba(255,255,255,0.6)');

        // Detail boxes
        const detailY = 106;
        const detailH = 56;
        const detailGap = 12;
        const detailW = (width - 60 - detailGap) / 2;

        const details = [
          { label: 'Member Name', value: userName || 'N/A', icon: '👤' },
          { label: 'Email', value: email || 'N/A', icon: '✉' },
          { label: 'Issued', value: formattedDate, icon: '📅' },
          { label: 'Expires', value: formattedExpiry, icon: '📆' },
        ];

        details.forEach((d, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const dx = 30 + col * (detailW + detailGap);
          const dy = detailY + row * (detailH + detailGap);

          rRect(dx, dy, detailW, detailH, 10);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fill();

          // Label
          drawText(d.label, dx + 14, dy + 8, 'bold 10px system-ui, sans-serif', 'rgba(255,255,255,0.4)');
          // Value
          drawText(d.value, dx + 14, dy + 28, 'bold 13px system-ui, sans-serif', '#ffffff', 'left', true);
        });

        // Signature section
        const sigY = detailY + 2 * (detailH + detailGap) + 12;
        drawText('Member Signature', 30, sigY, 'bold 10px system-ui, sans-serif', 'rgba(255,255,255,0.4)');

        rRect(30, sigY + 24, width - 60, 48, 10);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        if (signature) {
          // Try to draw signature image
          try {
            const sigImg = document.createElement('img');
            sigImg.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
              sigImg.onload = () => resolve();
              sigImg.onerror = () => reject(new Error('Failed'));
              sigImg.src = signature;
            });
            const sigAspect = sigImg.width / sigImg.height;
            const sigDrawH = 32;
            const sigDrawW = sigDrawH * sigAspect;
            ctx.drawImage(sigImg, width / 2 - sigDrawW / 2, sigY + 32 - sigDrawH, sigDrawW, sigDrawH);
          } catch {
            drawText('Signature on file', width / 2, sigY + 18, '12px system-ui, sans-serif', 'rgba(255,255,255,0.4)', 'center');
          }
        } else {
          drawText('Signature on file', width / 2, sigY + 18, '12px system-ui, sans-serif', 'rgba(255,255,255,0.4)', 'center');
        }

        // Footer
        drawText('© SpaceOut', 30, height - 36, '11px system-ui, sans-serif', 'rgba(255,255,255,0.4)');
        drawText('Astronaut', width - 30, height - 36, 'bold 11px system-ui, sans-serif', 'rgba(255,255,255,0.6)', 'right');
      }

      const link = document.createElement('a');
      link.download = `spaceout-card-${cardNumber || 'member'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Card downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download card. Please try again.');
    }
  }, [
    isFlipped, displayCardNumber, membershipType, userName, email,
    formattedDate, formattedExpiry, cardNumber, profileImage, signature, qrCodeUrl,
  ]);

  // Expose the canvas download through the onDownload prop by wrapping it
  const wrappedOnDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }
    downloadCardViaCanvas();
  }, [onDownload, downloadCardViaCanvas]);

  if (!mounted) {
    return (
      <div className="w-full aspect-[1.586/1] bg-gray-100 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="w-full flex flex-col items-center py-1 gap-2 max-w-3xl mx-auto">
      <div className="relative w-full" style={{ perspective: '1000px' }}>
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="w-full"
          style={{ transformStyle: 'preserve-3d', aspectRatio: '1.586/1' }}
        >
          {/* Front of Card */}
          <div
            className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl ${
              isFlipped ? 'hidden' : 'block'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
          >
            <div className="relative w-full aspect-[1.586/1]">
              <Image
                src="/card-front.webp"
                alt="Card Front"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/40" />
              <div className="absolute inset-0 flex flex-col justify-between p-3 md:p-4">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className="bg-slate-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1">
                    <p className="text-[9px] font-bold text-white tracking-widest uppercase">SpaceOut</p>
                  </div>
                  {displayCardNumber !== 'SP-OUT-000000' && (
                    <div className="bg-amber-500/90 backdrop-blur-sm rounded-lg px-2 py-0.5 border border-amber-400">
                      <p className="text-[9px] font-mono font-bold text-white tracking-wider">{displayCardNumber}</p>
                    </div>
                  )}
                </div>
                {/* Middle Section */}
                <div className="flex-1 flex flex-col justify-end gap-1">
                  {/* Profile Photo */}
                  <div className="flex items-center gap-2">
                    {profileImage ? (
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg">
                        <Image src={profileImage} alt="Passport" width={40} height={40} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center border-2 border-amber-500">
                        <span className="text-white font-bold text-sm">{userName ? userName.charAt(0).toUpperCase() : '?'}</span>
                      </div>
                    )}
                  </div>
                  {/* Astronaut Badge */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                      <Image src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} alt="Logo" width={28} height={28} className="w-3.5 h-3.5 object-contain rounded-full" />
                    </div>
                    <span className="text-[9px] font-black text-white tracking-[0.2em] uppercase drop-shadow-lg">Now an Astronaut</span>
                  </div>
                  {/* Membership Type */}
                  <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-[8px] font-semibold text-slate-400 tracking-widest uppercase mb-0.5">Membership</p>
                    <h3 className="text-xs font-black text-white leading-tight">{membershipType}</h3>
                  </div>
                  {/* Member Name */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
                    <p className="text-[8px] font-semibold text-slate-400 tracking-widest uppercase mb-0.5">Member Name</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                  </div>
                  {/* Card Number */}
                  {displayCardNumber !== 'SP-OUT-000000' && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <p className="text-[7px] font-semibold text-slate-400 tracking-widest uppercase mb-0.5">Card Number</p>
                      <p className="text-[11px] font-mono font-bold text-slate-800 tracking-wider">{displayCardNumber}</p>
                    </div>
                  )}
                </div>
                {/* Bottom Row */}
                <div className="flex items-end justify-between gap-2 mt-1">
                  {/* Status */}
                  <div className="text-left space-y-1">
                    <div>
                      <p className="text-[6px] font-semibold text-white/70 tracking-widest uppercase">Status</p>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black text-emerald-300 uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[6px] font-semibold text-white/70 tracking-widest uppercase">Valid Until</p>
                      <p className="text-[9px] font-bold text-white">{formattedExpiry}</p>
                    </div>
                  </div>
                  {/* QR Code */}
                  <div className="bg-white rounded-lg p-1 border-2 border-white/30 flex-shrink-0">
                    {qrCodeUrl ? (
                      <Image src={qrCodeUrl} alt="QR Code" width={48} height={48} className="w-8 h-8" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><QrCode className="w-3.5 h-3.5 text-gray-400" /></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div
            className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl ${
              isFlipped ? 'block' : 'hidden'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="relative w-full aspect-[1.586/1]">
              <Image src="/card-back.webp" alt="Card Back" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 600px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
              <div className="absolute inset-0 flex flex-col h-full p-3 md:p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-slate-900/90 px-2.5 py-1 rounded-lg">
                    <p className="text-[8px] font-black text-white tracking-widest uppercase">Now an Astronaut</p>
                  </div>
                  {displayCardNumber !== 'SP-OUT-000000' && <p className="text-[9px] font-mono text-white/70">{displayCardNumber}</p>}
                </div>
                {/* Details Grid */}
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5"><User className="w-2.5 h-2.5 text-slate-500" /><p className="text-[7px] font-semibold text-slate-500 tracking-widest uppercase">Member Name</p></div>
                      <p className="text-[11px] font-bold text-slate-900 truncate">{userName}</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5"><Shield className="w-2.5 h-2.5 text-slate-500" /><p className="text-[7px] font-semibold text-slate-500 tracking-widest uppercase">Email</p></div>
                      <p className="text-[9px] font-medium text-slate-700 truncate">{email || 'N/A'}</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5"><Calendar className="w-2.5 h-2.5 text-slate-500" /><p className="text-[7px] font-semibold text-slate-500 tracking-widest uppercase">Issued</p></div>
                      <p className="text-[11px] font-bold text-slate-900">{formattedMemberSince}</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5"><CreditCard className="w-2.5 h-2.5 text-slate-500" /><p className="text-[7px] font-semibold text-slate-500 tracking-widest uppercase">Expires</p></div>
                      <p className="text-[11px] font-bold text-slate-900">{formattedExpiry}</p>
                    </div>
                  </div>
                  {/* Signature */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-[7px] font-semibold text-slate-500 tracking-widest uppercase mb-1">Member Signature</p>
                    {signature ? (
                      <div className="bg-gray-50 rounded p-1 h-8 flex items-center justify-center"><Image src={signature} alt="Signature" width={120} height={40} className="max-h-full max-w-full object-contain" /></div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded h-8 flex items-center justify-center"><p className="text-slate-400 text-[9px]">Signature on file</p></div>
                    )}
                  </div>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                  <p className="text-white/60 text-[7px]">© SpaceOut</p>
                  <p className="text-white text-[7px] font-black tracking-widest uppercase">Astronaut</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        <motion.button
          onClick={handleFlipClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white hover:bg-gray-50 backdrop-blur-sm text-slate-700 border border-slate-200 rounded-xl transition-colors text-sm md:text-base shadow-sm"
        >
          <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          {isFlipped ? 'Card Front' : 'Card Back'}
        </motion.button>

        <motion.button
          onClick={wrappedOnDownload}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition-all text-sm md:text-base"
        >
          <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Download Card
        </motion.button>
      </div>
    </div>
  );
}
