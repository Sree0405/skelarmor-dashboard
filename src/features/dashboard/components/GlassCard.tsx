import { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  delay?: number;
}

const GLASS_EASE = [0.16, 1, 0.3, 1] as const;

export const GlassCard = ({ children, className = "", hoverable = true, delay = 0 }: GlassCardProps) => {
  const transition = useMemo(
    () => ({ duration: 0.5, delay, ease: GLASS_EASE }),
    [delay]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={transition}
      className={`${hoverable ? "glass-card-hover" : "glass-card"} ${className}`}
    >
      {children}
    </motion.div>
  );
};
