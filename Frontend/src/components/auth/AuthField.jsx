import { AlertCircle } from "lucide-react";

export default function AuthField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  action,
  optional = false,
  className = "",
  ...inputProps
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-hcm-ink-soft"
        >
          {label}
        </label>
        {optional && (
          <span className="text-xs font-medium text-hcm-muted">
            Optional
          </span>
        )}
      </div>

      <div className="relative min-w-0">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-hcm-muted" />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={`h-12 min-w-0 w-full rounded-[10px] border bg-hcm-surface pl-11 text-base text-hcm-ink outline-none transition placeholder:text-hcm-muted disabled:cursor-not-allowed disabled:opacity-60 ${
            action ? "pr-12" : "pr-4"
          } ${
            error
              ? "border-rose-300 focus:border-hcm-danger focus:ring-4 focus:ring-hcm-danger/10"
              : "border-hcm-line hover:border-hcm-line-strong focus:border-hcm-accent focus:ring-4 focus:ring-hcm-accent/10"
          } ${className}`}
          {...inputProps}
        />
        {action && (
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
            {action}
          </div>
        )}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-hcm-danger"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <div id={`${id}-hint`} className="mt-1.5 text-xs text-hcm-muted">
            {hint}
          </div>
        )
      )}
    </div>
  );
}
