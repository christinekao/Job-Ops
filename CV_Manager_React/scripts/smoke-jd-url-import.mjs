import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const {
  JdImportError,
  validateImportUrl,
  isPublicAddress,
  pinnedLookup,
  extractJobDescription,
  extractMicrosoftEmployerInsights,
  extractMicrosoftPositionDetail,
  createJdImportService
} = require("../jdImportService.cjs");

assert.equal(typeof validateImportUrl, "function", "production must expose a URL safety validator");
assert.equal(typeof extractJobDescription, "function", "production must expose one bounded extractor");
assert.equal(typeof createJdImportService, "function", "production must expose the server-side JD import owner");

function errorCode(action, expected) {
  assert.throws(action, (error) => error instanceof JdImportError && error.code === expected);
}

assert.equal(validateImportUrl("https://careers.microsoft.com/jobs/1").protocol, "https:");
assert.equal(validateImportUrl("http://example.com/jobs/1").protocol, "http:");
for (const [value, code] of [
  ["", "INVALID_URL"],
  ["not a url", "INVALID_URL"],
  ["file:///etc/passwd", "UNSUPPORTED_PROTOCOL"],
  ["ftp://example.com/job", "UNSUPPORTED_PROTOCOL"],
  ["data:text/plain,job", "UNSUPPORTED_PROTOCOL"],
  ["https://user:secret@example.com/job", "INVALID_URL"],
  ["http://localhost/job", "BLOCKED_HOST"],
  ["http://jobs.localhost/job", "BLOCKED_HOST"],
  ["http://127.0.0.1/job", "BLOCKED_NETWORK"],
  ["http://10.0.0.1/job", "BLOCKED_NETWORK"],
  ["http://169.254.169.254/latest/meta-data", "BLOCKED_NETWORK"],
  ["http://[::1]/job", "BLOCKED_NETWORK"],
  ["http://[fc00::1]/job", "BLOCKED_NETWORK"],
  ["http://[fe80::1]/job", "BLOCKED_NETWORK"],
  ["http://[::ffff:127.0.0.1]/job", "BLOCKED_NETWORK"]
]) errorCode(() => validateImportUrl(value), code);

for (const address of ["127.0.0.1","10.0.0.1","172.16.2.1","192.168.1.1","169.254.1.1","100.64.0.1","0.0.0.0","224.0.0.1","::1","fc00::1","fe80::1","ff02::1","::ffff:10.0.0.1"]) {
  assert.equal(isPublicAddress(address), false, `${address} must be blocked`);
}
assert.equal(isPublicAddress("93.184.216.34"), true);
assert.equal(isPublicAddress("2606:2800:220:1:248:1893:25c8:1946"), true);
const selectedAddress = { address: "93.184.216.34", family: 4 };
await new Promise((resolve, reject) => pinnedLookup(selectedAddress)("example.com", { all: true }, (error, addresses) => {
  if (error) return reject(error);
  try {
    assert.deepEqual(addresses, [selectedAddress], "modern Node all-address lookup contract must remain pinned");
    resolve();
  } catch (assertion) {
    reject(assertion);
  }
}));
await new Promise((resolve, reject) => pinnedLookup(selectedAddress)("example.com", {}, (error, address, family) => {
  if (error) return reject(error);
  try {
    assert.equal(address, selectedAddress.address);
    assert.equal(family, selectedAddress.family);
    resolve();
  } catch (assertion) {
    reject(assertion);
  }
}));

