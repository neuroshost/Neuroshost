"use client";

import { useMemo, useState } from "react";

type Props = {
  headerDefault?: string;
  footerDefault?: string;
  cssDefault?: string;
};

const sampleBody = `
<div class="mail-container">
  <h1>Bonjour {{user.name}} 👋</h1>
  <p>Votre message ou contenu d'e-mail sera affiché ici.</p>
  <p><a class="mail-button" href="{{company.url}}">Accéder à mon espace</a></p>
</div>`;

const variables = [
  "{{company.name}}",
  "{{company.url}}",
  "{{company.logo}}",
  "{{user.name}}",
  "{{user.email}}",
  "{{order.id}}",
  "{{order.total}}",
  "{{order.status}}",
  "{{invoice.number}}",
  "{{invoice.total}}",
  "{{invoice.due_at}}",
  "{{service.name}}",
  "{{service.status}}",
  "{{ticket.id}}",
  "{{ticket.subject}}",
];

export default function MailCodeEditor({ headerDefault = "", footerDefault = "", cssDefault = "" }: Props) {
  const [header, setHeader] = useState(headerDefault);
  const [footer, setFooter] = useState(footerDefault);
  const [css, setCss] = useState(cssDefault);
  const [tab, setTab] = useState<"header" | "footer" | "css">("header");
  const [preview, setPreview] = useState(false);

  const previewHtml = useMemo(() => `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head>
<body>${header}${sampleBody}${footer}</body>
</html>`, [header, footer, css]);

  const copyVariable = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch {}
  };

  return (
    <div className="mail-code-editor">
      <div className="mail-editor-toolbar">
        <div className="mail-editor-tabs">
          <button type="button" className={tab === "header" ? "active" : ""} onClick={() => setTab("header")}>Header</button>
          <button type="button" className={tab === "footer" ? "active" : ""} onClick={() => setTab("footer")}>Footer</button>
          <button type="button" className={tab === "css" ? "active" : ""} onClick={() => setTab("css")}>Mail CSS</button>
        </div>
        <button type="button" className={`mail-preview-toggle ${preview ? "active" : ""}`} onClick={() => setPreview(v => !v)}>
          {preview ? "Code" : "Aperçu"}
        </button>
      </div>

      {!preview ? (
        <>
          {tab === "header" && <textarea className="input mail-code-textarea" name="mail_header" value={header} onChange={e => setHeader(e.target.value)} placeholder="<!-- HTML du header de vos e-mails -->" spellCheck={false} />}
          {tab === "footer" && <textarea className="input mail-code-textarea" name="mail_footer" value={footer} onChange={e => setFooter(e.target.value)} placeholder="<!-- HTML du footer de vos e-mails -->" spellCheck={false} />}
          {tab === "css" && <textarea className="input mail-code-textarea" name="mail_css" value={css} onChange={e => setCss(e.target.value)} placeholder="/* CSS global de vos e-mails */" spellCheck={false} />}
        </>
      ) : (
        <iframe className="mail-preview-frame" title="Aperçu de l'e-mail" srcDoc={previewHtml} sandbox="" />
      )}

      <div className="mail-editor-help">
        <div>
          <strong>Variables disponibles</strong>
          <span>Utilisez-les dans le Header, le Footer ou vos templates d'e-mails.</span>
        </div>
        <div className="mail-variable-list">
          {variables.map(variable => (
            <button key={variable} type="button" className="mail-variable" onClick={() => copyVariable(variable)} title="Copier la variable">
              {variable}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
