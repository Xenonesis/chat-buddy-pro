import { ForwardRefExoticComponent, RefAttributes, ComponentPropsWithoutRef } from 'react';
import { AnimatePresenceProps, MotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface AnimatePresenceProps {
    children?: React.ReactNode;
  }

  export interface MotionProps {
    children?: React.ReactNode;
  }

  export const motion: {
    div: ForwardRefExoticComponent<Omit<ComponentPropsWithoutRef<'div'>, keyof MotionProps> & MotionProps & RefAttributes<HTMLDivElement>>;
    form: ForwardRefExoticComponent<Omit<ComponentPropsWithoutRef<'form'>, keyof MotionProps> & MotionProps & RefAttributes<HTMLFormElement>>;
    button: ForwardRefExoticComponent<Omit<ComponentPropsWithoutRef<'button'>, keyof MotionProps> & MotionProps & RefAttributes<HTMLButtonElement>>;
    // Add other element types as needed
  };

  export const AnimatePresence: React.FC<AnimatePresenceProps>;
} 