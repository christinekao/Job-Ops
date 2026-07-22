import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { extractJobDescription } = require("../jdImportService.cjs");

const stamp = Date.now();
const positioningPath = join(tmpdir(), `golden-positioning-${stamp}.mjs`);
const evidencePath = join(tmpdir(), `golden-evidence-${stamp}.mjs`);
const writerPath = join(tmpdir(), `golden-writer-${stamp}.mjs`);
const hashPath = join(tmpdir(), `golden-hash-${stamp}.mjs`);
await Promise.all([
  build({ entryPoints: ["src/domain/positioningPolicy.ts"], bundle: true, format: "esm", platform: "node", outfile: positioningPath, logLevel: "silent" }),
  build({ entryPoints: ["src/data/evidence.ts"], bundle: true, format: "esm", platform: "node", outfile: evidencePath, logLevel: "silent" }),
  build({ entryPoints: ["src/domain/screeningCvOutput.ts"], bundle: true, format: "esm", platform: "node", outfile: writerPath, logLevel: "silent" }),
  build({ entryPoints: ["src/utils/hash.ts"], bundle: true, format: "esm", platform: "node", outfile: hashPath, logLevel: "silent" })
]);
const [{ buildPositioningReport }, { validateEvidenceCard }, { validateScreeningCvOutput }, { contentHash }] = await Promise.all([
  import(pathToFileURL(positioningPath).href),
  import(pathToFileURL(evidencePath).href),
  import(pathToFileURL(writerPath).href),
  import(pathToFileURL(hashPath).href)
]);

const dataset = JSON.parse(await readFile("scripts/golden/fixtures/golden-jd-dataset-v1.json", "utf8"));
const failures = [];
const results = [];

function fail(scenario, stage, values) {
  failures.push({
    scenario_id: scenario.scenario_id,
    pipeline_stage: stage,
    requirement_id: values.requirement_id || "",
    expected: values.expected,
    actual: values.actual,
    match_status: values.match_status || "",
    evidence_ids: values.evidence_ids || [],
    forbidden_claim: values.forbidden_claim || "",
    score_delta: values.score_delta || 0,
    blocking: values.blocking ?? true,
    probable_owner: values.probable_owner
  });
}

function check(scenario, condition, stage, values) {
  if (!condition) fail(scenario, stage, values);
}

function appDataFor(scenario) {
  const fixture = dataset.candidate_fixture;
  return {
    rawSources: [fixture.source],
    sourceOfTruth: {},
    careerProfile: { contact: {}, workExperiences: [fixture.experience] },
    skillInferences: [],
    domainKnowledge: [],
    evidenceCards: fixture.evidence,
    starStories: [],
    jobs: [],
    cvVersions: [],
    backboneTasks: [],
    backboneMetadata: {},
    backboneUpdateSummary: {},
    recruiterAnswers: [],
    promptTemplates: [],
    highCompensationSignals: []
  };
}

function writerOutputFor(scenario) {
  const claims = scenario.recorded_writer_claims;
  const bullets = Array.from({ length: 6 }, (_, index) => {
    const claim = claims[index % claims.length];
    return {
      text: `${claim.text} Scope ${index + 1}.`,
      evidenceIds: claim.evidence_ids,
      confidence: "Grounded",
      metricType: "None"
    };
  });
  return {
    header: { name: "Golden Candidate", targetRole: scenario.analysis.primaryTargetTitle, email: "golden@example.com", location: "Taipei" },
    sidebar: { languages: [], skillGroups: [], certifications: [], education: [] },
    summary: scenario.analysis.summaryAngle,
    workExperience: [{
      company: dataset.candidate_fixture.experience.company,
      role: dataset.candidate_fixture.experience.role,
      period: dataset.candidate_fixture.experience.period,
      location: dataset.candidate_fixture.experience.location,
      subsections: [{ title: "Evidence-backed delivery", bullets }]
    }],
    reviewNotes: [],
    keywordPlacementNotes: [],
    interviewNotes: []
  };
}

