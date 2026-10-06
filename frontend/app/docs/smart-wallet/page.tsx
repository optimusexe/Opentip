export const metadata = {
  title: "Smart Wallet",
  description: "Your Opentip Smart Wallet — one address on every device. How to create it, use it, and keep it safe.",
};

export default function SmartWalletPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Smart Wallet</h1>
        <p className="text-lg text-zinc-600">
          The Opentip Smart Wallet is a self-custodial smart contract wallet on Base, provisioned automatically with your account.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">What it is</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          A smart contract wallet on Base, secured by Coinbase infrastructure and controlled exclusively by you. No seed phrase, no browser extension.
        </p>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">One address, every device</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Signing in with the same credentials on any device yields the same wallet address.
            </p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Up to 5 devices</h3>
            <p className="text-sm text-zinc-600 mt-1">
              Active on up to five devices. A sixth requires removing an existing one first; removal is always your choice.
            </p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Smart Wallet vs external wallet</h3>
            <p className="text-sm text-zinc-600 mt-1">
              The Smart Wallet is marked <strong>SMART</strong> and is primary by default. External wallets (MetaMask, Rabby, mobile wallets) can be linked in Dashboard → Wallets, with the primary switchable at any time.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">New users — create your wallet</h2>
        <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
          <li>Sign up with email or GitHub.</li>
          <li>If you signed up with email, connect GitHub so you can verify repo ownership.</li>
          <li>Your Smart Wallet is created automatically — wait a few seconds.</li>
          <li>Your new address appears with a copy button. Fund it with ETH or USDC on Base. OAR is coming soon.</li>
        </ol>
        <p className="text-sm text-zinc-700 leading-relaxed">
          When you register a repo, the payout address defaults to your Smart Wallet. You can switch to a linked external wallet from the dropdown if you prefer.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Existing users — upgrade</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          A Smart Wallet can be added alongside linked external wallets without affecting them. Open <a href="/dashboard/wallets" className="text-accent underline underline-offset-4">Dashboard → Wallets</a> and click <strong>Create</strong>; it becomes the primary payout on creation, with existing wallets retained as backup.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Switch primaries at any time via <strong>Set primary</strong>. A wallet assigned as a repo payout cannot be unlinked until those repos are unregistered.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Using it</h2>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Tipping</h3>
            <p className="text-sm text-zinc-600 mt-1">Fund any repo in ETH or USDC (minimum $1). OAR is coming soon. For USDC, approval and the payment are batched into a single confirmation.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Claiming</h3>
            <p className="text-sm text-zinc-600 mt-1">From the payout wallet, select Claim all to withdraw every pending token at once.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Send & deposit</h3>
            <p className="text-sm text-zinc-600 mt-1">Open <a href="/wallet" className="text-accent underline underline-offset-4">Wallet</a> to see your total balance, send to any address on Base, or deposit via address copy or onramp.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Gas fees</h3>
            <p className="text-sm text-zinc-600 mt-1">You pay your own gas (roughly $0.005–$0.04 per transaction on Base). Keep a little ETH in the wallet. Tips sent without an Opentip account are never sponsored.</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Protect it</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Your Smart Wallet has spending controls: pause all transactions, daily and per-transaction USD limits, and a permitted-recipients allowlist. Limits apply to Smart Wallet signing; external wallets sign in their own apps and aren&apos;t covered.
        </p>
        <div className="space-y-3">
          <a href="/wallet/security" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Wallet Security →</h3>
            <p className="text-sm text-zinc-600 mt-1">Set limits, manage recipients, or pause everything.</p>
          </a>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Supported assets</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          You can fund a repo in <strong>ETH or USDC</strong> on Base. <strong>OAR is coming soon.</strong> The wallet can still show an OAR balance, and you can send OAR from the wallet, but the funding form does not accept it yet.
        </p>
        <div className="p-4 border rule rounded-sm bg-accent/5">
          <p className="text-sm text-zinc-700">
            <strong>Warning:</strong> your Smart Wallet is a regular on-chain address, so it can technically hold any token or NFT sent to it — verifiable on Basescan. Anything outside ETH, USDC, and OAR displays as a raw amount with no dollar value and is excluded from in-app flows. Airdropped tokens and NFTs can be scams — never approve unknown contracts or follow links attached to them. Verify contract addresses, test with small amounts, and assume unsupported assets may not be recoverable through Opentip.
          </p>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Security & recovery</h2>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li><strong>Self-custody</strong> — your keys live in secure infrastructure that even Coinbase cannot access. Opentip never sees them.</li>
          <li><strong>New device</strong> — sign in with the same email (and password) or GitHub. Your wallet session re-establishes itself silently — no codes, no re-creating, same address.</li>
          <li><strong>No export</strong> — private keys cannot be exported. Keep access to your email account.</li>
          <li><strong>Never share</strong> email codes or approve transactions you did not initiate.</li>
          <li><strong>Lost email access?</strong> Contact us (see below) — recovery is handled case by case and is not guaranteed.</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Troubleshooting</h2>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Email code not arriving</h3>
            <p className="text-sm text-zinc-600 mt-1">Check spam, wait a minute, then request a new code. Codes expire after a short time.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">“5 devices reached”</h3>
            <p className="text-sm text-zinc-600 mt-1">Remove the oldest device when prompted, then add the new one.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Signed out unexpectedly</h3>
            <p className="text-sm text-zinc-600 mt-1">Sessions last 30 days. Sign in again with the same email to get your same wallet back.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Transaction fails</h3>
            <p className="text-sm text-zinc-600 mt-1">Make sure you are on Base (not Ethereum mainnet) and hold enough ETH for gas. Tipping below $1 is rejected. With the Smart Wallet, token approval is batched into your single confirmation automatically; with an external wallet, approve the spend first and then tip.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Transaction blocked by policy</h3>
            <p className="text-sm text-zinc-600 mt-1">If a tip or send is refused with a limit or recipient message, check your controls at <a href="/wallet/security" className="text-accent underline underline-offset-4">Wallet → Security</a> — a daily cap, per-transaction cap, pause switch, or recipients list may be stopping it.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Wrong network or missing funds</h3>
            <p className="text-sm text-zinc-600 mt-1">Deposits must be sent on Base. Funds sent on other networks will not appear in your wallet.</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10">
        <h2 className="serif text-2xl font-semibold mb-4">Next steps</h2>
        <div className="space-y-3">
          <a href="/wallet" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Open your Wallet →</h3>
            <p className="text-sm text-zinc-600 mt-1">See balances, send, deposit, and view history.</p>
          </a>
          <a href="/wallet/security" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Security →</h3>
            <p className="text-sm text-zinc-600 mt-1">Spending limits, recipients allowlist, and the pause switch.</p>
          </a>
          <a href="/docs/for-developers" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">For Developers →</h3>
            <p className="text-sm text-zinc-600 mt-1">Register a repo with your Smart Wallet as payout.</p>
          </a>
          <a href="/docs/contacts" className="block p-4 border rule rounded-sm hover:bg-zinc-900/5 transition-colors">
            <h3 className="font-medium text-sm">Contact →</h3>
            <p className="text-sm text-zinc-600 mt-1">Include your wallet address when asking for help.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
