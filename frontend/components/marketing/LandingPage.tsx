import Link from "next/link";
import { ChatFrame, DashboardFrame, DocsFrame, WorklogFrame } from "@/components/marketing/ProductShots";

const FAQ = [
  [
    "Does Opentip write to my repo?",
    "No. Opentip never commits to your repo and never opens pull requests. It reads your code and hosts the docs itself.",
  ],
  [
    "How do the docs stay up to date?",
    "A GitHub App runs on every push. Each push updates only the pages it affects, and pushes that don't touch documented code are skipped.",
  ],
  [
    "Can I review changes before they go live?",
    "Yes, on every plan. Approval before publishing is optional. Turn it on and each update waits for you.",
  ],
  [
    "What happens to my chat edits when I push?",
    "Your edits stay in place when later pushes update the docs.",
  ],
  [
    "Where are my docs hosted?",
    "Every site goes live at name.opentip.tech. On Pro and Team, connect a custom domain.",
  ],
  [
    "What are llms.txt and MCP?",
    "Every site publishes an llms.txt file, on every plan. MCP connects AI coding tools to your docs. Pro and Team include an MCP server. Team gets a private MCP server with a key.",
  ],
  [
    "How do tips work?",
    "Add a tip button to your docs and Worklog pages. Supporters can tip in ETH or USDC. It's free on every plan, fees stay the same as today, and you can turn it off for any site.",
  ],
  [
    "How do I get into the beta?",
    "Apply for the beta. It runs for one to two months. We'll email you access. No charge during the beta.",
  ],
] as const;

