import { cn } from "@/lib/utils";
import voltfixLogo from "@/assets/voltfix-logo.png";

interface LogoProps {
  variant?: "default" | "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export function Logo({ 
  variant = "default", 
  size = "md", 
  showTagline = false,
  className 
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-16",
  };

  const filterClasses = {
    default: "",
    light: "brightness-0 invert",
    dark: "",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={voltfixLogo} 
        alt="VoltFix - 24/7 Service" 
        className={cn(
          sizeClasses[size],
          "w-auto object-contain",
          filterClasses[variant]
        )}
      />
      {showTagline && (
        <span className={cn(
          "ml-2 text-xs font-medium tracking-wider uppercase",
          variant === "light" ? "text-white/70" : "text-muted-foreground"
        )}>
          24/7 Service
        </span>
      )}
    </div>
  );
}
