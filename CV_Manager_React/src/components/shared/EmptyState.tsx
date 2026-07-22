import { Archive } from "lucide-react";

export function EmptyState({ title, action, onClick }: { title: string; action: string; onClick?: () => void }) {
  return (
    <section className="empty-state">
      <Archive size={28} />
      <strong>{title}</strong>
      {onClick && <button className="primary" onClick={onClick}>{action}</button>}
    </section>
  );
}