for (const scenario of dataset.scenarios) {
  const data = appDataFor(scenario);
  const job = {
    id: scenario.scenario_id,
    company: scenario.normalized_jd.company,
    role: scenario.normalized_jd.role,
    location: "",
    rawJD: scenario.raw_jd_text,
    parsed: {
      company: scenario.normalized_jd.company,
      role: scenario.normalized_jd.role,
      location: "",
      requirements: scenario.normalized_jd.required_qualifications,
      preferredQualifications: scenario.normalized_jd.preferred_qualifications,
      keywords: [],
      employerSignal: "",
      risks: [],
      sourceUrl: scenario.source_url
    },
    status: "Parsed",
    fit: "Unknown",
    nextAction: "",
    selectedSkillIds: [],
    selectedDomainKnowledgeIds: [],
    selectedEvidenceIds: [...new Set(scenario.analysis.jdEvidenceMapping.flatMap((item) => item.matchingEvidenceIds))],
    selectedStoryIds: [],
    updatedAt: dataset.captured_date,
    screeningAnalysis: scenario.analysis
  };
  data.jobs = [job];

  check(scenario, scenario.dataset_version === undefined || scenario.dataset_version === dataset.dataset_version, "fixture-schema", {
    expected: dataset.dataset_version, actual: scenario.dataset_version, probable_owner: "Golden Dataset"
  });
  check(scenario, contentHash(scenario.normalized_jd) === scenario.content_hash, "jd-normalization", {
    expected: scenario.content_hash, actual: contentHash(scenario.normalized_jd), probable_owner: "JD parser"
  });

  const report = buildPositioningReport({ job, data });
  const matrix = report.requirementMatchMatrix || [];
  const matrixIds = matrix.map((item) => item.requirementId);
  check(scenario, matrix.length === scenario.analysis.jdEvidenceMapping.length && new Set(matrixIds).size === matrix.length, "requirement-classifier", {
    expected: `${scenario.analysis.jdEvidenceMapping.length} unique requirements`, actual: `${matrix.length}/${new Set(matrixIds).size}`, probable_owner: "Screening"
  });

  for (const expected of scenario.expected_requirement_expectations) {
    const row = matrix.find((item) => item.requirementId === expected.requirement_id);
    check(scenario, row?.matchStatus === expected.match_status, "requirement-classifier", {
      requirement_id: expected.requirement_id,
      expected: expected.match_status,
      actual: row?.matchStatus,
      match_status: row?.matchStatus,
      evidence_ids: row?.evidenceIds,
      probable_owner: "Screening"
    });
  }

  for (const row of matrix) {
    const evidenceRequired = row.matchStatus === "DIRECT_MATCH" || row.matchStatus === "TRANSFERABLE_MATCH";
    check(scenario, !evidenceRequired || row.evidenceIds.length > 0, "evidence-selection", {
      requirement_id: row.requirementId, expected: "eligible Evidence ID", actual: row.evidenceIds, match_status: row.matchStatus, evidence_ids: row.evidenceIds, probable_owner: "Evidence Selection"
    });
    check(scenario, row.matchStatus !== "TRANSFERABLE_MATCH" || Boolean(row.transferContext), "requirement-classifier", {
      requirement_id: row.requirementId, expected: "source-to-target transfer context", actual: row.transferContext, match_status: row.matchStatus, evidence_ids: row.evidenceIds, probable_owner: "Screening"
    });
    check(scenario, row.matchStatus !== "PARTIAL_MATCH" || (row.supportedAspects.length > 0 && row.unsupportedAspects.length > 0), "requirement-classifier", {
      requirement_id: row.requirementId, expected: "supported and unsupported aspects", actual: { supported: row.supportedAspects, unsupported: row.unsupportedAspects }, match_status: row.matchStatus, probable_owner: "Screening"
    });
    for (const id of row.evidenceIds) {
      const card = data.evidenceCards.find((item) => item.id === id);
      const validation = card ? validateEvidenceCard(data, card) : { valid: false, cvUsable: false };
      check(scenario, validation.valid && validation.cvUsable, "evidence-lineage", {
        requirement_id: row.requirementId, expected: "valid CV-usable Evidence", actual: validation, match_status: row.matchStatus, evidence_ids: [id], probable_owner: "Canonical Evidence"
      });
    }
  }

  check(scenario, report.fitClassification === scenario.expected_fit_dimensions.fit_classification, "fit-dimensions", {
    expected: scenario.expected_fit_dimensions.fit_classification, actual: report.fitClassification, score_delta: report.fitDimensions?.relativeRank, probable_owner: "Screening"
  });
  check(scenario, report.fitDimensions?.generationRecommendation === scenario.expected_fit_dimensions.generation_recommendation, "fit-dimensions", {
    expected: scenario.expected_fit_dimensions.generation_recommendation, actual: report.fitDimensions?.generationRecommendation, score_delta: report.fitDimensions?.relativeRank, probable_owner: "Screening"
  });
  check(scenario, report.fitDimensions?.applicationPriority === scenario.expected_fit_dimensions.application_priority, "fit-dimensions", {
    expected: scenario.expected_fit_dimensions.application_priority, actual: report.fitDimensions?.applicationPriority, probable_owner: "Screening"
  });
  if (report.fitClassification === "VIABLE_MEDIUM_FIT" || report.fitClassification === "STRETCH_MEDIUM_FIT") {
    check(scenario, Boolean(report.opportunityAnalysis?.whyCandidateCouldWin.length && report.opportunityAnalysis.cvPositioning), "opportunity-analysis", {
      expected: "complete Medium Fit opportunity analysis", actual: report.opportunityAnalysis, probable_owner: "Screening"
    });
  }
  if (report.fitClassification === "LOW_FIT") {
    check(scenario, Boolean(report.lowFitAnalysis?.whyCoreFitIsLow.length && report.lowFitAnalysis.futureTransitionPath.length), "opportunity-analysis", {
      expected: "credible overlap and transition analysis", actual: report.lowFitAnalysis, probable_owner: "Screening"
    });
  }

  const writerOutput = writerOutputFor(scenario);
  const validEvidenceIds = data.evidenceCards.filter((item) => validateEvidenceCard(data, item).cvUsable).map((item) => item.id);
  const writerValidation = validateScreeningCvOutput(writerOutput, { validEvidenceIds });
  check(scenario, writerValidation.valid, "writer", {
    expected: "valid evidence-traced Writer output", actual: writerValidation.errors, evidence_ids: validEvidenceIds, probable_owner: "Writer"
  });
  const visibleText = JSON.stringify(writerOutput).toLowerCase();
  for (const forbiddenClaim of scenario.forbidden_claims) {
    check(scenario, !visibleText.includes(forbiddenClaim.toLowerCase()), "reviewer", {
      expected: "forbidden claim absent", actual: forbiddenClaim, forbidden_claim: forbiddenClaim, probable_owner: "Reviewer"
    });
  }

  const beforeRepair = JSON.stringify(writerOutput);
  const repaired = { ...writerOutput, reviewNotes: ["No approved repair was required by the recorded Golden output."] };
  check(scenario, JSON.stringify({ ...repaired, reviewNotes: [] }) === beforeRepair, "repair", {
    expected: "protected Writer content unchanged", actual: "protected content changed", probable_owner: "Repair"
  });

  results.push({
    scenario_id: scenario.scenario_id,
    fit: report.fitClassification,
    fit_dimensions: report.fitDimensions,
    counts: Object.fromEntries(["DIRECT_MATCH","TRANSFERABLE_MATCH","PARTIAL_MATCH","LEARNABLE_GAP","CORE_CAPABILITY_GAP","FORMAL_SCREENING_RISK"].map((status) => [status, matrix.filter((item) => item.matchStatus === status).length])),
    relative_rank_score: report.fitDimensions?.relativeRank
  });
}

