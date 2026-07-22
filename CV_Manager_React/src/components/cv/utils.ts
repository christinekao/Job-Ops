import type { AppData, CareerProfile, CvVersion, JobApplication, StarStory, TailoredCv } from "../../types";
import { evidenceSelectionQualityDiagnostics, fitRecommendationsApplied, resolveEffectiveCvBrief, selectionDiagnostics } from "../../data/selection";
import { normalizePeriodText, stringArray, textValue } from "../../utils/normalize";
export { CvLayoutDiagnosticsPanel } from "./CvLayoutDiagnosticsPanel";

export type CvSections = NonNullable<CvVersion["sections"]>;

export function cleanCvBullet(value: string) {
  return value
    .replace(/^[\s•\-–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sectionTitleForCv(profile: CareerProfile, item: { sectionTitle?: string; category?: string; projectId?: string }) {
  if (item.sectionTitle?.trim()) return item.sectionTitle.trim();
  const project = profile.workExperiences.flatMap((experience) => experience.projects).find((entry) => entry.id === item.projectId);
  return project?.category || item.category || "Project Delivery";
}

export function storyToCvBullets(story: StarStory) {
  if (story.cvBullets?.length) return story.cvBullets.map(cleanCvBullet).filter(Boolean);
  const action = cleanCvBullet(story.action);
  const result = cleanCvBullet(story.result);
  if (action && result) return [`${action} ${result}`];
  return [action || result].filter(Boolean);
}

export function emptyCvSections(): CvSections {
  return {
    header: "",
    summary: "",
    skills: "",
    workExperience: "",
    projects: "",
    education: "",
    certifications: "",
    languages: ""
  };
}

export function sectionsFromContent(content: string, fallback: CvSections | undefined): CvSections {
  if (!content.trim()) return fallback || emptyCvSections();
  return {
    ...(fallback || emptyCvSections()),
    summary: content
  };
}

export function normalizeTailoredCv(value: unknown): TailoredCv | null {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const wrappedCandidate = [
    root.tailoredCv,
    root.screeningCv,
    root.cv,
    root.resume
  ].find((item) => item && typeof item === "object");
  const candidate = (wrappedCandidate || root) as Record<string, unknown>;
  if (!candidate || typeof candidate !== "object") return null;
  const header = candidate.header && typeof candidate.header === "object" ? candidate.header as Record<string, unknown> : {};
  const sidebar = candidate.sidebar && typeof candidate.sidebar === "object" ? candidate.sidebar as Record<string, unknown> : {};
  const jdAnalysis = candidate.jdAnalysis && typeof candidate.jdAnalysis === "object" ? candidate.jdAnalysis as Record<string, unknown> : {};
  const positioningReport = candidate.positioningReport && typeof candidate.positioningReport === "object"
    ? candidate.positioningReport as TailoredCv["positioningReport"]
    : undefined;
  const work = Array.isArray(candidate.workExperience) ? candidate.workExperience : [];
  if (!textValue(candidate.summary).trim() && work.length === 0) return null;
  return {
    jdAnalysis: {
      targetRole: textValue(jdAnalysis.targetRole || header.targetRole || header.role),
      coreRequirements: stringArray(jdAnalysis.coreRequirements || jdAnalysis.requirements),
      topKeywords: (Array.isArray(jdAnalysis.topKeywords) ? jdAnalysis.topKeywords : []).map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          keyword: textValue(record.keyword || item),
          priority: (textValue(record.priority) as "Must-have" | "Important" | "Nice-to-have") || "Important",
          placement: (textValue(record.placement) as "Summary" | "Skills" | "Work Experience") || "Skills"
        };
      }).filter((item) => item.keyword),
      gaps: stringArray(jdAnalysis.gaps || jdAnalysis.missingSkills)
    },
    header: {
      name: textValue(header.name || "Li Ting Kao / Christine Kao"),
      targetRole: textValue(header.targetRole || header.role),
      email: textValue(header.email),
      location: textValue(header.location),
      phone: textValue(header.phone || header.mobile || header.telephone),
      linkedIn: textValue(header.linkedIn || header.linkedin || header.linkedInUrl || header.linkedinUrl),
      portfolio: textValue(header.portfolio || header.website || header.url)
    } as TailoredCv["header"] & Record<string, string>,
    sidebar: {
      languages: (Array.isArray(sidebar.languages) ? sidebar.languages : []).map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          name: textValue(record.name || item),
          level: textValue(record.level),
          note: textValue(record.note)
        };
      }).filter((item) => item.name || item.level || item.note),
      skillGroups: (Array.isArray(sidebar.skillGroups) ? sidebar.skillGroups : []).map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          title: textValue(record.title || record.name || "Skills"),
          highlightedSkills: stringArray(record.highlightedSkills || record.highlights),
          otherSkills: stringArray(record.otherSkills || record.skills)
        };
      }).filter((item) => item.title || item.highlightedSkills.length || item.otherSkills.length),
      certifications: stringArray(sidebar.certifications),
      education: (Array.isArray(sidebar.education) ? sidebar.education : []).map((item) => {
        const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          school: textValue(record.school || record.institution || record.university),
          degree: textValue(record.degree || record.program),
          period: textValue(record.period || record.years || record.date)
        };
      }).filter((item) => item.school || item.degree)
    },
    summary: textValue(candidate.summary),
    workExperience: work.map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const subsections = Array.isArray(record.subsections) ? record.subsections : [];
      return {
        experienceId: textValue(record.experienceId || record.id) || undefined,
        company: textValue(record.company),
        role: textValue(record.role || record.title),
        period: textValue(record.period || record.years),
        location: textValue(record.location),
        subsections: subsections.map((section) => {
          const sectionRecord = section && typeof section === "object" ? section as Record<string, unknown> : {};
          const bullets = Array.isArray(sectionRecord.bullets) ? sectionRecord.bullets : [];
          return {
            title: textValue(sectionRecord.title || sectionRecord.name),
            bullets: bullets.map((bullet) => {
              const bulletRecord = bullet && typeof bullet === "object" ? bullet as Record<string, unknown> : {};
              return {
                text: cleanCvBullet(textValue(bulletRecord.text || bullet)),
                metric: textValue(bulletRecord.metric) || undefined,
                metricType: (textValue(bulletRecord.metricType) as TailoredCv["workExperience"][number]["subsections"][number]["bullets"][number]["metricType"]) || "None",
                evidenceIds: stringArray(bulletRecord.evidenceIds),
                confidence: (textValue(bulletRecord.confidence) as TailoredCv["workExperience"][number]["subsections"][number]["bullets"][number]["confidence"]) || undefined
              };
            }).filter((bullet) => bullet.text)
          };
        }).filter((section) => section.title || section.bullets.length)
      };
    }).filter((item) => item.company || item.role || item.subsections.length),
    keywordPlacementNotes: stringArray(candidate.keywordPlacementNotes || candidate.keywordNotes),
    positioningReport,
    interviewNotes: (Array.isArray(candidate.interviewNotes) ? candidate.interviewNotes : []).map((item) => {
      const record = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        topic: textValue(record.topic),
        details: textValue(record.details),
        evidenceIds: stringArray(record.evidenceIds)
      };
    }).filter((item) => item.topic || item.details),
    reviewNotes: stringArray(candidate.reviewNotes || candidate.notes)
  };
}

