import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "light" | "dark";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ 
  variant = "default", 
  size = "md", 
  showText = true,
  className 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const colorClasses = {
    default: "text-primary",
    light: "text-white",
    dark: "text-foreground",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-lg p-1.5",
        variant === "default" && "bg-primary",
        variant === "light" && "bg-white/20",
        variant === "dark" && "bg-primary"
      )}>
        <Zap 
          className={cn(
            sizeClasses[size],
            variant === "default" && "text-primary-foreground",
            variant === "light" && "text-white",
            variant === "dark" && "text-primary-foreground"
          )} 
          strokeWidth={2.5}
          fill="currentColor"
        />
      </div>
      {showText && (
        <span className={cn(
          "font-display font-bold tracking-tight",
          textSizeClasses[size],
          colorClasses[variant]
        )}>
          VoltFix
        </span>
      )}
    </div>
  );
}
