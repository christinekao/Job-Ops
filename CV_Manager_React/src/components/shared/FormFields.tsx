import React from "react";
import { useId } from "react";

export function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const fieldId = useId();
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 5,
  readOnly,
  action
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  readOnly?: boolean;
  action?: React.ReactNode;
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
        rows={rows}
        readOnly={readOnly}
        onChange={(event) => syncValue(event.currentTarget)}
        onInput={(event) => syncValue(event.currentTarget)}
        onPaste={(event) => {
          const element = event.currentTarget;
          window.setTimeout(() => syncValue(element), 0);
        }}
      />
    </div>
  );
}
