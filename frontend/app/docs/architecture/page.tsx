export const metadata = {
  title: "Architecture",
  description: "System design, indexer, authentication flow, and infrastructure behind Opentip.",
};

function Diagram({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 text-zinc-100 p-6 rounded-sm font-mono text-sm overflow-x-auto">
      <pre className="whitespace-pre">{children}</pre>
    </div>
  );
}

export default function ArchitecturePage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Architecture</h1>
        <p className="text-lg text-zinc-600">
          How Opentip is built — from the smart contract to the frontend.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">System overview</h2>
        <Diagram>
{`┌─────────────────────────────────────────────────────────┐
│                      Frontend                          │
│              Next.js 16 · Vercel                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Pages   │  │  API     │  │  Auth    │             │
│  │  (SSR)   │  │  Routes  │  │NextAuth  │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │              │              │                   │
│  ┌────┴──────────────┴──────────────┴─────┐            │
│  │           Prisma Client                │            │
│  └────────────────┬───────────────────────┘            │
└───────────────────┼────────────────────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───┴───┐    ┌──────┴──────┐   ┌───┴────────┐
│  DB   │    │  Contract   │   │  External  │
│Postgres│    │  (Base)     │   │  Services  │
└───────┘    └─────────────┘   └────────────┘

External Services:
  Groq (AI summaries) · Azure Blob (uploads)
  Resend (emails) · GitHub API (repos, ownership)

┌─────────────────────────────────────────────────────────┐
│                     Indexer                             │
│           Node.js · Azure Container Apps                │
│                                                         │
│  Polls contract events → writes to PostgreSQL           │
│  Events: TipReceived, RepoRegistered, PayoutUpdated    │
└─────────────────────────────────────────────────────────┘`}
        </Diagram>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Tech stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Next.js 16</p>
            <p className="text-xs text-zinc-600 mt-1">React framework with Turbopack, SSR, App Router</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Prisma</p>
            <p className="text-xs text-zinc-600 mt-1">Type-safe ORM for PostgreSQL</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">PostgreSQL</p>
            <p className="text-xs text-zinc-600 mt-1">Azure Database for PostgreSQL Flexible Server</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">viem</p>
            <p className="text-xs text-zinc-600 mt-1">TypeScript Ethereum library for contract interaction</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Reown AppKit</p>
            <p className="text-xs text-zinc-600 mt-1">Wallet connection modal (WalletConnect, injected)</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">NextAuth.js</p>
            <p className="text-xs text-zinc-600 mt-1">Authentication (GitHub OAuth + email/password)</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Azure Blob Storage</p>
            <p className="text-xs text-zinc-600 mt-1">Profile picture and header image uploads</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Groq</p>
            <p className="text-xs text-zinc-600 mt-1">AI-powered repo summaries (GPT-OSS)</p>
          </div>
          <div className="p-3 border rule rounded-sm">
            <p className="font-medium text-sm">Resend</p>
            <p className="text-xs text-zinc-600 mt-1">Transactional email (password reset)</p>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Monorepo structure</h2>
        <Diagram>
{`opentip/
├── frontend/          Next.js app (Vercel)
│   ├── app/           Pages, API routes, layouts
│   ├── components/    UI components (motion-enhanced)
│   ├── lib/           Utilities, auth, contract ABI
│   ├── prisma/        Schema + migrations
│   └── config/        Reown AppKit + wagmi setup
│
├── indexer/           Event indexer (Azure Container Apps)
│   ├── src/index.ts   Polling loop + event processing
│   └── prisma/        Shared schema with frontend
│
├── contracts/         Solidity smart contracts (Foundry)
│   ├── src/Opentip.sol
│   ├── script/Deploy.s.sol
│   └── test/          36 tests
│
└── package.json       npm workspaces`}
        </Diagram>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Authentication flow</h2>
        <Diagram>
{`GitHub OAuth:                     Email/Password:
                                  
User clicks "GitHub"              User enters email + password
  → signIn("github")                → POST /api/auth/signup
  → GitHub OAuth popup                → bcrypt hash, store user
  → Callback with code              → signIn("credentials")
  → NextAuth creates session         → bcrypt compare
  → JWT stored in cookie             → JWT stored in cookie
                                  
Both flows:                       
  → JWT callback enriches token     
    with login, githubId, accessToken
  → Session callback exposes       
    user.login, user.id, etc.`}
        </Diagram>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Sessions use JWT strategy (not database sessions). The JWT is stored in an HTTP-only cookie (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">next-auth.session-token</code>). The custom Prisma adapter handles user creation, account linking, and githubId deduplication.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Indexer</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          A standalone Node.js process that polls the Base blockchain for smart contract events and writes them to PostgreSQL.
        </p>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">How it works</h3>
            <ol className="text-sm text-zinc-600 mt-2 space-y-1 list-decimal pl-5">
              <li>Reads the last processed block from <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">IndexerState</code> table</li>
              <li>Fetches new events via <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">eth_getLogs</code> in batches of <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GETLOGS_RANGE</code> blocks (default 10). With no checkpoint and no <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">START_BLOCK</code>, the first scan starts 10,000 blocks behind the chain head.</li>
              <li>Processes each event and writes to the database</li>
              <li>Saves the new checkpoint</li>
              <li>Repeats every 12 seconds</li>
            </ol>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Events indexed</h3>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-accent">TipReceived</code>
                <span className="text-zinc-600">→ Creates/updates Tip record</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-accent">RepoRegistered</code>
                <span className="text-zinc-600">→ Upserts Repo record</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-accent">PayoutAddressUpdated</code>
                <span className="text-zinc-600">→ Updates Repo.payoutAddress</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-accent">Claimed</code>
                <span className="text-zinc-600">→ Stores a Claim and notifies the payout account (&quot;Tips paid out&quot;)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-xs text-accent">TreasuryWithdrawn</code>
                <span className="text-zinc-600">→ Advances checkpoint only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Wallet connection</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Opentip has two wallet paths. The primary path is the <strong>Opentip Smart Wallet</strong> — a CDP Embedded smart wallet created with an email code, giving the same address on every device with no extension or seed phrase. The secondary path is <strong>external wallets</strong> via Reown AppKit, which supports injected wallets (MetaMask, Rabby, etc.) and the WalletConnect protocol for mobile wallets.
        </p>
        <p className="text-sm text-zinc-700 leading-relaxed">
          The wagmi library handles EVM reads and external-wallet transactions, while CDP hooks sign for the Smart Wallet. The wagmi config uses cookie-based storage for SSR support. See <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Smart Wallet</a> for the user-facing guide.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Environment variables</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Frontend and indexer environment variables, including <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GROQ_API_KEY</code> for AI summaries, are listed in Contributing. The indexer reads <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CHAIN</code>, not <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_CHAIN</code>.
        </p>
        <a href="/docs/contributing" className="inline-block text-sm text-accent underline underline-offset-4">
          See the full list in Contributing →
        </a>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 className="serif text-2xl font-semibold">Deployment</h2>
        <div className="space-y-3">
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Frontend → Vercel</h3>
            <p className="text-sm text-zinc-600 mt-1">Auto-deployed from the main branch. Environment variables set in the Vercel dashboard. Uses Node 20+.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Indexer → Azure Container Apps</h3>
            <p className="text-sm text-zinc-600 mt-1">Docker image built from the indexer directory. Runs in a consumption plan on Azure. Polls every 12 seconds.</p>
          </div>
          <div className="p-4 border rule rounded-sm">
            <h3 className="font-medium text-sm">Contract → Base (Foundry)</h3>
            <p className="text-sm text-zinc-600 mt-1">Deployed via Foundry scripts. Verified on Basescan. Live on Base mainnet.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
