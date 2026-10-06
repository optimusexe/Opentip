import Link from "next/link";

export const metadata = {
  title: "Documentation",
  description: "Learn how Opentip works — tip open-source developers in crypto, register repos, and manage your tips.",
};

export default function DocsPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <h1 className="serif fluid-page-title font-semibold tracking-tight leading-[0.9]">Documentation</h1>
        <p className="text-lg text-zinc-600 max-w-xl">
          Opentip is an open-source tip jar on Base. Send crypto to the developers who build the tools you use.
        </p>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-6">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="stats text-3xl font-semibold text-accent">01</div>
            <h3 className="font-medium">Find a repo</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Browse registered repositories or visit any repo page directly. Search by name or owner.
            </p>
          </div>
          <div className="space-y-3">
            <div className="stats text-3xl font-semibold text-accent">02</div>
            <h3 className="font-medium">Connect & tip</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Connect your wallet, check the AI-generated summary on the About tab, choose USDC or ETH, enter an amount, and send. OAR is coming soon. Minimum tip is $1.
            </p>
          </div>
          <div className="space-y-3">
            <div className="stats text-3xl font-semibold text-accent">03</div>
            <h3 className="font-medium">Developers claim</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              95% of every tip goes directly to the developer. They connect their payout wallet and claim anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-6">Quick facts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="stats text-2xl font-semibold">5%</div>
            <p className="text-xs text-zinc-500 mt-1">Platform fee</p>
          </div>
          <div>
            <div className="stats text-2xl font-semibold">$1</div>
            <p className="text-xs text-zinc-500 mt-1">Minimum tip</p>
          </div>
          <div>
            <div className="stats text-2xl font-semibold">Base</div>
            <p className="text-xs text-zinc-500 mt-1">L2 chain</p>
          </div>
          <div>
            <div className="stats text-2xl font-semibold">Multi</div>
            <p className="text-xs text-zinc-500 mt-1">Token support</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-6">Sections</h2>
        <div className="space-y-3">
          <Link href="/docs/getting-started" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Getting Started</h3>
            <p className="text-sm text-zinc-600 mt-1">How to tip a repository — connect a wallet, choose an amount, and send.</p>
          </Link>
          <Link href="/docs/smart-wallet" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Smart Wallet</h3>
            <p className="text-sm text-zinc-600 mt-1">Your Opentip Smart Wallet — one address on every device.</p>
          </Link>
          <Link href="/docs/for-developers" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">For Developers</h3>
            <p className="text-sm text-zinc-600 mt-1">Register your repo, set up a payout address, and claim tips.</p>
          </Link>
          <Link href="/docs/smart-contract" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Smart Contract</h3>
            <p className="text-sm text-zinc-600 mt-1">Full reference for the on-chain contract — functions, events, and security model.</p>
          </Link>
          <Link href="/docs/architecture" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Architecture</h3>
            <p className="text-sm text-zinc-600 mt-1">System design, indexer, auth flow, and infrastructure.</p>
          </Link>
          <Link href="/docs/contributing" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Contributing</h3>
            <p className="text-sm text-zinc-600 mt-1">Self-host, run locally, or contribute to the codebase.</p>
          </Link>
          <Link href="/docs/troubleshooting" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Troubleshooting</h3>
            <p className="text-sm text-zinc-600 mt-1">Fixes for funding, registering, claiming, sign-in, notifications, and self-hosting.</p>
          </Link>
          <Link href="/docs/resources" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Resources</h3>
            <p className="text-sm text-zinc-600 mt-1">All links — contract, explorer, GitHub, social, and integrations.</p>
          </Link>
          <Link href="/docs/contacts" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium">Contact</h3>
            <p className="text-sm text-zinc-600 mt-1">Get in touch with the Opentip team.</p>
          </Link>
        </div>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-4">Contract</h2>
        <p className="text-sm text-zinc-600">
          Deployed on Base mainnet:
        </p>
        <code className="block mt-3 bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm break-all">
          0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC
        </code>
        <a
          href="https://basescan.org/address/0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-sm text-accent underline underline-offset-4"
        >
          View on Basescan →
        </a>
      </section>
    </div>
  );
}