export function tailoredCvToSections(cv: TailoredCv): CvSections {
  const headerRecord = cv.header as TailoredCv["header"] & Record<string, string>;
  const contactLine = [
    headerRecord.email,
    headerRecord.phone,
    headerRecord.location,
    headerRecord.linkedIn,
    headerRecord.portfolio
  ].filter(Boolean).join(" | ");
  return {
    header: [
      cv.header.name,
      cv.header.targetRole ? `Target: ${cv.header.targetRole}` : "",
      contactLine
    ].filter(Boolean).join("\n"),
    summary: cv.summary,
    skills: cv.sidebar.skillGroups
      .map((group) => `${group.title}: ${[...group.highlightedSkills, ...group.otherSkills].filter(Boolean).join(", ")}`)
      .join("\n"),
    workExperience: cv.workExperience.map((experience) => {
      const sectionText = experience.subsections
        .map((section) => `Section: ${section.title}\n${section.bullets.map((bullet) => `- ${cleanCvBullet(`${bullet.text}${bullet.metric ? ` (${bullet.metric})` : ""}`)}`).join("\n")}`)
        .join("\n");
      return `${experience.role} | ${experience.company} | ${experience.period}\n${sectionText}`;
    }).join("\n\n"),
    projects: "",
    education: cv.sidebar.education.map((item) => `${item.degree} | ${item.school} | ${item.period}`).join("\n\n"),
    certifications: cv.sidebar.certifications.join("\n"),
    languages: cv.sidebar.languages.map((item) => [item.name, item.level, item.note].filter(Boolean).join(" | ")).join("\n")
  };
}

export function parseSkillSection(value: string) {
  return value.split("\n").map((line) => {
    const [name, rest] = line.split(":");
    return {
      name: rest ? name.trim() : "Core Skills",
      skills: stringArray(rest || line)
    };
  }).filter((group) => group.skills.length);
}

export function parseEducationSection(value: string) {
  return value.split(/\n\n+/).map((block) => {
    const [degree = "", school = "", period = ""] = block.split("|").map((item) => item.trim());
    return { degree, school, period: normalizePeriodText(period) };
  }).filter((item) => item.degree || item.school);
}

