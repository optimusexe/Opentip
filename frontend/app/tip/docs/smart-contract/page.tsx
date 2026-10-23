export const metadata = {
  title: "Smart Contract",
  description: "Full reference for the Opentip smart contract — functions, events, fee structure, and security model.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-10 space-y-6">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function FuncTable({ rows }: { rows: { name: string; params: string; returns: string; modifier: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-4 font-medium">Function</th>
            <th className="text-left py-3 pr-4 font-medium">Parameters</th>
            <th className="text-left py-3 pr-4 font-medium">Returns</th>
            <th className="text-left py-3 pr-4 font-medium">Modifier</th>
            <th className="text-left py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border last:border-0">
              <td className="py-3 pr-4 font-mono text-xs text-accent">{r.name}</td>
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.params}</td>
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.returns}</td>
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.modifier}</td>
              <td className="py-3 text-muted-foreground">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventTable({ rows }: { rows: { name: string; params: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-4 font-medium">Event</th>
            <th className="text-left py-3 pr-4 font-medium">Parameters</th>
            <th className="text-left py-3 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border last:border-0">
              <td className="py-3 pr-4 font-mono text-xs text-accent">{r.name}</td>
              <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{r.params}</td>
              <td className="py-3 text-muted-foreground">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SmartContractPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight">Smart Contract</h1>
        <p className="text-lg text-muted-foreground">
          The on-chain component of Opentip. Written in Solidity, deployed on Base.
        </p>
      </section>

      <Section title="Deployment">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[10px] border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">V1 (USDC-only)</p>
              <code className="block mt-2 font-mono text-sm break-all text-muted-foreground">Deprecated</code>
              <a href="https://basescan.org/address/0xA45Be472a64eE6Daa093c6a975Cd8908C615d594" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-accent underline underline-offset-4">Basescan →</a>
            </div>
            <div className="p-4 rounded-[10px] border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">V2 (Multi-token)</p>
              <code className="block mt-2 font-mono text-sm break-all">0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC</code>
              <a href="https://basescan.org/address/0xAf1b70F5BdDFfD64c5D7B971bA670e1ff65cB1bC" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-accent underline underline-offset-4">Basescan →</a>
              <p className="text-xs text-muted-foreground mt-2">Supports USDC and ETH. OAR is coming soon.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Solidity</p>
              <p className="font-mono text-sm">^0.8.26</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">License</p>
              <p className="font-mono text-sm">MIT</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tokens</p>
              <p className="font-mono text-sm">USDC · ETH</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fee</p>
              <p className="font-mono text-sm">feeBps, shown on the tip page</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Inheritance">
        <p className="text-sm text-foreground/80">The contract inherits from four OpenZeppelin libraries:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-[10px] border border-border">
            <p className="font-medium text-sm">Ownable2Step</p>
            <p className="text-xs text-muted-foreground mt-1">Two-step ownership transfer for safety</p>
          </div>
          <div className="p-3 rounded-[10px] border border-border">
            <p className="font-medium text-sm">Pausable</p>
            <p className="text-xs text-muted-foreground mt-1">Emergency pause/unpause mechanism</p>
          </div>
          <div className="p-3 rounded-[10px] border border-border">
            <p className="font-medium text-sm">ReentrancyGuard</p>
            <p className="text-xs text-muted-foreground mt-1">Protection against reentrancy attacks</p>
          </div>
          <div className="p-3 rounded-[10px] border border-border">
            <p className="font-medium text-sm">EIP712</p>
            <p className="text-xs text-muted-foreground mt-1">Off-chain typed signature verification</p>
          </div>
        </div>
      </Section>

      <Section title="Constants">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-medium">Constant</th>
                <th className="text-left py-3 pr-4 font-medium">Value</th>
                <th className="text-left py-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 pr-4 font-mono text-xs text-accent">MAX_FEE_BPS</td>
                <td className="py-3 pr-4 font-mono text-xs">1000</td>
                <td className="py-3 text-muted-foreground">Maximum fee: 10%</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 pr-4 font-mono text-xs text-accent">MAX_REPO_ID_LENGTH</td>
                <td className="py-3 pr-4 font-mono text-xs">200</td>
                <td className="py-3 text-muted-foreground">Maximum characters for a repo ID</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Functions">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Functions</h3>
        <FuncTable rows={[
          { name: "registerRepo", params: "repoId, payoutAddress, expiry, nonce, signature", returns: "—", modifier: "whenNotPaused", description: "Register a repo with an EIP-712 signed permit. Validates format, expiry, and signature." },
          { name: "updatePayoutAddress", params: "repoId, newAddress", returns: "—", modifier: "whenNotPaused", description: "Rotate the payout wallet for a registered repo. Only callable by current payout address." },
          { name: "receiveTipEth", params: "repoId", returns: "—", modifier: "payable, nonReentrant, whenNotPaused", description: "Accept an ETH tip. Splits fee, credits pending balance in ETH." },
          { name: "receiveTip", params: "repoId, token, amount", returns: "—", modifier: "nonReentrant, whenNotPaused", description: "Accept an ERC-20 tip (USDC). OAR is coming soon. Pulls tokens from msg.sender, splits fee, credits pending balance." },
          { name: "claimAll", params: "repoId", returns: "—", modifier: "nonReentrant, whenNotPaused", description: "Withdraw all pending tokens (ETH + ERC-20) in a single transaction. Only callable by the payout address." },
        ]} />

        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-8">Admin Functions</h3>
        <FuncTable rows={[
          { name: "pause", params: "—", returns: "—", modifier: "onlyOwner", description: "Emergency pause. Blocks register, update, tip, and claim." },
          { name: "unpause", params: "—", returns: "—", modifier: "onlyOwner", description: "Resume operations after a pause." },
          { name: "setFeeBps", params: "newFeeBps", returns: "—", modifier: "onlyOwner", description: "Update platform fee. Capped at MAX_FEE_BPS (1000 = 10%)." },
          { name: "setTreasuryAddress", params: "newTreasury", returns: "—", modifier: "onlyOwner", description: "Change the treasury address." },
          { name: "withdrawTreasury", params: "token, amount", returns: "—", modifier: "onlyOwner, nonReentrant", description: "Withdraw accumulated fees for a specific token." },
          { name: "setRegistrarSigner", params: "newSigner", returns: "—", modifier: "onlyOwner", description: "Rotate the EIP-712 registrar signer." },
          { name: "adminReassignPayout", params: "repoId, newAddress", returns: "—", modifier: "onlyOwner", description: "Emergency recovery: reassign payout address. Developer must first link and verify the new wallet in their dashboard." },
          { name: "adminMigrateRepo", params: "repoId, payoutAddress", returns: "—", modifier: "onlyOwner", description: "Migrate a v1 repo to v2. Disabled after migrationDeadline." },
          { name: "addToken", params: "token, decimals", returns: "—", modifier: "onlyOwner", description: "Register a new ERC-20 token for tipping." },
          { name: "removeToken", params: "token", returns: "—", modifier: "onlyOwner", description: "Remove a token from accepting new tips. Existing pending balances remain claimable via everAcceptedTokens." },
          { name: "sweepStrayEth", params: "to", returns: "—", modifier: "onlyOwner, nonReentrant", description: "Recover ETH sent directly to the contract outside receiveTipEth." },
          { name: "setMigrationDeadline", params: "deadline", returns: "—", modifier: "onlyOwner", description: "Set a deadline after which adminMigrateRepo is disabled. Pass 0 to re-enable." },
        ]} />

        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-8">View Functions</h3>
        <FuncTable rows={[
          { name: "getPendingBalance", params: "repoId, token", returns: "uint256", modifier: "view", description: "Amount of a specific token available to claim for a repo." },
          { name: "getPayoutAddress", params: "repoId", returns: "address", modifier: "view", description: "The wallet that can claim tips for a repo." },
          { name: "getTotalTipped", params: "repoId, token", returns: "uint256", modifier: "view", description: "Lifetime gross tip amount for a repo in a specific token." },
          { name: "getTotalTipCount", params: "repoId", returns: "uint256", modifier: "view", description: "Lifetime tip count for a repo." },
          { name: "feeBps", params: "—", returns: "uint256", modifier: "view", description: "Current platform fee in basis points." },
          { name: "treasuryBalances", params: "token", returns: "uint256", modifier: "view", description: "Accumulated unwithdrawn fees for a token." },
          { name: "isRegistered", params: "repoId", returns: "bool", modifier: "view", description: "Whether a repo has been registered." },
        ]} />
      </Section>

      <Section title="Events">
        <EventTable rows={[
          { name: "RepoRegistered", params: "repoId, payoutAddress (indexed), timestamp", description: "Emitted when a new repo is registered." },
          { name: "PayoutAddressUpdated", params: "repoId, oldAddress, newAddress (indexed)", description: "Emitted when a payout wallet is rotated." },
          { name: "TipReceived", params: "tipper (indexed), repoId, token, amount, feeAmount, timestamp", description: "Emitted on every tip (ETH or ERC-20)." },
          { name: "Claimed", params: "repoId, payoutAddress (indexed), token, amount, timestamp", description: "Emitted when a developer claims tips." },
          { name: "TreasuryWithdrawn", params: "to (indexed), token, amount, timestamp", description: "Emitted when the treasury balance is withdrawn." },
          { name: "FeeUpdated", params: "oldFeeBps, newFeeBps", description: "Emitted when the platform fee changes." },
          { name: "TreasuryAddressUpdated", params: "oldTreasury (indexed), newTreasury (indexed)", description: "Emitted when the treasury address changes." },
          { name: "RegistrarSignerUpdated", params: "oldSigner (indexed), newSigner (indexed)", description: "Emitted when the registrar signer is rotated." },
          { name: "TokenAdded", params: "token (indexed), decimals", description: "Emitted when a new token is registered for tipping." },
          { name: "TokenRemoved", params: "token (indexed)", description: "Emitted when a token is removed." },
        ]} />
      </Section>

      <Section title="Fee Structure">
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            The platform fee is expressed in basis points (bps). 100 bps is 1 percent. The fee is capped at 1000 bps (10%) and enforced in both the constructor and <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">setFeeBps</code>. The tip page shows the current rate.
          </p>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">How fees flow</h3>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal pl-5">
              <li>Tipper sends tokens via <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTipEth()</code> (ETH) or <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTip()</code> (ERC-20)</li>
              <li>Fee = <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">amount * feeBps / 10000</code></li>
              <li>Fee credited to <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">treasuryBalance[token]</code></li>
              <li>Net amount (amount - fee) credited to repo&apos;s <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">pendingBalance[token]</code></li>
              <li>Developer calls <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">claimAll()</code> to withdraw all tokens</li>
              <li>Owner calls <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">withdrawTreasury(token, amount)</code> to collect fees per token</li>
            </ol>
          </div>
        </div>
      </Section>

      <Section title="Registration Flow">
        <div className="space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            Registration uses EIP-712 typed signatures to prevent squatting. The process:
          </p>
          <ol className="text-sm text-foreground/80 space-y-2 list-decimal pl-5">
            <li>Server verifies GitHub ownership (owner or write collaborator)</li>
            <li>Server signs a <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">Register</code> typed struct with the registrar key</li>
            <li>User submits the signature on-chain via <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">registerRepo()</code></li>
            <li>Contract verifies the registrar signer matches, stores the repo</li>
          </ol>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The signature expires after 5 minutes (backend) with a hard cap of 10 minutes enforced on-chain. This limits the window for replay attacks while giving ample time for normal transaction submission.
          </p>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Repo ID validation rules</h3>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
              <li>Must be lowercase (no uppercase A-Z)</li>
              <li>Must contain exactly one <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">/</code> separator</li>
              <li>Minimum 3 characters, maximum 200</li>
              <li>No leading or trailing <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">/</code></li>
              <li>Must not be already registered</li>
            </ul>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">EIP-712 domain</h3>
            <code className="block mt-2 bg-zinc-950 text-zinc-100 p-3 rounded-sm font-mono text-xs">
{`{
  name: "Opentip",
  version: "2",
  chainId: 8453,
  verifyingContract: "0x..."
}`}
            </code>
          </div>
        </div>
      </Section>

      <Section title="Security Properties">
        <div className="space-y-3">
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Reentrancy protection</h3>
            <p className="text-sm text-muted-foreground mt-1">All state-changing external functions (<code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTip</code>, <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTipEth</code>, <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">claimAll</code>, <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">withdrawTreasury</code>) use <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">nonReentrant</code>.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Pausable</h3>
            <p className="text-sm text-muted-foreground mt-1">The owner can pause the contract in an emergency. Paused contract blocks registration, tip updates, tips, and claims.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Two-step ownership</h3>
            <p className="text-sm text-muted-foreground mt-1">Uses Ownable2Step — ownership transfer requires the new owner to accept. Prevents accidental transfer to a wrong address.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Checks-effects-interactions</h3>
            <p className="text-sm text-muted-foreground mt-1">All functions update state before making external calls (USDC transfers), following the CEI pattern.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Stray ETH protection</h3>
            <p className="text-sm text-muted-foreground mt-1">ETH sent outside <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">receiveTipEth()</code> is tracked separately as <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">strayEth</code> and can be swept by the owner via <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">sweepStrayEth()</code>.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Token removal safety</h3>
            <p className="text-sm text-muted-foreground mt-1">Removing a token stops new tips but existing pending balances remain claimable. <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">claimAll()</code> iterates over <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">everAcceptedTokens</code>, a permanent record of all tokens that were ever added.</p>
          </div>
          <div className="p-4 rounded-[10px] border border-border">
            <h3 className="font-medium text-sm">Signature expiry bound</h3>
            <p className="text-sm text-muted-foreground mt-1">Registration signatures are capped at 10 minutes maximum validity. The backend signs with a 5-minute expiry.</p>
          </div>
        </div>
      </Section>

      <section className="border-t border-border pt-10">
        <h2 className="font-display text-xl mb-4">Source code</h2>
        <p className="text-sm text-foreground/80">
          The full contract source is available at <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">contracts/src/OpentipV2.sol</code> in the repository.
        </p>
        <a href="https://github.com/opentiphq" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-accent underline underline-offset-4">
          View on GitHub →
        </a>
      </section>
    </div>
  );
}
