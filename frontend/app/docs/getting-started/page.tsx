export const metadata = {
  title: "Getting Started",
  description: "How to tip an open-source repository on Opentip — connect a wallet, choose an amount, and send.",
};

export default function GettingStartedPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Getting Started</h1>
        <p className="text-lg text-zinc-600">
          Tip any open-source GitHub repository in crypto. The entire flow takes less than a minute.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Prerequisites</h2>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li>A crypto wallet — an <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Opentip Smart Wallet</a> (recommended, no extension needed) or an external wallet (MetaMask, Rainbow, etc.)</li>
          <li>ETH on Base for gas fees (tips are free to send — gas is minimal on Base L2)</li>
          <li>USDC or ETH on Base. OAR is coming soon.</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 1 — Find a repo</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Visit the <a href="/repos" className="text-accent underline underline-offset-4">Repos</a> page to browse all registered repositories. You can search by name or sort by most tipped, most recent, or number of tips.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          You can also visit a repo page directly using the URL format:
        </p>
        <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm">
          opentip.tech/{'{owner}'}/{'{repo}'}
        </code>
        <p className="text-sm text-zinc-700 leading-relaxed">
          For example: <a href="/vercel/next.js" className="text-accent underline underline-offset-4">opentip.tech/vercel/next.js</a>
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Each repo page has two tabs — <strong>Tip</strong> (tipping form and stats) and <strong>About</strong> (AI-generated summary and developer links). Check the About tab to learn what a project does before tipping.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 2 — Connect your wallet</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          On the repo page, click <strong>Connect wallet</strong>. This opens the wallet modal where you can choose your provider — injected wallets (MetaMask, Rabby, etc.) or WalletConnect for mobile wallets.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Signed in? Your <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Opentip Smart Wallet</a> is already available — same address on every device, no extension needed.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          You do not need an Opentip account to tip. Just connect a wallet and you are ready to go.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 3 — Choose currency and amount</h2>
        <div className="space-y-4">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">USDC tips</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Select USDC, enter a dollar amount (minimum $1). Every payment approves the Opentip contract for that exact amount, then sends the payment. From an external wallet those are two confirmations. The Opentip Smart Wallet batches them into one confirmation.
            </p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">ETH tips</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Select ETH, enter an amount. Your wallet sends ETH directly to the contract via a payable call. No swaps needed.
            </p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">OAR</h3>
            <p className="text-sm text-zinc-600 mt-1">
              OAR funding is coming soon. Choosing OAR in the token menu shows &quot;OAR tipping coming soon&quot; and keeps your current token.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 4 — Send the tip</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Click <strong>Tip</strong>. Your wallet will prompt you to confirm the transaction. On Base, transactions confirm in about 2 seconds with negligible gas fees.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Once confirmed, your tip appears in the repo&apos;s activity feed and leaderboard. You&apos;re done.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Setting a display name</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          By default, tippers are identified by their wallet address. You can set a display name (like &quot;Alice&quot; or &quot;Satoshi&quot;) that appears in activity feeds and leaderboards.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          On any repo page, enter a name next to your tip amount and click <strong>Set name</strong>. You will need to sign a message with your wallet to prove ownership. The name is stored and shown for all future tips.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Sharing a tip link</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Every repo page has a <strong>Copy link</strong> button. Share it on social media, in READMEs, or in issues to encourage others to tip the same project.
        </p>
        <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm">
          https://opentip.tech/{'{owner}'}/{'{repo}'}
        </code>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">How fees work</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Opentip charges a 5% platform fee on every tip. The fee is deducted automatically by the smart contract before the developer can claim. For example, a $100 tip results in $95 going to the developer and $5 to the Opentip treasury.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Fees are non-refundable once a transaction is confirmed on-chain. The fee rate is capped at 10% and can only be changed by the contract owner.
        </p>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-4">Next steps</h2>
        <div className="space-y-3">
          <a href="/docs/for-developers" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">For Developers →</h3>
            <p className="text-sm text-zinc-600 mt-1">Register your own repo and start receiving tips.</p>
          </a>
          <a href="/docs/smart-contract" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Smart Contract →</h3>
            <p className="text-sm text-zinc-600 mt-1">Understand the on-chain mechanics.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
