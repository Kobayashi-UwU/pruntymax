import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "outline" | "solid";

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
};

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = BaseProps & {
  href?: string;
};

const baseStyles = "inline-flex items-center justify-center rounded-full border text-base font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const variantStyles: Record<ButtonVariant, string> = {
  outline:
    "border-white/30 bg-transparent text-white hover:border-white hover:bg-white/10",
  solid: "border-white bg-white text-black hover:bg-white/90",
};

export const MainButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, disabled, variant = "outline", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        baseStyles,
        "px-6 py-3 text-lg",
        variantStyles[variant],
        disabled && "cursor-not-allowed border-white/20 text-white/30",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

MainButton.displayName = "MainButton";

export const MainLinkButton = ({
  children,
  className,
  variant = "outline",
  disabled,
  href,
}: LinkProps & { disabled?: boolean }) => {
  if (disabled || !href) {
    return (
      <span
        role="button"
        aria-disabled="true"
        className={cn(
          baseStyles,
          "px-6 py-3 text-lg",
          variantStyles[variant],
          "cursor-not-allowed border-white/10 text-white/40",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(baseStyles, "px-6 py-3 text-lg", variantStyles[variant], className)}
    >
      {children}
    </Link>
  );
};
