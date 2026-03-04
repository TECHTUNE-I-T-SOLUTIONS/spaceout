'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTheme } from 'next-themes';
import Image from 'next/image';

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
  const { theme } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFlipClick = () => {
    setIsFlipped(!isFlipped);
  };

  const formattedDate = membershipDate
    ? typeof membershipDate === 'string'
      ? membershipDate
      : format(new Date(membershipDate), 'MMM dd, yyyy')
    : format(new Date(), 'MMM dd, yyyy');

  if (!mounted) {
    return <div className="w-full h-80 md:h-96 bg-muted rounded-2xl animate-pulse" />;
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 md:py-8 gap-6">
      <motion.div
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '42rem',
        }}
        className="relative h-80 md:h-120 rounded-2xl"
        as="div"
      >
        {/* Front of Card */}
        {!isFlipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-2xl shadow-2xl border-2 border-amber-500/30 relative overflow-hidden"
            as="div"
            style={{
              backgroundImage: 'url(/card-front.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Content overlay */}
            <div className="relative z-10 flex flex-col h-full justify-between p-6 md:p-8">
              <div>
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="relative w-14 h-14 md:w-16 md:h-16 p-1 flex-shrink-0 bg-white/20 dark:bg-black/90 rounded-full flex items-center justify-center shadow-lg">
                    <Image
                      src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
                      alt="SpaceOut Logo"
                      width={86}
                      height={86}
                      className="w-18 h-18 md:w-18 md:h-10 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black dark:text-black drop-shadow-lg tracking-widest">
                      NOW AN
                    </p>
                    <h2 className="text-base md:text-lg font-black text-black dark:text-black drop-shadow-lg tracking-wide">
                      ASTRONAUT
                    </h2>
                  </div>
                </div>

                {/* Membership Type */}
                <div className="mb-8 md:mb-10 bg-black/20 backdrop-blur-sm px-4 py-3 rounded-lg">
                  <p className="text-xs font-semibold text-white/90 drop-shadow tracking-widest mb-1">
                    MEMBERSHIP
                  </p>
                  <h3 className="text-lg md:text-2xl font-black text-white drop-shadow-lg leading-tight max-w-xs">
                    {membershipType}
                  </h3>
                </div>
              </div>

              {/* Member Details */}
              <div className="space-y-4 md:space-y-5 bg-black/20 backdrop-blur-md p-4 md:p-5 rounded-lg border border-white/30">
                {/* Member Name */}
                <div>
                  <p className="text-xs font-semibold text-white/80 drop-shadow tracking-widest mb-1">
                    MEMBER NAME
                  </p>
                  <p className="text-base md:text-lg font-black text-white drop-shadow-lg">
                    {userName}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/40" />

                {/* Status and Date */}
                <div className="flex justify-between items-end gap-4">
                  <div>
                    <p className="text-xs font-semibold text-white/80 drop-shadow tracking-widest mb-1">
                      STATUS
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-lg" />
                      <p className="font-black text-emerald-100 drop-shadow text-xs md:text-sm">
                        ACTIVE
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/80 drop-shadow tracking-widest mb-1">
                      VALID FROM
                    </p>
                    <p className="font-black text-white drop-shadow-lg text-xs md:text-sm">
                      {formattedDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Back of Card */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-2xl shadow-2xl border-2 border-white/40 relative overflow-hidden"
            as="div"
            style={{
              backgroundImage: 'url(/card-back.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Content overlay */}
            <div className="relative z-10 flex flex-col h-full justify-between p-6 md:p-8">
              {/* Header area */}
              <div className="mb-6 md:mb-8 bg-white/15 backdrop-blur-sm px-4 py-3 rounded-lg text-center">
                <p className="text-xs font-black text-white drop-shadow tracking-widest">
                  NOW AN
                </p>
                <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight">
                  ASTRONAUT
                </h2>
              </div>

              {/* Signature area */}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xs font-semibold text-white drop-shadow tracking-widest mb-3 md:mb-4">
                  SIGNATURE
                </p>
                {signature ? (
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 md:p-4 border-2 border-white/50 h-20 md:h-24 flex items-center justify-center shadow-lg">
                    <Image
                      src={signature}
                      alt="Member signature"
                      width={100}
                      height={80}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 md:p-4 border-2 border-dashed border-white/60 h-20 md:h-24 flex items-center justify-center shadow-lg">
                    <p className="text-white font-semibold text-xs md:text-sm drop-shadow">Signature on file</p>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="space-y-3 md:space-y-4 bg-white/20 backdrop-blur-md p-4 md:p-5 rounded-lg border border-white/30">
                {/* Dates and info */}
                <div className="flex justify-between items-end gap-3 text-xs md:text-sm">
                  <div>
                    <p className="font-semibold text-white drop-shadow tracking-widest mb-1">
                      ISSUED
                    </p>
                    <p className="text-white font-black drop-shadow-lg">
                      {formattedDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white drop-shadow tracking-widest mb-1">
                      CARD TYPE
                    </p>
                    <p className="text-white font-black drop-shadow-lg">
                      {membershipType}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/40" />

                {/* SpaceOut branding */}
                <div className="flex items-center justify-between pt-2">
                  <p className="text-white/80 text-xs font-semibold drop-shadow">© SpaceOut</p>
                  <p className="text-white text-xs font-black drop-shadow-lg tracking-widest">ASTRONAUT</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Flip Button - Always visible but changes text based on card state */}
      <motion.button
        onClick={handleFlipClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-8 md:px-10 py-3 md:py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all text-sm md:text-base hover:from-amber-600 hover:to-orange-700"
      >
        {isFlipped ? '👁️ View Front' : '🖋️ View Signature'}
      </motion.button>

      {/* Instructions */}
      <div className="text-center text-xs md:text-sm text-muted-foreground max-w-sm">
        {isFlipped ? 'See your signature and card details' : 'View your membership information'}
      </div>
    </div>
  );
}