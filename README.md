# Opentip

The open-source tip jar on Base. Send crypto to the developers who build the tools you use every day.

**[opentip.tech](https://opentip.tech)** · **[GitHub](https://github.com/opentiphq)** · **[X / Twitter](https://x.com/opentip_tech)** · **[support@opentip.tech](mailto:support@opentip.tech)**

---

## How it works

1. **Find a repo** — browse registered repositories on Opentip
2. **Change one word in the URL** — replace `github.com` with `opentip.tech` (or visit directly)
3. **Send a tip** — pay in ETH, USDC, or OAR
4. **Developer claims** — the repo owner sets a payout address and pulls tips on-chain

Opentip takes a **5% fee** on each tip to keep the platform running. **95% goes directly to the developer.** Minimum tip is $1 to prevent gas fees from eating small amounts.

---

## Features

- **Multi-token tipping** — send ETH, USDC, or OAR; tips stay in the token you send
- **Repo-level tips** — tips are tied to a specific GitHub repository
- **Pull payments** — developers set a payout address and claim when ready
- **Email verification** — 6-digit code flow with brute-force protection
- **Password reset** — email-based reset via Resend
- **AI-generated summaries** — Groq-powered codebase analysis on each repo page
- **Developer profiles** — public profiles with stats, contribution heatmaps, and social links
- **Leaderboard** — top supporters ranked by lifetime USD tipped
- **Admin dashboard** — contract controls, fee management, treasury, user management
- **GitHub OAuth** — sign in with GitHub to verify repo ownership
- **Email/password auth** — optional email signup with verification
- **Profile customization** — upload profile picture and header image via Azure Blob Storage

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Solidity 0.8.26, OpenZeppelin, Foundry |
| Frontend | Next.js 16, React 19, Tailwind CSS, TypeScript |
| Animation | Motion (Framer Motion) |
| Validation | Zod |
| Auth | NextAuth.js v4, GitHub OAuth, JWT |
| Database | PostgreSQL (Azure), Prisma ORM |
| Wallet | Opentip Smart Wallet (CDP Embedded, email OTP, same address everywhere) + Reown AppKit for external wallets, wagmi, viem |
| Indexer | Standalone Node.js, polls Base for events (Azure Container Apps) |
| RPC | Alchemy (recommended), Base public RPC |
| AI summaries | Groq API |
| Image uploads | Azure Blob Storage |
| Email | Resend |
| Hosting | Vercel (frontend), Azure Container Apps (indexer) |

---

## Project structure

```
opentip/
├── contracts/              Solidity smart contract + Foundry tests
│   ├── src/OpentipV2.sol   Multi-token contract (ETH, USDC, OAR)
│   ├── src/Opentip.sol     V1 contract (deprecated, USDC-only)
│   ├── test/               91 tests (36 V1 + 55 V2)
│   └── script/DeployV2.s.sol
├── frontend/               Next.js app (deployed to Vercel)
│   ├── app/                Pages, API routes, layouts
│   │   ├── [owner]/[repo]/ Public repo page (tip form + AI summary)
│   │   ├── admin/          Admin dashboard (owner-only controls)
│   │   ├── dashboard/      User dashboard (repos, account, profile)
│   │   ├── dev/[login]/    Public developer profile
│   │   ├── docs/           Documentation site
│   │   ├── verify-email/   Email verification (6-digit code)
│   │   ├── signin/         Sign in / sign up
│   │   ├── onboarding/     Repo onboarding flow
│   │   ├── activity/       Public tip activity feed
│   │   ├── repos/          Browse registered repos
│   │   ├── api/            REST API routes
│   │   └── legal/          Terms of Service, Privacy Policy
│   ├── components/         Shared UI components
│   ├── config/             Reown AppKit / wagmi configuration
│   ├── context/            React context providers
│   ├── lib/                Utilities (chain, auth, contracts, email, prices)
│   └── prisma/             Database schema
├── indexer/                Event indexer (polls contract, syncs to DB)
└── package.json            npm workspaces root
```

---

## Quick start

### Prerequisites

- Node.js 20+
- [Foundry](https://book.getfoundry.sh/) (for contracts)
- PostgreSQL database

### 1. Clone & install

```bash
git clone https://github.com/opentiphq/opentip.git
cd opentip
npm install
```

### 2. Smart contract (Foundry)

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv

# Deploy to Base Sepolia
cp .env.example .env   # fill in PRIVATE_KEY, BASE_SEPOLIA_RPC, ETHERSCAN_API_KEY
forge script script/DeployV2.s.sol:DeployV2 --rpc-url $BASE_SEPOLIA_RPC --broadcast

# Verify on Basescan
forge build && forge verify-contract <CONTRACT_ADDRESS> src/OpentipV2.sol:OpentipV2 --chain-id 84532
```

The contract is deployed and verified:

- **V2 (Multi-token, mainnet):** [`0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC`](https://basescan.org/address/0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC) — ETH, USDC, OAR
- **V1 (USDC-only, deprecated):** [`0xA45Be472a64eE6Daa093c6a975Cd8908C615d594`](https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594)
- **V2 (testnet):** [`0xeD13dB8234d437771e115419BF7498Ddef90Dc8D`](https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d)

**Token addresses (mainnet):**

- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- OAR: `0x6F19171963b7095d039372d0962512259187E4e6`

### 3. Database

```bash
# Set DATABASE_URL in frontend/.env and indexer/.env
cd indexer && npx prisma migrate dev --name init
cd ../frontend && npx prisma generate
```

### 4. Indexer

```bash
cd indexer
cp .env.example .env   # fill in DATABASE_URL, RPC_URL, CONTRACT_ADDRESS, START_BLOCK
npm run dev
```

The indexer polls the contract for events and syncs to PostgreSQL.

### 5. Frontend

```bash
cd frontend
cp .env.example .env   # fill in all required env vars (see below)
npm run dev            # http://localhost:3000
```

---

## Environment variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (`?sslmode=require`) |
| `GITHUB_ID` | GitHub OAuth app client ID |
| `GITHUB_SECRET` | GitHub OAuth app client secret |
| `NEXTAUTH_SECRET` | Random string for JWT signing |
| `NEXTAUTH_URL` | `http://localhost:3000` (dev) or `https://opentip.tech` (prod) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Reown/WalletConnect project ID |
| `NEXT_PUBLIC_CHAIN` | `baseSepolia` (testnet) or `base` (mainnet) |
| `NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT` | Testnet contract address |
| `NEXT_PUBLIC_BASE_CONTRACT` | Mainnet contract address |
| `NEXT_PUBLIC_RPC_URL` | RPC endpoint for client-side wagmi/Reown (e.g. Alchemy) |
| `RPC_URL` | RPC endpoint for server-side admin routes |
| `START_BLOCK` | Contract deployment block for dev profile scanning |
| `GETLOGS_RANGE` | Max blocks per `eth_getLogs` call (default: 10 for Alchemy free tier) |
| `PRIVATE_KEY` | Owner wallet private key for on-chain admin transactions |
| `OWNER_ADDRESS` | Owner wallet address for admin auth |
| `REGISTRAR_PRIVATE_KEY` | Private key for EIP-712 registrar signer |
| `GROQ_API_KEY` | Groq API key for AI-generated repo summaries |
| `RESEND_API_KEY` | Resend API key (verification + password reset emails) |
| `RESEND_FROM` | Sender email address (e.g. `noreply@opentip.tech`) |
| `GITHUB_TOKEN` | GitHub personal access token for API requests |
| `NOTIFICATION_SECRET` | Shared secret for `POST /api/notifications/send` (same value as the indexer). Generate with `openssl rand -hex 32` |
| `AZURE_STORAGE_ACCOUNT` | Azure Blob Storage account name |
| `AZURE_STORAGE_KEY` | Azure Blob Storage access key |

### Indexer (`indexer/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `RPC_URL` | RPC endpoint (e.g. `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY`) |
| `CONTRACT_ADDRESS` | Deployed Opentip contract address |
| `START_BLOCK` | Block number to start indexing from |
| `POLL_MS` | Polling interval (default: 12000ms) |
| `CHAIN` | `base` (mainnet) or `baseSepolia` (testnet) |
| `GETLOGS_RANGE` | Max blocks per `eth_getLogs` call (default: 10) |
| `NOTIFICATION_API_URL` | Push endpoint (default: `https://opentip.tech/api/notifications/send`) |
| `NOTIFICATION_SECRET` | Shared secret sent as `x-notification-secret` (same value as the frontend) |

### Contract deploy (`contracts/.env`)

| Variable | Description |
|----------|-------------|
| `BASE_SEPOLIA_RPC` | Alchemy or public RPC for Base Sepolia |
| `BASE_RPC` | Alchemy or public RPC for Base mainnet |
| `PRIVATE_KEY` | Deployer wallet private key |
| `ETHERSCAN_API_KEY` | Basescan API key for contract verification |
| `TREASURY_ADDRESS` | Treasury wallet address (defaults to deployer) |
| `FEE_BPS` | Fee in basis points (default: 500 = 5%) |
| `REGISTRAR_SIGNER` | Address of the EIP-712 registrar signer |

---

## Architecture

### Smart contract (`OpentipV2.sol`)

The on-chain contract handles:

- **Repo registration** — EIP-712 signed registration with GitHub ownership verification
- **Multi-token tips** — ETH, USDC, OAR, or any registered ERC-20 token
- **Payout claims** — pull-payment pattern; developers set an address and claim all tokens at once
- **Fee collection** — 5% fee routed to the treasury per token
- **Token management** — admin can add/remove supported tokens
- **Stray ETH recovery** — ETH sent outside `receiveTipEth()` is tracked and sweepable
- **Migration** — V1 repos can be migrated to V2 via `adminMigrateRepo()` with a deadline
- **Admin controls** — pause/unpause, fee adjustment, treasury and registrar key rotation

Key properties:

- `Ownable2Step` — two-step ownership transfer for security
- `Pausable` — emergency stop mechanism
- `ReentrancyGuard` — prevents reentrancy attacks
- `EIP-712` — typed structured data for off-chain signature verification (domain version "2")
- `everAcceptedTokens` — permanent record of all tokens that were ever tipped, ensures `claimAll()` works even after token removal

### Indexer

A standalone Node.js service that:

- Polls the contract for `TipReceived`, `RepoRegistered`, `PayoutAddressUpdated`, and other events
- Syncs event data to PostgreSQL with idempotent upserts
- Batches `eth_getLogs` calls with configurable block range (`GETLOGS_RANGE`)
- Includes DB retry logic with exponential backoff
- Runs on Azure Container Apps

### Frontend

Next.js 16 app with:

- **App Router** — file-based routing with layouts
- **Server Components** — DB queries in server components (leaderboard, repo pages)
- **Turbopack** — fast dev server and builds
- **Fluid responsive design** — CSS `clamp()` for typography and spacing
- **Chain-driven config** — single `lib/chain.ts` module controls all chain-specific values
- **Email verification** — 6-digit code flow mandatory before onboarding
- **OTP input** — 6-digit code input with auto-advance and paste support

---

## Deployment

### Vercel (frontend)

1. Connect your GitHub repo to Vercel
2. Set all environment variables in the Vercel dashboard
3. Deploy — `npm run build` runs automatically

### Azure Container Apps (indexer)

```bash
# Build and push
cd indexer
docker build -t opentipregistry.azurecr.io/opentip-indexer:latest .
az acr login --name opentipregistry
docker push opentipregistry.azurecr.io/opentip-indexer:latest

# Update the container app
az containerapp update --name opentip-indexer --resource-group opentip --image opentipregistry.azurecr.io/opentip-indexer:latest

# Set env vars (if needed)
az containerapp update --name opentip-indexer --resource-group opentip --set-env-vars "RPC_URL=https://..." "GETLOGS_RANGE=10"
```

---

## Contributing

See [CONTRIBUTING.md](frontend/app/tip/docs/contributing/page.tsx) or visit [opentip.tech/tip/docs/contributing](https://opentip.tech/tip/docs/contributing) for setup instructions, code conventions, and PR guidelines.

---

## License

MIT

---

## Links

- **Website:** [opentip.tech](https://opentip.tech)
- **GitHub:** [github.com/opentiphq](https://github.com/opentiphq)
- **X / Twitter:** [@opentip_tech](https://x.com/opentip_tech)
- **Email:** [support@opentip.tech](mailto:support@opentip.tech)
- **Contract V2 (mainnet):** [Basescan](https://basescan.org/address/0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC)
- **Contract V1 (deprecated):** [Basescan](https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594)
- **Contract (testnet):** [Basescan](https://sepolia.basescan.org/address/0xed13db8234d437771e115419bf7498ddef90dc8d)
