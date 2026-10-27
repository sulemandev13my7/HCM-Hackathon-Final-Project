const variants = {
  primary:
    "bg-hcm-accent text-white shadow-sm hover:bg-hcm-accent-strong",
  lime: "bg-hcm-lime text-hcm-ink hover:bg-[#c2e863]",
  secondary:
    "border border-hcm-line bg-white text-hcm-ink hover:border-hcm-line-strong hover:bg-hcm-surface-soft",
  ghost: "text-hcm-muted hover:bg-hcm-canvas hover:text-hcm-ink",
  danger: "bg-hcm-danger text-white hover:bg-[#9a3827]",
  inverse: "bg-white text-hcm-ink hover:bg-hcm-canvas",
  "inverse-ghost":
    "border border-white/15 bg-white/5 text-white hover:bg-white/10",
};

const sizes = {
  sm: "h-9 gap-1.5 rounded-[10px] px-3 text-xs",
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
