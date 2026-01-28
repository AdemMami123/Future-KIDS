import { Variants, Transition } from 'framer-motion';

/**
 * Animation variants for Framer Motion
 * Provides consistent, reusable animation configurations across the app
 */

// Default spring transition
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Smooth ease transition
export const smoothTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Bounce transition
export const bounceTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 10,
};

/**
 * Fade in/out variants
 */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade and slide up variants (great for cards and list items)
 */
export const fadeSlideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Fade and slide down variants
 */
export const fadeSlideDownVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Fade and slide from left
 */
export const fadeSlideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Fade and slide from right
 */
export const fadeSlideRightVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * Scale variants (great for buttons, modals)
 */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * Pop in effect (for success states, badges)
 */
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: bounceTransition,
  },
  exit: { opacity: 0, scale: 0 },
};

/**
 * Container variants for staggered children
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/**
 * Stagger container with faster animation
 */
export const fastStaggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/**
 * Child variants for staggered containers
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition,
  },
};

/**
 * Modal/overlay backdrop variants
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Modal content variants
 */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: springTransition,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: { duration: 0.2 },
  },
};

/**
 * Drawer variants (slide from right)
 */
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: { 
    x: 0,
    transition: springTransition,
  },
  exit: { x: '100%' },
};

/**
 * Menu dropdown variants
 */
export const menuVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.1 },
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.1 },
  },
};

/**
 * Page transition variants
 */
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * Card hover effect
 */
export const cardHoverVariants: Variants = {
  rest: { 
    scale: 1, 
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
  },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
};

/**
 * Button press effect
 */
export const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
};

/**
 * Pulse animation (for notifications, alerts)
 */
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Shake animation (for errors)
 */
export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

/**
 * Success checkmark animation
 */
export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeInOut' },
      opacity: { duration: 0.1 },
    },
  },
};

/**
 * Counter animation hook helper
 */
export const counterVariants = (from: number, to: number): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
});

/**
 * Confetti particle animation
 */
export const confettiVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 0, 
    scale: 0,
    rotate: 0,
  },
  visible: (custom: number) => ({
    opacity: [0, 1, 1, 0],
    y: [0, -100, -200, -300],
    x: [0, custom * 50, custom * 100, custom * 150],
    scale: [0, 1, 1, 0.5],
    rotate: [0, 180, 360, 540],
    transition: {
      duration: 2,
      ease: 'easeOut',
    },
  }),
};

/**
 * Loading spinner variants
 */
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Progress bar variants
 */
export const progressVariants = (progress: number): Variants => ({
  hidden: { width: 0 },
  visible: {
    width: `${progress}%`,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
});

/**
 * Tooltip variants
 */
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 5, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.15 },
  },
  exit: { 
    opacity: 0, 
    y: 5, 
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

/**
 * Notification slide in variants
 */
export const notificationVariants: Variants = {
  hidden: { opacity: 0, x: 100, scale: 0.9 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: springTransition,
  },
  exit: { 
    opacity: 0, 
    x: 100, 
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

/**
 * Tab content variants
 */
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.15 },
  },
};

/**
 * Accordion content variants
 */
export const accordionVariants: Variants = {
  hidden: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.2 },
  },
  visible: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export default {
  fadeVariants,
  fadeSlideUpVariants,
  fadeSlideDownVariants,
  fadeSlideLeftVariants,
  fadeSlideRightVariants,
  scaleVariants,
  popVariants,
  staggerContainerVariants,
  staggerItemVariants,
  backdropVariants,
  modalVariants,
  drawerVariants,
  menuVariants,
  pageTransitionVariants,
  cardHoverVariants,
  buttonVariants,
  pulseVariants,
  shakeVariants,
  checkmarkVariants,
  confettiVariants,
  spinnerVariants,
  tooltipVariants,
  notificationVariants,
  tabContentVariants,
  accordionVariants,
};
