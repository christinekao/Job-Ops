import { cvLayoutDiagnostics } from "./utils";

export function CvLayoutDiagnosticsPanel({
  checks,
  compact = false
}: {
  checks: ReturnType<typeof cvLayoutDiagnostics>;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "layout-diagnostics compact" : "layout-diagnostics"}>
      <div className="layout-diagnostics-head">
        <strong>CV layout diagnostics</strong>
        <span>{checks.filter((item) => item.state === "ok").length}/{checks.length} balanced</span>
      </div>
      <div className="layout-diagnostics-grid">
        {checks.map((item) => (
          <article className={item.state === "ok" ? "ok" : "warn"} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {!compact && <p>{item.note}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
