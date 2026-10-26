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
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-[#32433c]"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[11px] font-medium text-[#8a948f]">
            Optional
          </span>
        )}
      </div>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8a948f]" />
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={`h-12 w-full rounded-xl border bg-[#fbfaf6] pl-11 text-[15px] text-[#16251f] outline-none transition placeholder:text-[#9aa39d] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
            action ? "pr-12" : "pr-4"
          } ${
            error
              ? "border-[#e7a6a0] focus:border-[#b42318] focus:ring-4 focus:ring-[#b42318]/10"
              : "border-[#ded8cb] hover:border-[#c9c1b2] focus:border-[#2f5d4d] focus:ring-4 focus:ring-[#2f5d4d]/10"
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
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-[#b42318]"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <div id={`${id}-hint`} className="mt-1.5 text-xs text-[#7d8882]">
            {hint}
          </div>
        )
      )}
    </div>
  );
}
