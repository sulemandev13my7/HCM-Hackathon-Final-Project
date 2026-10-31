const variants = {
  primary: "hcm-btn-primary text-white",
  lime: "bg-hcm-lime text-hcm-ink hover:bg-hcm-lime/85",
  secondary:
    "border border-hcm-line bg-white text-hcm-ink hover:border-hcm-line-strong hover:bg-hcm-surface-soft",
  ghost: "text-hcm-muted hover:bg-hcm-canvas hover:text-hcm-ink",
  danger: "bg-hcm-danger text-white hover:bg-[#921f15]",
  inverse:
    "border border-hcm-line bg-white text-hcm-ink shadow-sm hover:border-hcm-line-strong hover:bg-hcm-surface-soft",
  "inverse-ghost":
    "border border-hcm-accent/20 bg-white/55 text-hcm-accent-strong hover:bg-white",
};

const sizes = {
  sm: "h-10 gap-1.5 rounded-[10px] px-3 text-xs",
  md: "h-10 gap-2 rounded-[10px] px-4 text-sm",
  lg: "h-11 gap-2 rounded-[10px] px-5 text-sm",
  icon: "h-10 w-10 rounded-[10px]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className = "",
} = {}) {
  return `inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
}
