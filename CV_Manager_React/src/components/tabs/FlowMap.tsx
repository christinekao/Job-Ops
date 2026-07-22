import { PageHeader } from "../ui/primitives";

export function FlowMap() {
  return (
    <PageHeader title="Workflow Map" subtitle="整個工具的正確資料流：先整理 career source，再進 JD tailoring，最後才產生可編輯 CV version。">
      <WorkflowMapContent />
    </PageHeader>
  );
}

export function WorkflowMapContent() {
  const flows = [
    {
      title: "Career Source Build",
      nodes: [
        ["Career Source Builder", "保存 raw source，使用 Career Backbone prompt 一次建立 source / skill / evidence / STAR。"],
        ["Structured Profile", "以 experience → project 作為穩定 hierarchy。"],
        ["Skill Map", "從 project 推導技術能力，保留 experienceId / projectId。"],
        ["Evidence + STAR", "同一批 evidence 轉成 CV bullets 和面試故事。"]
      ]
    },
    {
      title: "JD Tailoring",
      nodes: [
        ["Application Inbox", "選一個 JD 作為工作上下文。"],
        ["JD Intake", "貼 JD，parse 成 company / role / requirements / keywords。"],
        ["Evidence Matching", "按 work experience / project 階層選 Evidence + STAR。"],
        ["Tailored Prompt", "用 selected evidence + selected STAR 產 recruiter-ready CV JSON。"]
      ]
    },
    {
      title: "Version & Export",
      nodes: [
        ["CV Builder", "貼回 Tailored CV JSON，Apply 後儲存 CV version。"],
        ["Saved CV Version", "每份 CV version 綁定 selected JD，可重新打開。"],
        ["CV Editor / Export", "讀 saved version，block editor 編輯後正式 preview / print PDF。"],
        ["Overview", "看 pipeline health，不當日常輸入頁。"]
      ]
    }
  ];

  return (
    <>
      <section className="flow-board">
        {flows.map((flow, flowIndex) => (
          <div className="flow-lane" key={flow.title}>
            <h3>{flow.title}</h3>
            <div className="flow-nodes">
              {flow.nodes.map(([title, detail], index) => (
                <article className="flow-node" key={title}>
                  <span>{String(flowIndex * 4 + index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="panel flow-note">
        <strong>Prompt boundary</strong>
        <p>第一輪 Career Backbone 可以一次產 Source of Truth / Skill Map / Evidence / STAR。Skill Map、Evidence Bank、STAR Story Bank 的單獨 prompt 集中放在 Prompt Control Center，只在局部修正或補資料時使用。最後 CV 不直接吃 raw source，而是吃 Tailored CV JSON，避免看起來像胡亂拼貼。</p>
      </section>
    </>
  );
}
