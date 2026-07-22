import { strict as assert } from "node:assert";
import { createTailoredCv, evidenceCards } from "./product-acceptance/fixtures.mjs";
import { runHrReviewGate } from "./product-acceptance/hrReviewGate.mjs";

const pass = runHrReviewGate({ cv: createTailoredCv(), evidenceCards, unresolvedBlockers: [] });
assert.equal(pass.pass, true, "complete fixture must pass HR gate");
assert.equal(pass.blockers.length, 0, "complete fixture should have no HR blockers");
assert.ok(pass.score >= 90, "complete fixture should have high HR score");

const missingEmail = runHrReviewGate({ cv: createTailoredCv({ header: { email: "" } }), evidenceCards, unresolvedBlockers: [] });
assert.equal(missingEmail.pass, false, "missing email must fail HR gate");
assert.ok(missingEmail.blockers.some((item) => item.id === "hr-email" && item.target === "header.email"), "missing email must target header.email");

const unsupported = runHrReviewGate({
  cv: createTailoredCv({ summary: "Customer Automation Specialist who owned an enterprise AI platform." }),
  evidenceCards,
  unresolvedBlockers: []
});
assert.equal(unsupported.pass, false, "unsupported visible claim must fail HR gate");
assert.ok(unsupported.blockers.some((item) => item.id === "hr-unsupported-claim"), "unsupported claim blocker must be reported");

const unresolved = runHrReviewGate({ cv: createTailoredCv(), evidenceCards, unresolvedBlockers: ["weak-bullet"] });
assert.equal(unresolved.pass, false, "unresolved blocker must fail HR gate");
assert.ok(unresolved.blockers.some((item) => item.id === "hr-unresolved-blocker"), "unresolved blocker must be explicit");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "complete HR fixture passes",
    "missing email fails with target",
    "unsupported visible claim fails",
    "unresolved blocker fails"
  ],
  passScore: pass.score
}, null, 2));
