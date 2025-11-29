import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GameCardProps {
  children: ReactNode;
  className?: string;
  animateKey?: number;
}

export function GameCard({ children, className, animateKey }: GameCardProps) {
  return (
    <div
      key={animateKey}
      className={cn(
        "blur-card rounded-3xl border border-white/10 p-8 text-center shadow-glow transition-opacity",
        "animate-fadeUp",
        className,
      )}
    >
      {children}
    </div>
  );
}