const singleJob = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Power Platform Solution Engineer",
  hiringOrganization: { name: "Microsoft" },
  identifier: { value: "12345" },
  description: "<p>Build Power Platform and Copilot solutions for enterprise customers with responsible AI governance.</p>",
  responsibilities: ["Lead customer discovery", "Deliver solution workshops"],
  qualifications: ["Power Platform experience"],
  skills: ["Copilot", "Microsoft Fabric"]
};
const htmlFor = (json) => `<!doctype html><html><body><nav>Navigation noise</nav><script type="application/ld+json">${JSON.stringify(json)}</script><footer>Cookie legal noise</footer></body></html>`;
for (const fixture of [
  singleJob,
  [singleJob],
  { "@graph": [{ "@type": "Organization", name: "Ignore" }, singleJob] },
  { wrapper: { nested: singleJob } }
]) {
  const result = extractJobDescription(htmlFor(fixture), { contentType: "text/html", sourceUrl: "https://careers.microsoft.com/jobs/12345" });
  assert.equal(result.extractionMethod, "json-ld-job-posting");
  assert.equal(result.canonical.company, "Microsoft");
  assert.equal(result.canonical.role, "Power Platform Solution Engineer");
  assert.deepEqual(result.canonical.responsibilities, ["Lead customer discovery", "Deliver solution workshops"]);
}
const multiple = `<script type="application/ld+json">{"@type":"WebSite"}</script>${htmlFor(singleJob)}`;
assert.equal(extractJobDescription(multiple, { contentType: "text/html" }).canonical.jobNumber, "12345");
const withUnknownField = extractJobDescription(htmlFor({
  ...singleJob,
  industry: ["Software Development", "Cloud Services"]
}), { contentType: "text/html" });
assert.deepEqual(withUnknownField.canonical.additionalAttributes, [{
  label: "industry",
  value: ["Software Development", "Cloud Services"],
  sourcePath: "JobPosting.industry"
}]);
assert.equal(Object.hasOwn(withUnknownField.canonical, "industry"), false, "unknown source fields must not dynamically expand the canonical schema");
const invalidFallback = extractJobDescription(
  `<script type="application/ld+json">{invalid</script><main><h1>Technical Trainer</h1><h2>Responsibilities</h2><ul><li>Deliver workshops</li></ul><h2>Qualifications</h2><p>Technical enablement experience required for this public role.</p></main>`,
  { contentType: "text/html", sourceUrl: "https://example.com/job" }
);
assert.equal(invalidFallback.extractionMethod, "generic-html");
assert.match(invalidFallback.sourceText, /Responsibilities\n- Deliver workshops/);
const microsoftFallback = extractJobDescription(
  `<nav>Search jobs and cookie settings</nav><main><h1>Cloud Solution Engineer</h1><h2>Responsibilities</h2><ul><li>Lead discovery workshops</li><li>Build safe prototypes</li></ul><h2>Qualifications</h2><p>Power Platform delivery experience and customer communication are required.</p></main><footer>Privacy and related jobs</footer>`,
  { contentType: "text/html", sourceUrl: "https://apply.careers.microsoft.com/job/1" }
);
assert.equal(microsoftFallback.extractionMethod, "microsoft-careers-html");
assert.doesNotMatch(microsoftFallback.sourceText, /cookie|Privacy|related jobs/i);
assert.match(microsoftFallback.sourceText, /Responsibilities/);
assert.match(microsoftFallback.sourceText, /Qualifications/);
const microsoftDetailPayload = {
  data: {
    name: "Principal Engineer",
    displayJobId: "200041631",
    locations: ["United States, Washington, Redmond"],
    postedTs: 1782761725,
    efcustomTextWorkSite: ["3 days / week in-office"],
    efcustomTextRequiredTravel: ["Less than 25%"],
    efcustomTextCurrentProfession: ["Software Engineering"],
    efcustomTextTaDisciplineName: ["Software Engineering"],
    efcustomTextRoletype: ["Individual Contributor"],
    efcustomTextEmploymentType: ["Full-Time"],
    skills: ["C#", "Python", "Distributed systems"],
    positionExtraDetails: {
      employerInsights: {
        topSkills: [
          "Architecture", "Business", "Automation", "Analytics",
          "Amazon Web Services (AWS)", "Business Planning",
          "Business Development", "Big Data", "Adoption", "Administration",
          "Architecture"
        ],
        previouslyWorkedAs: [
          "Senior Partner Manager", "Digital Specialist", "Technical",
          "Support Manager", "Senior Product Manager", "Technical"
        ]
      }
    },
    jobDescription: "<b>Overview</b><br><div>Build a trustworthy experimentation platform for AI product learning at very high scale.</div><br><b>Responsibilities</b><br><ul><li>Own reliable distributed services.</li></ul><br><b>Qualifications</b><br><div><strong>Required</strong></div><ul><li>Production coding experience.</li></ul><div><strong>Preferred</strong></div><ul><li>Observability and A/B testing.</li></ul><p>Microsoft is an equal opportunity employer. Boilerplate.</p>"
  }
};
const microsoftDetail = extractMicrosoftPositionDetail(microsoftDetailPayload);
assert.equal(microsoftDetail.extractionMethod, "microsoft-careers-position-details");
assert.match(microsoftDetail.sourceText, /Job number\n200041631/);
assert.match(microsoftDetail.sourceText, /Overview\nBuild a trustworthy experimentation platform/);
assert.match(microsoftDetail.sourceText, /Responsibilities\n- Own reliable distributed services/);
assert.match(microsoftDetail.sourceText, /Qualifications/);
assert.match(microsoftDetail.sourceText, /Skills\n- C#\n- Python\n- Distributed systems/);
assert.doesNotMatch(microsoftDetail.sourceText, /equal opportunity employer/);
assert.equal(microsoftDetail.canonical.jobNumber, "200041631");
assert.equal(microsoftDetail.canonical.overview, "Build a trustworthy experimentation platform for AI product learning at very high scale.");
assert.deepEqual(microsoftDetail.canonical.responsibilities, ["Own reliable distributed services."]);
assert.deepEqual(microsoftDetail.canonical.requirements, ["Production coding experience."]);
assert.deepEqual(microsoftDetail.canonical.preferredQualifications, ["Observability and A/B testing."]);
assert.deepEqual(microsoftDetail.canonical.skills, ["C#", "Python", "Distributed systems"]);
assert.equal(microsoftDetail.canonical.workSite, "3 days / week in-office");
assert.deepEqual(microsoftDetail.canonical.employerInsights, {
  topSkills: [
    "Architecture", "Business", "Automation", "Analytics",
    "Amazon Web Services (AWS)", "Business Planning",
    "Business Development", "Big Data", "Adoption", "Administration"
  ],
  previouslyWorkedAs: [
    "Senior Partner Manager", "Digital Specialist", "Technical",
    "Support Manager", "Senior Product Manager"
  ]
});
assert.deepEqual(microsoftDetail.canonical.skills, ["C#", "Python", "Distributed systems"], "previous-hire skills must not enter formal Skills");
assert.doesNotMatch(microsoftDetail.canonical.requirements.join(" "), /Architecture|Amazon Web Services/, "previous-hire insights must not enter requirements");
const microsoftInsightsPayload = {
  data: {
    insights: {
      skills: {
        Architecture: 6,
        Business: 3,
        Automation: 3,
        Analytics: 3,
        "Amazon Web Services (AWS)": 3,
        "Business Planning": 2,
        "Business Development": 2,
        "Big Data": 2,
        Adoption: 2,
        Administration: 2
      },
      titles: {
        "Senior Partner Manager": 2,
        "Digital Specialist": 2,
        Technical: 1,
        "Support Manager": 1,
        "Senior Product Manager": 1
      }
    }
  }
};
assert.deepEqual(extractMicrosoftEmployerInsights(microsoftInsightsPayload), microsoftDetail.canonical.employerInsights);
errorCode(() => extractJobDescription("<p>Too short</p>", { contentType: "text/html" }), "NO_JOB_CONTENT_FOUND");

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
const response = (statusCode, headers, body = "") => ({ statusCode, headers, buffer: Buffer.from(body) });
const service = (pages, overrides = {}) => createJdImportService({
  timeoutMs: 50,
  maxRedirects: 2,
  maxCompressedBytes: 1024 * 1024,
  maxResponseBytes: 1024 * 1024,
  ...overrides
}, {
  lookup: publicLookup,
  requestPage: async (url) => {
    const page = pages[url.toString()];
    if (page instanceof Error) throw page;
    assert.ok(page, `unexpected URL ${url}`);
    return page;
  },
  now: () => new Date("2026-07-19T00:00:00.000Z")
});

const imported = await service({
  "https://example.com/start": response(302, { location: "https://jobs.example.com/posting" }),
  "https://jobs.example.com/posting": response(200, { "content-type": "text/html; charset=utf-8" }, htmlFor(singleJob))
}).importFromUrl("https://example.com/start");
assert.equal(imported.rawJD.includes("responsible AI governance"), true);
assert.equal(imported.provenance.redirectCount, 1);
assert.equal(imported.provenance.sourceUrl, "https://example.com/start");
assert.equal(imported.provenance.finalUrl, "https://jobs.example.com/posting");
assert.equal(imported.provenance.sourceDomain, "jobs.example.com");
assert.equal(imported.provenance.extractionCoverage, "FULL");
assert.equal(imported.provenance.fetchedAt, "2026-07-19T00:00:00.000Z");
assert.equal(imported.extracted.role, "Power Platform Solution Engineer");

const microsoftUrl = "https://apply.careers.microsoft.com/careers?domain=microsoft.com&pid=1970393556915319";
const microsoftApiUrl = "https://apply.careers.microsoft.com/api/pcsx/position_details?position_id=1970393556915319&domain=microsoft.com&hl=en";
const microsoftInsightsUrl = "https://apply.careers.microsoft.com/api/pcsx/position_insights?position_id=1970393556915319&domain=microsoft.com&hl=en";
const importedMicrosoft = await service({
  [microsoftUrl]: response(200, { "content-type": "text/html; charset=utf-8" }, htmlFor(singleJob)),
  [microsoftApiUrl]: response(200, { "content-type": "application/json; charset=utf-8" }, JSON.stringify(microsoftDetailPayload)),
  [microsoftInsightsUrl]: response(200, { "content-type": "application/json; charset=utf-8" }, JSON.stringify(microsoftInsightsPayload))
}).importFromUrl(microsoftUrl);
assert.equal(importedMicrosoft.provenance.extractionMethod, "microsoft-careers-position-details");
assert.equal(importedMicrosoft.provenance.extractionCoverage, "FULL");
assert.match(importedMicrosoft.rawJD, /Overview/);
assert.match(importedMicrosoft.rawJD, /Responsibilities/);
assert.match(importedMicrosoft.rawJD, /Qualifications/);
assert.match(importedMicrosoft.rawJD, /Skills/);
assert.equal(importedMicrosoft.extracted.jobNumber, "200041631");
assert.deepEqual(importedMicrosoft.extracted.employerInsights, microsoftDetail.canonical.employerInsights);

const redirectBlocked = createJdImportService({}, {
  lookup: publicLookup,
  requestPage: async () => response(302, { location: "http://127.0.0.1/private" })
});
await assert.rejects(() => redirectBlocked.importFromUrl("https://example.com/start"), (error) => error.code === "BLOCKED_NETWORK");
const privateDns = createJdImportService({}, {
  lookup: async () => [{ address: "10.0.0.8", family: 4 }],
  requestPage: async () => assert.fail("request must not run")
});
await assert.rejects(() => privateDns.importFromUrl("https://example.com/job"), (error) => error.code === "BLOCKED_NETWORK");
const failedDns = createJdImportService({}, {
  lookup: async () => { throw new Error("internal DNS detail"); },
  requestPage: async () => assert.fail("request must not run")
});
await assert.rejects(() => failedDns.importFromUrl("https://example.com/job"), (error) =>
  error.code === "DNS_RESOLUTION_FAILED" && !error.message.includes("internal DNS detail")
);
const redirectLoop = service({
  "https://example.com/a": response(302, { location: "/b" }),
  "https://example.com/b": response(302, { location: "/a" })
});
await assert.rejects(() => redirectLoop.importFromUrl("https://example.com/a"), (error) => error.code === "TOO_MANY_REDIRECTS");
const tooMany = service({
  "https://example.com/a": response(302, { location: "/b" }),
  "https://example.com/b": response(302, { location: "/c" }),
  "https://example.com/c": response(302, { location: "/d" })
}, { maxRedirects: 1 });
await assert.rejects(() => tooMany.importFromUrl("https://example.com/a"), (error) => error.code === "TOO_MANY_REDIRECTS");

for (const [page, code] of [
  [response(200, { "content-type": "application/pdf" }, "%PDF"), "UNSUPPORTED_CONTENT_TYPE"],
  [response(200, { "content-type": "text/html" }, ""), "NO_JOB_CONTENT_FOUND"],
  [response(500, { "content-type": "text/html" }, "server failed"), "FETCH_FAILED"],
  [new JdImportError("FETCH_TIMEOUT", "timeout", 504), "FETCH_TIMEOUT"],
  [new JdImportError("FETCH_FAILED", "network", 502), "FETCH_FAILED"]
]) {
  await assert.rejects(
    () => service({ "https://example.com/job": page }).importFromUrl("https://example.com/job"),
    (error) => error.code === code
  );
}
await assert.rejects(
  () => service({
    "https://example.com/job": response(200, { "content-type": "text/plain" }, "x".repeat(500))
  }, { maxResponseBytes: 100 }).importFromUrl("https://example.com/job"),
  (error) => error.code === "RESPONSE_TOO_LARGE"
);
await assert.rejects(
  () => service({
    "https://example.com/job": {
      statusCode: 200,
      headers: { "content-type": "text/plain", "content-encoding": "gzip" },
      buffer: gzipSync("x".repeat(10_000))
    }
  }, { maxResponseBytes: 100 }).importFromUrl("https://example.com/job"),
  (error) => error.code === "RESPONSE_TOO_LARGE"
);
await assert.rejects(
  () => service({
    "https://example.com/job": response(200, { "content-type": "text/plain", "content-encoding": "compress" }, "content")
  }).importFromUrl("https://example.com/job"),
  (error) => error.code === "UNSUPPORTED_CONTENT_TYPE"
);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "HTTP/HTTPS and malformed/credential/protocol validation",
    "hostname, DNS, IPv4, IPv6, mapped IPv6, metadata, and private-network blocking",
    "public redirects with per-hop revalidation, loop, and redirect limits",
    "timeout, network, response-size, content-type, status, and empty-response errors",
    "JSON-LD object, array, graph, nested, multiple-script, and invalid fallback",
    "Microsoft Careers full position-details metadata, Overview, Responsibilities, Qualifications, Skills, and generic HTML extraction",
    "fixed provenance with no AI invocation"
  ]
}, null, 2));
