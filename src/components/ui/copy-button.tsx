"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";

interface CopyButtonProps 
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  value: string;
  label?: string;
  showText?: boolean;
  successText?: string;
  idleText?: string;
  onCopy?: () => void;
}

export function CopyButton({
  value,
  label = "Content",
  showText = false,
  successText = "Copied",
  idleText = "Copy",
  onCopy,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      toast.success(`Copied ${label}`);
      onCopy?.();
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error(`Failed to copy ${label}`);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn(
        "gap-1.5 transition-colors",
        variant === "ghost" && "hover:text-brand hover:bg-brand-bg",
        variant === "outline" && "hover:border-brand/40 hover:text-brand hover:bg-brand-bg/50",
        className
      )}
      {...props}
    >
      {isCopied ? (
        <Check className="h-3.5 w-3.5 text-brand" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {showText && (isCopied ? successText : idleText)}
    </Button>
  );
}
