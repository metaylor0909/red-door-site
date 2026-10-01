
import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SlideShellProps {
  /** Required when used inside <AnimatePresence mode="wait"> so React can match in/out frames. */
  motionKey: string | number;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export default function SlideShell({
  motionKey,
  eyebrow,
  title,
  subtitle,
  children,
}: SlideShellProps) {
  return (
    <motion.div
      key={motionKey}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-md flex-col items-stretch text-center"
    >
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-[28px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{subtitle}</p>
      )}
      <div className="mt-8">{children}</div>
    </motion.div>
  );
}
