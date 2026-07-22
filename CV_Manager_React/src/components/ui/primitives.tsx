import { Archive, ClipboardCopy } from "lucide-react";
import React, { useState, useId } from "react";
import type { ParsePreview } from "../../types";

export function PageHeader({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {action}
      </header>
      {children}
    </div>
  );
}

export function EmptyState({ title, action, onClick }: { title: string; action: string; onClick?: () => void }) {
  return (
    <section className="empty-state">
      <Archive size={28} />
      <strong>{title}</strong>
      {onClick && <button className="primary" onClick={onClick}>{action}</button>}
    </section>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  displayValue
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  displayValue?: string;
}) {
  const fieldId = useId();
  const [focused, setFocused] = useState(false);
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input
        id={fieldId}
        value={focused ? value : displayValue ?? value}
        title={value}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
      />
      <small className="field-helper">{helperText || "\u00a0"}</small>
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  readOnly,
  action,
  placeholder,
  helperText
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  readOnly?: boolean;
  action?: React.ReactNode;
  placeholder?: string;
  helperText?: string;
}) {
  const textareaId = useId();
  function syncValue(element: HTMLTextAreaElement) {
    onChange(element.value);
  }

  return (
    <div className="field">
      {action ? (
        <div className="manual-label-row">
          <label htmlFor={textareaId}>{label}</label>
          {action}
        </div>
      ) : (
        <label htmlFor={textareaId}>{label}</label>
      )}
      <textarea
        id={textareaId}
        aria-label={label}
        value={value}
        title={value}
        placeholder={placeholder}
        rows={rows}
        readOnly={readOnly}
        onChange={(event) => syncValue(event.currentTarget)}
        onInput={(event) => syncValue(event.currentTarget)}
        onPaste={(event) => {
          const element = event.currentTarget;
          window.setTimeout(() => syncValue(element), 0);
        }}
      />
      <small className="field-helper">{helperText || "\u00a0"}</small>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function FocusSection({ step, title, detail, children }: { step?: string; title: string; detail: string; children: React.ReactNode }) {
  return (
    <section className={step ? "focus-section" : "focus-section unnumbered"}>
      <div className="focus-section-head">
        {step && <span>{step}</span>}
        <div>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function WorkflowStepHeader({ step, title, detail }: { step: string; title: string; detail: string }) {
  return (
    <div className="workflow-step-head">
      <span>{step}</span>
      <div>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}

export function MiniList({ title, items }: { title: string; items?: string[] }) {
  const visible = (items || []).filter(Boolean).slice(0, 4);
  if (!visible.length) return null;
  return (
    <div className="mini-list">
      <span>{title}</span>
      <ul>
        {visible.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

export function ParseAction({ value, onParse }: { value: string; onParse: () => void }) {
  const ready = Boolean(value.trim());
  const count = value.trim().length;
  return (
    <div className="parse-action">
      <span>{ready ? `${count.toLocaleString()} chars ready` : "Paste GPT JSON below first"}</span>
      <button className="primary" disabled={!ready} onClick={onParse}>Parse JSON</button>
    </div>
  );
}

export function CopyButton({ text, label, disabled = false }: { text: string; label: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  function showCopied() {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function copy() {
    if (disabled) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
      showCopied();
    } catch {
      showCopied();
    }
  }

  return (
    <button className={copied ? "secondary copied" : "secondary"} disabled={disabled} onClick={copy}>
      <ClipboardCopy size={15} /> {copied ? "Copied" : label}
    </button>
  );
}

export function ParsePreviewCard<T>({
  preview,
  onApply,
  applyLabel = "Apply / Save",
  applying = false
}: {
  preview: ParsePreview<T>;
  onApply: () => void | Promise<void>;
  applyLabel?: string;
  applying?: boolean;
}) {
  if (!preview.raw && !preview.error && !preview.parsed) return null;
  return (
    <section className={preview.error ? "panel parse-card error" : preview.warning ? "panel parse-card warning" : "panel parse-card"}>
      <div className="panel-head">
        <h3>Parse Preview</h3>
        <button className="primary" disabled={!preview.parsed || applying} onClick={() => void onApply()}>
          {applying ? "Applying…" : applyLabel}
        </button>
      </div>
      {preview.error ? (
        <p className="error-text" role="alert">JSON cannot be parsed: {preview.error}</p>
      ) : (
        <>
          {preview.warning && <p className="parse-warning">{preview.warning}</p>}
          <pre>{JSON.stringify(preview.parsed, null, 2)}</pre>
        </>
      )}
    </section>
  );
}

export function ManualAiPanel({
  prompt,
  inputLabel,
  inputValue,
  onInputChange,
  readOnlyInput,
  pasteLabel,
  pasteValue,
  onPasteChange,
  onParse,
  promptBlockedReason
}: {
  prompt: string;
  inputLabel: string;
  inputValue: string;
  onInputChange?: (value: string) => void;
  readOnlyInput?: boolean;
  pasteLabel: string;
  pasteValue: string;
  onPasteChange: (value: string) => void;
  onParse: () => void;
  promptBlockedReason?: string;
}) {
  return (
    <section className="manual-ai panel">
      <div className="manual-row">
        <Textarea label={inputLabel} value={inputValue} onChange={onInputChange || (() => {})} rows={7} readOnly={readOnlyInput} />
        <label className="field prompt-box">
          <div className="manual-label-row">
            <span>Copy Prompt</span>
            <CopyButton text={prompt} label="Copy Prompt" disabled={Boolean(promptBlockedReason) || !prompt} />
          </div>
          <textarea readOnly value={prompt} rows={7} />
        </label>
      </div>
      {promptBlockedReason && <div className="fit-warning"><strong>Copy Prompt unavailable</strong><p>{promptBlockedReason}</p></div>}
      <div className="manual-row">
        <Textarea
          label={pasteLabel}
          value={pasteValue}
          onChange={onPasteChange}
          rows={7}
          action={<ParseAction value={pasteValue} onParse={onParse} />}
        />
      </div>
    </section>
  );
}

export function PasteBackPanel({
  title,
  detail,
  prompt,
  pasteLabel,
  pasteValue,
  onPasteChange,
  onParse
}: {
  title: string;
  detail: string;
  prompt: string;
  pasteLabel: string;
  pasteValue: string;
  onPasteChange: (value: string) => void;
  onParse: () => void;
}) {
  return (
    <section className="paste-back-panel panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          <p>{detail}</p>
        </div>
        <CopyButton text={prompt} label="Copy Prompt" />
      </div>
      <Textarea
        label={pasteLabel}
        value={pasteValue}
        onChange={onPasteChange}
        rows={7}
        action={<ParseAction value={pasteValue} onParse={onParse} />}
      />
    </section>
  );
}
