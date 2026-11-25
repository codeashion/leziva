// Luxury Editorial Animation Variants & Timing Tokens
// Designed for High-Fashion E-Commerce Interfaces

export const LUXURY_EASE = [0.22, 1, 0.36, 1] as const; // Premium cubic-bezier ease-out
export const LUXURY_EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;

// Staggered Container Variant
export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

// Editorial Text Stagger (Word-by-word or Line-by-line)
export const wordReveal = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.85,
      ease: LUXURY_EASE,
    },
  },
};

// Subtle Fade Up
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: LUXURY_EASE,
    },
  },
};

// Subtle Fade Down
export const fadeDown = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: LUXURY_EASE,
    },
  },
};

// Image Mask Reveal (Clip-path from bottom or inset)
export const imageMaskReveal = {
  hidden: {
    clipPath: "inset(15% 0% 0% 0%)",
    opacity: 0,
    scale: 1.08,
  },
  visible: {
    clipPath: "inset(0% 0% 0% 0%)",
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: LUXURY_EASE,
    },
  },
};

// Arch Card Stagger
export const archCardVariant = {
  hidden: { opacity: 0, y: 35, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: LUXURY_EASE,
    },
  },
};

// Slide-in Drawer Variant (Right)
export const drawerSlideRight = {
  hidden: { x: "100%", opacity: 0.5 },
  visible: {
    x: "0%",
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: LUXURY_EASE,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      duration: 0.35,
      ease: LUXURY_EASE,
    },
  },
};

// Slide-in Drawer Variant (Left for Mobile Nav)
export const drawerSlideLeft = {
  hidden: { x: "-100%", opacity: 0.5 },
  visible: {
    x: "0%",
    opacity: 1,
    transition: {
      duration: 0.45,
      ease: LUXURY_EASE,
    },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: {
      duration: 0.35,
      ease: LUXURY_EASE,
    },
  },
};

// Modal Pop Variant
export const modalPop = {
  hidden: { opacity: 0, scale: 0.95, y: 15 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: LUXURY_EASE,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.25,
      ease: LUXURY_EASE,
    },
  },
};

// Accordion Expand / Collapse
export const accordionVariant = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: LUXURY_EASE },
      opacity: { duration: 0.2 },
    },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.35, ease: LUXURY_EASE },
      opacity: { duration: 0.3, delay: 0.05 },
    },
  },
};

// Subtle Page Transition Variant
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: LUXURY_EASE },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.3, ease: LUXURY_EASE },
  },
};
