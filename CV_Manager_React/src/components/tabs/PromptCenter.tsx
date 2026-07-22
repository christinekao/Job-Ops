import type { AppData } from "../../types";
import {
  buildDomainKnowledgePrompt,
  buildEvidencePrompt,
  buildFitReviewPrompt,
  buildSkillInferencePrompt,
  buildSourceParsingPrompt,
  buildStarPrompt,
  buildTailoredCVPrompt
} from "../../promptBuilders";
import { CopyButton, PageHeader } from "../ui/primitives";

export function PromptCenter({ data, selectedJobId }: { data: AppData; selectedJobId: string }) {
  const prompts = [
    ["Source Parsing", buildSourceParsingPrompt(data)],
    ["Skill Map", buildSkillInferencePrompt(data)],
    ["Domain Knowledge", buildDomainKnowledgePrompt(data)],
    ["Evidence Cards", buildEvidencePrompt(data)],
    ["STAR Stories", buildStarPrompt(data)],
    ["Fit Review", buildFitReviewPrompt(data, selectedJobId)],
    ["Tailored CV", buildTailoredCVPrompt(data, selectedJobId)]
  ];

  return (
    <PageHeader title="Prompt Control Center" subtitle="集中管理 manual AI workflow。沒有 API，只有 copy prompt 和 paste-back。">
      <div className="prompt-grid">
        {prompts.map(([title, prompt]) => (
          <section className="panel prompt-card" key={title}>
            <div className="panel-head">
              <h3>{title}</h3>
              <CopyButton text={prompt} label="Copy" />
            </div>
            <textarea readOnly value={prompt} />
          </section>
        ))}
      </div>
    </PageHeader>
  );
}
