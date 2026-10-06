export const metadata = {
  title: "Troubleshooting",
  description: "Fixes for common Opentip problems: funding, registering and claiming repos, sign-in, notifications, and running your own instance.",
};

function CodeBlock({ children }: { children: string }) {
  return (
    <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-sm font-mono text-sm overflow-x-auto whitespace-pre">
      {children}
    </code>
  );
}

export default function TroubleshootingPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="serif text-4xl font-semibold tracking-tight">Troubleshooting</h1>
        <p className="text-lg text-zinc-600">
          Something not working? Find the message you see below. Each entry covers what it means, how to check, and how to fix it.
        </p>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li><strong>Funding or maintaining a repo on opentip.tech?</strong> Start with <a href="#funding-a-repo" className="text-accent underline underline-offset-4">Funding a repo</a>.</li>
          <li><strong>Running your own Opentip instance?</strong> Go to <a href="#running-your-own-instance" className="text-accent underline underline-offset-4">Running your own instance</a>.</li>
        </ul>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Still stuck? Email <strong>support@opentip.tech</strong> (see <a href="/docs/contacts" className="text-accent underline underline-offset-4">Contact</a>). Include the repo (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">owner/repo</code>), your wallet address, and the exact message you see.
        </p>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 id="for-people-funding-and-maintaining-repos" className="serif text-2xl font-semibold">For people funding and maintaining repos</h2>

        <h3 id="funding-a-repo" className="font-medium text-lg pt-2">Funding a repo</h3>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Wrong network&quot;</h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            You see <strong>&quot;Switch your wallet to Base before sending.&quot;</strong> or <strong>&quot;That transaction was not confirmed on Base.&quot;</strong>
          </p>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Your external wallet is on a different network. Opentip asks your wallet to switch before it sends. You see this if the switch was declined or failed.</li>
            <li><strong>Fix:</strong> Switch your wallet to Base yourself, then press <strong>Tip</strong> again. If the second message appeared, check your wallet&apos;s activity to see which network the transaction went to before you try again.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;ETH price is unavailable. Try again shortly.&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Opentip checks that an ETH amount is worth at least $1, and it needs a live ETH price for that. If the price can&apos;t be loaded, ETH funding is paused rather than letting the $1 minimum slip.</li>
            <li><strong>Fix:</strong> Wait a minute and try again, or fund in USDC for now.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Minimum tip is $1&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The minimum is $1. USDC counts as $1 per token. ETH uses the live price.</li>
            <li><strong>Fix:</strong> Enter a larger amount. You may also see <strong>&quot;Enter an amount&quot;</strong> (empty or zero) or <strong>&quot;Invalid amount&quot;</strong> (too many decimal places for the token).</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;OAR tipping coming soon&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Choosing OAR in the token menu shows this message and keeps your current token. OAR isn&apos;t available in the funding form yet.</li>
            <li><strong>Fix:</strong> Fund in USDC or ETH.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Connect wallet&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> You pressed <strong>Tip</strong> without a connected wallet.</li>
            <li><strong>Fix:</strong> Press <strong>Connect wallet</strong> next to the amount, pick your wallet, then try again. You don&apos;t need an Opentip account to fund. See <a href="/docs/getting-started" className="text-accent underline underline-offset-4">Getting Started</a>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Not enough balance</h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            You see <strong>&quot;Transaction rejected&quot;</strong> or <strong>&quot;Tip failed&quot;</strong>, followed by your wallet&apos;s own error.
          </p>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Opentip doesn&apos;t check your balance before it sends. Your wallet or the network refuses the transaction instead.</li>
            <li><strong>Check:</strong> Make sure you hold the amount on <strong>Base</strong>, plus a little ETH for gas.</li>
            <li><strong>Fix:</strong> Top up on Base and try again. Funds sent on other networks won&apos;t show up.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">You cancelled in your wallet</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>ETH:</strong> You see <strong>&quot;Transaction rejected&quot;</strong>. Nothing was sent. Try again whenever you&apos;re ready.</li>
            <li><strong>USDC approve, USDC payment, claim, or register from an external wallet:</strong> Cancelling the prompt shows <strong>&quot;Transaction rejected&quot;</strong> and the button leaves <strong>&quot;Approving spend...&quot;</strong> or <strong>&quot;Sending...&quot;</strong>. A failed approval shows <strong>&quot;Approve failed&quot;</strong>. A failed payment shows <strong>&quot;Tip failed&quot;</strong>. A failed claim shows <strong>&quot;Claim failed&quot;</strong>. A failed registration shows <strong>&quot;Register failed&quot;</strong>. USDC from an external wallet still needs two confirmations when a new approval is required: the exact amount, then the payment.</li>
            <li><strong>Opentip Smart Wallet:</strong> You see <strong>&quot;Tip failed&quot;</strong> with the reason.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Opentip Smart Wallet errors</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">You see</th>
                  <th className="text-left py-3 font-medium">What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Couldn&apos;t reach Coinbase CDP — an adblocker or privacy extension is likely blocking it. …&quot;</td>
                  <td className="py-3 text-zinc-600">Turn off ad blockers or privacy extensions for this site, or try a private window with no extensions.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;CDP session not ready — try again&quot;</td>
                  <td className="py-3 text-zinc-600">Try again. If it keeps happening, sign out and back in.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;No Opentip Smart Wallet — create one in /dashboard/wallets first&quot;</td>
                  <td className="py-3 text-zinc-600">Create your wallet at <a href="/dashboard/wallets" className="text-accent underline underline-offset-4">Dashboard → Wallets</a>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Blocked by wallet security policy.&quot; or a limit or recipient message</td>
                  <td className="py-3 text-zinc-600">Check your controls at <a href="/wallet/security" className="text-accent underline underline-offset-4">Wallet → Security</a>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;… (you paid gas — daily sponsorship used up)&quot; after a successful payment</td>
                  <td className="py-3 text-zinc-600">Your payment went through. Today&apos;s sponsored transactions (10 per account, reset at midnight UTC) were used up, so the wallet paid its own gas. Sponsorship only runs when a paymaster is configured.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;… (you paid gas)&quot; after a successful payment</td>
                  <td className="py-3 text-zinc-600">The paymaster was unavailable, so the wallet paid its own gas. This happens on 502 and 503 from the paymaster.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">
            For devices, sessions, and more Smart Wallet help, see <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Smart Wallet</a>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Your payment went through but doesn&apos;t appear in &quot;Recent tips&quot; or &quot;Top supporters&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The <strong>Pending</strong>, <strong>Total tipped</strong>, and <strong>Tips</strong> numbers on a repo page come straight from the contract, so they update right away. A repo with no funds shows an em dash for an empty total. <strong>Recent tips</strong>, <strong>Top supporters</strong>, the <a href="/leaderboard" className="text-accent underline underline-offset-4">leaderboard</a>, and the totals on <a href="/repos" className="text-accent underline underline-offset-4">Repos</a> come from our indexer. The indexer reads the chain on a timer and can fall behind.</li>
            <li><strong>Fix:</strong> Give it a few minutes and reload. If the contract numbers changed, your funds arrived.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Display name</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Saving a name needs a signature from the wallet you fund with. That works for a connected external wallet and for the Opentip Smart Wallet. The name is stored for that wallet&apos;s address.</li>
            <li><strong>Fix:</strong> Type a name of 1–64 characters, press <strong>Save</strong>, and sign the message.</li>
            <li><strong>&quot;Enter a display name&quot;</strong> means the name is empty, or no wallet address is available yet.</li>
            <li><strong>&quot;Save failed&quot;</strong> with <strong>&quot;invalid signature&quot;</strong> means the signature didn&apos;t match that address.</li>
          </ul>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h3 id="accounts-and-sign-in" className="font-medium text-lg">Accounts and sign-in</h3>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Invalid email or password&quot; / &quot;Login failed&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The email or password is wrong, or the account was created with GitHub and has no password yet.</li>
            <li><strong>Fix:</strong> Use <strong>Forgot your password?</strong>, or press <strong>Continue with GitHub</strong>. To add a password to a GitHub account, open <a href="/dashboard/account" className="text-accent underline underline-offset-4">Dashboard → Account</a> and use <strong>Set password</strong>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Errors when creating an account</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>&quot;Email already registered&quot;</strong>: Sign in instead, or reset your password.</li>
            <li><strong>&quot;Password must be 8-128 characters&quot;</strong> or <strong>&quot;Password must be at least 8 characters&quot;</strong>: Choose a longer password.</li>
            <li><strong>&quot;rate limit exceeded, retry after Ns&quot;</strong>: Wait that many seconds and try again. Signed-out attempts are limited by client IP.</li>
            <li><strong>&quot;Account created, but the verification email failed to send. Sign in and resend the code.&quot;</strong>: The account exists. Sign in and request a new code. The page also takes you to email verification so you can resend.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Email verification code problems</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">You see</th>
                  <th className="text-left py-3 font-medium">What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;invalid or expired code&quot;</td>
                  <td className="py-3 text-zinc-600">Codes expire after 1 hour. Press <strong>Didn&apos;t get it? Resend</strong> and use the newest code.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;too many attempts, request a new code&quot;</td>
                  <td className="py-3 text-zinc-600">Request a new code, then enter it carefully.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;wait N seconds before requesting another code&quot;</td>
                  <td className="py-3 text-zinc-600">You can request a new code once a minute.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;email already in use&quot;</td>
                  <td className="py-3 text-zinc-600">That address belongs to another Opentip account. Sign in to that account instead.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;email already verified and cannot be changed&quot;</td>
                  <td className="py-3 text-zinc-600">Your email is already verified. Nothing to do.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;verification email failed to send&quot;</td>
                  <td className="py-3 text-zinc-600">The resend did not go out. Check that you can try again, then press <strong>Didn&apos;t get it? Resend</strong>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">No email arrives</td>
                  <td className="py-3 text-zinc-600">Check spam, wait a minute, then press <strong>Didn&apos;t get it? Resend</strong>. If the button reports that the email failed, the message was not sent.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Connecting GitHub from Dashboard → Account fails</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">You see</th>
                  <th className="text-left py-3 font-medium">What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Invalid OAuth state&quot;</td>
                  <td className="py-3 text-zinc-600">The GitHub step took more than 10 minutes, or it finished in a different browser. Press <strong>Connect GitHub</strong> again and finish in the same browser.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;GitHub OAuth failed&quot; / &quot;Failed to fetch GitHub info&quot;</td>
                  <td className="py-3 text-zinc-600">Try again. If you denied access on GitHub, approve it this time.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;This GitHub account is already linked to another user&quot;</td>
                  <td className="py-3 text-zinc-600">That GitHub account is linked to a different Opentip account. Sign in with <strong>Continue with GitHub</strong> to reach it.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Continue with GitHub&quot; brings you back to the sign-in page</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Likely cause:</strong> You already have an email account that uses the same address as your GitHub account.</li>
            <li><strong>Fix:</strong> Sign in with email, then open <a href="/dashboard/account" className="text-accent underline underline-offset-4">Dashboard → Account</a> and press <strong>Connect GitHub</strong>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Wallet creation failed&quot; during setup</h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            <strong>Fix:</strong> Press <strong>Try again</strong>. If the message mentions Coinbase or a blocked request, turn off ad blockers for this site first. <strong>&quot;smart wallet already exists for this account&quot;</strong> means you already have one. Find it in <a href="/dashboard/wallets" className="text-accent underline underline-offset-4">Dashboard → Wallets</a>.
          </p>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h3 id="registering-a-repo-maintainers" className="font-medium text-lg">Registering a repo (maintainers)</h3>
        <p className="text-sm text-zinc-700 leading-relaxed">
          Background: <a href="/docs/for-developers" className="text-accent underline underline-offset-4">For Developers</a> walks through registration step by step.
        </p>

        <div className="space-y-2">
          <h4 id="cant-register-not-repo-owner-maintainer-or-collaborator-on-an-org-repo" className="font-medium text-sm">&quot;Can&apos;t register: not repo owner, maintainer, or collaborator&quot; on an org repo</h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            The toast title is <strong>&quot;Can&apos;t register&quot;</strong>. The page also shows <strong>&quot;Not owner. Ensure you have admin/write on GitHub.&quot;</strong>
          </p>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> For a repo owned by an organization, Opentip asks GitHub for your permission level using your own GitHub sign-in. GitHub must report <strong>admin</strong>, <strong>maintain</strong>, or <strong>write</strong>. The most likely cause is that the organization restricts third-party OAuth apps and hasn&apos;t approved Opentip. GitHub then won&apos;t answer for that org&apos;s repos.</li>
            <li><strong>Check:</strong> You&apos;re signed in with GitHub, or you connected GitHub in <a href="/dashboard/account" className="text-accent underline underline-offset-4">Dashboard → Account</a>. An email-only sign-in isn&apos;t enough. Your role on the repo is write, maintain, or admin. Triage and read aren&apos;t enough.</li>
          </ul>
          <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
            <li>Go to <strong>github.com/settings/applications</strong>, open <strong>Authorized OAuth Apps</strong>, and choose <strong>Opentip</strong>.</li>
            <li>Under <strong>Organization access</strong>, press <strong>Grant</strong> for the org (org owners) or <strong>Request</strong> (members).</li>
            <li>If you requested access, an org owner approves it under the org&apos;s <strong>Settings → Third-party access → OAuth application policy</strong>.</li>
            <li>Back on Opentip, press <strong>Re-check</strong>. If it still fails, sign out and sign back in with GitHub.</li>
          </ol>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Can&apos;t register&quot; while you&apos;re signed in with email</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Registration needs a GitHub identity. The description is <strong>&quot;Connect GitHub to verify ownership&quot;</strong>. A request with no session still says <strong>&quot;not authenticated&quot;</strong>.</li>
            <li><strong>Fix:</strong> Connect GitHub in <a href="/dashboard/account" className="text-accent underline underline-offset-4">Dashboard → Account</a>, then press <strong>Verify ownership</strong> again.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Can&apos;t register&quot; with &quot;repo not found&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> GitHub didn&apos;t return the repo. It may be private, or the URL may have a typo. This is not a rate limit.</li>
            <li><strong>Fix:</strong> Check that the page URL matches <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">opentip.tech/owner/repo</code> exactly and the repo is public. Then try again.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Can&apos;t register&quot; with a rate-limit message</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>&quot;GitHub rate limit exceeded, retry after Ns&quot;</strong>: GitHub limited the lookup. Wait the number of seconds shown, then press <strong>Re-check</strong>.</li>
            <li><strong>&quot;rate limit exceeded, retry after Ns&quot;</strong>: Opentip&apos;s own ownership check allows 3 per minute. Wait, then press <strong>Re-check</strong>.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Payout address errors</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">You see</th>
                  <th className="text-left py-3 pr-4 font-medium">What it means</th>
                  <th className="text-left py-3 font-medium">Fix</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Could not verify that this payout address can receive ETH. Try again.&quot;</td>
                  <td className="py-3 pr-4 text-zinc-600">Opentip couldn&apos;t reach the network to check your payout address.</td>
                  <td className="py-3 text-zinc-600">Try again in a moment.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;This contract cannot receive ETH. claimAll reverts the whole claim if the ETH transfer fails, which also blocks token withdrawals.&quot;</td>
                  <td className="py-3 pr-4 text-zinc-600">Your payout address is a contract that refuses ETH. Using it would lock all your payouts.</td>
                  <td className="py-3 text-zinc-600">Choose a different payout wallet, such as your Opentip Smart Wallet or a regular wallet address.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;You need to link a wallet first. This wallet receives tips.&quot;</h4>
          <p className="text-sm text-zinc-700 leading-relaxed">
            <strong>Fix:</strong> Press <strong>Link wallet →</strong> and create your Opentip Smart Wallet or link an external wallet. This wallet receives your funds. See <a href="/docs/smart-wallet" className="text-accent underline underline-offset-4">Smart Wallet</a>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Register failed&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Your ownership check is valid for 5 minutes. If you waited longer before you pressed <strong>Register repo</strong>, the contract rejects it. A wallet on the wrong network also causes this. Cancelling the wallet prompt shows <strong>&quot;Transaction rejected&quot;</strong> instead, and the button recovers.</li>
            <li><strong>Fix:</strong> Reload the page, press <strong>Verify ownership</strong> again, then press <strong>Register repo</strong> right away. Make sure your wallet is on Base.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Your repo moved from a personal account into an org</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Opentip registers repos by their <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">owner/repo</code> path. After a move, the repo has a new path, and that path is registered separately.</li>
            <li><strong>Fix:</strong> Open the new path and register it there. The new owner is an org, so the org-repo entry above applies. Share the new link. Funds already sent to the old path stay under the old path. The payout wallet for the old path can still claim them on the old page.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Repo page says &quot;Could not fetch GitHub metadata.&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Opentip couldn&apos;t load the repo&apos;s details from GitHub. Funding, registering, and claiming still work on that page.</li>
            <li><strong>Fix:</strong> Reload in a few minutes. If it continues on opentip.tech, email support@opentip.tech with the repo name.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">A repo page shows &quot;404&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The repo has been hidden by an Opentip admin. Hidden repos show the not-found page and don&apos;t appear on <a href="/repos" className="text-accent underline underline-offset-4">Repos</a>.</li>
            <li><strong>Fix:</strong> If it&apos;s your repo, email support@opentip.tech with the repo name.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Dashboard → GitHub repos is empty or missing repos</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">You see</th>
                  <th className="text-left py-3 font-medium">What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Connect GitHub to list your repositories&quot;</td>
                  <td className="py-3 text-zinc-600">Connect GitHub in <a href="/dashboard/account" className="text-accent underline underline-offset-4">Dashboard → Account</a>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;No repos found.&quot; or an org repo is missing</td>
                  <td className="py-3 text-zinc-600">This list includes repos you own, repos you collaborate on, and org repos you reach as an organization member, including through a team. An org that hasn&apos;t approved Opentip can still hide its repos. Open the repo page directly in that case.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Your GitHub connection expired. Sign out, then sign in with Continue with GitHub.&quot;</td>
                  <td className="py-3 text-zinc-600">GitHub rejected the saved token. Sign out, then sign in with <strong>Continue with GitHub</strong>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Couldn&apos;t load your GitHub repositories. Try again in a minute.&quot;</td>
                  <td className="py-3 text-zinc-600">GitHub returned another error. The page shows this message instead of raw GitHub JSON.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">The repo icon doesn&apos;t change after you pick an image</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Check:</strong> The image is JPEG, PNG, WebP, or GIF and <strong>2 MB or smaller</strong>.</li>
            <li><strong>Why else:</strong> Icons can be changed only for repos whose payout wallet is linked to your account. Those are the repos listed in <a href="/dashboard/repos" className="text-accent underline underline-offset-4">Dashboard → Repos</a>.</li>
            <li><strong>Fix:</strong> The page shows the error. <strong>&quot;file too large (max 2MB)&quot;</strong>, <strong>&quot;invalid file type&quot;</strong>, <strong>&quot;not authorized&quot;</strong>, <strong>&quot;repo not found&quot;</strong>, and <strong>&quot;upload failed&quot;</strong> are the messages to look for. Pick a smaller image and try again, or email support@opentip.tech if it still doesn&apos;t change.</li>
          </ul>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h3 id="claiming-funds-maintainers" className="font-medium text-lg">Claiming funds (maintainers)</h3>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">There&apos;s no &quot;Claim tips&quot; button</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The button shows only when two things are true. The wallet you&apos;re using must be the repo&apos;s payout wallet, and the repo must have a pending balance.</li>
            <li><strong>Check:</strong> Compare the <strong>Payout</strong> address on the repo page with your wallet. <strong>Pending</strong> must show an amount.</li>
            <li><strong>Fix:</strong> Connect the payout wallet, or sign in so your Opentip Smart Wallet is used if it&apos;s the payout. In <a href="/dashboard/repos" className="text-accent underline underline-offset-4">Dashboard → Repos</a>, <strong>Claim</strong> takes you to the repo page. Lost the payout wallet? See the recovery note in <a href="/docs/for-developers" className="text-accent underline underline-offset-4">For Developers</a>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">&quot;Claim failed&quot;</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Check:</strong> Your wallet is on Base and has a little ETH for gas.</li>
            <li><strong>Fix:</strong> Try again from the repo page. Cancelling the wallet prompt shows <strong>&quot;Transaction rejected&quot;</strong> and the button leaves <strong>&quot;Sending...&quot;</strong>. If it keeps failing, email support@opentip.tech with the repo name and payout address.</li>
          </ul>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h3 id="notifications" className="font-medium text-lg">Notifications</h3>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Push notifications never arrive</h4>
          <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
            <li>Open <a href="/dashboard/notifications" className="text-accent underline underline-offset-4">Dashboard → Notifications</a>.</li>
            <li>If you see <strong>&quot;Install Opentip as a PWA to receive push notifications.&quot;</strong>, install it from <a href="/install" className="text-accent underline underline-offset-4">/install</a> and open the installed app.</li>
            <li>Press <strong>Enable Notifications</strong> and allow them in your browser.</li>
            <li>Press <strong>Subscribe</strong>. The page says <strong>&quot;Subscribed on this device.&quot;</strong> when it worked. Each device you use needs its own subscription. Pushes go to all of them.</li>
            <li>Check the notification types you want. <strong>&quot;No types selected, so pushes are not sent.&quot;</strong> means nothing will be delivered until you check at least one. Saving types before you subscribe shows <strong>&quot;Subscribe before saving notification types.&quot;</strong> A successful save says <strong>&quot;Notification types saved.&quot;</strong></li>
            <li>Press <strong>Send Test</strong>. The page says <strong>&quot;Test notification sent.&quot;</strong> <strong>&quot;not subscribed&quot;</strong> means this account has no device yet. <strong>&quot;push failed&quot;</strong> or <strong>&quot;Test notification failed&quot;</strong> means the send did not complete.</li>
          </ol>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>&quot;Service workers not supported&quot;</strong> means this browser can&apos;t receive push. Try a different browser.</li>
            <li><strong>&quot;VAPID key not configured&quot;</strong> means this Opentip instance has no public push key.</li>
            <li><strong>&quot;This browser can&apos;t receive push notifications here. Install Opentip as a PWA or try another browser.&quot;</strong> is what you see when the browser has no Notification API, including iOS Safari outside a PWA. The page stays up.</li>
            <li><strong>&quot;Subscribe failed&quot;</strong> means the browser or the server refused the subscription. Denying the permission shows the browser&apos;s own message.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Someone funded your repo but you got no notification</h4>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Check:</strong> The repo&apos;s payout wallet must be linked to your Opentip account. Funding notices go to the account that owns that wallet.</li>
            <li><strong>Check:</strong> The type has to be selected. An empty selection sends no pushes.</li>
            <li><strong>Check:</strong> Look at your in-app list at <a href="/notifications" className="text-accent underline underline-offset-4">/notifications</a>. Notices show up there even if push didn&apos;t reach you. They can take a few minutes, because they come from the indexer.</li>
          </ul>
        </div>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h3 id="stats-and-leaderboard-look-wrong-or-stale" className="font-medium text-lg">Stats and leaderboard look wrong or stale</h3>
        <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
          <li><strong>Live from the contract:</strong> <strong>Pending</strong>, <strong>Total tipped</strong>, <strong>Tips</strong>, and <strong>Payout</strong> on a repo page, plus pending and total amounts in <a href="/dashboard/repos" className="text-accent underline underline-offset-4">Dashboard → Repos</a>. An empty total is an em dash, not a row of zeros.</li>
          <li><strong>From the indexer, can lag a few minutes:</strong> <strong>Recent tips</strong>, <strong>Top supporters</strong>, the <a href="/leaderboard" className="text-accent underline underline-offset-4">leaderboard</a>, totals and sorting on <a href="/repos" className="text-accent underline underline-offset-4">Repos</a>, and tip counts in the dashboard.</li>
          <li><strong>Most tipped</strong> on Repos sorts by USD value, using each token&apos;s decimals. When the ETH price is unavailable, ETH amounts count as $0 for that sort.</li>
          <li><strong>Dollar values</strong> use current prices, so rankings can shift as prices move.</li>
          <li><strong>&quot;Couldn&apos;t load the leaderboard. Try again in a minute.&quot;</strong> means the leaderboard query failed. <strong>&quot;No tips yet.&quot;</strong> on that page means it loaded and the list is empty. A repo page can still say <strong>&quot;No tips yet.&quot;</strong> when that repo has no supporters.</li>
          <li><strong>One person can appear twice.</strong> The leaderboard is grouped by wallet address, so payments from a Smart Wallet and an external wallet show as separate supporters.</li>
        </ul>
      </section>

      <section className="border-t rule pt-10 space-y-6">
        <h2 id="running-your-own-instance" className="serif text-2xl font-semibold">Running your own instance</h2>
        <p className="text-sm text-zinc-700 leading-relaxed">
          These entries are for operators and self-hosters. For setup and the full list of env vars, see <a href="/docs/contributing" className="text-accent underline underline-offset-4">Contributing</a>.
        </p>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Repo pages show &quot;Could not fetch GitHub metadata.&quot;</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">fetchRepoMeta</code> (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">frontend/lib/github.ts</code>) returns nothing on <strong>any</strong> non-OK GitHub response, and the page shows this message. It sends <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_TOKEN</code> when one is set.</li>
          </ul>
          <p className="text-sm text-zinc-700 leading-relaxed">Call GitHub with the same token and read the status and message:</p>
          <CodeBlock>{`curl -i -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/repos/OWNER/REPO`}</CodeBlock>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">200 OK</td>
                  <td className="py-3 text-zinc-600">The token works for this repo.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">401 &quot;Bad credentials&quot;</td>
                  <td className="py-3 text-zinc-600">The token is wrong or truncated, and every repo fails.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">403</td>
                  <td className="py-3 text-zinc-600">An org policy or a rate limit. Read the message.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">404</td>
                  <td className="py-3 text-zinc-600">The repo is private or doesn&apos;t exist.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li>Fine-grained tokens start with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">github_pat_</code> and are about 93 characters long. Check the length with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">printf %s &quot;$GITHUB_TOKEN&quot; | wc -c</code>. With no token, calls share GitHub&apos;s limit of 60 per hour.</li>
            <li><strong>Known case:</strong> A fine-grained token with a lifetime over 366 days gets <strong>403 for one org&apos;s repos only</strong> when that org forbids fine-grained tokens with lifetimes over 366 days. Repos elsewhere still work.</li>
            <li><strong>Fix:</strong> Regenerate the token with an expiration within the org&apos;s limit, or ask an org owner to check the org&apos;s fine-grained token policy and any pending token requests. Update <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_TOKEN</code> and redeploy. GitHub responses are cached for about 5 minutes (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">revalidate: 300</code>), so give the page that long to recover.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Org repos fail ownership checks</h3>
          <p className="text-sm text-zinc-700 leading-relaxed">How the check works (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">frontend/app/api/verify-ownership/route.ts</code>):</p>
          <ol className="text-sm text-zinc-700 space-y-2 list-decimal pl-5">
            <li>It loads the repo with the user&apos;s GitHub token, then <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_TOKEN</code>. It calls GitHub with no token only when neither is set, or when the answer is not a definitive 404. A GitHub rate limit is <strong>&quot;GitHub rate limit exceeded, retry after Ns&quot;</strong>. A missing repo stays <strong>&quot;repo not found&quot;</strong>.</li>
            <li>It compares <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">repo.owner.login</code> with the signed-in GitHub login. This fails for org repos.</li>
            <li>It calls <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GET /repos/{"{owner}"}/{"{repo}"}/collaborators/{"{login}"}/permission</code>, first with the user&apos;s GitHub OAuth token (scope <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">read:user public_repo</code>), then with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_TOKEN</code>.</li>
            <li>It accepts <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">admin</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">maintain</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">write</code>, or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">push</code>.</li>
          </ol>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why the user&apos;s token matters:</strong> A fine-grained <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_TOKEN</code> gets <strong>403 &quot;Resource not accessible by personal access token&quot;</strong> on this endpoint for org repos. The user&apos;s OAuth token has to succeed, and an org&apos;s OAuth app restrictions can block it.</li>
          </ul>
          <CodeBlock>{`curl -i -H "Authorization: Bearer $GITHUB_TOKEN" \\
  https://api.github.com/repos/OWNER/REPO/collaborators/LOGIN/permission`}</CodeBlock>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Fix:</strong> Have the user grant or request org access for your OAuth app. See the <a href="#cant-register-not-repo-owner-maintainer-or-collaborator-on-an-org-repo" className="text-accent underline underline-offset-4">org repo entry</a> above.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">&quot;Can&apos;t register: internal error&quot;</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The route threw an error, most often because <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">REGISTRAR_PRIVATE_KEY</code> isn&apos;t set or the contract address isn&apos;t configured.</li>
            <li><strong>Check:</strong> Look in the server logs for a line that starts with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">verify-ownership error:</code>, such as <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">REGISTRAR_PRIVATE_KEY env var not set</code>.</li>
            <li><strong>Fix:</strong> Set the missing variable and redeploy.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Every registration ends in &quot;Register failed&quot;</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The permit is signed by <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">REGISTRAR_PRIVATE_KEY</code> for the chain and contract in your config. It fails on-chain if that key isn&apos;t the contract&apos;s registrar signer, which is set with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">setRegistrarSigner</code>, or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_CHAIN</code> or the contract address points somewhere else.</li>
            <li><strong>Check:</strong> A successful <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/api/verify-ownership</code> response includes <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">signer</code>. Compare it with the contract&apos;s registrar signer.</li>
            <li><strong>Fix:</strong> Use the matching key, or rotate the signer on the contract.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Every payout address fails with &quot;Could not verify that this payout address can receive ETH. Try again.&quot;</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The check needs <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_RPC_URL</code>. If the variable is empty, or the RPC fails, every address fails this way, including plain wallets.</li>
            <li><strong>Fix:</strong> Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_RPC_URL</code> to a working RPC for your chain and redeploy.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">&quot;Contract address not configured.&quot; or the wrong network name</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_CHAIN</code> must be exactly <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">base</code> for mainnet. Any other value means Base Sepolia. The contract address then comes from <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_BASE_CONTRACT</code> (mainnet) or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT</code> (testnet).</li>
            <li><strong>Symptom:</strong> Users on a mainnet site see <strong>&quot;Switch your wallet to Base Sepolia before sending.&quot;</strong> when the chain setting is wrong.</li>
            <li><strong>Fix:</strong> Set both variables to match, then rebuild. <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_</code> values are baked in at build time.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Lists, leaderboard, and stats are stale or missing</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> The indexer (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">indexer/src/index.ts</code>) polls the contract and writes funding, registration, payout, and claim events to Postgres. Claim events are stored and can trigger a <strong>&quot;Tips paid out&quot;</strong> notification.</li>
            <li><strong>Check:</strong> Look in the indexer logs for <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">[indexer] tick error</code> or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">[indexer] DB unreachable</code>. Look at <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">last_block</code> in the <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">IndexerState</code> table and compare it with the chain head.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CHAIN</code> isn&apos;t <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">base</code> on mainnet. The indexer reads <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CHAIN</code>, not <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_CHAIN</code>.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">RPC_URL</code> or <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CONTRACT_ADDRESS</code> is wrong. Without <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CONTRACT_ADDRESS</code>, the indexer exits with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CONTRACT_ADDRESS env required</code>.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GETLOGS_RANGE</code> defaults to 10 blocks per request, so catching up is slow. Increase it to whatever your RPC plan allows.</li>
            <li>There&apos;s no checkpoint and no <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">START_BLOCK</code>, so only the last 10,000 blocks were scanned. Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">START_BLOCK</code> to the contract&apos;s deployment block and reset the checkpoint.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">POLL_MS</code> defaults to 12000.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Push notifications don&apos;t work on your instance</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">VAPID_PUBLIC_KEY</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">VAPID_PRIVATE_KEY</code>, and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> are set. Users otherwise see <strong>&quot;VAPID key not configured&quot;</strong>, and <strong>Send Test</strong> fails with <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY required</code>.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NOTIFICATION_SECRET</code> is the same value in the frontend and the indexer. Otherwise <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">POST /api/notifications/send</code> returns 401 <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">unauthorized</code>.</li>
            <li><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NOTIFICATION_API_URL</code> in the indexer points to <strong>your</strong> deployment. It defaults to <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">https://opentip.tech/api/notifications/send</code>.</li>
            <li>Pushes honor the types saved on each subscription. An empty list sends nothing. Every subscription for that user is attempted, and endpoints that return 404 or 410 are removed.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Verification or reset emails never arrive</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> If <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">RESEND_API_KEY</code> is empty, sign-up still creates the account, but the API returns <strong>&quot;Account created, but the verification email failed to send. Sign in and resend the code.&quot;</strong> The server logs <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">Failed to send verification email</code>. Resend returns <strong>&quot;verification email failed to send&quot;</strong>. Password reset returns <strong>&quot;failed to send email&quot;</strong>.</li>
            <li><strong>Fix:</strong> Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">RESEND_API_KEY</code>, and set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">RESEND_FROM</code> to a sender your Resend account can use.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-sm">Smart Wallet doesn&apos;t work on your instance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b rule">
                  <th className="text-left py-3 pr-4 font-medium">Symptom</th>
                  <th className="text-left py-3 font-medium">Check</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">No Smart Wallet option anywhere</td>
                  <td className="py-3 text-zinc-600"><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXT_PUBLIC_CDP_PROJECT_ID</code> is set. Without it, the CDP provider isn&apos;t loaded.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700"><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/api/auth/cdp-jwt</code> returns 500 &quot;JWT_PRIVATE_KEY not set — run node scripts/gen-jwt-key.js&quot;</td>
                  <td className="py-3 text-zinc-600">Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">JWT_PRIVATE_KEY</code>. Also check <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">JWT_KID</code>, <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CDP_JWT_ISSUER</code>, and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CDP_JWT_AUDIENCE</code>. See the JWKS note in <a href="/docs/contributing" className="text-accent underline underline-offset-4">Contributing</a>.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">&quot;Wallet creation failed&quot; with &quot;wallet verification unavailable — try again&quot;</td>
                  <td className="py-3 text-zinc-600"><code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CDP_API_KEY_ID</code> and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CDP_API_KEY_SECRET</code> are set. The server uses them when <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CdpClient()</code> confirms wallet ownership.</td>
                </tr>
                <tr className="border-b rule">
                  <td className="py-3 pr-4 text-zinc-700">Smart Wallet payments fail and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/api/paymaster</code> returns &quot;paymaster not configured&quot;</td>
                  <td className="py-3 text-zinc-600">Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">CDP_PAYMASTER_URL</code>. Keep it server-only. A missing paymaster (500) does not fall back to self-paid gas. 429, 502, and 503 do: the wallet pays its own gas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">GitHub sign-in or Connect GitHub fails</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>&quot;GitHub OAuth not configured&quot;</strong>: Set <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_ID</code> and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">GITHUB_SECRET</code>.</li>
            <li><strong>Callback URLs:</strong> <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">NEXTAUTH_URL</code> must be your public URL. Connect GitHub sends users back to <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">${"{NEXTAUTH_URL}"}/api/account/github/callback</code>. NextAuth sign-in uses its own <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">/api/auth/...</code> callback. Your GitHub OAuth app&apos;s callback URL must allow both.</li>
            <li>Connecting GitHub again updates the stored access token for that account. Relinking used to keep the old token.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Image uploads fail</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Uploads need <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">AZURE_STORAGE_ACCOUNT</code> and <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">AZURE_STORAGE_KEY</code>. If they&apos;re missing, the upload route returns <strong>&quot;upload failed&quot;</strong>. The repo icon picker shows that error.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">ETH funding is blocked everywhere</h3>
          <ul className="text-sm text-zinc-700 space-y-2 list-disc pl-5">
            <li><strong>Why:</strong> Prices come from CoinGecko&apos;s public API and are cached for 60 seconds. If your server can&apos;t reach <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">api.coingecko.com</code>, users see <strong>&quot;ETH price is unavailable. Try again shortly.&quot;</strong></li>
            <li><strong>Fix:</strong> Allow outbound access to <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">api.coingecko.com</code>.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-sm">Rate limits act differently across servers</h3>
          <p className="text-sm text-zinc-700 leading-relaxed">
            Request limits are kept in each server instance&apos;s memory, so they reset on deploy and aren&apos;t shared between instances. Ownership checks allow 3 per minute. Sign-up and other writes allow 10 per minute. Signed-out signup is keyed by client IP (<code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">x-forwarded-for</code>, then <code className="bg-zinc-900/10 px-1.5 py-0.5 rounded-sm font-mono text-xs">x-real-ip</code>). A session cookie is used when one is present.
          </p>
        </div>
      </section>
    </div>
  );
}
