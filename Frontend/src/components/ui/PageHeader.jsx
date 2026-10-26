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
      className={`relative overflow-hidden rounded-[30px] bg-hcm-ink px-5 py-6 text-hcm-surface shadow-[0_34px_90px_-58px_rgba(16,37,31,0.95)] sm:px-8 sm:py-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hcm-grid-pattern-dark opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-hcm-lime/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-[#2f6b50]/35 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4 sm:items-center">
          {leading}
          <div className="min-w-0">
            {eyebrow && (
              <p className="hcm-eyebrow-light">
                <span className="h-1.5 w-1.5 rounded-full bg-hcm-lime" />
                {eyebrow}
              </p>
            )}
            <h1 className="mt-2 font-display text-[2rem] leading-[1.08] tracking-[-0.025em] text-[#fffdf8] text-balance sm:text-[2.65rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2.5 max-w-2xl text-sm leading-6 text-[#bdcbc3]">
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
