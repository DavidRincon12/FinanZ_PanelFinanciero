import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPageProps {
  children: React.ReactNode;
}

const pageVariants: any = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut", // Using standard easing string for compatibility
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    }
  },
};

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
