export const metadata = {
  title: "Contact",
  description: "Get in touch with the Opentip team.",
};

export default function ContactPage() {
  return (
    <div className="space-y-16">
      <section className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight">Contact</h1>
        <p className="text-lg text-muted-foreground">
          Have a question, bug report, or partnership inquiry? We would love to hear from you.
        </p>
      </section>

      <section className="border-t border-border pt-10 space-y-6">
        <h2 className="font-display text-xl">Email</h2>
        <div className="p-6 rounded-[10px] border border-border">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">General support</p>
          <a href="mailto:support@opentip.tech" className="text-xl font-mono text-accent hover:underline underline-offset-4">
            support@opentip.tech
          </a>
          <p className="text-sm text-muted-foreground mt-3">
            For account issues, bug reports, feature requests, or anything else — drop us a line. We typically respond within 24 hours.
          </p>
        </div>
      </section>

      <section className="border-t border-border pt-10 space-y-6">
        <h2 className="font-display text-xl">What to include</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          To help us respond quickly, please include:
        </p>
        <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-5">
          <li>A clear description of the issue or question</li>
          <li>Steps to reproduce (for bugs)</li>
          <li>Your wallet address (if the issue is transaction-related)</li>
          <li>The repo ID you are having trouble with (if applicable)</li>
          <li>Screenshots or error messages (if applicable)</li>
        </ul>
      </section>

      <section className="border-t border-border pt-10 space-y-6">
        <h2 className="font-display text-xl">Security</h2>
        <p className="text-sm text-foreground/80 leading-relaxed">
          If you have discovered a security vulnerability, please do not open a public issue. Instead, email us directly at{" "}
          <a href="mailto:support@opentip.tech" className="text-accent underline underline-offset-4">support@opentip.tech</a>{" "}
          with the details. We take security reports seriously and will respond promptly.
        </p>
      </section>

      <section className="border-t border-border pt-10 space-y-6">
        <h2 className="font-display text-xl">Other ways to reach us</h2>
        <div className="space-y-3">
          <a href="https://github.com/opentiphq" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-[10px] border border-border hover:bg-muted transition-colors">
            <h3 className="font-medium text-sm">GitHub</h3>
            <p className="text-sm text-muted-foreground mt-1">Open issues, check the source code, or contribute.</p>
          </a>
          <a href="https://x.com/opentip_tech" target="_blank" rel="noopener noreferrer" className="block p-4 rounded-[10px] border border-border hover:bg-muted transition-colors">
            <h3 className="font-medium text-sm">Twitter / X</h3>
            <p className="text-sm text-muted-foreground mt-1">Follow for updates, announcements, and community discussion.</p>
          </a>
        </div>
      </section>
    </div>
  );
}
