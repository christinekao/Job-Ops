import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const intake = await readFile("src/components/tabs/JDIntake.tsx", "utf8");
const primitives = await readFile("src/components/ui/primitives.tsx", "utf8");
const styles = await readFile("src/styles.css", "utf8");

const headings = [
  "Core Job Information",
  "Work Details",
  "Job Description",
  "Qualifications",
  "Compensation and Application",
  "Imported Source Insights",
  "AI Analysis"
];
let previous = -1;
for (const heading of headings) {
  const index = intake.indexOf(`>${heading}<`);
  assert.ok(index > previous, `${heading} must exist in the required section order`);
  previous = index;
}

assert.match(intake, /className="jd-intake-short-grid"/);
assert.match(styles, /\.jd-intake-short-grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(styles, /@media \(max-width: 1100px\)[\s\S]*\.jd-intake-short-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(styles, /@media \(max-width: 700px\)[\s\S]*\.jd-intake-short-grid[\s\S]*grid-template-columns: 1fr/);
assert.match(intake, /<details className="jd-insights-disclosure">/, "Employer Insights must be a collapsed-by-default disclosure");
assert.doesNotMatch(intake, /<details className="jd-insights-disclosure" open/, "Employer Insights must not default open");
assert.match(styles, /\.jd-insights-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(intake, /Not provided by source — run JD Parse to derive skills\./);
assert.match(intake, /Run JD Parse to derive keywords\./);
assert.match(intake, /Generated after candidate-to-JD Screening\./);
assert.match(primitives, /placeholder\?: string/);
assert.match(primitives, /helperText\?: string/);
assert.match(primitives, /displayValue\?: string/);
assert.match(intake, /formatReadableDate\(datePosted\)/);
assert.match(primitives, /title=\{value\}/, "complete input values must remain available as a tooltip");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "semantic section order",
    "responsive 3/2/1 short-field grid",
    "collapsed full-width Employer Insights",
    "non-persisted empty-state guidance",
    "readable date display with complete raw value"
  ]
}, null, 2));
