const tones = {
  neutral: "border-hcm-line bg-hcm-surface-soft text-hcm-muted",
  accent: "border-hcm-accent/15 bg-hcm-accent-soft text-hcm-accent",
  lime: "border-[#b7f5e8] bg-hcm-lime-soft text-[#006b5d]",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  dark: "border-white/10 bg-white/5 text-[#d9fff8]",
};

export default function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${tones[tone] || tones.neutral} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
