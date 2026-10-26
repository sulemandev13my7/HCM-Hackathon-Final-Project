const variants = {
  primary:
    "bg-hcm-ink text-hcm-surface shadow-[0_12px_28px_-18px_rgba(16,37,31,0.8)] hover:bg-hcm-ink-soft",
  lime: "bg-hcm-lime text-hcm-ink shadow-[0_12px_28px_-18px_rgba(16,37,31,0.8)] hover:bg-[#c9ee86]",
  secondary:
    "border border-hcm-line bg-white/80 text-hcm-ink hover:border-hcm-line-strong hover:bg-white",
  ghost: "text-hcm-muted hover:bg-hcm-ink/5 hover:text-hcm-ink",
  danger: "bg-hcm-danger text-white hover:bg-[#913a25]",
  inverse: "bg-hcm-lime text-hcm-ink hover:bg-[#c9ee86]",
  "inverse-ghost":
    "border border-white/15 bg-white/5 text-hcm-surface hover:bg-white/10",
};

const sizes = {
  sm: "h-9 gap-1.5 rounded-xl px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-11 gap-2 rounded-xl px-5 text-sm",
  icon: "h-10 w-10 rounded-xl",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className = "",
} = {}) {
  return `inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
}
