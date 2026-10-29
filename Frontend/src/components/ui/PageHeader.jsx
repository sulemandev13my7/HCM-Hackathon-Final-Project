export default function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  leading,
  className = "",
}) {
  return (
    <header
      className={`hcm-page-header relative isolate overflow-hidden rounded-[24px] border border-hcm-line/80 px-5 py-6 text-hcm-ink shadow-hcm-lift sm:px-7 sm:py-7 ${className}`}
    >
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {leading}
          <div className="min-w-0">
            {eyebrow && (
              <p className="hcm-eyebrow text-hcm-accent-strong">
                <span className="h-1.5 w-1.5 rounded-full bg-hcm-accent" />
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 font-display text-[27px] font-bold leading-[1.15] tracking-[-0.03em] text-hcm-ink text-balance sm:text-[34px]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-hcm-muted">
                {description}
              </p>
            )}
            {meta && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {meta}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
