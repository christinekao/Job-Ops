import { useEffect, useMemo, useRef, useState } from "react";
import { ExportDecisionPanel, RepairResultPanel } from "../tabs/screeningReviewRepairPanels";
import { generateRepairProposal } from "../../domain/repairProposalGenerator";
import { orchestrateRepair } from "../../domain/repairOrchestrator";
import { executeSafeRepairs } from "../../domain/safeRepairExecutor";
import { applyAcceptedRepairProposalBatch, createRepairProposalBatch } from "../../domain/repairProposalBatch";
import { createTargetedRegenerationRequest, executeTargetedRegeneration } from "../../domain/targetedRegeneration";
import { contentHash } from "../../utils/hash";
import type { CvVersion, TailoredCv } from "../../types";
import type { RepairProposal } from "../../domain/repairProposal.types";
import type { RepairProposalBatchStatus } from "../../domain/repairProposalBatch.types";

type ScenarioId = "happy" | "missing-contact" | "weak-bullet" | "proposal-batch" | "proposal-empty" | "proposal-stale" | "summary-regen" | "work-bullet-regen" | "wording-regen" | "contact-input" | "unsupported-claim" | "warning-only" | "no-safe-local-fix";

const scenarioLabels: Record<ScenarioId, string> = {
  happy: "Happy Path",
  "missing-contact": "Missing Contact",
  "weak-bullet": "Weak Bullet",
  "proposal-batch": "Proposal Batch",
  "proposal-empty": "Proposal Empty",
  "proposal-stale": "Proposal Stale",
  "summary-regen": "Summary Regeneration",
  "work-bullet-regen": "Work Bullet Regeneration",
  "wording-regen": "Wording Regeneration",
  "contact-input": "Contact Input",
  "unsupported-claim": "Unsupported Claim",
  "warning-only": "Warning Only",
  "no-safe-local-fix": "No Safe Local Fix"
};

