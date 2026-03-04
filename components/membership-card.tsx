'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface MembershipCardProps {
  userName: string;
  membershipType: string;
  signature?: string;
  membershipDate?: Date | string;
}

export function MembershipCard({
  userName,
  membershipType,
  signature,
  membershipDate,
}: MembershipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleCardClick();
    }
  };

  const formattedDate = membershipDate
    ? typeof membershipDate === 'string'
      ? membershipDate
      : format(new Date(membershipDate), 'MMM dd, yyyy')
    : format(new Date(), 'MMM dd, yyyy');

  return (
    <div className="w-full flex items-center justify-center py-8">
      <motion.div
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        role="button"
        tabIndex={0}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d' as any,
        }}
        className="w-full max-w-md cursor-pointer outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl"
      >
        {/* Front of Card */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          style={{
            transformStyle: 'preserve-3d' as any,
            backfaceVisibility: 'hidden' as any,
          }}
          className="h-96 rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-8 shadow-2xl border border-purple-500/20 relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

          {/* Header with SpaceOut branding */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-white font-bold tracking-widest text-sm">SPACEOUT</span>
              </div>

              <div className="mb-12">
                <p className="text-purple-300 text-xs font-semibold tracking-widest mb-2">
                  ASTRONAUT MEMBER
                </p>
                <h2 className="text-white text-3xl font-bold tracking-tight">
                  {membershipType}
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-purple-300 text-xs font-semibold tracking-widest mb-1">
                  MEMBER NAME
                </p>
                <p className="text-white text-xl font-bold">{userName}</p>
              </div>
              <div className="h-px bg-gradient-to-r from-purple-500/20 to-transparent" />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-purple-300 text-xs font-semibold tracking-widest mb-1">
                    STATUS
                  </p>
                  <p className="text-green-400 font-bold">ACTIVE</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-300 text-xs font-semibold tracking-widest mb-1">
                    VALID FROM
                  </p>
                  <p className="text-white font-semibold text-sm">{formattedDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Click hint for mobile */}
          <div className="absolute bottom-4 right-4 text-purple-300 text-xs opacity-50">
            Click to flip
          </div>
        </motion.div>

        {/* Back of Card */}
        <motion.div
          animate={{ rotateY: isFlipped ? 0 : 180 }}
          transition={{ duration: 0.6 }}
          style={{
            transformStyle: 'preserve-3d' as any,
            backfaceVisibility: 'hidden' as any,
          }}
          className="h-96 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 shadow-2xl border border-slate-700/50 relative overflow-hidden absolute inset-0"
        >
          {/* Decorative background elements */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl" />

          {/* Back content */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-slate-400 text-xs font-semibold tracking-widest mb-4">
                SIGNATURE
              </p>
              {signature ? (
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 h-24 flex items-center justify-center">
                  <img
                    src={signature}
                    alt="Member signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 h-24 flex items-center justify-center border-dashed">
                  <p className="text-slate-500 text-sm">No signature on file</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="h-px bg-gradient-to-r from-slate-600/50 to-transparent" />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-400 text-xs font-semibold tracking-widest mb-1">
                    ISSUED DATE
                  </p>
                  <p className="text-slate-200 font-semibold">{formattedDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs font-semibold tracking-widest mb-1">
                    CARD TYPE
                  </p>
                  <p className="text-slate-200 font-semibold">{membershipType}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-slate-500 text-xs">© SPACEOUT 2026</p>
                <p className="text-slate-400 text-xs font-semibold">DIGITAL MEMBER CARD</p>
              </div>
            </div>
          </div>

          {/* Click hint */}
          <div className="absolute bottom-4 left-4 text-slate-500 text-xs opacity-50">
            Click to flip
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile instructions */}
      <div className="md:hidden mt-4 text-center text-sm text-muted-foreground">
        Tap the card to flip
      </div>
    </div>
  );
}
