import { motion } from 'framer-motion';

interface AnimatedHeadingProps {
  text: string;
  className?: string;
}

export function AnimatedHeading({ text, className = '' }: AnimatedHeadingProps) {
  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className="relative inline-block"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main heading with Pacifico font */}
      <motion.h1
        className={`text-5xl md:text-7xl font-bold tracking-tight text-balance ${className}`}
        style={{
          fontFamily: '"Pacifico", cursive',
          fontWeight: 400,
          fontStyle: 'normal',
          letterSpacing: '0.02em',
        }}
      >
        {words.map((word, wordIndex) => (
          <motion.span
            key={wordIndex}
            variants={wordVariants}
            className="inline-block mr-3 md:mr-4"
          >
            {/* Individual letter color animation */}
            {word.split('').map((letter, letterIndex) => (
              <motion.span
                key={letterIndex}
                animate={{
                  color: [
                    'rgb(233, 229, 229)',      // White
                    'rgb(240, 240, 240)',      // Off-white
                    'rgb(231, 212, 127)',            // Black
                    'rgb(209, 185, 75)',         // Dark gray
                    'rgb(235, 235, 235)',      // Back to white
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (wordIndex * word.length + letterIndex) * 0.09,
                }}
                style={{
                  textShadow: 'inherit',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.span>
        ))}
      </motion.h1>
    </motion.div>
  );
}
