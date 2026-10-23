import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";

const description = "Draft terms for the Opentip docs beta, GitHub access, Worklog, and optional tips.";

export const metadata: Metadata = {
  title: { absolute: "Terms of Service | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/terms" },
  openGraph: {
    title: "Terms of Service | Opentip",
    description,
    url: "https://opentip.tech/terms",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Docs that write themselves from your code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function TermsPage() {
  return (
    <>
      <MarketingHeader />
      <article className="mkt-w mkt-prose">
        <p className="mkt-note">Draft for review, 23 October 2026. This is not final legal text.</p>
        <h1>Terms of Service</h1>
        <p>
          These terms cover the Opentip docs product at opentip.tech, including the beta, hosted docs, and the Worklog.
          Opentip Tip keeps its own terms at opentip.tech/tip/legal/terms.
        </p>
        <p>
          The operator is [Legal entity name]. Registered address: [Registered address].
          Until those details are filled in, contact support@opentip.tech.
        </p>

        <h2>The beta</h2>
        <p>
          Apply at opentip.tech/beta. If we accept the application, we email access to the address you gave us.
          The beta is planned to run for one to two months. There is no charge during the beta.
        </p>

        <h2>Hosted docs and the Worklog</h2>
        <p>
          Opentip hosts a docs site and a Worklog for a repository you connect. Opentip Copilot reads that repository and writes the docs.
          A GitHub App runs when you push. It updates the pages the push affects. Opentip does not commit to your repository and does not open pull requests.
        </p>

        <h2>GitHub access</h2>
        <p>
          The GitHub App asks for read access to the repositories you install it on. We use that access to read code, commits, and the metadata needed to write docs and the Worklog.
          You can remove the app in GitHub at any time. Removing it stops new updates.
        </p>

        <h2>AI-written pages</h2>
        <p>
          Docs and Worklog entries are generated from your code and your pushes. They can be wrong, incomplete, or behind the latest commit.
          You decide whether to rely on them. You can turn on approval before a change is published.
        </p>

        <h2>Tips</h2>
        <p>
          You can put a tip button on docs and Worklog pages, and you can turn it off. A supporter tips in ETH or USDC through the existing Opentip smart contract. OAR is coming soon.
          Tips are optional. The contract applies its current fee. Transactions stay on the public chain.
        </p>

        <h2>Paid plans</h2>
        <p>
          Pricing comes at launch. When paid plans start, Paddle will process those payments. We do not take card numbers on opentip.tech.
          The beta itself has no charge.
        </p>

        <h2>Your account</h2>
        <p>
          Use an email address and a GitHub account you control. You are responsible for the repositories you connect and for activity under your login.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not use Opentip to break the law, to attack another system, or to connect a repository you are not allowed to share with us.
          We can suspend beta access when that happens, and when the beta ends.
        </p>

        <h2>Changes</h2>
        <p>
          This page is a draft. We will replace it with a finished version before public launch. The text at opentip.tech/terms is the current draft.
        </p>

        <h2>Contact</h2>
        <ul>
          <li>Email: support@opentip.tech</li>
          <li>X: https://x.com/opentip_tech</li>
          <li>GitHub: https://github.com/opentiphq</li>
        </ul>
      </article>
      <MarketingFooter />
    </>
  );
}
