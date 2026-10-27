export default function ProgressBar({
  value = 0,
  label,
  tone = "bg-hcm-accent",
  className = "",
}) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div
      className={className}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div className="h-2 overflow-hidden rounded-full bg-hcm-canvas-deep">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