export function LandingPage() {
  return (
    <>
      <div className="mkt-hero">
        <div className="mkt-w">
          <span className="mkt-eyebrow">
            <b />
            Now in beta
          </span>
          <h1>Docs that write themselves from your code.</h1>
          <p className="mkt-sub">
            Opentip Copilot reads your whole codebase, writes a docs site and a Worklog, and updates the affected pages every time you push.
          </p>
          <div className="mkt-ctas">
            <Link className="mkt-btn mkt-pri" href="/beta">
              Apply for the beta
            </Link>
            <a className="mkt-btn" href="#how">
              See how it works
            </a>
          </div>
          <div className="mkt-micro">Free plan available. No charge during the beta. Access is sent by email.</div>
          <div className="mkt-tipline">
            Looking to tip a repo? <Link href="/tip">Continue to Opentip Tip →</Link>
          </div>
          <div className="mkt-stage">
            <div className="mkt-s1">
              <DashboardFrame />
            </div>
            <div className="mkt-s2">
              <DocsFrame />
            </div>
          </div>
        </div>
      </div>

      <section id="how">
        <div className="mkt-w">
          <div className="mkt-label">How it works</div>
          <h2>Three steps from repo to docs site</h2>
          <div className="mkt-steps">
            <div className="mkt-card">
              <span className="mkt-num">01</span>
              <h3>Install the GitHub App</h3>
              <p>Pick the repos you want documented. Opentip reads them and never writes to them.</p>
            </div>
            <div className="mkt-card">
              <span className="mkt-num">02</span>
              <h3>Copilot writes your docs</h3>
              <p>Opentip Copilot reads the whole codebase first, then writes a docs site and a Worklog.</p>
            </div>
            <div className="mkt-card">
              <span className="mkt-num">03</span>
              <h3>Push and they stay current</h3>
              <p>Every push triggers an update. Copilot rewrites only the pages your change affects.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features">
        <div className="mkt-w mkt-split">
          <div className="mkt-txt">
            <div className="mkt-label">Opentip Copilot</div>
            <h2>It reads the code before it writes a word</h2>
            <p>Copilot goes through your entire codebase before it starts. Then it writes a full docs site with tables, code tabs, diagrams, callouts and step-by-step guides.</p>
          </div>
          <div className="mkt-vis">
            <DocsFrame />
          </div>
        </div>
      </section>

      <section>
        <div className="mkt-w mkt-split mkt-rev">
          <div className="mkt-txt">
            <div className="mkt-label">Always current</div>
            <h2>Push code. The docs follow.</h2>
            <p>The Opentip GitHub App runs on every push. Each push updates only the pages it affects, and pushes that don&apos;t touch documented code are skipped.</p>
            <ul className="mkt-ck">
              <li>Each push updates only the pages it affects</li>
              <li>Pushes that don&apos;t touch documented code are skipped</li>
              <li>Turn on approval if you want to review each update before it goes live</li>
            </ul>
          </div>
          <div className="mkt-vis">
            <DashboardFrame />
          </div>
        </div>
      </section>

      <section>
        <div className="mkt-w mkt-split">
          <div className="mkt-txt">
            <div className="mkt-label">Copilot chat</div>
            <h2>Ask for a change. Preview it. Approve it.</h2>
            <p>Tell Copilot what to change in the dashboard chat. You see a preview before anything goes live. Your edits stay in place when later pushes update the docs.</p>
            <div className="mkt-prompt">› Add a quickstart for the CLI above the install page.</div>
          </div>
          <div className="mkt-vis">
            <ChatFrame />
          </div>
        </div>
      </section>

      <section>
        <div className="mkt-w mkt-split mkt-rev">
          <div className="mkt-txt">
            <div className="mkt-label">Worklog</div>
            <h2>A changelog you don&apos;t have to write</h2>
            <p>Copilot turns your commits into a Worklog, a public page that shows what shipped and links each entry to its commits.</p>
          </div>
          <div className="mkt-vis">
            <WorklogFrame />
          </div>
        </div>
      </section>

      <section>
        <div className="mkt-w">
          <div className="mkt-label">Hosting</div>
          <h2>Hosted for you, on your name or your domain</h2>
          <p className="mkt-lead">
            Every site goes live at <span className="mkt-mono">name.opentip.tech</span>. On Pro and Team, connect a custom domain and use every theme, including your own.
          </p>
          <div className="mkt-chips">
            <span className="mkt-chip">Ledger</span>
            <span className="mkt-chip">Midnight</span>
            <span className="mkt-chip">Paper</span>
            <span className="mkt-chip">Terminal</span>
            <span className="mkt-chip">Minimal</span>
            <span className="mkt-chip">Custom</span>
          </div>
          <p className="mkt-micro mkt-left">Free includes a selection of themes. Custom domains and all themes are on Pro and Team.</p>
        </div>
      </section>

      <section>
        <div className="mkt-w">
          <div className="mkt-label">AI-ready</div>
          <h2>Docs that people and AI tools can both read</h2>
          <div className="mkt-grid3">
            <div className="mkt-card">
              <div className="mkt-ico">txt</div>
              <h3>llms.txt</h3>
              <p>Every site publishes an llms.txt file, on every plan.</p>
            </div>
            <div className="mkt-card">
              <div className="mkt-ico">mcp</div>
              <h3>MCP server</h3>
              <p>Connect AI coding tools to your docs over MCP. Pro and Team. Team gets a private MCP server with a key.</p>
            </div>
            <div className="mkt-card">
              <div className="mkt-ico">?</div>
              <h3>Ask AI</h3>
              <p>Visitors can ask questions on your public docs site and get answers from your docs. Paid plans.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mkt-w mkt-split">
          <div className="mkt-txt">
            <div className="mkt-label">Tips</div>
            <h2>Let readers tip you</h2>
            <p>Add a tip button to your docs and Worklog pages. Supporters can tip in ETH or USDC. It&apos;s free on every plan, fees stay the same as today, and you can turn it off for any site.</p>
          </div>
          <div className="mkt-tipcard" aria-hidden="true">
            <div className="mkt-tiphead">
              <b>Tip button</b>
              <span className="mkt-tog" />
            </div>
            <p>Support this project</p>
            <div className="mkt-chips">
              <span className="mkt-chip">ETH</span>
              <span className="mkt-chip">USDC</span>
            </div>
            <span className="mkt-btn mkt-pri mkt-block">Tip</span>
          </div>
        </div>
      </section>

      <div className="mkt-dark">
        <section>
          <div className="mkt-w mkt-center">
            <div className="mkt-label">Your repo stays yours</div>
            <h2>Opentip reads your code. It never writes to it.</h2>
            <p className="mkt-lead mkt-center-copy">
              Opentip never commits to your repo and never opens pull requests. Your docs live on Opentip&apos;s hosting, and you decide whether updates publish on their own or wait for your approval.
            </p>
            <div className="mkt-flow">
              <div className="mkt-box">
                <div className="mkt-mono mkt-dim">github.com</div>
                <b>your-repo</b>
              </div>
              <div className="mkt-arrow">read only →</div>
              <div className="mkt-box">
                <div className="mkt-mono mkt-dim">name.opentip.tech</div>
                <b>Docs site</b>
              </div>
            </div>
            <div className="mkt-assures">
              <span>✓ No commits to your repo</span>
              <span>✓ No pull requests</span>
              <span>✓ Optional approval before anything publishes, on every plan</span>
            </div>
          </div>
        </section>
      </div>

      <section id="pricing">
        <div className="mkt-w">
          <div className="mkt-label">Pricing</div>
          <h2>Three plans. Pricing comes at launch.</h2>
          <p className="mkt-lead">Everything is free during the beta. Pricing comes at launch.</p>
          <div className="mkt-table-wrap">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>
                    Free
                    <small>For trying Opentip on one project.</small>
                  </th>
                  <th>
                    Pro
                    <small>For maintainers who want their own domain and AI features.</small>
                  </th>
                  <th>
                    Team
                    <small>For teams that share docs across repos and people.</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Docs site and Worklog by Copilot</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Updates on every push</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Copilot chat edits</td>
                  <td>Limited</td>
                  <td>More each month</td>
                  <td>The most each month</td>
                </tr>
                <tr>
                  <td>Approval before publishing</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Hosting</td>
                  <td>name.opentip.tech</td>
                  <td>name.opentip.tech or a custom domain</td>
                  <td>name.opentip.tech or a custom domain</td>
                </tr>
                <tr>
                  <td>Themes</td>
                  <td>Selected themes</td>
                  <td>All themes, plus custom</td>
                  <td>All themes, plus custom</td>
                </tr>
                <tr>
                  <td>llms.txt</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>Ask AI on public docs</td>
                  <td>No</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td>MCP server</td>
                  <td>No</td>
                  <td>Yes</td>
                  <td>Yes, private with a key</td>
                </tr>
                <tr>
                  <td>Seats</td>
                  <td>1</td>
                  <td>1</td>
                  <td>Up to 10</td>
                </tr>
                <tr>
                  <td>Tip button (ETH, USDC)</td>
                  <td>Yes</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td />
                  <td>
                    <Link className="mkt-btn" href="/beta">Apply for the beta</Link>
                  </td>
                  <td>
                    <Link className="mkt-btn mkt-pri" href="/beta">Apply for the beta</Link>
                  </td>
                  <td>
                    <Link className="mkt-btn" href="/beta">Apply for the beta</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mkt-micro mkt-left">Pricing comes at launch. You won&apos;t be charged during the beta.</p>
        </div>
      </section>

      <section id="faq">
        <div className="mkt-w mkt-faq">
          <div className="mkt-label">FAQ</div>
          <h2>Questions</h2>
          {FAQ.map(([question, answer], index) => (
            <details key={question} open={index < 3}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mkt-cta">
        <div className="mkt-w">
          <h2>Help shape Opentip</h2>
          <p className="mkt-sub">
            The beta runs for one to two months. Apply, and we&apos;ll email you access. Connect a repo and tell us what works and what doesn&apos;t.
          </p>
          <Link className="mkt-btn mkt-pri" href="/beta">
            Apply for the beta
          </Link>
          <div className="mkt-micro">No charge during the beta. Access is sent by email.</div>
        </div>
      </section>
    </>
  );
}
