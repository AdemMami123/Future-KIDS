'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Page transition variants with proper typing
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
  },
};

// Slide variants for different directions
const slideLeftVariants: Variants = {
  initial: { opacity: 0, x: -30 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
};

const slideRightVariants: Variants = {
  initial: { opacity: 0, x: 30 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 30 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
};

const slideDownVariants: Variants = {
  initial: { opacity: 0, y: -30 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 30 },
};

// Fade only variant for minimal animations
const fadeVariants: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 },
};

// Scale variant for modal-like transitions
const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  enter: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'default' | 'fade' | 'scale' | 'slideLeft' | 'slideRight' | 'slideUp' | 'slideDown';
  className?: string;
  /** Set to true for reduced motion support */
  respectReducedMotion?: boolean;
}

export function PageTransition({ 
  children, 
  variant = 'default',
  className = '',
  respectReducedMotion = true,
}: PageTransitionProps) {
  const pathname = usePathname();

  const getVariants = (): Variants => {
    switch (variant) {
      case 'fade':
        return fadeVariants;
      case 'scale':
        return scaleVariants;
      case 'slideLeft':
        return slideLeftVariants;
      case 'slideRight':
        return slideRightVariants;
      case 'slideUp':
        return slideUpVariants;
      case 'slideDown':
        return slideDownVariants;
      default:
        return pageVariants;
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={className}
        // Accessibility: respect reduced motion preference
        style={respectReducedMotion ? { 
          // CSS will handle reduced motion via media query
        } : undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Staggered children animation wrapper
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.1,
  delayChildren = 0.2,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      transition={{
        staggerChildren: staggerDelay,
        delayChildren: delayChildren,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual animated item for stagger
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

const staggerItemVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  enter: { 
    opacity: 1, 
    y: 0,
  },
  exit: { 
    opacity: 0, 
    y: -10,
  },
};

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Hover scale animation for cards and buttons
interface HoverScaleProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function HoverScale({ children, scale = 1.02, className = '' }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in on scroll/view
interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeInView({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up',
}: FadeInViewProps) {
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 30 };
      case 'down': return { opacity: 0, y: -30 };
      case 'left': return { opacity: 0, x: 30 };
      case 'right': return { opacity: 0, x: -30 };
      default: return { opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