function baseCv(): TailoredCv {
  return {
    jdAnalysis: {
      targetRole: "Customer Automation Specialist",
      coreRequirements: ["workflow automation", "stakeholder discovery", "customer enablement"],
      topKeywords: [
        { keyword: "workflow automation", priority: "Must-have", placement: "Work Experience" },
        { keyword: "stakeholder discovery", priority: "Must-have", placement: "Summary" },
        { keyword: "customer enablement", priority: "Important", placement: "Skills" }
      ],
      gaps: []
    },
    header: {
      name: "Alex Chen",
      targetRole: "Customer Automation Specialist",
      email: "alex.chen@example.com",
      location: "Taipei, Taiwan"
    },
    sidebar: {
      languages: [{ name: "English", level: "Professional", note: "Customer-facing documentation" }],
      skillGroups: [{ title: "Customer Automation", highlightedSkills: ["workflow automation", "stakeholder discovery", "customer enablement"], otherSkills: ["Power Automate", "CRM", "Power BI"] }],
      certifications: ["Microsoft Power Platform Fundamentals"],
      education: [{ school: "National Taiwan University", degree: "BA Business Administration", period: "2016-2020" }]
    },
    summary: "Customer Automation Specialist focused on workflow automation, stakeholder discovery, and customer enablement. Translates operational needs into practical workflow improvements backed by adoption reporting and evidence-based delivery.",
    workExperience: [{
      experienceId: "exp-current",
      company: "Acme Cloud Services",
      role: "Customer Operations Specialist",
      period: "2022-Present",
      location: "Taipei, Taiwan",
      subsections: [{
        title: "Workflow automation and enablement",
        bullets: [
          { text: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%.", metric: "35%", metricType: "Impact", evidenceIds: ["ev-workflow-automation"], confidence: "Grounded" },
          { text: "Translated process notes into customer-ready adoption guidance used across 12 customer sessions.", metric: "12 sessions", metricType: "Scope", evidenceIds: ["ev-enablement"], confidence: "Grounded" },
          { text: "Consolidated adoption data into weekly reporting that improved visibility for 4 stakeholder groups.", metric: "4 groups", metricType: "Scope", evidenceIds: ["ev-reporting"], confidence: "Grounded" }
        ]
      }]
    }],
    keywordPlacementNotes: [],
    interviewNotes: [],
    reviewNotes: ["All visible claims are backed by selected EvidenceCard IDs."]
  };
}

function cvForScenario(scenario: ScenarioId) {
  const cv = baseCv();
  if (scenario === "missing-contact") cv.header.email = "";
  if (scenario === "weak-bullet" || scenario === "happy") {
    cv.workExperience[0].subsections[0].bullets[0] = {
      text: scenario === "happy" ? "Helped with workflow automation." : "Helped automation.",
      evidenceIds: ["ev-workflow-automation"],
      confidence: "Weak"
    };
  }
  if (scenario === "proposal-batch" || scenario === "proposal-empty" || scenario === "proposal-stale") {
    cv.summary = "Customer Automation Specialist who owned an enterprise AI platform and workflow automation adoption.";
    cv.workExperience[0].subsections[0].bullets[0] = { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-workflow-automation"], confidence: "Grounded" };
    cv.workExperience[0].subsections[0].bullets[1] = { text: "Helped customers.", evidenceIds: ["ev-enablement"], confidence: "Weak" };
  }
  if (scenario === "summary-regen") {
    cv.summary = "Customer operator seeking work.";
  }
  if (scenario === "work-bullet-regen") {
    cv.workExperience[0].subsections[0].bullets[0] = { text: "Helped customers.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" };
    cv.workExperience[0].subsections[0].bullets[1] = { text: "Worked on tasks.", evidenceIds: ["ev-enablement"], confidence: "Weak" };
  }
  if (scenario === "wording-regen") {
    cv.workExperience[0].subsections[0].bullets[0] = { text: "Work-log: joined internal sync and tracked tickets.", evidenceIds: ["ev-workflow-automation"], confidence: "Grounded" };
  }
  if (scenario === "contact-input") {
    cv.header.email = "";
  }
  if (scenario === "unsupported-claim") {
    cv.summary = "Customer Automation Specialist who owned an enterprise AI platform and workflow automation adoption.";
  }
  if (scenario === "warning-only") {
    cv.reviewNotes = ["Warning: fit-risk item should be manually reviewed before sending."];
  }
  return cv;
}

function blockersFor(cv: TailoredCv, scenario: ScenarioId) {
  if (scenario === "no-safe-local-fix") return ["PDF export readiness: Composed CV content is missing or too short"];
  if (scenario === "summary-regen") return /Customer operator seeking work/i.test(cv.summary) ? ["Summary needs clearer role fit"] : [];
  if (scenario === "work-bullet-regen") return /Helped customers|Worked on tasks/i.test(JSON.stringify(cv.workExperience[0].subsections[0].bullets)) ? ["Achievements need stronger support"] : [];
  if (scenario === "wording-regen") return /work-log|internal sync|tickets/i.test(cv.workExperience[0].subsections[0].bullets[0].text) ? ["Wording needs to be clearer for recruiters"] : [];
  if (scenario === "contact-input" && !cv.header.email) return ["Contact extraction: Missing email", "Contact email: Missing email"];
  if (scenario === "proposal-batch" || scenario === "proposal-empty" || scenario === "proposal-stale") return [
    /owned an enterprise AI platform/i.test(cv.summary) ? "Summary wording needs safer external wording" : "",
    /work-log|internal sync|tickets/i.test(cv.workExperience[0].subsections[0].bullets[0].text) ? "External wording: first work bullet uses Work-log internal terminology" : "",
    ((cv.workExperience[0].subsections[0].bullets[1].text || "").length < 70 || cv.workExperience[0].subsections[0].bullets[1].confidence === "Weak")
      ? "Weak claims: second work bullet needs stronger supporting evidence"
      : ""
  ].filter(Boolean);
  if (!cv.header.email) return ["Contact extraction: Missing email"];
  const firstBullet = cv.workExperience[0].subsections[0].bullets[0];
  if ((firstBullet.text || "").length < 70 || firstBullet.confidence === "Weak") return ["Weak claims: first work bullet lacks concrete action and result"];
  if (/enterprise ai platform/i.test(cv.summary)) return ["Reviewer: summary unsupported claims: owned enterprise AI platform"];
  return [];
}

function warningsFor(cv: TailoredCv) {
  return (cv.reviewNotes || []).some((note) => /warning|fit-risk/i.test(note))
    ? ["Reviewer: application fit risk: fit-risk item should be manually reviewed"]
    : [];
}

function targetForBlocker(blocker: string) {
  if (/contact|email/i.test(blocker)) return { view: "studio", key: "guided-contact-email", label: "Email", field: "email" };
  if (/second work bullet/i.test(blocker)) return { view: "studio", key: "guided-workExperience-bullet-exp-current-0-0-1", label: "Second work bullet", field: "bullet-2" };
  if (/weak claims|bullet/i.test(blocker)) return { view: "studio", key: "guided-workExperience-bullet-exp-current-0-0-0", label: "First work bullet", field: "bullet" };
  if (/external wording|wording/i.test(blocker)) return { view: "studio", key: "guided-workExperience-bullet-exp-current-0-0-0", label: "First work bullet", field: "bullet" };
  if (/unsupported/i.test(blocker)) return { view: "studio", key: "guided-summary-summary", label: "Summary", field: "summary" };
  return null;
}

export function ProductAcceptanceFixtureApp() {
  const search = new URLSearchParams(window.location.search);
  const initialScenario = (search.get("scenario") || "happy") as ScenarioId;
  const [scenario, setScenario] = useState<ScenarioId>(initialScenario);
  const [cv, setCv] = useState<TailoredCv>(() => cvForScenario(initialScenario));
  const [view, setView] = useState<"workflow" | "studio" | "export">("workflow");
  const [highlightKey, setHighlightKey] = useState("");
  const [repairResult, setRepairResult] = useState<"none" | "updated" | "blocked">("none");
  const [targetedRegenerationLifecycle, setTargetedRegenerationLifecycle] = useState<"idle" | "running" | "validating">("idle");
  const [saved, setSaved] = useState(false);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const blockers = blockersFor(cv, scenario);
  const warnings = warningsFor(cv);
  const target = targetForBlocker(blockers[0] || "");
  const exportReady = blockers.length === 0;
  const cvContentHash = contentHash({ cv, scenario });
  const repairOrchestration = orchestrateRepair({
    cvVersionId: `fixture-cv-${scenario}`,
    cvContentHash,
    blockers,
    cv,
    trustedProfileEmail: scenario === "missing-contact" ? "alex.chen@example.com" : undefined,
    selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement", "ev-reporting"],
    effectiveCvBriefHash: `fixture-brief-${scenario}`
  });

  useEffect(() => {
    window.localStorage.setItem("cv-manager-e2e-fixture-mode", "product-acceptance");
    window.localStorage.setItem("cv-manager-e2e-current-state", JSON.stringify({ scenario, view, blockers, warnings, exportReady, repairOrchestration }));
    window.localStorage.setItem("cv-manager-e2e-final-cv", JSON.stringify(cv));
    window.__productAcceptanceFixture = { scenario, view, blockers, warnings, exportReady, cv };
  }, [scenario, view, blockers, warnings, exportReady, cv]);

  useEffect(() => {
    if (!highlightKey) return;
    window.setTimeout(() => fieldRef.current?.focus(), 0);
  }, [highlightKey]);

  function reset(nextScenario: ScenarioId) {
    setScenario(nextScenario);
    setCv(cvForScenario(nextScenario));
    setView("workflow");
    setHighlightKey("");
    setRepairResult("none");
    setTargetedRegenerationLifecycle("idle");
    setSaved(false);
  }

  function jumpToFix() {
    if (!target) return;
    setView("studio");
    setHighlightKey(target.key);
  }

  function applyDeterministicFix() {
    setCv((current) => {
      const next = structuredClone(current);
      if (target?.field === "email") next.header.email = "alex.chen@example.com";
      if (target?.field === "bullet") {
        next.workExperience[0].subsections[0].bullets[0] = {
          text: "Mapped stakeholder requests and configured workflow steps that reduced manual follow-up by 35%.",
          metric: "35%",
          metricType: "Impact",
          evidenceIds: ["ev-workflow-automation"],
          confidence: "Grounded"
        };
      }
      if (target?.field === "summary") {
        next.summary = "Customer Automation Specialist focused on workflow automation, stakeholder discovery, and customer enablement. Translates operational needs into practical workflow improvements backed by adoption reporting and evidence-based delivery.";
      }
      return next;
    });
    setSaved(true);
    setRepairResult("updated");
    setView("workflow");
  }

  function runSafeAiRepair() {
    const cvVersion: CvVersion = {
      id: `fixture-cv-${scenario}`,
      jdId: `fixture-job-${scenario}`,
      name: `${scenarioLabels[scenario]} CV`,
      summary: cv.summary,
      content: JSON.stringify(cv),
      tailoredCv: cv,
      status: "Ready for Review",
      updatedAt: "2026-07-13T00:00:00.000Z"
    };
    const result = executeSafeRepairs({
      cvVersion,
      orchestration: repairOrchestration,
      currentCvVersionId: cvVersion.id,
      currentContentHash: cvContentHash,
      trustedProfileEmail: scenario === "missing-contact" ? "alex.chen@example.com" : undefined,
      now: "2026-07-13T00:01:00.000Z"
    });
    if (result.status === "success" && result.nextVersion?.tailoredCv) {
      setCv(result.nextVersion.tailoredCv);
      setRepairResult("updated");
      setSaved(true);
    } else {
      setRepairResult("blocked");
    }
  }

  function applyAcceptedProposals(input: { proposals: RepairProposal[]; statuses: Record<string, RepairProposalBatchStatus> }) {
    const cvVersion: CvVersion = {
      id: `fixture-cv-${scenario}`,
      jdId: `fixture-job-${scenario}`,
      name: `${scenarioLabels[scenario]} CV`,
      summary: cv.summary,
      content: JSON.stringify(cv),
      tailoredCv: cv,
      status: "Ready for Review",
      updatedAt: "2026-07-13T00:00:00.000Z"
    };
    const batch = createRepairProposalBatch({
      sourceCvVersionId: cvVersion.id,
      sourceContentHash: cvContentHash,
      proposals: input.proposals,
      evidenceByProposalId: Object.fromEntries(input.proposals.map((proposal) => [proposal.id, proposal.target.section === "workExperience" ? ["ev-workflow-automation"] : []]))
    });
    const result = applyAcceptedRepairProposalBatch({
      cvVersion,
      currentCvVersionId: cvVersion.id,
      currentContentHash: cvContentHash,
      batch,
      statuses: input.statuses,
      now: "2026-07-13T00:02:00.000Z"
    });
    if (result.status === "success" && result.nextVersion?.tailoredCv) {
      setCv(result.nextVersion.tailoredCv);
      setRepairResult("updated");
      setSaved(true);
    } else {
      setRepairResult("blocked");
    }
  }

  async function runTargetedRegeneration() {
    if (targetedRegenerationLifecycle !== "idle") return;
    setTargetedRegenerationLifecycle("running");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
    setTargetedRegenerationLifecycle("validating");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
    const cvVersion: CvVersion = {
      id: `fixture-cv-${scenario}`,
      jdId: `fixture-job-${scenario}`,
      name: `${scenarioLabels[scenario]} CV`,
      summary: cv.summary,
      content: JSON.stringify(cv),
      tailoredCv: cv,
      status: "Ready for Review",
      updatedAt: "2026-07-13T00:00:00.000Z"
    };
    const request = createTargetedRegenerationRequest({
      classifications: repairOrchestration.targetedRegeneration,
      selectedEvidenceIds: ["ev-workflow-automation", "ev-enablement", "ev-reporting"],
      effectiveCvBriefHash: `fixture-brief-${scenario}`
    });
    const result = executeTargetedRegeneration({
      cvVersion,
      request,
      currentCvVersionId: cvVersion.id,
      currentContentHash: cvContentHash,
      currentEffectiveCvBriefHash: `fixture-brief-${scenario}`,
      now: "2026-07-13T00:03:00.000Z"
    });
    if (result.status === "success" && result.nextVersion?.tailoredCv) {
      setCv(result.nextVersion.tailoredCv);
      setRepairResult("updated");
      setSaved(true);
    } else {
      setRepairResult("blocked");
    }
    setTargetedRegenerationLifecycle("idle");
  }

  return (
    <main className="e2e-fixture-shell" data-testid="product-acceptance-fixture">
      <header className="panel">
        <span className="eyebrow">Browser E2E Fixture Mode</span>
        <h1>Product Acceptance Test</h1>
        <p className="section-note">Test-only deterministic browser flow. No automation endpoint or model API is used.</p>
        <select aria-label="Scenario" value={scenario} onChange={(event) => reset(event.target.value as ScenarioId)}>
          {Object.entries(scenarioLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </header>

      <section className="panel" data-testid="workflow-state">
        <span className="eyebrow">Current Workflow State</span>
        <strong>{exportReady ? "Export Ready" : "Needs Repair"}</strong>
        <span data-testid="remaining-count">{blockers.length} remaining item{blockers.length === 1 ? "" : "s"}</span>
      </section>

      {view === "workflow" ? (
        <section className="panel" data-testid="review-repair-export-ui">
          <RepairResultPanel result={repairResult === "updated" ? {
            summary: "Deterministic browser edit saved and revalidated.",
            actionId: "browser-deterministic-edit",
            status: "success",
            changedSections: [target?.label || "CV field"],
            unchangedSections: ["Evidence Selection", "Unrelated CV sections"],
            contentHash: `fixture-${scenario}`,
            remainingBlockers: blockers
          } : repairResult === "blocked" ? {
            summary: "No safe local edit target exists.",
            actionId: "browser-deterministic-edit",
            status: "blocked",
            changedSections: [],
            unchangedSections: ["Existing CV content"],
            remainingBlockers: blockers
          } : undefined} />
          <ExportDecisionPanel
            decision={{ ready: exportReady, blockers, warnings, contentHash: cvContentHash }}
            onExport={() => setView("export")}
            cv={cv}
            repairOrchestration={repairOrchestration}
            proposalResolver={(input) => {
              if (scenario === "proposal-empty") return null;
              const result = generateRepairProposal(cv, {
                ...input,
                deterministicEmail: scenario === "missing-contact" ? "alex.chen@example.com" : undefined
              });
              return result.supported ? result.proposal : null;
            }}
            onJumpToFix={jumpToFix}
            onRunSafeRepairs={runSafeAiRepair}
            onRunTargetedRegeneration={runTargetedRegeneration}
            targetedRegenerationLifecycle={targetedRegenerationLifecycle}
            onCollectHumanInput={jumpToFix}
            onGenerateAiProposals={() => {
              if (scenario === "proposal-stale") {
                setCv((current) => ({ ...current, reviewNotes: [...(current.reviewNotes || []), "Content changed after proposal generation."] }));
              }
            }}
            onApplyAcceptedProposals={applyAcceptedProposals}
          />
        </section>
      ) : null}

      {view === "studio" ? (
        <section className="panel" data-testid="cv-studio-fixture">
          <span className="eyebrow">CV Studio</span>
          <h2>Guided Edit</h2>
          <label className={highlightKey === "guided-contact-email" ? "guided-edit-target active" : "guided-edit-target"} data-guided-key="guided-contact-email">
            Email
            <input ref={highlightKey === "guided-contact-email" ? fieldRef as React.MutableRefObject<HTMLInputElement | null> : undefined} data-testid="email-field" value={cv.header.email} onChange={(event) => setCv({ ...cv, header: { ...cv.header, email: event.target.value } })} />
          </label>
          <label className={highlightKey === "guided-summary-summary" ? "guided-edit-target active" : "guided-edit-target"} data-guided-key="guided-summary-summary">
            Summary
            <textarea ref={highlightKey === "guided-summary-summary" ? fieldRef as React.MutableRefObject<HTMLTextAreaElement | null> : undefined} data-testid="summary-field" value={cv.summary} onChange={(event) => setCv({ ...cv, summary: event.target.value })} />
          </label>
          <label className={highlightKey === "guided-workExperience-bullet-exp-current-0-0-0" ? "guided-edit-target active" : "guided-edit-target"} data-guided-key="guided-workExperience-bullet-exp-current-0-0-0">
            First work bullet
            <textarea
              ref={highlightKey === "guided-workExperience-bullet-exp-current-0-0-0" ? fieldRef as React.MutableRefObject<HTMLTextAreaElement | null> : undefined}
              data-testid="first-bullet-field"
              value={cv.workExperience[0].subsections[0].bullets[0].text}
              onChange={(event) => {
                const next = structuredClone(cv);
                next.workExperience[0].subsections[0].bullets[0].text = event.target.value;
                setCv(next);
              }}
            />
          </label>
          <button className="primary" data-testid="save-guided-edit" onClick={applyDeterministicFix}>Save and Validate</button>
          {saved ? <p data-testid="save-result">Affected checks revalidated; unrelated passed checks remain passed.</p> : null}
        </section>
      ) : null}

      {view === "export" ? (
        <section className="panel" data-testid="final-export">
          <span className="eyebrow">Final Export</span>
          <h2>Final CV artifact ready</h2>
          <pre data-testid="final-cv-json">{JSON.stringify(cv, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}

declare global {
  interface Window {
    __productAcceptanceFixture?: unknown;
  }
}
