export const metadata = {
  title: "For Developers",
  description: "Register your GitHub repository on Opentip, set up a payout address, and claim tips from supporters.",
};

export default function ForDevelopersPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">For Developers</h1>
        <p className="text-lg text-zinc-600">
          Register your repository, receive tips from supporters, and manage your earnings.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Prerequisites</h2>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li>A GitHub account with owner or write access to the repository</li>
          <li>An Opentip account (sign in with GitHub or email)</li>
          <li>A linked wallet — an <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Opentip Smart Wallet</a> (recommended) or any external EVM wallet on Base</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 1 — Create an account</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Go to <a href="/signin" className="text-accent underline underline-offset-4">/signin</a> and sign in with GitHub. This links your GitHub identity so you can verify repo ownership. Alternatively, create an account with email and password, then connect GitHub later from your dashboard.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 2 — Link a wallet</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          During onboarding (or from <a href="/dashboard/wallets" className="text-accent underline underline-offset-4">Dashboard → Wallets</a>), create an <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Opentip Smart Wallet</a> or connect an external wallet to use as your payout address. External wallets require signing a message to prove ownership.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          This wallet will receive all tips for repos you register. New repo registrations default to your Smart Wallet. You can link multiple wallets and use different ones for different repos.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 3 — Register your repo</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Visit your repo&apos;s page on Opentip:
        </p>
        <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm">
          opentip.tech/{'{owner}'}/{'{repo}'}
        </code>
        <p className="text-sm text-zinc-700 leading-relaxed">
          If the repo is not yet registered, you will see a <strong>Claim this repo</strong> section. Click <strong>Verify ownership</strong>.
        </p>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">What happens behind the scenes</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Opentip checks the GitHub API to confirm you own or have write access to the repository. If verified, the server signs an EIP-712 registration permit using the registrar key. This signature expires in 5 minutes and is submitted to the smart contract along with your payout address. The on-chain expiry is hard-capped at 10 minutes.
            </p>
          </div>
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Click <strong>Register repo</strong> and confirm the transaction in your wallet. The repo is now registered and ready to receive tips.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">AI-generated summary</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Upon registration, Opentip automatically generates an AI summary of your repository using Groq. The summary is created by analyzing your README, configuration files, and source code. It includes:
        </p>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li><strong>Description</strong> — what the project does and what problem it solves</li>
          <li><strong>Tech stack</strong> — core technologies used in the project</li>
          <li><strong>Features</strong> — 3-5 key features of the project</li>
          <li><strong>Audience</strong> — who the project is built for</li>
        </ul>
        <p className="text-sm text-zinc-700 leading-relaxed">
          The summary is cached in the database and automatically refreshed every 7 days. Tippers see this summary on the <strong>About</strong> tab of your repo page, helping them understand what they are contributing to.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Tabbed repo pages</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Each repo page on Opentip has two tabs:
        </p>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Tip</h3>
            <p className="text-sm text-zinc-600 mt-1">The default tab. Shows the tipping form, stats (pending balance, total tipped, payout address), leaderboard, and recent tips.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">About</h3>
            <p className="text-sm text-zinc-600 mt-1">Shows the AI-generated summary and any links added by the repo owner. This is what tippers see when they want to learn about the project before tipping.</p>
          </div>
        </div>
        <p className="text-sm text-zinc-700 leading-relaxed">
          The active tab is controlled via URL parameter (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">?tab=about</code> or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">?tab=tip</code>), making it shareable.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Managing links</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Repo owners can add custom links that appear on the About tab. These can be documentation, social media, community, or any other relevant URLs.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          To manage links, go to <a href="/dashboard/repos" className="text-accent underline underline-offset-4">Dashboard → Repos</a> and click <strong>Manage</strong> next to a repo. You can add up to 10 links, each with a title and URL.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Step 4 — Claim tips</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          When someone funds your repo, the tokens (USDC or ETH; OAR is coming soon) are held by the smart contract in a per-token pending balance. To withdraw, connect the wallet that was registered as the payout address and click <strong>Claim tips</strong>.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          The full pending balance (after the 5% fee) is transferred to your wallet in one transaction.
        </p>
        <div className="p-4 border rule rounded-sm bg-accent/5">
          <p className="text-sm text-zinc-700">
            <strong>Important:</strong> Only the wallet registered as the payout address can claim tips. If you lose access to this wallet, you must first link and verify your new wallet in <a href="/dashboard/wallets" className="text-accent underline underline-offset-4">Dashboard → Wallets</a>. Then contact us — the contract owner can reassign the payout address to your verified wallet as an emergency recovery measure.
          </p>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Updating your payout address</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          If you want to rotate your payout wallet, you can call <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">updatePayoutAddress</code> on the contract from the current payout wallet. This changes the address for future claims without affecting pending balance.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Setting up your profile</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Visit <a href="/dashboard" className="text-accent underline underline-offset-4">Dashboard</a> to customize your public profile at <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/dev/{'{login}'}</code>:
        </p>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li><strong>Profile picture</strong> — Upload a headshot or avatar (max 2MB)</li>
          <li><strong>Header image</strong> — A banner that appears at the top of your profile (max 4MB)</li>
          <li><strong>Bio</strong> — Tell people what you build. URLs are automatically linked.</li>
          <li><strong>Social links</strong> — Website, GitHub, Twitter, Discord, Telegram, Farcaster</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Dashboard overview</h2>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Repos</h3>
            <p className="text-sm text-zinc-600 mt-1">View all repos where your linked wallets are the payout address. See pending balances, total tipped, and tip counts. Claim directly from this page.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">GitHub Repos</h3>
            <p className="text-sm text-zinc-600 mt-1">Browse your GitHub repositories. Each one links to its Opentip page where you can register it.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Wallets</h3>
            <p className="text-sm text-zinc-600 mt-1">Create your Opentip Smart Wallet or link external wallets. Set which one is primary.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Account</h3>
            <p className="text-sm text-zinc-600 mt-1">Connect GitHub, add an email, set or change your password.</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">How the pull payment model works</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Opentip uses a pull payment pattern. Tips are not sent directly to your wallet. Instead:
        </p>
        <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
          <li>The tipper sends tokens (USDC via approve+transfer, ETH via payable call, or OAR via approve+transfer) to the contract.</li>
          <li>The contract deducts 5% to the treasury and credits 95% to the repo&apos;s pending balance for that token.</li>
          <li>You (the payout address holder) call <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">claimAll()</code> to withdraw all tokens at once.</li>
        </ol>
        <p className="text-sm text-zinc-700 leading-relaxed">
          This model means you control when you withdraw, and the contract never has custody of your funds beyond what you are owed.
        </p>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-4">Next steps</h2>
        <div className="space-y-3">
          <a href="/docs/smart-contract" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Smart Contract →</h3>
            <p className="text-sm text-zinc-600 mt-1">Deep dive into the on-chain mechanics, events, and security model.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
