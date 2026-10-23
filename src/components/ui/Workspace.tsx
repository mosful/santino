import type { ReactNode } from "react";

/** 套餐速算的共用呈現語彙；不持有資料或計價狀態。 */
export function WorkArea({ children, aside, className = "" }: { children: ReactNode; aside: ReactNode; className?: string }) {
  return <div className={`work-area ${className}`}><div className="work-main">{children}</div><aside className="work-aside">{aside}</aside></div>;
}

export function FormSection({ title, description, children, className = "" }: { title?: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`work-surface form-section ${className}`}>
    {(title || description) && <div className="section-intro">{title && <h3>{title}</h3>}{description && <p>{description}</p>}</div>}
    {children}
  </section>;
}

export function SummaryRow({ label, value, muted = false }: { label: ReactNode; value: ReactNode; muted?: boolean }) {
  return <div className={`summary-row ${muted ? "summary-muted" : ""}`}><span>{label}</span><span>{value}</span></div>;
}

export function ResultCard({ title, value, description, children }: { title: string; value: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return <section className="work-surface result-card" aria-label={title}>
    <h3>{title}</h3><p className="result-value">{value}</p>
    {description && <p className="result-description">{description}</p>}
    {children && <div className="result-detail">{children}</div>}
  </section>;
}

export type StatusSummaryItem = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "brand" | "success" | "warning" | "danger";
};

/** 核心工作區的情境摘要：讓狀態、異常與下一步固定出現在同一條閱讀路徑。 */
export function StatusSummary({
  title,
  description,
  items,
  actions,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  items: StatusSummaryItem[];
  actions?: ReactNode;
  className?: string;
}) {
  return <section className={`work-surface status-summary ${className}`}>
    <div className="status-summary-heading">
      <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {actions && <div className="status-summary-actions">{actions}</div>}
    </div>
    <dl className="status-summary-grid">
      {items.map((item, index) => <div key={index} className="status-summary-item" data-tone={item.tone ?? "default"}>
        <dt>{item.label}</dt>
        <dd>{item.value}</dd>
        {item.detail && <span>{item.detail}</span>}
      </div>)}
    </dl>
  </section>;
}

/** 長表單與流程頁的動作收尾區；由呼叫端決定哪些按鈕是主要或次要動作。 */
export function ActionDock({ title, description, children }: { title: ReactNode; description?: ReactNode; children: ReactNode }) {
  return <section className="action-dock" data-no-print>
    <div className="action-dock-copy"><strong>{title}</strong>{description && <span>{description}</span>}</div>
    <div className="action-dock-actions">{children}</div>
  </section>;
}
