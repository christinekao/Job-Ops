import { strict as assert } from "node:assert";
import { createTailoredCv, evidenceCards, jobDescription, selectedEvidence } from "./product-acceptance/fixtures.mjs";
import { runHiringManagerReviewGate } from "./product-acceptance/hiringManagerReviewGate.mjs";

const pass = runHiringManagerReviewGate({
  cv: createTailoredCv(),
  evidenceCards,
  jd: jobDescription,
  selectedEvidenceIds: selectedEvidence
});
assert.equal(pass.pass, true, "complete fixture must pass Hiring Manager gate");
assert.equal(pass.blockers.length, 0, "complete fixture should have no manager blockers");
assert.ok(pass.score >= 90, "complete fixture should have high manager score");

const weakBullet = createTailoredCv({
  workExperience: [{
    experienceId: "exp-current",
    company: "Acme Cloud Services",
    role: "Customer Operations Specialist",
    period: "2022-Present",
    location: "Taipei, Taiwan",
    subsections: [{
      title: "Workflow automation and enablement",
      bullets: [
        { text: "Helped automation.", evidenceIds: ["ev-workflow-automation"], confidence: "Weak" }
      ]
    }]
  }]
});
const weak = runHiringManagerReviewGate({ cv: weakBullet, evidenceCards, jd: jobDescription, selectedEvidenceIds: selectedEvidence });
assert.equal(weak.pass, false, "weak/generic bullet fixture must fail manager gate");
assert.ok(weak.blockers.some((item) => item.id === "hm-action-result" || item.id === "hm-role-depth"), "weak bullet failure must be explicit");

const untraced = createTailoredCv();
untraced.workExperience[0].subsections[0].bullets[0].evidenceIds = ["skill-not-evidence"];
const trace = runHiringManagerReviewGate({ cv: untraced, evidenceCards, jd: jobDescription, selectedEvidenceIds: selectedEvidence });
assert.equal(trace.pass, false, "wrong evidence namespace must fail manager gate");
assert.ok(trace.blockers.some((item) => item.id === "hm-bullet-traceability"), "traceability blocker must be reported");

const unsupported = runHiringManagerReviewGate({
  cv: createTailoredCv({ summary: "Customer Automation Specialist who owned an enterprise AI platform." }),
  evidenceCards,
  jd: jobDescription,
  selectedEvidenceIds: selectedEvidence
});
assert.equal(unsupported.pass, false, "unsupported visible claim must fail manager gate");
assert.ok(unsupported.blockers.some((item) => item.id === "hm-unsupported-claim"), "unsupported claim blocker must be reported");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "complete manager fixture passes",
    "weak bullet fails",
    "wrong evidence ID fails",
    "unsupported visible claim fails"
  ],
  passScore: pass.score
}, null, 2));
