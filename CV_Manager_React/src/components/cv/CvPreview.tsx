import type { CareerProfile, JobApplication, TailoredCv } from "../../types";
import {
  type CvSections,
  compactSkillGroups,
  parseCertificationSection,
  parseCvHeaderLines,
  parseEducationSection,
  parseLanguageSection,
  parseSkillSection,
  parseWorkSection,
  sameWorkItem,
  splitWorkForCvPages
} from "./utils";

export function CvPreview({ sections, profile, job }: { sections: CvSections; profile: CareerProfile; job?: JobApplication }) {
  const skillGroups = compactSkillGroups(parseSkillSection(sections.skills));
  const workItems = parseWorkSection(sections.workExperience);
  const { firstPageWork, secondPageWork } = splitWorkForCvPages(workItems);
  const education = parseEducationSection(sections.education);
  const certifications = parseCertificationSection(sections.certifications);
  const languages = parseLanguageSection(sections.languages);
  const headerLines = sections.header.split("\n").map((line) => line.trim()).filter(Boolean);
  const { displayName, roleLine, contacts } = parseCvHeaderLines(headerLines, profile, job);
  const pageTwoContinuesCurrentRole = sameWorkItem(firstPageWork[0], secondPageWork[0]);

  return (
    <article className="cv-preview formal-cv">
      <section className="cv-sheet">
        <CvSidebar
          name={displayName}
          role={roleLine}
          contacts={contacts}
          skills={skillGroups}
          languages={languages}
          education={education}
        />
        <main className="cv-main">
          <div className="cv-banner">{sections.summary}</div>
          <CvWorkExperience items={firstPageWork} />
        </main>
      </section>
      <section className="cv-sheet">
        <CvSidebar
          name={displayName}
          role={roleLine}
          contacts={contacts}
          education={education}
          certifications={certifications}
        />
        <main className="cv-main">
          <CvWorkExperience items={secondPageWork} continuationKey={pageTwoContinuesCurrentRole ? `${secondPageWork[0].role}-${secondPageWork[0].company}` : undefined} />
          {secondPageWork.length === 0 && <CvWorkExperience items={firstPageWork.slice(1)} />}
        </main>
      </section>
    </article>
  );
}

export function CvSidebar({
  name,
  role,
  contacts,
  skills,
  languages,
  certifications,
  education
}: {
  name: string;
  role: string;
  contacts?: string[];
  skills?: { name: string; skills: string[] }[];
  languages?: TailoredCv["sidebar"]["languages"];
  certifications?: string[];
  education?: { degree: string; school: string; period: string }[];
}) {
  return (
    <aside className="cv-sidebar">
      <div className="cv-name-block">
        <h2>{name}</h2>
        <div>{role}</div>
      </div>
      {contacts && contacts.length > 0 && (
        <div className="cv-side-section cv-contact-section">
          <div className="cv-side-label">Contact</div>
          {contacts.map((contact) => <p className="cv-contact-line" key={contact}>{contact}</p>)}
        </div>
      )}
      {languages && languages.length > 0 && (
        <div className="cv-side-section">
          <div className="cv-side-label">Languages</div>
          {languages.map((item) => (
            <div className="cv-lang" key={`${item.name}-${item.level}-${item.note}`}>
              <strong>{item.name}</strong>
              <span>{[item.level, item.note].filter(Boolean).join(" / ")}</span>
            </div>
          ))}
        </div>
      )}
      {skills && skills.length > 0 && (
        <div className="cv-side-section">
          <div className="cv-side-label">Core Skills</div>
          {skills.map((group) => (
            <div className="cv-skill-group" key={group.name}>
              <strong>{group.name}</strong>
              <div>
                {group.skills.map((skill, index) => (
                  <span className={index < 3 ? "cv-skill hi" : "cv-skill"} key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {certifications && certifications.length > 0 && (
        <div className="cv-side-section">
          <div className="cv-side-label">Certifications</div>
          {certifications.map((cert) => <div className="cv-cert" key={cert}>{cert}</div>)}
        </div>
      )}
      {education && education.length > 0 && (
        <div className="cv-side-section">
          <div className="cv-side-label">Education</div>
          {education.map((item) => (
            <div className="cv-edu" key={`${item.school}-${item.degree}`}>
              <strong>{item.school}</strong>
              <span>{item.degree}</span>
              <small>{item.period}</small>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

export function CvWorkExperience({ items, continuationKey }: { items: ReturnType<typeof parseWorkSection>; continuationKey?: string }) {
  if (!items.length) return null;
  return (
    <section className="cv-section">
      <div className="cv-sec-title">Work Experience</div>
      {items.map((item, index) => (
        <div className={continuationKey === `${item.role}-${item.company}` && index === 0 ? "cv-company-block cv-company-continuation" : "cv-company-block"} key={`${item.role}-${item.company}-${index}`}>
          {continuationKey === `${item.role}-${item.company}` && index === 0 && (
            <div className="cv-continuation-label">Continued from page 1</div>
          )}
          {continuationKey === `${item.role}-${item.company}` && index === 0 ? null : (
            <>
              <div className="cv-co-header">
                <span>{item.role}</span>
                <strong>{item.period}</strong>
              </div>
              <div className="cv-co-org">{item.company}</div>
            </>
          )}
          {item.sections.map((section) => (
            <div className="cv-subsec" key={section.title}>
              {section.title && <div className="cv-subsec-title">{section.title}</div>}
              <ul className="cv-bullets">
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
