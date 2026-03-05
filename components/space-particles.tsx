'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  duration: number;
  delay: number;
}

interface Planet {
  id: number;
  name: string;
  size: number;
  distance: number;
  color: string;
  orbitDuration: number;
  opacity: number;
  rotationDuration: number;
  glow: string;
}

export function SpaceParticles() {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [mounted, setMounted] = useState(false);

  // Solar System planets with realistic properties
  const planets: Planet[] = [
    {
      id: 0,
      name: 'Mercury',
      size: 8,
      distance: 60,
      color: 'from-gray-400 to-gray-500',
      orbitDuration: 6,
      opacity: 0.7,
      rotationDuration: 3,
      glow: 'rgba(150, 150, 150, 0.6)',
    },
    {
      id: 1,
      name: 'Venus',
      size: 14,
      distance: 100,
      color: 'from-yellow-300 to-yellow-500',
      orbitDuration: 10,
      opacity: 0.75,
      rotationDuration: 4,
      glow: 'rgba(255, 200, 100, 0.7)',
    },
    {
      id: 2,
      name: 'Earth',
      size: 15,
      distance: 140,
      color: 'from-blue-400 to-green-500',
      orbitDuration: 14,
      opacity: 0.8,
      rotationDuration: 4,
      glow: 'rgba(100, 150, 255, 0.6)',
    },
    {
      id: 3,
      name: 'Mars',
      size: 10,
      distance: 180,
      color: 'from-red-500 to-orange-600',
      orbitDuration: 18,
      opacity: 0.7,
      rotationDuration: 5,
      glow: 'rgba(255, 100, 50, 0.5)',
    },
    {
      id: 4,
      name: 'Jupiter',
      size: 40,
      distance: 240,
      color: 'from-orange-400 via-yellow-600 to-orange-700',
      orbitDuration: 30,
      opacity: 0.6,
      rotationDuration: 3,
      glow: 'rgba(200, 100, 50, 0.4)',
    },
    {
      id: 5,
      name: 'Saturn',
      size: 35,
      distance: 300,
      color: 'from-yellow-200 to-yellow-400',
      orbitDuration: 40,
      opacity: 0.5,
      rotationDuration: 5,
      glow: 'rgba(255, 220, 100, 0.3)',
    },
  ];

  useEffect(() => {
    setMounted(true);
    
    // Generate realistic star field
    const generatedStars: Star[] = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
    }));
    setStars(generatedStars);

    // Generate shooting stars
    const generatedShootingStars: ShootingStar[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 40,
      angle: Math.random() * 45 + 20,
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 10,
    }));
    setShootingStars(generatedShootingStars);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Fixed background canvas for space particles */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {/* Deep space background with layers - REMOVED to keep transparent */}
        {/* Only particles, no dark background */}
        
        {/* Aurora borealis effect - top */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-green-600/10 via-cyan-500/5 to-transparent blur-3xl"
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Aurora accent - top right */}
        <motion.div
          className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-l from-purple-600/15 to-transparent rounded-full blur-3xl"
          animate={{
            opacity: [0.15, 0.35, 0.15],
            x: [20, -20, 20],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Main stars - twinkling */}
        {stars.map((star) => (
          <motion.div
            key={`star-${star.id}`}
            className="absolute rounded-full bg-white"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              left: `${star.x}%`,
              top: `${star.y}%`,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
            }}
            animate={{
              opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Shooting stars / Meteors */}
        {shootingStars.map((meteor) => {
          // Calculate end position based on angle
          const distance = 300;
          const radiansAngle = (meteor.angle * Math.PI) / 180;
          const endX = distance * Math.cos(radiansAngle);
          const endY = distance * Math.sin(radiansAngle);

          return (
            <motion.div
              key={`meteor-${meteor.id}`}
              className="absolute"
              style={{
                left: `${meteor.startX}%`,
                top: `${meteor.startY}%`,
              }}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], x: endX, y: endY }}
              transition={{
                duration: meteor.duration,
                repeat: Infinity,
                delay: meteor.delay,
                ease: 'easeIn',
              }}
            >
              {/* Meteor head */}
              <div 
                className="w-1.5 h-1.5 bg-white rounded-full"
                style={{
                  boxShadow: '0 0 8px rgba(255, 200, 100, 1), 0 0 20px rgba(255, 100, 50, 0.6)',
                }}
              />
              {/* Meteor tail */}
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: '80px',
                  height: '2px',
                  background: 'linear-gradient(to left, rgba(255, 150, 50, 0.8), transparent)',
                  transformOrigin: 'right center',
                  transform: `rotate(${-(meteor.angle)}deg)`,
                }}
              />
            </motion.div>
          );
        })}

        {/* Solar System - centered on screen */}
        <div className="absolute top-1/3 left-1/2 w-96 h-96">
          {/* The Sun */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500"
            style={{
              width: '30px',
              height: '30px',
              boxShadow: '0 0 40px rgba(255, 150, 0, 0.9), 0 0 80px rgba(255, 100, 0, 0.6)',
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Orbital paths and planets */}
          {planets.map((planet) => (
            <motion.div
              key={planet.id}
              className="absolute top-1/2 left-1/2"
              style={{
                width: `${planet.distance * 2}px`,
                height: `${planet.distance * 2}px`,
                marginLeft: `-${planet.distance}px`,
                marginTop: `-${planet.distance}px`,
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: planet.orbitDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {/* Orbit path */}
              <div
                className="absolute inset-0 border border-white/5 rounded-full"
                style={{
                  borderRadius: '50%',
                }}
              />

              {/* Planet */}
              <motion.div
                className={`absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br ${planet.color}`}
                style={{
                  width: `${planet.size}px`,
                  height: `${planet.size}px`,
                  opacity: planet.opacity,
                  boxShadow: `0 0 ${planet.size * 1.5}px ${planet.glow}`,
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: planet.rotationDuration,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Distant nebula clouds */}
        <motion.div
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-t from-blue-600/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Additional nebula accent */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-b from-cyan-600/10 to-transparent rounded-full blur-3xl"
          animate={{
            opacity: [0.15, 0.3, 0.15],
            x: [10, -10, 10],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Ensure content appears above particles */}
      <div className="relative z-10" />
    </>
  );
}

