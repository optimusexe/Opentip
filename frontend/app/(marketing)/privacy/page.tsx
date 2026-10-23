import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/MarketingChrome";

const description = "Draft privacy policy for the Opentip docs beta, GitHub access, Worklog, and optional tips.";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Opentip" },
  description,
  alternates: { canonical: "https://opentip.tech/privacy" },
  openGraph: {
    title: "Privacy Policy | Opentip",
    description,
    url: "https://opentip.tech/privacy",
    siteName: "Opentip",
    type: "website",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Docs that write themselves from your code." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Opentip",
    description,
    images: ["/og-home.png"],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingHeader />
      <article className="mkt-w mkt-prose">
        <p className="mkt-note">Draft for review, 23 October 2026. This is not final legal text.</p>
        <h1>Privacy Policy</h1>
        <p>
          This policy covers the Opentip docs product, the beta application, hosted docs, and the Worklog.
          Opentip Tip keeps its own privacy policy at opentip.tech/tip/legal/privacy.
        </p>
        <p>
          The operator is [Legal entity name]. Registered address: [Registered address].
          Email support@opentip.tech if you want a copy of your data, a correction, or deletion of what we store.
        </p>

        <h2>Beta applications</h2>
        <p>When you apply, we store:</p>
        <ul>
          <li>Your name and email</li>
          <li>Your GitHub username, and your X handle if you add one</li>
          <li>The repository URL you want us to try</li>
          <li>What the project is, who reads the docs, what you use for docs now, the biggest docs pain, and how often you push</li>
          <li>An optional monthly amount, if you type one, and whether you will do a feedback call</li>
          <li>The time you submitted the form</li>
        </ul>
        <p>
          We use this to review the application and to email beta access. The amount is a number you chose to share. It is not a charge.
          We do not sell applications.
        </p>

        <h2>GitHub App</h2>
        <p>
          If you install the Opentip GitHub App, you choose which repositories it can read. We receive repository contents, commits, and related metadata, and we use them to write docs and the Worklog.
          The app is read access. It does not push commits or open pull requests. Uninstalling it in GitHub stops that access.
        </p>

        <h2>Docs and the Worklog</h2>
        <p>
          We store the generated site, Worklog entries, and edits you make in Opentip so we can host them and update them on later pushes.
          Treat generated text as a draft until you have read it.
        </p>

        <h2>Tips</h2>
        <p>
          If you leave tips on, supporters can send ETH or USDC through the Opentip smart contract. OAR is coming soon.
          Wallet addresses and transaction hashes are public on the chain. We may keep a copy so the page can show tip activity. We cannot delete a transaction from the chain.
        </p>

        <h2>Payments at launch</h2>
        <p>
          The beta has no charge. When paid plans launch, Paddle will process payment. Paddle handles card and tax details under its own policy.
          We expect to store the plan, the payment status, and the email tied to the purchase. We do not plan to store full card numbers.
        </p>

        <h2>Sign-in</h2>
        <p>
          Opentip Tip sign-in can set a session cookie. That cookie is covered by the Opentip Tip privacy policy as well.
          The beta form does not set a tracking cookie. The site can register a service worker so the installed app shell loads.
        </p>

        <h2>How long we keep it</h2>
        <p>
          We keep a beta application until you ask us to delete it, or until we no longer need it to run the beta.
          We keep hosted docs and Worklog entries until you disconnect the repository or ask us to delete them.
          On-chain tips remain on the network. Email support@opentip.tech for data we hold off chain.
        </p>

        <h2>Who else sees it</h2>
        <p>
          We use vendors to host the product and to send email. GitHub sees the app installation because you approved it there.
          The chain sees tips. Paddle will see payments when paid plans launch. We also share information when the law requires it.
          We do not sell personal information.
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
