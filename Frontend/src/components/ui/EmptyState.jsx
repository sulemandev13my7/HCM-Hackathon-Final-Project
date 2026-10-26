export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-hcm-line-strong bg-[#faf7f0] px-5 py-9 text-center ${className}`}
    >
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-hcm-accent shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <h3 className="mt-3 text-sm font-semibold text-hcm-ink">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-5 text-hcm-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
