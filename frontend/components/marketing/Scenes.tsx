"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function Scene({
  className,
  children,
  eager = false,
}: {
  className: string;
  children: ReactNode;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(eager);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(reduce.matches);
    sync();
    reduce.addEventListener("change", sync);
    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => setOn(entry.isIntersecting),
      { threshold: 0.35 },
    );
    if (node) observer.observe(node);
    return () => {
      reduce.removeEventListener("change", sync);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`scene ${className}${on ? " is-on" : ""}${still ? " is-still" : ""}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function Cursor() {
  return (
    <span className="scene-cursor">
      <svg viewBox="0 0 16 16">
        <path d="M2.2 1.4l4.7 12.1 1.9-4.8 4.9-1.1L2.2 1.4z" />
      </svg>
    </span>
  );
}

export function HeroScene() {
  return (
    <Scene className="scene-hero" eager>
      <div className="scene-card scene-term">
        <div className="scene-top">
          <span className="scene-dots"><i /><i /><i /></span>
          <span>acme/widget</span>
        </div>
        <p className="scene-cmd">
          <span className="scene-prompt">$</span>
          <span className="scene-type">git push origin main</span>
          <span className="scene-caret" />
        </p>
        <p className="scene-out scene-out-a">Enumerating objects: 12, done.</p>
        <p className="scene-out scene-out-b">main → a1b2c3d</p>
      </div>
      <div className="scene-card scene-doc">
        <div className="scene-top">
          <b>acme/widget</b>
          <span>Docs</span>
        </div>
        <h3>Install</h3>
        <p>Add the package, then use the CLI.</p>
        <pre>npm i @acme/widget</pre>
        <p className="scene-hl">Updated from a1b2c3d. The CLI is the recommended start.</p>
      </div>
    </Scene>
  );
}

export function ReadScene() {
  return (
    <Scene className="scene-read">
      <div className="scene-card scene-read-card">
        <div className="scene-top"><b>acme/widget</b><span>Reading</span></div>
        <ul className="scene-tree">
          <li>src/cli.ts</li>
          <li>src/widget.ts</li>
          <li>src/install.ts</li>
          <li>src/config.ts</li>
        </ul>
        <div className="scene-outline">
          <span>Outline</span>
          <ol>
            <li>Install</li>
            <li>Quickstart</li>
            <li>Configuration</li>
          </ol>
        </div>
      </div>
    </Scene>
  );
}

export function PushScene() {
  return (
    <Scene className="scene-push">
      <div className="scene-card">
        <div className="scene-commit">
          <b>a1b2c3d</b>
          <span>Add the CLI quickstart</span>
        </div>
        <ul className="scene-pages">
          <li><span>Install</span><em>Current</em></li>
          <li className="scene-hit"><span>Quickstart</span><em>Updated</em></li>
          <li><span>Configuration</span><em>Current</em></li>
          <li><span>API</span><em>Current</em></li>
        </ul>
      </div>
    </Scene>
  );
}

export function ChatScene() {
  return (
    <Scene className="scene-chat">
      <div className="scene-card">
        <div className="scene-top"><b>Copilot</b><span>acme/widget</span></div>
        <div className="scene-input">
          <p>
            <span className="scene-line scene-line-a">Add a quickstart for the CLI</span>
            <span className="scene-line scene-line-b">above the install page</span>
          </p>
          <span className="scene-send">Send</span>
        </div>
        <div className="scene-preview">
          <span>Preview</span>
          <strong>Quickstart</strong>
          <p>Install the CLI, then run widget init.</p>
          <span className="scene-approve">Approve</span>
        </div>
        <div className="scene-toast">Published</div>
        <Cursor />
      </div>
    </Scene>
  );
}

export function WorklogScene() {
  return (
    <Scene className="scene-log">
      <div className="scene-card">
        <ul className="scene-shas">
          <li><b>a1b2c3d</b> Add the CLI quickstart</li>
          <li><b>b4c5d6e</b> Document install flags</li>
          <li><b>c7d8e9f</b> Fix the example command</li>
        </ul>
        <div className="scene-entry">
          <span>Worklog</span>
          <strong>Quickstart for the CLI</strong>
          <p>
            <span>a1b2c3d</span>
            <span>b4c5d6e</span>
            <span>c7d8e9f</span>
          </p>
        </div>
      </div>
    </Scene>
  );
}

const THEMES = ["Ledger", "Minimal", "Midnight", "Paper"] as const;

export function HostingScene() {
  return (
    <Scene className="scene-host">
      <div className="scene-card">
        <div className="scene-chips">
          {THEMES.map((theme) => (
            <span key={theme} className={`scene-chip scene-chip-${theme.toLowerCase()}`}>{theme}</span>
          ))}
        </div>
        <div className="scene-themes">
          <div className="scene-theme scene-theme-ledger">
            <b>Install</b>
            <p>npm i @acme/widget</p>
          </div>
          <div className="scene-theme scene-theme-minimal">
            <b>Install</b>
            <p>npm i @acme/widget</p>
          </div>
          <div className="scene-theme scene-theme-midnight">
            <b>Install</b>
            <p>npm i @acme/widget</p>
          </div>
          <div className="scene-theme scene-theme-paper">
            <b>Install</b>
            <p>npm i @acme/widget</p>
          </div>
        </div>
        <div className="scene-domain">
          <span className="scene-domain-a">acme.opentip.tech</span>
          <span className="scene-domain-b">docs.yourdomain.com</span>
        </div>
      </div>
    </Scene>
  );
}

export function AiScene() {
  return (
    <Scene className="scene-ai">
      <div className="scene-card">
        <p className="scene-req scene-req-a"><span>GET</span> /llms.txt</p>
        <p className="scene-req scene-req-b"><span>MCP</span> How do I install the CLI?</p>
        <div className="scene-answer">
          <span className="scene-line scene-line-a">npm i @acme/widget</span>
          <span className="scene-line scene-line-b">then run widget init.</span>
        </div>
      </div>
    </Scene>
  );
}

export function TipsScene() {
  return (
    <Scene className="scene-tips">
      <div className="scene-card">
        <div className="scene-top">
          <b>acme/widget</b>
          <span className="scene-tog" />
        </div>
        <p className="scene-support">Support this project</p>
        <div className="scene-chips">
          <span className="scene-chip is-pick">ETH</span>
          <span className="scene-chip">USDC</span>
        </div>
        <span className="scene-tipbtn">
          <span className="scene-tip-label">Tip</span>
          <span className="scene-tipped-label">Tipped</span>
        </span>
        <Cursor />
      </div>
    </Scene>
  );
}