const byScenario = new Map(results.map((item) => [item.scenario_id, item]));
for (const [higher, lower] of [["GOLDEN-JD-003","GOLDEN-JD-001"],["GOLDEN-JD-001","GOLDEN-JD-002"],["GOLDEN-JD-003","GOLDEN-JD-004"]]) {
  check({ scenario_id: `${higher}>${lower}` }, byScenario.get(higher).relative_rank_score > byScenario.get(lower).relative_rank_score, "relative-ranking", {
    expected: `${higher} > ${lower}`,
    actual: `${byScenario.get(higher).relative_rank_score} vs ${byScenario.get(lower).relative_rank_score}`,
    score_delta: byScenario.get(higher).relative_rank_score - byScenario.get(lower).relative_rank_score,
    probable_owner: "Screening"
  });
}
const ranked = [...results].sort((left, right) =>
  right.relative_rank_score - left.relative_rank_score || left.scenario_id.localeCompare(right.scenario_id)
);
for (const [index, result] of ranked.entries()) {
  const scenario = dataset.scenarios.find((item) => item.scenario_id === result.scenario_id);
  check(scenario, scenario.expected_relative_rank === index + 1, "relative-ranking", {
    expected: scenario.expected_relative_rank,
    actual: index + 1,
    score_delta: result.relative_rank_score,
    probable_owner: "Screening"
  });
}

