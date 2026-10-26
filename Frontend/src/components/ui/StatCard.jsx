export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "bg-hcm-accent-soft text-hcm-accent",
  emphasis = false,
  action,
  className = "",
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-5 shadow-hcm transition duration-300 hover:-translate-y-0.5 hover:shadow-hcm-lift ${
        emphasis
          ? "border-hcm-ink bg-hcm-ink text-hcm-surface"
          : "border-hcm-line bg-hcm-surface text-hcm-ink"
      } ${className}`}
    >
      {emphasis && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-hcm-lime/10 blur-2xl"
        />
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-semibold ${
              emphasis ? "text-[#b9c8c0]" : "text-hcm-muted"
            }`}
          >
            {label}
          </p>
          <p className="mt-2.5 text-[1.65rem] font-semibold tracking-[-0.03em]">
            {value}
          </p>
          {detail && (
            <p
              className={`mt-1 text-[11px] leading-5 ${
                emphasis ? "text-[#8fa79b]" : "text-hcm-muted"
              }`}
            >
              {detail}
            </p>
          )}
        </div>
        {Icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              emphasis ? "bg-white/10 text-hcm-lime" : tone
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      {action && <div className="relative mt-4">{action}</div>}
    </article>
  );
}
