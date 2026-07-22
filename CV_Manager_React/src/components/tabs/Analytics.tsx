import type { AppData } from "../../types";
import { Metric, PageHeader } from "../ui/primitives";

export function Analytics({ data }: { data: AppData }) {
  const active = data.jobs.filter((job) => job.status !== "Archived").length;
  const drafted = data.jobs.filter((job) => job.status === "CV Drafted" || job.status === "Reviewed").length;
  const applied = data.jobs.filter((job) => job.status === "Applied").length;

  return (
    <PageHeader title="Overview / Analytics" subtitle="週期復盤，不當每日入口。">
      <div className="metric-row">
        <Metric label="Active JD" value={active} />
        <Metric label="CV Drafted" value={drafted} />
        <Metric label="Applied" value={applied} />
        <Metric label="Evidence Cards" value={data.evidenceCards.length} />
      </div>
      <section className="panel">
        <h3>Pipeline notes</h3>
        <p>目前版本先追蹤 workflow health：有多少 JD、有多少已選 evidence、有多少 CV version。之後可再加 rejection reasons / interview rate。</p>
      </section>
    </PageHeader>
  );
}