export function parseCertificationSection(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function parseLanguageSection(value: string): TailoredCv["sidebar"]["languages"] {
  return value.split("\n").map((line) => {
    const [name = "", level = "", note = ""] = line.split("|").map((item) => item.trim());
    return { name, level, note };
  }).filter((item) => item.name || item.level || item.note);
}

export function parseWorkSection(value: string) {
  return value.split(/\n\n+/).map((block) => {
    const lines = block.split("\n").map((line) => line.trimEnd()).filter(Boolean);
    const [role = "", company = "", period = ""] = (lines.shift() || "").split("|").map((item) => item.trim());
    const sections: { title: string; bullets: string[] }[] = [];
    let current = { title: "", bullets: [] as string[] };
    lines.forEach((line) => {
      if (line.startsWith("Section:") || line.startsWith("Project:")) {
        if (current.bullets.length) sections.push(current);
        current = { title: line.replace(/^(Section|Project):\s*/, "").trim(), bullets: [] };
        return;
      }
      const bullet = cleanCvBullet(line);
      if (bullet) current.bullets.push(bullet);
    });
    if (current.bullets.length) sections.push(current);
    return { role, company, period: normalizePeriodText(period), sections };
  }).filter((item) => item.role || item.company || item.sections.length);
}

export type ParsedWorkItem = ReturnType<typeof parseWorkSection>[number];
export type ParsedSkillGroup = ReturnType<typeof parseSkillSection>[number];

export function splitWorkForCvPages(workItems: ParsedWorkItem[]) {
  const [primary, ...rest] = workItems;
  if (!primary) return { firstPageWork: [] as ParsedWorkItem[], secondPageWork: [] as ParsedWorkItem[] };

  const primaryBulletCount = primary.sections.reduce((sum, section) => sum + section.bullets.length, 0);
  const firstPageBulletBudget = primaryBulletCount <= 10 ? primaryBulletCount : Math.min(13, Math.max(11, Math.ceil(primaryBulletCount * 0.65)));
  const firstSections: ParsedWorkItem["sections"] = [];
  const remainingSections: ParsedWorkItem["sections"] = [];
  let firstPageBulletCount = 0;

  primary.sections.forEach((section) => {
    const firstBullets: string[] = [];
    const secondBullets: string[] = [];
    section.bullets.forEach((bullet) => {
      if (firstPageBulletCount < firstPageBulletBudget) {
        firstBullets.push(bullet);
        firstPageBulletCount += 1;
      } else {
        secondBullets.push(bullet);
      }
    });
    if (firstBullets.length) firstSections.push({ ...section, bullets: firstBullets });
    if (secondBullets.length) remainingSections.push({ ...section, bullets: secondBullets });
  });

  const firstPageWork: ParsedWorkItem[] = [{ ...primary, sections: firstSections }];
  const secondPageWork: ParsedWorkItem[] = [
    ...(remainingSections.length ? [{ ...primary, sections: remainingSections }] : []),
    ...rest
  ];

  const targetFirstPageBulletCount = 11;
  if (firstPageBulletCount < targetFirstPageBulletCount && secondPageWork.length > 0) {
    const pulledWork: ParsedWorkItem[] = [];
    const retainedSecondPageWork: ParsedWorkItem[] = [];
    let remainingFirstPageSlots = targetFirstPageBulletCount - firstPageBulletCount;

    secondPageWork.forEach((item) => {
      if (remainingFirstPageSlots <= 0) {
        retainedSecondPageWork.push(item);
        return;
      }
      const pulledSections: ParsedWorkItem["sections"] = [];
      const retainedSections: ParsedWorkItem["sections"] = [];

      item.sections.forEach((section) => {
        if (remainingFirstPageSlots <= 0) {
          retainedSections.push(section);
          return;
        }
        const pulledBullets = section.bullets.slice(0, remainingFirstPageSlots);
        const retainedBullets = section.bullets.slice(remainingFirstPageSlots);
        if (pulledBullets.length) {
          pulledSections.push({ ...section, bullets: pulledBullets });
          remainingFirstPageSlots -= pulledBullets.length;
        }
        if (retainedBullets.length) retainedSections.push({ ...section, bullets: retainedBullets });
      });

      if (pulledSections.length) pulledWork.push({ ...item, sections: pulledSections });
      if (retainedSections.length) retainedSecondPageWork.push({ ...item, sections: retainedSections });
    });

    return {
      firstPageWork: [...firstPageWork, ...pulledWork],
      secondPageWork: retainedSecondPageWork
    };
  }

  return {
    firstPageWork,
    secondPageWork
  };
}

export function compactSkillGroups(groups: ParsedSkillGroup[]) {
  return groups.slice(0, 4).map((group) => ({ ...group, skills: group.skills.slice(0, 5) }));
}

export function parseCvHeaderLines(lines: string[], profile: CareerProfile, job?: JobApplication) {
  const displayName = lines[0] || profile.identity.split(";")[0] || "Li Ting Kao";
  const roleLine = lines[1]?.replace(/^Target:\s*/, "") || job?.role || "Power Platform / BI Engineer";
  const contacts = lines.slice(2).join(" | ").split(/\s*\|\s*/).map((item) => item.trim()).filter(Boolean);
  return { displayName, roleLine, contacts };
}

export function sameWorkItem(a?: ParsedWorkItem, b?: ParsedWorkItem) {
  if (!a || !b) return false;
  return a.role === b.role && a.company === b.company && a.period === b.period;
}

export function sectionsToTailoredCv(sections: CvSections, base?: TailoredCv): TailoredCv {
  const headerLines = sections.header.split("\n").map((line) => line.trim()).filter(Boolean);
  const skillGroups = parseSkillSection(sections.skills).map((group) => ({
    title: group.name,
    highlightedSkills: group.skills.slice(0, 3),
    otherSkills: group.skills.slice(3)
  }));
  return {
    header: {
      name: headerLines[0] || base?.header.name || "Li Ting Kao / Christine Kao",
      targetRole: headerLines.find((line) => line.startsWith("Target:"))?.replace(/^Target:\s*/, "") || base?.header.targetRole || "",
      email: base?.header.email || "",
      location: base?.header.location || ""
    },
    jdAnalysis: base?.jdAnalysis,
    sidebar: {
      languages: parseLanguageSection(sections.languages),
      skillGroups,
      certifications: parseCertificationSection(sections.certifications),
      education: parseEducationSection(sections.education).map((item) => ({
        school: item.school,
        degree: item.degree,
        period: item.period
      }))
    },
    summary: sections.summary,
    workExperience: parseWorkSection(sections.workExperience).map((item) => ({
      company: item.company,
      role: item.role,
      period: item.period,
      location: "",
      subsections: item.sections.map((section) => ({
        title: section.title,
        bullets: section.bullets.map((bullet) => ({ text: cleanCvBullet(bullet), confidence: "Grounded" as const }))
      }))
    })),
    keywordPlacementNotes: base?.keywordPlacementNotes || [],
    reviewNotes: base?.reviewNotes || []
  };
}

export function tailoredCvFromVersion(version?: CvVersion): TailoredCv | undefined {
  if (!version) return undefined;
  if (version.tailoredCv) {
    return normalizeTailoredCv(version.tailoredCv) || (version.sections ? sectionsToTailoredCv(version.sections, version.tailoredCv) : undefined);
  }
  return version.sections ? sectionsToTailoredCv(version.sections, version.tailoredCv) : undefined;
}

export function buildCvPromptInput(data: AppData, job: JobApplication) {
  const diagnostics = selectionDiagnostics(data, job);
  const cvBrief = resolveEffectiveCvBrief(data, job);
  return {
    jd: job.parsed || job.rawJD,
    careerProfile: data.careerProfile,
    selectedSkills: diagnostics.selectedSkills,
    selectedDomainKnowledge: diagnostics.selectedDomainKnowledge,
    selectedEvidence: diagnostics.selectedEvidence,
    selectedStarStories: diagnostics.selectedStarStories,
    cvBrief,
    selectionQuality: evidenceSelectionQualityDiagnostics(data, job),
    selectionAudit: {
      validSkillCount: diagnostics.selectedSkills.length,
      validDomainKnowledgeCount: diagnostics.selectedDomainKnowledge.length,
      validEvidenceCount: diagnostics.selectedEvidence.length,
      validStarStoryCount: diagnostics.selectedStarStories.length,
      invalidSkillIds: diagnostics.invalidSkillIds,
      invalidDomainKnowledgeIds: diagnostics.invalidDomainKnowledgeIds,
      invalidEvidenceIds: diagnostics.invalidEvidenceIds,
      invalidStoryIds: diagnostics.invalidStoryIds
    }
  };
}

export function defaultCvVersionName(role: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${role || "Power Platform Developer"} CV ${date}`;
}

export function jobBlocker(job: JobApplication, cvCount: number) {
  if (!job.parsed && !job.rawJD) return "Paste JD first";
  if (!job.screeningAnalysis) return "Run Screening Analysis";
  if (!job.selectedEvidenceIds.length) return "Select evidence";
  if (!cvCount) return "Build screening CV";
  if (job.status === "CV Drafted") return "Review Screening Gate and finalize CV";
  if (job.status === "Reviewed") return "Export or apply";
  if (job.status === "Applied") return "Track follow-up";
  return job.nextAction || "Review next step";
}

export function composeCvContent(sections: CvSections): string {
  return [
    sections.header,
    "Professional Summary",
    sections.summary,
    "Core Skills",
    sections.skills,
    "Work Experience",
    sections.workExperience,
    "Education",
    sections.education,
    sections.certifications ? `Certifications\n${sections.certifications}` : "",
    sections.languages ? `Languages\n${sections.languages}` : ""
  ].filter((section) => section.trim()).join("\n\n");
}

export function cvContentAudit(cv: TailoredCv) {
  const diagnosticPattern = /\bvs\b[^.;]*%|human-review cases|sample size|sampling ratio|prompt taxonomy.*v\d|launched? \d{4}[/-]|issue handled|records confirmed|ingestion validated|reviewers? granted|configuration changes|golden question test|accuracy median|score dumps?|global benchmark|japan benchmark|benchmark:[^.;]*\d+(\.\d+)?%/i;
  const internalJargonPattern = /\b(TOMO|Trender Buddy|GenAI Hub|Sunshine Project|AppsIQ|TrendIQ|Consumer Companion|Eureka API)\b|_tbl_|\bv\d+\.\d+\b/i;
  const activityNumberPattern = /\b(version|ticket|change request|bug-fix|operation log|review case|record|recipient|photo update)s?\b[^.;]{0,55}\d|\d[^.;]{0,55}\b(version|ticket|change request|bug-fix|operation log|review case|record|recipient|photo update)s?\b/i;
  const workLogParentheticalPattern = /\([^)]{55,}\)|\([^)]*(daily scheduled|utc|uat|go-live|internal test|prompt versions?|operation log|change request|bug-fix|tracked in|global benchmark|japan benchmark|from \d{4}\/\d{1,2}|to \d{4}\/\d{1,2})[^)]*\)/i;
  const internalProductPattern = /\b(TOMO|FIN)\b/i;
  const outcomePattern = /reduce|improv|increase|save|faster|lower|enable|support|protect|prevent|centraliz|visibility|reliability|accuracy|efficien|adoption|decision|risk|compliance|quality|scale|production|stakeholder/i;
  const scopePattern = /enterprise|global|cross-region|production|regions?|markets?|users?|stakeholders?|systems?|workflows?|projects?/i;
  return cv.workExperience.flatMap((experience) => experience.subsections.flatMap((section) =>
    section.bullets.flatMap((bullet, index) => {
      const text = `${bullet.text} ${bullet.metric || ""}`.trim();
      const reasons = [
        workLogParentheticalPattern.test(text) ? "Bullet contains long parenthetical proof or work-log details that should not appear in a CV." : "",
        internalProductPattern.test(text) ? "Internal product or project names must be translated into external market language." : "",
        diagnosticPattern.test(text) ? "Benchmark or test data is presented like a business outcome." : "",
        activityNumberPattern.test(text) ? "An internal activity count is presented like impact." : "",
        internalJargonPattern.test(text) ? "Internal project or system language needs an external explanation." : "",
        !outcomePattern.test(text) && !scopePattern.test(text) ? "Task-focused bullet does not explain the business outcome, risk reduced, decision enabled, or meaningful scope." : ""
      ].filter(Boolean);
      return reasons.length ? [{
        id: `${experience.experienceId || experience.company}-${section.title}-${index}`,
        location: `${experience.company} · ${section.title}`,
        excerpt: bullet.text,
        reasons
      }] : [];
    })
  ));
}

export function cvQualityChecks(cv: TailoredCv, job: JobApplication, data: AppData) {
  const bullets = cv.workExperience.flatMap((experience) =>
    experience.subsections.flatMap((section) => section.bullets)
  );
  const primaryExperience = cv.workExperience[0];
  const primaryBullets = primaryExperience
    ? primaryExperience.subsections.flatMap((section) => section.bullets)
    : [];
  const jdKeywords = (job.parsed?.keywords || []).map((keyword) => keyword.toLowerCase());
  const cvText = JSON.stringify(cv).toLowerCase();
  const keywordHits = jdKeywords.filter((keyword) => cvText.includes(keyword)).length;
  const impactMetricPattern = /(reduc|improv|increas|grew|growth|sav|cut|lower|raise|adoption|conversion|accuracy lift|error rate|time saved|cost|efficien|throughput|risk reduction)[^.!;]{0,90}(\d|%)|(\d|%)[^.!;]{0,90}(reduction|improvement|increase|growth|saved|faster|lower|adoption|conversion|accuracy|error rate|efficiency)/i;
  const meaningfulScopePattern = /(enterprise|global|cross-region|production|portfolio|regions?|markets?|users?|stakeholders?|systems?|workflows?|projects?)[^.!;]{0,70}\d|\d[^.!;]{0,70}(regions?|markets?|users?|stakeholders?|systems?|workflows?|projects?)/i;
  const diagnosticDataDumpPattern = /\bvs\b[^.;]*%|human-review cases|sample size|sampling ratio|prompt taxonomy.*v\d|launched? \d{4}[/-]|issue handled|records confirmed|ingestion validated|reviewers? granted|configuration changes/i;
  const achievementSignalBullets = bullets.filter((bullet) => {
    const text = `${bullet.text} ${bullet.metric || ""}`;
    return (impactMetricPattern.test(text) || meaningfulScopePattern.test(text)) && !diagnosticDataDumpPattern.test(text);
  }).length;
  const diagnosticDataBullets = bullets.filter((bullet) => diagnosticDataDumpPattern.test(`${bullet.text} ${bullet.metric || ""}`)).length;
  const businessImpactBullets = bullets.filter((bullet) =>
    /reduce|improve|increase|centralize|visibility|govern|risk|decision|adoption|production|reliability|accuracy|efficiency|support|enable|audit|control|stakeholder/i.test(`${bullet.text} ${bullet.metric || ""}`)
  ).length;
  const unsupported = bullets.filter((bullet) => bullet.confidence === "Weak" || bullet.confidence === "Needs Review").length;
  const sidebarSkillCount = cv.sidebar.skillGroups.reduce(
    (sum, group) => sum + group.highlightedSkills.length + group.otherSkills.length,
    0
  );
  const diagnostics = selectionDiagnostics(data, job);
  const eligibleEvidence = diagnostics.selectedEvidence.filter((item) => item.confidence === "Grounded" && item.evidenceTier !== "Archive");
  const eligibleEvidenceCount = eligibleEvidence.length;
  const eligibleProjectIds = Array.from(new Set(eligibleEvidence.map((item) => item.projectId).filter(Boolean)));
  const primaryExperienceId = data.careerProfile.workExperiences[0]?.id;
  const eligiblePrimaryEvidence = eligibleEvidence.filter((item) => item.experienceId === primaryExperienceId).length;
  const targetTotalBullets = Math.min(12, Math.max(4, eligibleEvidenceCount));
  const targetPrimaryBullets = Math.min(8, Math.max(3, eligiblePrimaryEvidence));
  const eligibleSkillNames = diagnostics.selectedSkills
    .filter((item) => item.confidence === "Grounded" && item.strength !== "Mentioned" && item.usageContext !== "mentioned")
    .map((item) => item.skill.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim());
  const sidebarSkills = cv.sidebar.skillGroups.flatMap((group) => [...group.highlightedSkills, ...group.otherSkills]);
  const unsupportedSidebarSkills = sidebarSkills.filter((skill) => {
    const normalized = skill.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
    return normalized && !eligibleSkillNames.some((grounded) => grounded === normalized || grounded.includes(normalized) || normalized.includes(grounded));
  });
  const evidenceById = new Map(data.evidenceCards.map((item) => [item.id, item]));
  const validEvidenceIds = new Set(evidenceById.keys());
  const linkedBullets = bullets.filter((bullet) => (bullet.evidenceIds || []).some((id) => validEvidenceIds.has(id))).length;
  const invalidBulletEvidenceIds = bullets.flatMap((bullet) => bullet.evidenceIds || []).filter((id) => !validEvidenceIds.has(id));
  const visibleProjectIds = new Set(
    bullets.flatMap((bullet) => (bullet.evidenceIds || [])
      .map((id) => evidenceById.get(id)?.projectId)
      .filter(Boolean)
    )
  );
  const targetVisibleProjects = Math.min(5, Math.max(2, eligibleProjectIds.length));
  const selectedEvidenceCount = diagnostics.selectedEvidence.length;
  const recommendationsApplied = fitRecommendationsApplied(data, job);
  const invalidSelectionCount = diagnostics.invalidEvidenceIds.length
    + diagnostics.invalidStoryIds.length
    + diagnostics.invalidSkillIds.length
    + diagnostics.invalidDomainKnowledgeIds.length;
  const priorRoleCount = cv.workExperience.slice(1).filter((experience) =>
    experience.subsections.some((section) => section.bullets.some((bullet) => bullet.text.trim()))
  ).length;
  const plainEmail = cv.header.email.trim();
  const emailLooksPlain = /^[^\s@<>\[\]()]+@[^\s@<>\[\]()]+\.[^\s@<>\[\]()]+$/.test(plainEmail);
  const malformedPeriods = cv.workExperience
    .map((experience) => experience.period)
    .filter((period) => period && period !== normalizePeriodText(period));
  const visibleCvText = [
    cv.header.name,
    cv.header.targetRole,
    cv.summary,
    ...cv.workExperience.flatMap((experience) => [
      experience.role,
      experience.company,
      ...experience.subsections.flatMap((section) => [
        section.title,
        ...section.bullets.map((bullet) => bullet.text)
      ])
    ])
  ].join(" ");
  const reviewNoteLeak = /selected evidence|review note|grounded in uploaded|needs review|do not claim/i.test(visibleCvText);
  const internalEvidenceLanguage = /evidence card|raw material|claim boundary|STAR story/i.test(visibleCvText);
  const layoutChecks = cvLayoutDiagnostics(cv, tailoredCvToSections(cv));
  const layoutWarnings = layoutChecks.filter((item) => item.state !== "ok");
  const contentAudit = cvContentAudit(cv);
  return [
    {
      label: "Summary",
      ok: cv.summary.trim().split(/\s+/).length >= 30 && cv.summary.trim().split(/\s+/).length <= 70,
      message: "35-55 words is ideal; it should state role fit and business value early.",
      action: "Rewrite around target role, ownership scope, and fastest business value."
    },
    {
      label: "ATS keywords",
      ok: !jdKeywords.length || keywordHits >= Math.min(5, jdKeywords.length),
      message: `${keywordHits}/${jdKeywords.length || 0} JD keywords appear naturally in the CV.`,
      action: "Add missing must-have keywords into Summary, Skills, or matching work bullets."
    },
    {
      label: "Content depth",
      ok: bullets.length >= targetTotalBullets && primaryBullets.length >= targetPrimaryBullets,
      message: `${eligibleEvidenceCount} eligible grounded evidence items support a target of ${targetTotalBullets} total bullets and ${targetPrimaryBullets} primary-role bullets; current CV has ${bullets.length} / ${primaryBullets.length}.`,
      action: "Use additional grounded Core/Supporting evidence if available. Otherwise keep the CV shorter; do not use weak evidence to fill space."
    },
    {
      label: "Representative projects",
      ok: !eligibleProjectIds.length || visibleProjectIds.size >= targetVisibleProjects,
      message: `${visibleProjectIds.size}/${eligibleProjectIds.length} selected grounded project(s) are represented by valid evidence-linked visible bullets.`,
      action: "Add project-backed bullets from the strongest selected evidence. Do not write only generic capability themes when grounded representative projects are available."
    },
    {
      label: "Achievement bullets",
      ok: bullets.length > 0 && achievementSignalBullets / Math.max(bullets.length, 1) >= 0.35,
      message: `${achievementSignalBullets}/${bullets.length} bullets show grounded impact or meaningful responsibility scope.`,
      action: "Open Content Audit and rewrite the flagged task-only bullets around business outcome, risk reduction, decision value, or meaningful scope. If no attributable outcome exists, keep the bullet qualitative; do not invent a number."
    },
    {
      label: "Metric discipline",
      ok: diagnosticDataBullets === 0,
      message: diagnosticDataBullets ? `${diagnosticDataBullets} bullets contain benchmark/test or internal activity data presented like achievements.` : "No diagnostic or internal activity data is presented as business impact.",
      action: "Remove score dumps, sample settings, versions, dates, ticket counts, and internal record checks unless they prove an externally meaningful outcome."
    },
    {
      label: "External readability",
      ok: contentAudit.length === 0,
      message: contentAudit.length ? `${contentAudit.length} bullets still read like internal project logs or test notes.` : "Bullets are understandable without internal company context.",
      action: "Translate internal names into capabilities and outcomes; keep benchmark settings and activity counts out of achievement metrics."
    },
    {
      label: "Business impact",
      ok: bullets.length > 0 && businessImpactBullets / Math.max(bullets.length, 1) >= 0.6,
      message: `${businessImpactBullets}/${bullets.length} bullets explain operational value, risk reduction, adoption, or decision impact.`,
      action: "Move from task descriptions to manager-facing outcomes and operational value."
    },
    {
      label: "Sidebar focus",
      ok: sidebarSkillCount <= 32,
      message: `${sidebarSkillCount} sidebar skills listed. Senior CVs should show focused strengths, not a keyword dump.`,
      action: "Keep only the strongest ATS and positioning skills; move low-priority tools out of the sidebar."
    },
    {
      label: "Demonstrated skills",
      ok: unsupportedSidebarSkills.length === 0,
      message: unsupportedSidebarSkills.length ? `${unsupportedSidebarSkills.length} sidebar skills are not backed by selected Grounded Strong/Moderate skill evidence: ${unsupportedSidebarSkills.slice(0, 5).join(", ")}.` : "Every listed sidebar skill is backed by demonstrated skill evidence.",
      action: "Remove unsupported sidebar skills or select grounded evidence that demonstrates actual usage. Do not add a skill only because the JD contains the keyword."
    },
    {
      label: "Evidence risk",
      ok: unsupported === 0,
      message: unsupported ? `${unsupported} bullets still need evidence review.` : "No weak or needs-review bullets detected.",
      action: "Remove unsupported claims or attach stronger source-backed evidence."
    },
    {
      label: "Source linkage",
      ok: invalidSelectionCount === 0
        && (selectedEvidenceCount >= 12 || (recommendationsApplied && selectedEvidenceCount >= 8))
        && linkedBullets >= Math.min(10, bullets.length),
      message: `${selectedEvidenceCount} valid evidence selected; ${linkedBullets}/${bullets.length} bullets carry valid evidence links${invalidSelectionCount ? `; ${invalidSelectionCount} stale selected IDs` : ""}.`,
      action: "Re-apply recommendations, remove stale IDs, and ensure generated bullets include evidenceIds."
    },
    {
      label: "Formal header",
      ok: emailLooksPlain,
      message: emailLooksPlain ? "Email is plain text and ready for ATS / PDF." : "Email must be plain text, not markdown or a mailto link.",
      action: "Replace markdown-style email with a plain address such as christinekao8@gmail.com."
    },
    {
      label: "Career coverage",
      ok: priorRoleCount >= Math.min(2, new Set(eligibleEvidence.map((item) => item.experienceId).filter((id) => id && id !== primaryExperienceId)).size),
      message: `${priorRoleCount} prior roles include visible bullets supported by eligible evidence.`,
      action: "Include prior roles only when grounded evidence exists. Do not create placeholder achievements to force a full career arc."
    },
    {
      label: "Date format",
      ok: malformedPeriods.length === 0,
      message: malformedPeriods.length ? `${malformedPeriods.length} period values need normalization.` : "Work experience periods are normalized.",
      action: "Use formats like Jul 2022 - Present or Oct 2021 - Jul 2022."
    },
    {
      label: "Visible review notes",
      ok: !reviewNoteLeak && !internalEvidenceLanguage && invalidBulletEvidenceIds.length === 0,
      message: reviewNoteLeak || internalEvidenceLanguage ? "Internal review/evidence language is visible in the CV." : invalidBulletEvidenceIds.length ? `${invalidBulletEvidenceIds.length} bullet evidence links are invalid.` : "No internal review-note leakage detected.",
      action: "Keep review notes out of visible CV content and remove invalid evidence links."
    },
    {
      label: "Page balance",
      ok: layoutWarnings.length === 0,
      message: layoutWarnings.length ? layoutWarnings.map((item) => `${item.label}: ${item.value}`).join("; ") : "Two-page layout density is balanced.",
      action: layoutWarnings[0]?.note || "Adjust the CV split, add stronger bullets, or reduce overflow before export."
    }
  ];
}

export function cvLayoutDiagnostics(cv: TailoredCv, sections: CvSections) {
  const workItems = parseWorkSection(sections.workExperience);
  const { firstPageWork, secondPageWork } = splitWorkForCvPages(workItems);
  const firstPageBullets = firstPageWork.flatMap((item) => item.sections.flatMap((section) => section.bullets)).length;
  const secondPageBullets = secondPageWork.flatMap((item) => item.sections.flatMap((section) => section.bullets)).length;
  const totalBullets = firstPageBullets + secondPageBullets;
  const sidebarSkillCount = cv.sidebar.skillGroups.reduce(
    (sum, group) => sum + group.highlightedSkills.length + group.otherSkills.length,
    0
  );
  const summaryWords = cv.summary.trim().split(/\s+/).filter(Boolean).length;
  const checks = [
    {
      label: "Page 1 density",
      value: `${firstPageBullets} bullets`,
      state: firstPageBullets < 9 ? "warn" : firstPageBullets > 14 ? "warn" : "ok",
      note: firstPageBullets < 9 ? "Page 1 may look sparse." : firstPageBullets > 14 ? "Page 1 may feel dense." : "Good first-page weight."
    },
    {
      label: "Page 2 balance",
      value: `${secondPageBullets} bullets`,
      state: secondPageBullets < 4 ? "warn" : secondPageBullets > 12 ? "warn" : "ok",
      note: secondPageBullets < 4 ? "Page 2 may look too empty." : secondPageBullets > 12 ? "Page 2 may overflow." : "Good second-page balance."
    },
    {
      label: "Work depth",
      value: `${totalBullets} total bullets`,
      state: totalBullets < 12 ? "warn" : totalBullets > 22 ? "warn" : "ok",
      note: totalBullets < 12 ? "Add more selected evidence." : totalBullets > 22 ? "Consider cutting lower-value bullets." : "Enough substance for a two-page CV."
    },
    {
      label: "Sidebar load",
      value: `${sidebarSkillCount} skills`,
      state: sidebarSkillCount > 32 ? "warn" : "ok",
      note: sidebarSkillCount > 32 ? "Sidebar may read as keyword stuffing." : "Sidebar is reasonably focused."
    },
    {
      label: "Summary length",
      value: `${summaryWords} words`,
      state: summaryWords < 30 || summaryWords > 70 ? "warn" : "ok",
      note: summaryWords < 30 ? "Summary may be too thin." : summaryWords > 70 ? "Summary may be too long." : "Summary is within a readable range."
    }
  ];
  return checks;
}

export function qualityFixGuide(label: string) {
  const guides: Record<string, { steps: string[]; example?: string }> = {
    "Achievement bullets": {
      steps: [
        "Open Edit Blocks and find the task-only bullets listed in Content Audit.",
        "Keep the action, then add the business outcome, risk reduced, decision enabled, or meaningful scope supported by evidence.",
        "Use a number only when it proves attributable impact. Otherwise use a grounded qualitative outcome."
      ],
      example: "Before: Created a three-page dashboard. After: Built a recruiting dashboard that gave HR leaders a single view of pipeline health and source effectiveness."
    },
    "Metric discipline": {
      steps: [
        "Remove benchmark score lists, sample ratios, version numbers, dates, ticket counts, and configuration counts from achievement parentheses.",
        "Keep the method in one phrase and explain why the evaluation or control mattered.",
        "Move useful technical details to interview notes instead of the visible CV."
      ],
      example: "Before: TOMO 87.6% vs FIN 83.74%; 250 cases. After: Designed a cross-market chatbot evaluation framework combining benchmark questions, automated scoring, and human review to support platform selection."
    },
    "External readability": {
      steps: [
        "Replace company-only project names with the capability an external recruiter understands.",
        "Explain unavoidable product names once, then use the generic capability afterward.",
        "Remove table names, internal codes, and process shorthand."
      ],
      example: "Before: Maintained Trender Buddy v3.19. After: Maintained an internal AI support assistant and its quality-scoring taxonomy across employee-service use cases."
    },
    "Business impact": {
      steps: [
        "For each bullet, answer: what became faster, safer, more reliable, easier to decide, or easier to operate?",
        "Put that value in the same sentence as the action.",
        "Delete low-value implementation detail when it does not strengthen the hiring signal."
      ]
    },
    "Source linkage": {
      steps: [
        "Return to JD Workspace and re-apply the recommended evidence selections.",
        "Generate a fresh CV so every bullet receives valid evidenceIds.",
        "Do not manually invent unsupported bullets just to fill space."
      ]
    },
    "Content depth": {
      steps: [
        "Return to JD Workspace and select more relevant Grounded Core/Supporting evidence if it exists.",
        "Generate a fresh CV version.",
        "If strong evidence is limited, accept a shorter CV. Do not use Archive, Weak, or Needs Review evidence as filler."
      ]
    },
    "Demonstrated skills": {
      steps: [
        "Open Edit Blocks and remove sidebar skills that you cannot explain with a real project example.",
        "Keep skills marked Grounded and Strong/Moderate with actual built, used, integrated, tested, governed, or maintained context.",
        "Do not add a tool only because it appears in the JD; ATS matching must remain truthful."
      ]
    }
  };
  return guides[label] || {
    steps: [
      "Read the failed check and its recommended action.",
      "Open Edit Blocks, make the smallest evidence-grounded correction, then Save edits.",
      "Return to Final Export and confirm the check turns green."
    ]
  };
}
