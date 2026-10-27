export default function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "",
  icon: Icon,
}) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className={`hcm-card overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hcm-line/80 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-hcm-accent-soft text-hcm-accent">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-hcm-ink">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs leading-5 text-hcm-muted">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className={`px-5 py-4 sm:px-6 sm:py-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
