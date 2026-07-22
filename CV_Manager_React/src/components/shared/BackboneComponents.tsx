import { careerBackboneCoverage } from "../../utils/normalize";
export { SubmitReadinessPanel, submitReadiness } from "./SubmitReadinessComponents";

export function BackboneCoveragePanel({ coverage }: { coverage: NonNullable<ReturnType<typeof careerBackboneCoverage>> }) {
  const rows = [
    { label: "Projects", value: coverage.projectCount, expected: "source-derived", ok: coverage.projectCount > 0 },
    { label: "Skill Map", value: coverage.skillCount, expected: `target ${coverage.expectedSkills}+`, ok: coverage.enoughSkills },
    { label: "Domain Knowledge", value: coverage.domainCount, expected: `target ${coverage.expectedDomains}+`, ok: coverage.enoughDomains },
    { label: "Evidence Bank", value: coverage.evidenceCount, expected: `target ${coverage.expectedEvidence}+`, ok: coverage.enoughEvidence },
    { label: "STAR Story Bank", value: coverage.storyCount, expected: `target ${coverage.expectedStories}+`, ok: coverage.enoughStories }
  ];
  const tooSparse = rows.some((row) => !row.ok);
  return (
    <section className={tooSparse ? "backbone-coverage sparse" : "backbone-coverage"}>
      <div>
        <strong>Backbone Coverage Check</strong>
        <p>{tooSparse ? "This output looks too thin for repeated JD tailoring. Ask GPT to expand per project before applying." : "Coverage looks usable for JD tailoring."}</p>
      </div>
      <div className="backbone-coverage-grid">
        {rows.map((row) => (
          <article className={row.ok ? "ok" : "warn"} key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <small>{row.expected}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
