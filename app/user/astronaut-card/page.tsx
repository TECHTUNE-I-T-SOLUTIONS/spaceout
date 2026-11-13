'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { MembershipCard } from '@/components/membership-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, CheckCircle, AlertCircle, CreditCard, Calendar, User, Shield, Crown, Clock, ChevronRight, Sparkles, Download, X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface UserSubscription {
  _id: string;
  serviceName: string;
  planName: string;
  expiryDate: string;
  status: string;
  isAccessCard?: boolean;
  purchaseDate?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  passportUrl?: string;
  passportPhotoUrl?: string;
  signatureUrl?: string;
  profileImage?: string;
  cardNumber?: string;
  cardIssuedAt?: Date | string;
  createdAt?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function AstronautCardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [membershipData, setMembershipData] = useState<UserSubscription | null>(null);
  const [allSubscriptions, setAllSubscriptions] = useState<UserSubscription[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDownloadPreview, setShowDownloadPreview] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/login'); return; }
    if (status === 'authenticated') {
      const successParam = searchParams.get('success');
      const message = searchParams.get('message');
      if (successParam === 'true') { setSuccess('Membership payment successful! Your card is now active.'); window.history.replaceState({}, '', '/user/astronaut-card'); }
      else if (successParam === 'false') { setError(message || 'Payment failed. Please try again.'); window.history.replaceState({}, '', '/user/astronaut-card'); }
      fetchMembershipData();
    }
  }, [status, router, searchParams]);

  const fetchMembershipData = async () => {
    try {
      setLoading(true); setError(null);
      const [profileResponse, subscriptionsResponse] = await Promise.all([fetch('/api/user/profile'), fetch('/api/user/subscriptions')]);
      if (profileResponse.ok) setUserProfile(await profileResponse.json());
      if (subscriptionsResponse.ok) {
        const subs = (await subscriptionsResponse.json()).subscriptions || [];
        const active = subs.filter((s: UserSubscription) => s.status === 'active');
        setAllSubscriptions(active);
        let primary = active.find((s: UserSubscription) => !s.isAccessCard);
        if (!primary && active.length > 0) primary = active[0];
        if (primary) setMembershipData(primary);
        else setError('No active membership found. Please purchase a membership to view your card.');
      }
    } catch (err: any) { setError(err.message || 'An error occurred while fetching your data.'); }
    finally { setLoading(false); }
  };

  const handleDownloadCard = useCallback(async () => {
    try {
      toast.info('Preparing your card image...');
      const width = 1000; const height = Math.round(width / 1.586); const scale = 2;
      const canvas = document.createElement('canvas'); canvas.width = width * scale; canvas.height = height * scale;
      const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not get canvas context'); ctx.scale(scale, scale);
      const img = document.createElement('img'); img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Failed to load card image')); img.src = '/card-front.webp'; });
      ctx.drawImage(img, 0, 0, width, height); ctx.fillStyle = 'rgba(10, 10, 10, 0.5)'; ctx.fillRect(0, 0, width, height);
      const rR = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); };
      const drawT = (text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', outline = false) => { ctx.textAlign = align; ctx.font = font; ctx.textBaseline = 'top'; if (outline) { ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); } ctx.fillStyle = color; ctx.fillText(text, x, y); };
      const profileImageUrl = userProfile?.passportPhotoUrl || userProfile?.passportUrl || userProfile?.profileImage || null;
      let profileImg: HTMLImageElement | null = null;
      if (profileImageUrl) { profileImg = document.createElement('img'); profileImg.crossOrigin = 'anonymous'; await new Promise<void>((resolve, reject) => { profileImg!.onload = () => resolve(); profileImg!.onerror = () => reject(new Error('Failed to load profile image')); profileImg!.src = profileImageUrl; }).catch(() => { profileImg = null; }); }
      const qrData = JSON.stringify({ name: userProfile?.name || 'N/A', cardNumber: userProfile?.cardNumber || 'N/A', email: userProfile?.email || '', membership: membershipData?.planName || 'Member', verified: true });
      const qrUrl = await QRCode.toDataURL(qrData, { width: 140, margin: 1, color: { dark: '#1a1a2e', light: '#ffffff' } });
      let qrImg: HTMLImageElement | null = null;
      qrImg = document.createElement('img'); await new Promise<void>((resolve, reject) => { qrImg!.onload = () => resolve(); qrImg!.onerror = () => reject(new Error('Failed to load QR code')); qrImg!.src = qrUrl; });
      rR(0, 0, width, 56, 0); ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fill();
      rR(30, 14, 140, 32, 8); ctx.fillStyle = '#1a1a2e'; ctx.fill(); drawT('SpaceOut', 48, 22, 'bold 16px system-ui, sans-serif', '#ffffff', 'left', true);
      const cardNumStr = userProfile?.cardNumber && userProfile.cardNumber !== 'SP-OUT-000000' ? userProfile.cardNumber.replace(/(.{4})/g, '$1-').replace(/-$/, '') : 'SP-OUT-000000';
      if (cardNumStr !== 'SP-OUT-000000') { rR(width - 260, 14, 230, 32, 8); ctx.fillStyle = '#f59e0b'; ctx.fill(); drawT(cardNumStr, width - 145, 22, 'bold 14px monospace', '#ffffff', 'center', true); }
      const photoX = 30; const photoY = 76; const photoSize = 96; const photoRadius = photoSize / 2;
      if (profileImg) { ctx.save(); ctx.beginPath(); ctx.arc(photoX + photoRadius, photoY + photoRadius, photoRadius + 4, 0, Math.PI * 2); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.arc(photoX + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.drawImage(profileImg, photoX, photoY, photoSize, photoSize); ctx.restore(); }
      else { ctx.save(); ctx.beginPath(); ctx.arc(photoX + photoRadius, photoY + photoRadius, photoRadius, 0, Math.PI * 2); ctx.closePath(); ctx.clip(); ctx.fillStyle = '#334155'; ctx.fillRect(photoX, photoY, photoSize, photoSize); ctx.restore(); drawT(userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : '?', photoX + photoRadius, photoY + photoRadius - 20, 'bold 42px system-ui, sans-serif', '#94a3b8', 'center', true); }
      const infoX = photoX + photoSize + 24; let infoY = photoY + 10;
      drawT(userProfile?.name || 'SpaceOut Member', infoX, infoY, 'bold 24px system-ui, sans-serif', '#ffffff', 'left', true); infoY += 32;
      if (cardNumStr !== 'SP-OUT-000000') { drawT(cardNumStr, infoX, infoY, 'bold 14px monospace', '#f59e0b', 'left', true); infoY += 18; }
      drawT(userProfile?.email || session?.user?.email || 'N/A', infoX, infoY, '14px system-ui, sans-serif', 'rgba(255,255,255,0.85)', 'left', true); infoY += 20;
      if (userProfile?.phone) { drawT(userProfile.phone, infoX, infoY, '13px system-ui, sans-serif', 'rgba(255,255,255,0.7)', 'left', true); infoY += 18; }
      if (cardNumStr !== 'SP-OUT-000000') { drawT(`Card: ${cardNumStr}`, infoX, infoY, '12px monospace', 'rgba(255,255,255,0.6)', 'left', true); infoY += 18; }
      ctx.beginPath(); ctx.arc(infoX, infoY + 6, 5, 0, Math.PI * 2); ctx.fillStyle = '#22c55e'; ctx.fill(); drawT('Active', infoX + 18, infoY, 'bold 13px system-ui, sans-serif', '#22c55e', 'left'); infoY += 24;
      drawT('Astronaut Member', infoX, infoY, 'bold 12px system-ui, sans-serif', 'rgba(245,158,11,0.9)', 'left', true);
      const boxY = 200; const boxH = 72; const gap = 16; const boxW = (width - 60 - gap * 2) / 3;
      const boxes = [
        { label: 'PLAN', value: membershipData?.planName || membershipData?.serviceName || 'Member', color: '#f59e0b' },
        { label: 'STATUS', value: 'Active', color: '#22c55e', dot: true },
        { label: 'EXPIRES', value: membershipData?.expiryDate ? new Date(membershipData.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A', color: '#60a5fa' },
      ];
      boxes.forEach((box, i) => { const bx = 30 + i * (boxW + gap); rR(bx, boxY, boxW, boxH, 12); ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fill(); rR(bx, boxY, boxW, boxH, 12); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.stroke(); drawT(box.label, bx + 14, boxY + 10, 'bold 10px system-ui, sans-serif', 'rgba(255,255,255,0.5)'); let valY = boxY + 30; if (box.dot) { ctx.beginPath(); ctx.arc(bx + 16, valY + 6, 4, 0, Math.PI * 2); ctx.fillStyle = box.color; ctx.fill(); drawT(box.value, bx + 28, valY, 'bold 14px system-ui, sans-serif', box.color, 'left'); } else { drawT(box.value, bx + 14, valY, 'bold 14px system-ui, sans-serif', '#ffffff', 'left', true); } });
      const mdY = boxY + boxH + 20; drawT('Member Since', 30, mdY, 'bold 10px system-ui, sans-serif', 'rgba(255,255,255,0.5)'); const memberSinceDate = userProfile?.cardIssuedAt ? new Date(userProfile.cardIssuedAt) : membershipData?.purchaseDate ? new Date(membershipData.purchaseDate) : new Date();
      drawT(memberSinceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), 130, mdY, 'bold 12px system-ui, sans-serif', 'rgba(255,255,255,0.85)', 'left', true);
      const bottomY = 310; const qrSize = 140; const qrX = width - 30 - qrSize; const qrY = bottomY;
      rR(qrX, qrY, qrSize + 16, qrSize + 16, 10); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      if (qrImg) { ctx.save(); rR(qrX + 8, qrY + 8, qrSize, qrSize, 6); ctx.clip(); ctx.drawImage(qrImg, qrX + 8, qrY + 8, qrSize, qrSize); ctx.restore(); }
      const leftBottomX = 30; const leftBottomY = bottomY + 16;
      rR(leftBottomX, leftBottomY, 210, 36, 10); ctx.fillStyle = '#1a1a2e'; ctx.fill(); drawT('Now an Astronaut', leftBottomX + 14, leftBottomY + 8, 'bold 14px system-ui, sans-serif', '#ffffff', 'left');
      drawT(userProfile?.name || 'SpaceOut Member', leftBottomX, leftBottomY + 52, 'bold 22px system-ui, sans-serif', '#ffffff', 'left', true);
      if (cardNumStr !== 'SP-OUT-000000') { drawT(cardNumStr, leftBottomX, leftBottomY + 84, '12px monospace', 'rgba(255,255,255,0.5)', 'left', true); }
      drawT('© SpaceOut', 30, height - 36, '11px system-ui, sans-serif', 'rgba(255,255,255,0.4)'); drawT('Astronaut', width - 30, height - 36, 'bold 11px system-ui, sans-serif', 'rgba(255,255,255,0.6)', 'right');
      const link = document.createElement('a'); link.download = `spaceout-card-${userProfile?.cardNumber || 'member'}.png`; link.href = canvas.toDataURL('image/png'); link.click();
      toast.success('Card downloaded successfully!'); setShowDownloadPreview(false);
    } catch (err) { console.error('Download error:', err); toast.error('Failed to download card. Please try again.'); }
  }, [userProfile, membershipData, session?.user?.email]);

  const handleRegenerateCard = useCallback(async () => {
    try {
      setRegenerating(true);
      const res = await fetch('/api/user/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ regenerateCardNumber: true }) });
      const data = await res.json(); setUserProfile(data.profile);
      if (data.message?.includes('permanent')) toast.info(data.message);
      else toast.success(data.message || 'Card number generated successfully!');
    } catch (err: any) { toast.error(err.message || 'Failed to regenerate card number'); }
    finally { setRegenerating(false); }
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="px-3 py-3 max-w-[1400px] mx-auto">
          <Skeleton className="h-6 w-24 mb-1" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-40 rounded-xl bg-muted/30 animate-pulse mt-2 mb-3" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div className="px-3 py-3 max-w-[1400px] mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        {/* Back Link */}
        <motion.div variants={itemVariants}>
          <Link href="/user/dashboard" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground mb-3 transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </motion.div>

        {/* Success Alert */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }}>
              <Card className="p-3 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 text-xs">Payment Successful</h3>
                  <p className="text-emerald-700 dark:text-emerald-300 text-[10px]">{success}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && !success && (
            <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }}>
              <Card className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm mb-1">No Active Membership</h3>
                <p className="text-red-700 dark:text-red-300 text-xs mb-3">{error}</p>
                <Link href="/user/dashboard">
                  <Button variant="secondary" size="sm" className="text-xs">Explore Membership Options <ChevronRight className="ml-1 w-3.5 h-3.5" /></Button>
                </Link>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {membershipData && userProfile && (
          <>
            {/* Page Header */}
            <motion.div variants={itemVariants} className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="text-[10px]"><Crown className="w-3 h-3 mr-1" /> Astronaut</Badge>
              </div>
              <h1 className="text-xl font-bold text-foreground">Your Astronaut Card</h1>
              <p className="text-muted-foreground text-[10px]">Your exclusive membership card for premium SpaceOut experiences</p>
            </motion.div>

            {/* Membership Card */}
            <motion.div variants={itemVariants} className="mb-3">
              <MembershipCard
                userName={userProfile.name || 'SpaceOut Member'}
                membershipType={membershipData.planName}
                cardNumber={userProfile.cardNumber}
                signature={userProfile.signatureUrl}
                profileImage={userProfile.passportPhotoUrl || userProfile.passportUrl || userProfile.profileImage}
                memberSince={userProfile.cardIssuedAt || membershipData.purchaseDate || new Date()}
                membershipDate={userProfile.cardIssuedAt || membershipData.purchaseDate || new Date()}
                expiryDate={membershipData.expiryDate}
                email={userProfile.email || session?.user?.email || undefined}
                onDownload={() => setShowDownloadPreview(true)}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="mb-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleRegenerateCard} disabled={regenerating} className="text-[10px] h-7">
                {regenerating && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {regenerating ? 'Regenerating...' : 'Regenerate Card Number'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCard} className="text-[10px] h-7"><Download className="w-3.5 h-3.5" /> Download Card</Button>
            </motion.div>

            {/* Card Details Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {/* Member Info */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>
                  <h3 className="font-semibold text-xs">Member Info</h3>
                </div>
                <div className="space-y-1.5">
                  <div><p className="text-[9px] text-muted-foreground">Full Name</p><p className="text-[11px] font-medium">{userProfile.name || 'N/A'}</p></div>
                  <div><p className="text-[9px] text-muted-foreground">Email</p><p className="text-[11px] font-medium break-words">{userProfile.email || session?.user?.email || 'N/A'}</p></div>
                  {userProfile.cardNumber && (
                    <div><p className="text-[9px] text-muted-foreground">Card Number</p><p className="font-mono text-[10px] tracking-wider">{userProfile.cardNumber}</p></div>
                  )}
                </div>
              </Card>

              {/* Membership */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-amber-600" /></div>
                  <h3 className="font-semibold text-xs">Membership</h3>
                </div>
                <div className="space-y-1.5">
                  <div><p className="text-[9px] text-muted-foreground">Plan</p><p className="text-[11px] font-semibold">{membershipData.planName}</p></div>
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><Badge className="text-[9px]">Active</Badge></div>
                </div>
              </Card>

              {/* Validity */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center"><Calendar className="w-3.5 h-3.5 text-blue-600" /></div>
                  <h3 className="font-semibold text-xs">Validity</h3>
                </div>
                <div className="space-y-1.5">
                  <div><p className="text-[9px] text-muted-foreground">Expires</p><p className="text-[11px] font-semibold">{new Date(membershipData.expiryDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p></div>
                  <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-emerald-500" /><span className="text-[11px] text-emerald-600 font-medium">Identity Verified</span></div>
                </div>
              </Card>
            </motion.div>

            {/* All Subscriptions */}
            {allSubscriptions.length > 0 && (
              <motion.div variants={itemVariants} className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Subscriptions</h2>
                  <Badge variant="outline" className="text-[9px]">{allSubscriptions.length} active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allSubscriptions.map((sub, index) => (
                    <motion.div key={sub._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}>
                      <Card className="p-3 border-l-4 border-l-primary/60 hover:border-l-primary">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <h3 className="font-semibold text-[11px] flex items-center gap-1">{sub.serviceName}{sub.isAccessCard && <Badge variant="secondary" className="text-[8px]">Access Card</Badge>}</h3>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{sub.planName}</p>
                          </div>
                          <Badge className="text-[9px]"><Clock className="w-2.5 h-2.5 mr-0.5" />{sub.status}</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires: {new Date(sub.expiryDate).toLocaleDateString()}</div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Download Preview Modal */}
      <AnimatePresence>
        {showDownloadPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3" onClick={() => setShowDownloadPreview(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-xl p-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold">Download Your Card</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDownloadPreview(false)} className="h-7 w-7 p-0"><X className="w-3.5 h-3.5" /></Button>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">Your card will be downloaded as a high-quality PNG image.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleDownloadCard} className="flex-1 text-[10px]"><Download className="w-3.5 h-3.5 mr-1" /> Download PNG</Button>
                <Button variant="outline" size="sm" onClick={() => setShowDownloadPreview(false)} className="flex-1 text-[10px]">Cancel</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
