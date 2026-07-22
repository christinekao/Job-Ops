import type { CareerProfile, DomainKnowledge, EvidenceCard, JobApplication, SkillInference, StarStory } from "../../types";
import { experienceLabel, projectLabel, stringArray } from "../../utils/normalize";
import { EmptyState } from "./EmptyState";
import { Field, Textarea } from "./FormFields";

export function groupByExperience<T extends { experienceId?: string; projectId?: string }>(items: T[], profile: CareerProfile) {
  const groups = new Map<string, { id: string; label: string; items: T[] }>();
  items.forEach((item) => {
    const key = item.experienceId || "unassigned";
    if (!groups.has(key)) {
      groups.set(key, { id: key, label: experienceLabel(profile, item.experienceId), items: [] });
    }
    groups.get(key)?.items.push(item);
  });
  return Array.from(groups.values());
}

export function groupSelectionByLabel<T extends { id: string }>(items: T[], labelFor: (item: T) => string) {
  const groups = new Map<string, { id: string; label: string; items: T[] }>();
  items.forEach((item) => {
    const label = labelFor(item) || "Other";
    if (!groups.has(label)) groups.set(label, { id: label, label, items: [] });
    groups.get(label)?.items.push(item);
  });
  return Array.from(groups.values());
}

export function normalizeMatchKey(...parts: (string | undefined)[]) {
  return parts.join(" ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function migrateReplacement<T extends { id: string }>(
  current: T[],
  incoming: T[],
  referencedIds: string[],
  keyFor: (item: T) => string
) {
  const currentById = new Map(current.map((item) => [item.id, item]));
  const currentByKey = new Map(current.map((item) => [keyFor(item), item]));
  const nextItems = incoming.map((item) => {
    const byId = currentById.get(item.id);
    const byKey = currentByKey.get(keyFor(item));
    return { ...item, id: byId?.id || byKey?.id || item.id };
  });
  const nextIds = new Set(nextItems.map((item) => item.id));
  const protectedItems = current.filter((item) => referencedIds.includes(item.id) && !nextIds.has(item.id));
  const keptIds = nextItems.filter((item) => currentById.has(item.id)).map((item) => item.id);
  const addedIds = nextItems.filter((item) => !currentById.has(item.id)).map((item) => item.id);
  const removedIds = current.filter((item) => !nextIds.has(item.id) && !protectedItems.some((protectedItem) => protectedItem.id === item.id)).map((item) => item.id);
  return {
    nextItems: [...nextItems, ...protectedItems],
    keptIds,
    addedIds,
    removedIds,
    protectedIds: protectedItems.map((item) => item.id)
  };
}

export function ReplacementMigrationCard({
  title,
  diff,
  affectedJobs,
  onApply
}: {
  title: string;
  diff: { keptIds: string[]; addedIds: string[]; removedIds: string[]; protectedIds: string[] };
  affectedJobs: JobApplication[];
  onApply: () => void;
}) {
  return (
    <section className="panel migration-card">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>Review replacement diff before updating the bank. Protected items are kept because existing JDs still reference them.</p>
        </div>
        <button className="primary" onClick={onApply}>Apply migrated replacement</button>
      </div>
      <div className="migration-grid">
        <article><span>Kept</span><strong>{diff.keptIds.length}</strong></article>
        <article><span>Added</span><strong>{diff.addedIds.length}</strong></article>
        <article><span>Removed</span><strong>{diff.removedIds.length}</strong></article>
        <article><span>Protected</span><strong>{diff.protectedIds.length}</strong></article>
      </div>
      {affectedJobs.length > 0 && (
        <div className="migration-affected">
          <strong>Affected JD selections</strong>
          <p>{affectedJobs.map((job) => `${job.role} · ${job.company}`).join(" / ")}</p>
        </div>
      )}
    </section>
  );
}

export function EditableSkillCard({
  skill,
  onUpdate,
  onDelete
}: {
  skill: SkillInference;
  onUpdate: (patch: Partial<SkillInference>) => void;
  onDelete: () => void;
}) {
  return (
    <article className="editable-card skill-map-row">
      <em className="skill-card-group">{skill.group || "Other"}</em>
      <div className="editable-card-head">
        <div>
          <strong>{skill.skill || "Untitled skill"}</strong>
          <span>{[skill.strength, skill.usageContext, skill.confidence].filter(Boolean).join(" · ")}</span>
        </div>
        <button className="danger-lite" type="button" onClick={onDelete}>Delete</button>
      </div>
      <p>{skill.cvWording || skill.evidenceSummary || "No recruiter-facing wording yet."}</p>
      <details className="editable-details">
        <summary>Edit this skill card</summary>
        <div className="editable-card-grid">
          <Field label="Group" value={skill.group} onChange={(group) => onUpdate({ group })} />
          <Field label="Skill" value={skill.skill} onChange={(value) => onUpdate({ skill: value })} />
          <Field label="Strength" value={skill.strength} onChange={(value) => onUpdate({ strength: value as SkillInference["strength"] })} />
          <Field label="Usage context" value={skill.usageContext} onChange={(value) => onUpdate({ usageContext: value as SkillInference["usageContext"] })} />
          <Field label="Confidence" value={skill.confidence} onChange={(value) => onUpdate({ confidence: value as SkillInference["confidence"] })} />
          <Field label="Project ID" value={skill.projectId || ""} onChange={(projectId) => onUpdate({ projectId })} />
          <Textarea label="Evidence summary" value={skill.evidenceSummary} rows={4} onChange={(evidenceSummary) => onUpdate({ evidenceSummary })} />
          <Textarea label="CV wording" value={skill.cvWording} rows={4} onChange={(cvWording) => onUpdate({ cvWording })} />
          <Textarea label="Source IDs" value={skill.sourceIds.join(", ")} rows={3} onChange={(value) => onUpdate({ sourceIds: stringArray(value) })} />
        </div>
      </details>
    </article>
  );
}

export function EditableDomainCard({
  item,
  profile,
  summaryFacts,
  shortText,
  onUpdate,
  onDelete
}: {
  item: DomainKnowledge;
  profile: CareerProfile;
  summaryFacts: string[];
  shortText: (value: string, max?: number) => string;
  onUpdate: (patch: Partial<DomainKnowledge>) => void;
  onDelete: () => void;
}) {
  return (
    <article className="editable-card domain-map-row">
      <div className="editable-card-head">
        <div>
          <strong>{item.businessProcess || projectLabel(profile, item.projectId) || "Business context"}</strong>
          <span>{item.confidence}</span>
        </div>
        <button className="danger-lite" type="button" onClick={onDelete}>Delete</button>
      </div>
      <div className="domain-meta">
        {[projectLabel(profile, item.projectId), ...summaryFacts].filter(Boolean).map((label) => (
          <em key={label}>{label}</em>
        ))}
      </div>
      {(item.cvWording || item.proof) && <p>{shortText(item.cvWording || item.proof)}</p>}
      {item.riskOrCompliance && <small><strong>Risk:</strong> {shortText(item.riskOrCompliance, 110)}</small>}
      <details className="editable-details">
        <summary>Edit this domain card</summary>
        <div className="editable-card-grid">
          <Field label="Domain" value={item.domain} onChange={(domain) => onUpdate({ domain })} />
          <Field label="Business process" value={item.businessProcess} onChange={(businessProcess) => onUpdate({ businessProcess })} />
          <Field label="Confidence" value={item.confidence} onChange={(value) => onUpdate({ confidence: value as DomainKnowledge["confidence"] })} />
          <Field label="Project ID" value={item.projectId || ""} onChange={(projectId) => onUpdate({ projectId })} />
          <Textarea label="Stakeholders" value={item.stakeholders.join(", ")} rows={3} onChange={(value) => onUpdate({ stakeholders: stringArray(value) })} />
          <Textarea label="Systems / data" value={item.systemsOrData.join(", ")} rows={3} onChange={(value) => onUpdate({ systemsOrData: stringArray(value) })} />
          <Textarea label="Metrics / KPIs" value={item.metricsOrKpis.join(", ")} rows={3} onChange={(value) => onUpdate({ metricsOrKpis: stringArray(value) })} />
          <Textarea label="Risk / compliance" value={item.riskOrCompliance} rows={3} onChange={(riskOrCompliance) => onUpdate({ riskOrCompliance })} />
          <Textarea label="Proof" value={item.proof} rows={4} onChange={(proof) => onUpdate({ proof })} />
          <Textarea label="CV wording" value={item.cvWording} rows={4} onChange={(cvWording) => onUpdate({ cvWording })} />
          <Textarea label="Source IDs" value={item.sourceIds.join(", ")} rows={3} onChange={(value) => onUpdate({ sourceIds: stringArray(value) })} />
        </div>
      </details>
    </article>
  );
}

export function evidenceReadabilityIssues(card: EvidenceCard) {
  const visibleText = `${card.title} ${card.cvBullet || ""}`;
  const internalJargon = /\b(TOMO|Trender Buddy|GenAI Hub|Sunshine Project|AppsIQ|TrendIQ|Consumer Companion|Eureka API)\b|_tbl_|\bv\d+\.\d+\b/i;
  const diagnosticNumbers = /\bvs\b[^.;]*%|human-review cases|sample size|sampling ratio|configuration changes|change requests|version|records confirmed|reviewers? granted/i;
  return [
    internalJargon.test(visibleText) ? "internal-jargon" : "",
    card.evidenceTier === "Core" && diagnosticNumbers.test(`${visibleText} ${card.metrics}`) ? "diagnostic-metric" : ""
  ].filter(Boolean);
}

export function EditableEvidenceCard({
  card,
  profile,
  onUpdate,
  onDelete
}: {
  card: EvidenceCard;
  profile: CareerProfile;
  onUpdate: (patch: Partial<EvidenceCard>) => void;
  onDelete: () => void;
}) {
  const readabilityIssues = evidenceReadabilityIssues(card);
  return (
    <article className="evidence-card editable-card">
      <div className="editable-card-head">
        <div>
          <span>{[card.evidenceTier || "Supporting", card.category, projectLabel(profile, card.projectId), card.confidence].filter(Boolean).join(" / ")}</span>
          <strong>{card.title || "Untitled evidence"}</strong>
          {readabilityIssues.length > 0 && <em className="card-audit-warning">Recruiter wording review</em>}
        </div>
        <button className="danger-lite" type="button" onClick={onDelete}>Delete</button>
      </div>
      <p>{card.externalFriendlyDescription || card.cvSafeBullet || card.cvBullet || card.proof || "No recruiter-facing wording yet."}</p>
      <div className="tag-row">{card.tools.map((tool) => <em key={tool}>{tool}</em>)}</div>
      <details className="editable-details">
        <summary>Edit this evidence card</summary>
        <div className="editable-card-grid">
          <Field label="Title" value={card.title} onChange={(title) => onUpdate({ title })} />
          <Field label="Category" value={card.category} onChange={(category) => onUpdate({ category })} />
          <Field label="Internal name" value={card.internalName || ""} onChange={(internalName) => onUpdate({ internalName })} />
          <Field label="Date / period" value={card.datePeriod || ""} onChange={(datePeriod) => onUpdate({ datePeriod })} />
          <Field label="Candidate role" value={card.candidateRole || ""} onChange={(candidateRole) => onUpdate({ candidateRole })} />
          <Field label="Audience" value={card.audience || ""} onChange={(audience) => onUpdate({ audience })} />
          <Field label="Business function" value={card.businessFunction || ""} onChange={(businessFunction) => onUpdate({ businessFunction })} />
          <Field label="Evidence strength" value={card.evidenceStrength || ""} onChange={(value) => onUpdate({ evidenceStrength: value as EvidenceCard["evidenceStrength"] })} />
          <Field label="Can be used in CV" value={card.canBeUsedInCv || ""} onChange={(value) => onUpdate({ canBeUsedInCv: value as EvidenceCard["canBeUsedInCv"] })} />
          <Field label="Can be used in interview" value={card.canBeUsedInInterview || ""} onChange={(value) => onUpdate({ canBeUsedInInterview: value as EvidenceCard["canBeUsedInInterview"] })} />
          <Field label="Section title" value={card.sectionTitle || ""} onChange={(sectionTitle) => onUpdate({ sectionTitle })} />
          <Field label="Confidence" value={card.confidence} onChange={(value) => onUpdate({ confidence: value as EvidenceCard["confidence"] })} />
          <Field label="Evidence tier" value={card.evidenceTier || "Supporting"} onChange={(value) => onUpdate({ evidenceTier: value as EvidenceCard["evidenceTier"] })} />
          <Field label="Claim level" value={card.claimLevel || ""} onChange={(value) => onUpdate({ claimLevel: value as EvidenceCard["claimLevel"] })} />
          <Field label="Visibility use" value={card.visibilityUse || ""} onChange={(value) => onUpdate({ visibilityUse: value as EvidenceCard["visibilityUse"] })} />
          <Field label="Experience ID" value={card.experienceId || ""} onChange={(experienceId) => onUpdate({ experienceId })} />
          <Field label="Project ID" value={card.projectId || ""} onChange={(projectId) => onUpdate({ projectId })} />
          <Textarea label="External-friendly description" value={card.externalFriendlyDescription || ""} rows={4} onChange={(externalFriendlyDescription) => onUpdate({ externalFriendlyDescription })} />
          <Textarea label="Problem / context" value={card.problemContext || ""} rows={4} onChange={(problemContext) => onUpdate({ problemContext })} />
          <Textarea label="Action I took" value={card.actionTaken || ""} rows={4} onChange={(actionTaken) => onUpdate({ actionTaken })} />
          <Textarea label="Result / impact / quantified evidence" value={card.quantifiedEvidence || ""} rows={3} onChange={(quantifiedEvidence) => onUpdate({ quantifiedEvidence })} />
          <Textarea label="Proof" value={card.proof} rows={4} onChange={(proof) => onUpdate({ proof })} />
          <Textarea label="Metrics" value={card.metrics} rows={3} onChange={(metrics) => onUpdate({ metrics })} />
          <Textarea label="CV bullet" value={card.cvBullet || ""} rows={4} onChange={(cvBullet) => onUpdate({ cvBullet })} />
          <Textarea label="CV-safe bullet" value={card.cvSafeBullet || ""} rows={4} onChange={(cvSafeBullet) => onUpdate({ cvSafeBullet })} />
          <Textarea label="Interview talking point" value={card.interviewTalkingPoint || ""} rows={4} onChange={(interviewTalkingPoint) => onUpdate({ interviewTalkingPoint })} />
          <Textarea label="Risk if used wrongly" value={card.riskIfUsedWrongly || ""} rows={3} onChange={(riskIfUsedWrongly) => onUpdate({ riskIfUsedWrongly })} />
          <Textarea label="Confidentiality risk" value={card.confidentialityRisk || ""} rows={3} onChange={(confidentialityRisk) => onUpdate({ confidentialityRisk })} />
          <Textarea label="CV angle" value={card.cvAngle || ""} rows={3} onChange={(cvAngle) => onUpdate({ cvAngle })} />
          <Textarea label="Related JD keywords" value={(card.relatedJdKeywords || []).join(", ")} rows={3} onChange={(value) => onUpdate({ relatedJdKeywords: stringArray(value) })} />
          <Textarea label="Stakeholders" value={(card.stakeholders || []).join(", ")} rows={3} onChange={(value) => onUpdate({ stakeholders: stringArray(value) })} />
          <Textarea label="Allowed visible claims" value={(card.allowedVisibleClaims || []).join("\n")} rows={3} onChange={(value) => onUpdate({ allowedVisibleClaims: stringArray(value) })} />
          <Textarea label="Forbidden visible claims" value={(card.forbiddenVisibleClaims || []).join("\n")} rows={3} onChange={(value) => onUpdate({ forbiddenVisibleClaims: stringArray(value) })} />
          <Textarea label="Blocked visible terms" value={(card.blockedVisibleTerms || []).join(", ")} rows={3} onChange={(value) => onUpdate({ blockedVisibleTerms: stringArray(value) })} />
          <Textarea label="Tools" value={card.tools.join(", ")} rows={3} onChange={(value) => onUpdate({ tools: stringArray(value) })} />
          <Textarea label="Source IDs" value={card.sourceIds.join(", ")} rows={3} onChange={(value) => onUpdate({ sourceIds: stringArray(value) })} />
          <Textarea label="Notes" value={card.notes || ""} rows={3} onChange={(notes) => onUpdate({ notes })} />
        </div>
      </details>
    </article>
  );
}

export function EditableStarCard({
  story,
  profile,
  onUpdate,
  onDelete
}: {
  story: StarStory;
  profile: CareerProfile;
  onUpdate: (patch: Partial<StarStory>) => void;
  onDelete: () => void;
}) {
  return (
    <article className="story-card editable-card">
      <header>
        <div>
          <strong>{story.title || "Untitled STAR story"}</strong>
          <small>{projectLabel(profile, story.projectId)} · {story.storyConfidence || "Usable"}</small>
        </div>
        <button className="danger-lite" type="button" onClick={onDelete}>Delete</button>
      </header>
      <div className="tag-row">{story.tags.map((tag) => <em key={tag}>{tag}</em>)}</div>
      <dl>
        <dt>S</dt><dd>{story.situation}</dd>
        <dt>T</dt><dd>{story.task}</dd>
        <dt>A</dt><dd>{story.action}</dd>
        <dt>R</dt><dd>{story.result}</dd>
      </dl>
      <details className="editable-details">
        <summary>Edit this STAR card</summary>
        <div className="editable-card-grid">
          <Field label="Title" value={story.title} onChange={(title) => onUpdate({ title })} />
          <Field label="Section title" value={story.sectionTitle || ""} onChange={(sectionTitle) => onUpdate({ sectionTitle })} />
          <Field label="Experience ID" value={story.experienceId || ""} onChange={(experienceId) => onUpdate({ experienceId })} />
          <Field label="Project ID" value={story.projectId || ""} onChange={(projectId) => onUpdate({ projectId })} />
          <Field label="Story confidence" value={story.storyConfidence || "Usable"} onChange={(value) => onUpdate({ storyConfidence: value as StarStory["storyConfidence"] })} />
          <Textarea label="Tags" value={story.tags.join(", ")} rows={3} onChange={(value) => onUpdate({ tags: stringArray(value) })} />
          <Textarea label="Situation" value={story.situation} rows={4} onChange={(situation) => onUpdate({ situation })} />
          <Textarea label="Task" value={story.task} rows={4} onChange={(task) => onUpdate({ task })} />
          <Textarea label="Action" value={story.action} rows={4} onChange={(action) => onUpdate({ action })} />
          <Textarea label="Result" value={story.result} rows={4} onChange={(result) => onUpdate({ result })} />
          <Textarea label="CV bullets" value={(story.cvBullets || []).join("\n")} rows={4} onChange={(value) => onUpdate({ cvBullets: stringArray(value) })} />
          <Textarea label="Evidence IDs" value={story.evidenceIds.join(", ")} rows={3} onChange={(value) => onUpdate({ evidenceIds: stringArray(value) })} />
        </div>
      </details>
    </article>
  );
}

export function GroupedEvidenceView({
  groups,
  profile,
  onUpdate,
  onDelete
}: {
  groups: ReturnType<typeof groupByExperience<EvidenceCard>>;
  profile: CareerProfile;
  onUpdate: (id: string, patch: Partial<EvidenceCard>) => void;
  onDelete: (id: string) => void;
}) {
  if (!groups.length) return <EmptyState title="No evidence cards yet." action="Create evidence with GPT paste-back" />;
  return (
    <div className="grouped-list">
      {groups.map((group) => (
        <section className="panel group-panel" key={group.id}>
          <h3>{group.label}</h3>
          <div className="card-grid">
            {group.items.map((card) => (
              <EditableEvidenceCard
                key={card.id}
                card={card}
                profile={profile}
                onUpdate={(patch) => onUpdate(card.id, patch)}
                onDelete={() => onDelete(card.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function GroupedStoryView({
  groups,
  profile,
  onUpdate,
  onDelete
}: {
  groups: ReturnType<typeof groupByExperience<StarStory>>;
  profile: CareerProfile;
  onUpdate: (id: string, patch: Partial<StarStory>) => void;
  onDelete: (id: string) => void;
}) {
  if (!groups.length) return <EmptyState title="No STAR stories yet." action="Create STAR stories with GPT paste-back" />;
  return (
    <div className="grouped-list">
      {groups.map((group) => (
        <section className="panel group-panel" key={group.id}>
          <h3>{group.label}</h3>
          <div className="story-list">
            {group.items.map((story) => (
              <EditableStarCard
                key={story.id}
                story={story}
                profile={profile}
                onUpdate={(patch) => onUpdate(story.id, patch)}
                onDelete={() => onDelete(story.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
