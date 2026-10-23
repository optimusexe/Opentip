import type { ReactNode } from "react";

function DashboardShot() {
  return (
    <div className="mkt-shot mkt-dash">
      <aside className="mkt-dash-side">
        <div className="mkt-dash-brand"><i />Opentip</div>
        <span className="mkt-dash-link is-on">Projects</span>
        <span className="mkt-dash-link">Pages</span>
        <span className="mkt-dash-link">Worklog</span>
        <span className="mkt-dash-link">Settings</span>
      </aside>
      <div className="mkt-dash-main">
        <div className="mkt-dash-top">
          <strong>Projects</strong>
          <span className="mkt-pill">3 live</span>
        </div>
        <div className="mkt-stats">
          <div><b>3</b><span>Projects</span></div>
          <div><b>86</b><span>Pages</span></div>
          <div><b>41</b><span>Updated</span></div>
        </div>
        <div className="mkt-activity">
          <span className="mkt-kicker">Recent activity</span>
          <div><i />Copilot updated Installation</div>
          <div><i />Copilot updated Quickstart</div>
          <div><i />Worklog published 4 entries</div>
        </div>
      </div>
    </div>
  );
}

function DocsShot() {
  return (
    <div className="mkt-shot mkt-docs">
      <div className="mkt-docs-bar">
        <span className="mkt-mono">name.opentip.tech</span>
        <span>Installation</span>
      </div>
      <h3>Installation</h3>
      <p>Add the GitHub App, then push. Copilot writes the pages.</p>
      <pre className="mkt-code">{`npm i @opentip/cli
opentip link`}</pre>
      <div className="mkt-options">
        <span>Options</span>
        <div><b>Theme</b><em>Ledger</em></div>
        <div><b>Approval</b><em>On</em></div>
      </div>
    </div>
  );
}

function ChatShot() {
  return (
    <div className="mkt-shot mkt-chat">
      <div className="mkt-docs-bar">
        <span>Copilot</span>
        <span className="mkt-pill">Preview</span>
      </div>
      <div className="mkt-bubble">Add a quickstart for the CLI above the install page.</div>
      <div className="mkt-preview">
        <span className="mkt-kicker">Preview</span>
        <strong>Quickstart</strong>
        <p>Install the CLI, link the repo, and push. The docs update on that push.</p>
      </div>
    </div>
  );
}

function WorklogShot() {
  return (
    <div className="mkt-shot mkt-log">
      <div className="mkt-docs-bar">
        <span className="mkt-mono">name.opentip.tech</span>
        <span>Worklog</span>
      </div>
      <h3>Worklog</h3>
      <div className="mkt-log-row"><b>Shipped the CLI quickstart</b><span className="mkt-mono">a1c4e2</span></div>
      <div className="mkt-log-row"><b>Rewrote the install page</b><span className="mkt-mono">9b10aa</span></div>
      <div className="mkt-log-row"><b>Batched three small pushes</b><span className="mkt-mono">44de18</span></div>
    </div>
  );
}

export function ShotFrame({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="mkt-tilt" role="img" aria-label={label}>
      <div className="mkt-shot-frame">{children}</div>
    </div>
  );
}

export function DashboardFrame() {
  return (
    <ShotFrame label="Opentip projects dashboard">
      <DashboardShot />
    </ShotFrame>
  );
}

export function DocsFrame() {
  return (
    <ShotFrame label="Hosted docs installation page">
      <DocsShot />
    </ShotFrame>
  );
}

export function ChatFrame() {
  return (
    <ShotFrame label="Copilot chat with a docs preview">
      <ChatShot />
    </ShotFrame>
  );
}

export function WorklogFrame() {
  return (
    <ShotFrame label="Worklog of shipped changes">
      <WorklogShot />
    </ShotFrame>
  );
}