const urlFixtureHtml = await readFile(dataset.url_fixture.response_file, "utf8");
assert.equal(contentHash(urlFixtureHtml), dataset.url_fixture.response_hash, "fixed URL response hash must remain stable");
const urlExtraction = extractJobDescription(urlFixtureHtml, {
  contentType: "text/html",
  sourceUrl: dataset.url_fixture.url
});
const urlScenario = dataset.scenarios.find((item) => item.scenario_id === dataset.url_fixture.scenario_id);
const urlNormalized = {
  company: urlExtraction.canonical.company,
  role: urlExtraction.canonical.role,
  job_number: urlExtraction.canonical.jobNumber,
  overview: urlExtraction.canonical.overview,
  responsibilities: urlExtraction.canonical.responsibilities,
  required_qualifications: urlExtraction.canonical.requiredQualifications,
  preferred_qualifications: urlExtraction.canonical.preferredQualifications.length
    ? urlExtraction.canonical.preferredQualifications
    : urlExtraction.canonical.skills,
  core_content: urlExtraction.canonical.coreContent
};
assert.equal(urlExtraction.sourceText, urlScenario.raw_jd_text, "URL extraction and manual fixture must produce identical canonical raw JD content");
assert.deepEqual(urlNormalized, urlScenario.normalized_jd, "URL extraction and manual fixture must normalize to identical JD content");
assert.equal(contentHash(urlNormalized), urlScenario.content_hash, "URL and manual canonical normalized identity must match");
const urlData = appDataFor(urlScenario);
const urlJob = {
  id: urlScenario.scenario_id,
  company: urlNormalized.company,
  role: urlNormalized.role,
  location: "",
  rawJD: urlExtraction.sourceText,
  parsed: {
    company: urlNormalized.company,
    role: urlNormalized.role,
    location: "",
    requirements: urlNormalized.required_qualifications,
    preferredQualifications: urlNormalized.preferred_qualifications,
    keywords: [],
    employerSignal: "",
    risks: []
  },
  jdProvenance: {
    sourceType: "url",
    sourceUrl: dataset.url_fixture.url,
    sourceDomain: "apply.careers.microsoft.com",
    fetchedAt: `${dataset.url_fixture.captured_date}T00:00:00.000Z`,
    extractionMethod: urlExtraction.extractionMethod,
    fetchWarnings: urlExtraction.warnings
  },
  status: "Parsed",
  fit: "Unknown",
  nextAction: "",
  selectedSkillIds: [],
  selectedDomainKnowledgeIds: [],
  selectedEvidenceIds: [...new Set(urlScenario.analysis.jdEvidenceMapping.flatMap((item) => item.matchingEvidenceIds))],
  selectedStoryIds: [],
  updatedAt: dataset.captured_date,
  screeningAnalysis: urlScenario.analysis
};
urlData.jobs = [urlJob];
const urlReport = buildPositioningReport({ job: urlJob, data: urlData });
const manualResult = byScenario.get(urlScenario.scenario_id);
assert.equal(urlReport.fitClassification, manualResult.fit, "URL and manual Fit classification must match");
assert.equal(urlReport.fitDimensions.relativeRank, manualResult.relative_rank_score, "URL and manual ranking score must match");
assert.equal(urlReport.fitDimensions.generationRecommendation, urlScenario.expected_fit_dimensions.generation_recommendation, "URL and manual generation recommendation must match");
assert.deepEqual(
  urlReport.requirementMatchMatrix.map((item) => [item.requirementId, item.matchStatus, item.evidenceIds]),
  buildPositioningReport({
    job: { ...urlJob, rawJD: urlScenario.raw_jd_text, jdProvenance: { sourceType: "manual" } },
    data: urlData
  }).requirementMatchMatrix.map((item) => [item.requirementId, item.matchStatus, item.evidenceIds]),
  "URL and manual requirement matrices must match"
);

const manualIdentity = dataset.scenarios.map((scenario) => contentHash(scenario.normalized_jd));
const fixedUrlImportIdentity = dataset.scenarios.map((scenario) => {
  const imported = {
    ...scenario.normalized_jd,
    source_type: "url_import",
    source_url: scenario.source_url,
    fetched_time: "fixed-fixture-time",
    adapter_name: "future-fixed-adapter"
  };
  const { source_type: _sourceType, source_url: _sourceUrl, fetched_time: _fetchedTime, adapter_name: _adapterName, ...canonical } = imported;
  return contentHash(canonical);
});
assert.deepEqual(fixedUrlImportIdentity, manualIdentity, "URL/import metadata must not enter canonical JD identity");

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  dataset_version: dataset.dataset_version,
  scenarios: results,
  checked: [
    "fixture schema and JD content hash",
    "requirement uniqueness/classification/coverage",
    "Evidence lineage and CV eligibility",
    "multidimensional Fit and ranking",
    "Medium opportunity and Low transition analysis",
    "Writer schema and forbidden-claim review",
    "repair protected-content preservation",
    "fixed URL response hash and manual/URL extraction, identity, matrix, Fit, rank, and recommendation equivalence",
    "no network or AI invocation"
  ]
}, null, 2));
