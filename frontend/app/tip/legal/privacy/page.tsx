export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 py-6">
      <header>
        <h1 className="font-display text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">1. Information We Collect</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Opentip collects only the minimum data necessary to operate the Service:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li><strong>GitHub account data:</strong> username, profile image, email (if public), and repository information — used solely for authentication and to populate your developer profile.</li>
          <li><strong>Email address:</strong> used for account recovery and password reset only.</li>
          <li><strong>On-chain addresses:</strong> wallet addresses you link to your account, used for tip distribution.</li>
          <li><strong>Usage data:</strong> minimal server logs (IP addresses, request times) retained for security and debugging.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">2. How We Use Your Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your data is used exclusively to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Authenticate your identity via GitHub OAuth or email/password.</li>
          <li>Display your developer profile and repository information.</li>
          <li>Process and record tip transactions on-chain.</li>
          <li>Send account-related emails (password reset, security alerts).</li>
          <li>Prevent fraud and abuse of the platform.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">3. Data Storage & Security</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your data is stored in encrypted databases hosted on secure cloud infrastructure. Passwords are hashed with bcrypt. We do not store or have access to your private keys or wallet credentials. All on-chain transactions are public by nature of the blockchain and are not controlled by Opentip.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">4. Data Sharing</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We do not sell, trade, or share your personal data with third parties, except:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>GitHub (for OAuth authentication only).</li>
          <li>Resend (for sending transactional emails).</li>
          <li>Azure Blob Storage (for storing uploaded profile images).</li>
          <li>As required by law or to protect the rights and safety of Opentip.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">5. Your Rights</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You have the right to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Access and download your data.</li>
          <li>Correct inaccurate data.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Revoke GitHub OAuth permissions at any time via your GitHub settings.</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To exercise these rights, contact us via the link in the site footer.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">6. Blockchain Transparency</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          All tip transactions are recorded on the Base blockchain and are publicly visible. Linking a wallet address to your Opentip account associates that address with your profile. Be aware of this transparency when choosing which addresses to link.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">7. Cookies</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Opentip uses only essential session cookies required for authentication. We do not use tracking cookies, analytics cookies, or advertising cookies.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">8. Children&apos;s Privacy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Service is not intended for users under 18. We do not knowingly collect data from children.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-medium">9. Changes to This Policy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance.
        </p>
      </section>
    </article>
  );
}
